import type { JSX } from 'react'
import { memo, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import type { PhotoRecord } from '@shared/types'
import { findCamera } from '../data/cameras'
import type { SortKey } from '../lib/filter'
import { validateCached, worstLevel } from '../lib/validate'
import { api, useStore } from '../store'
import { IChevronDown, IError, IImage, IWarn } from './Icons'

/** Shared with App's keyboard navigation so arrow-up/down can jump a whole row. */
export const gridMetrics = { cols: 1 }

function useSize(ref: React.RefObject<HTMLElement | null>): { w: number; h: number } {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [ref])
  return size
}

function useClickSelect(): (e: MouseEvent, path: string) => void {
  const select = useStore((s) => s.select)
  return (e, path) => {
    if (e.shiftKey) select(path, 'range')
    else if (e.ctrlKey || e.metaKey) select(path, 'toggle')
    else select(path, 'single')
  }
}

const shortCamera = (r: PhotoRecord): string => {
  const m = r.fields.Model
  if (typeof m !== 'string') return typeof r.fields.Make === 'string' ? r.fields.Make : ''
  const c = findCamera(r.fields.Make as string, m)
  return (c?.label ?? m).replace(/^(Canon|Nikon|Sony|NIKON|FUJIFILM|Fujifilm|Panasonic|Leica|LEICA)\s+/, '')
}

const expLine = (r: PhotoRecord): string => {
  const f = r.fields
  return [
    typeof f.FocalLength === 'number' ? `${Math.round(f.FocalLength * 10) / 10}mm` : null,
    typeof f.FNumber === 'number' ? `ƒ/${f.FNumber}` : null,
    typeof f.ExposureTime === 'string' ? `${f.ExposureTime}s` : null,
    typeof f.ISO === 'number' ? `ISO ${f.ISO}` : null
  ]
    .filter(Boolean)
    .join('  ')
}

export function Browser({ list }: { list: PhotoRecord[] }): JSX.Element {
  const view = useStore((s) => s.settings.view)
  return view === 'list' ? <ListView list={list} /> : <GridView list={list} />
}


function GridView({ list }: { list: PhotoRecord[] }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const { w, h } = useSize(ref)
  const [scroll, setScroll] = useState(0)
  const thumb = useStore((s) => s.settings.thumbSize)
  const focus = useStore((s) => s.focus)
  const clearSelection = useStore((s) => s.clearSelection)

  const GAP = 12
  const PAD = 16
  const cardW = thumb
  const cardH = thumb + 46
  const cols = Math.max(1, Math.floor((w - PAD * 2 + GAP) / (cardW + GAP)))
  gridMetrics.cols = cols
  const rows = Math.ceil(list.length / cols)
  const rowH = cardH + GAP
  const extra = Math.max(0, (w - PAD * 2 - cols * cardW - (cols - 1) * GAP) / cols)
  const realW = cardW + extra
  const first = Math.max(0, Math.floor((scroll - PAD) / rowH) - 2)
  const last = Math.min(rows, Math.ceil((scroll + h) / rowH) + 2)

  useEffect(() => {
    if (!focus || !ref.current) return
    const i = list.findIndex((r) => r.path === focus)
    if (i < 0) return
    const top = PAD + Math.floor(i / cols) * rowH
    const el = ref.current
    if (top < el.scrollTop) el.scrollTop = top - PAD
    else if (top + cardH > el.scrollTop + el.clientHeight) el.scrollTop = top + cardH - el.clientHeight + PAD
  }, [focus]) // eslint-disable-line react-hooks/exhaustive-deps

  const items: JSX.Element[] = []
  for (let row = first; row < last; row++) {
    for (let c = 0; c < cols; c++) {
      const i = row * cols + c
      if (i >= list.length) break
      const r = list[i]
      items.push(
        <Card key={r.path} rec={r} size={thumb} style={{ left: PAD + c * (realW + GAP), top: PAD + row * rowH, width: realW, height: cardH }} />
      )
    }
  }

  return (
    <div
      className="grid-scroll"
      ref={ref}
      onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) clearSelection()
      }}
    >
      <div className="grid-inner" style={{ height: PAD * 2 + rows * rowH }} onMouseDown={(e) => e.target === e.currentTarget && clearSelection()}>
        {items}
      </div>
    </div>
  )
}

const Card = memo(function Card({ rec, size, style }: { rec: PhotoRecord; size: number; style: React.CSSProperties }): JSX.Element {
  const selected = useStore((s) => s.selected.has(rec.path))
  const focused = useStore((s) => s.focus === rec.path)
  const version = useStore((s) => s.versions[rec.path] ?? 0)
  const openModal = useStore((s) => s.openModal)
  const onClick = useClickSelect()
  const [failed, setFailed] = useState(false)
  const issues = validateCached(rec.fields)
  const level = worstLevel(issues)
  const px = Math.min(512, Math.ceil((size * (window.devicePixelRatio || 1)) / 128) * 128)

  return (
    <div
      className={`card ${selected ? 'selected' : ''} ${focused ? 'focused' : ''}`}
      style={style}
      onMouseDown={(e) => onClick(e, rec.path)}
      onDoubleClick={() => openModal({ kind: 'lightbox', path: rec.path })}
    >
      <div className="card-img" style={{ height: size }}>
        {failed ? (
          <div className="card-noimg">
            <IImage size={26} />
            <span>{rec.ext.toUpperCase()}</span>
          </div>
        ) : (
          <img src={api.thumbUrl(rec.path, px, version)} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} />
        )}
        {level && (
          <span className={`badge ${level}`} title={issues.map((i) => i.message).join('\n')}>
            {level === 'error' ? <IError size={13} /> : <IWarn size={13} />}
            {issues.length > 1 && <b>{issues.length}</b>}
          </span>
        )}
        {rec.error && (
          <span className="badge error" title={rec.error}>
            <IError size={13} />
          </span>
        )}
        <span className="ext">
          {rec.ext}
          {rec.sidecar && <b title="Edits live in an XMP sidecar">+xmp</b>}
        </span>
      </div>
      <div className="card-meta">
        <span className="card-name" title={rec.name}>
          {rec.name}
        </span>
        <span className="card-sub">
          {shortCamera(rec) || <i>No camera</i>}
          {expLine(rec) && <em>{expLine(rec)}</em>}
        </span>
      </div>
    </div>
  )
})


interface Col {
  key: SortKey | 'issues'
  label: string
  width: number
  get(r: PhotoRecord): string
  align?: 'right'
}

const COLS: Col[] = [
  { key: 'issues', label: '', width: 30, get: () => '' },
  { key: 'name', label: 'Name', width: 220, get: (r) => r.name },
  { key: 'folder', label: 'Folder', width: 120, get: (r) => r.rel || '.' },
  { key: 'camera', label: 'Camera', width: 170, get: (r) => shortCamera(r) },
  { key: 'lens', label: 'Lens', width: 230, get: (r) => (typeof r.fields.LensModel === 'string' ? r.fields.LensModel : '') },
  { key: 'focal', label: 'Focal', width: 70, align: 'right', get: (r) => (typeof r.fields.FocalLength === 'number' ? `${Math.round(r.fields.FocalLength * 10) / 10}mm` : '') },
  { key: 'aperture', label: 'Aperture', width: 74, align: 'right', get: (r) => (typeof r.fields.FNumber === 'number' ? `ƒ/${r.fields.FNumber}` : '') },
  { key: 'shutter', label: 'Shutter', width: 74, align: 'right', get: (r) => (typeof r.fields.ExposureTime === 'string' ? r.fields.ExposureTime : '') },
  { key: 'iso', label: 'ISO', width: 64, align: 'right', get: (r) => (typeof r.fields.ISO === 'number' ? String(r.fields.ISO) : '') },
  { key: 'date', label: 'Date taken', width: 150, get: (r) => (typeof r.fields.DateTimeOriginal === 'string' ? r.fields.DateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3') : '') },
  { key: 'size', label: 'Size', width: 80, align: 'right', get: (r) => (r.fileSize ? `${(r.fileSize / 1e6).toFixed(1)} MB` : '') }
]

function ListView({ list }: { list: PhotoRecord[] }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const { h } = useSize(ref)
  const [scroll, setScroll] = useState(0)
  const sort = useStore((s) => s.sort)
  const setSort = useStore((s) => s.setSort)
  const focus = useStore((s) => s.focus)
  gridMetrics.cols = 1
  const ROW = 32
  const first = Math.max(0, Math.floor(scroll / ROW) - 5)
  const last = Math.min(list.length, Math.ceil((scroll + h) / ROW) + 5)
  const total = COLS.reduce((a, c) => a + c.width, 0)

  useEffect(() => {
    if (!focus || !ref.current) return
    const i = list.findIndex((r) => r.path === focus)
    if (i < 0) return
    const el = ref.current
    const top = i * ROW
    if (top < el.scrollTop) el.scrollTop = top
    else if (top + ROW > el.scrollTop + el.clientHeight - ROW) el.scrollTop = top + ROW * 2 - el.clientHeight
  }, [focus]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="list-scroll" ref={ref} onScroll={(e) => setScroll(e.currentTarget.scrollTop)}>
      <div className="list-head" style={{ minWidth: total }}>
        {COLS.map((c) => (
          <button
            key={c.key}
            style={{ width: c.width, textAlign: c.align ?? 'left' }}
            className={sort.key === c.key ? 'on' : ''}
            onClick={() => c.key !== 'issues' && setSort({ key: c.key, dir: sort.key === c.key ? (-sort.dir as 1 | -1) : 1 })}
          >
            {c.label}
            {sort.key === c.key && <IChevronDown size={12} style={{ transform: sort.dir === -1 ? 'rotate(180deg)' : undefined }} />}
          </button>
        ))}
      </div>
      <div style={{ height: list.length * ROW, position: 'relative', minWidth: total }}>
        {list.slice(first, last).map((r, j) => (
          <Row key={r.path} rec={r} top={(first + j) * ROW} />
        ))}
      </div>
    </div>
  )
}

const Row = memo(function Row({ rec, top }: { rec: PhotoRecord; top: number }): JSX.Element {
  const selected = useStore((s) => s.selected.has(rec.path))
  const focused = useStore((s) => s.focus === rec.path)
  const openModal = useStore((s) => s.openModal)
  const onClick = useClickSelect()
  const issues = validateCached(rec.fields)
  const level = worstLevel(issues)
  return (
    <div
      className={`row ${selected ? 'selected' : ''} ${focused ? 'focused' : ''}`}
      style={{ top }}
      onMouseDown={(e) => onClick(e, rec.path)}
      onDoubleClick={() => openModal({ kind: 'lightbox', path: rec.path })}
    >
      {COLS.map((c) =>
        c.key === 'issues' ? (
          <span key="i" style={{ width: c.width }} className={`cell flag ${level ?? ''}`} title={issues.map((i) => i.message).join('\n')}>
            {level === 'error' ? <IError size={13} /> : level === 'warning' ? <IWarn size={13} /> : null}
          </span>
        ) : (
          <span key={c.key} className="cell" style={{ width: c.width, textAlign: c.align ?? 'left' }} title={c.get(rec)}>
            {c.get(rec)}
          </span>
        )
      )}
    </div>
  )
})
