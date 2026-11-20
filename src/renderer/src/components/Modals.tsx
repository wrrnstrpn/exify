import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  DATE_FIELDS,
  FIELDS,
  FIELD_BY_KEY,
  exifDateToMs,
  msToExifDate,
  valuesEqual,
  type FieldKey,
  type FieldMap,
  type FieldValue
} from '@shared/fields'
import type { FileEdit } from '@shared/types'
import logo from '../assets/logo-dark.png'
import { offsetFromGps } from '../lib/tz'
import { api, useStore } from '../store'
import { Check, DateTimeField, Segmented, Toggle } from './Controls'
import { IChevronLeft, IChevronRight, IError, IFolder, IX } from './Icons'
import { BackupsModal } from './modals/BackupsModal'
import { CompareModal } from './modals/CompareModal'
import { GeotagModal } from './modals/GeotagModal'
import { ImportModal } from './modals/ImportModal'
import { MapModal } from './modals/MapModal'
import { RenameModal } from './modals/RenameModal'
import { fmtDate, revealLabel, Shell, useSelection } from './Shell'

export function Modals(): JSX.Element | null {
  const modal = useStore((s) => s.modal)
  if (!modal) return null
  switch (modal.kind) {
    case 'dates':
      return <DatesModal initial={modal.mode} />
    case 'sync':
      return <SyncModal />
    case 'settings':
      return <SettingsModal />
    case 'savePreset':
      return <SavePresetModal />
    case 'strip':
      return <StripModal />
    case 'errors':
      return <ErrorsModal results={modal.results} />
    case 'lightbox':
      return <Lightbox path={modal.path} />
    case 'rename':
      return <RenameModal />
    case 'import':
      return <ImportModal />
    case 'geotag':
      return <GeotagModal />
    case 'map':
      return <MapModal pick={modal.pick} />
    case 'compare':
      return <CompareModal />
    case 'backups':
      return <BackupsModal />
  }
}


function DatesModal({ initial }: { initial?: 'shift' | 'sequence' | 'zone' }): JSX.Element {
  const sel = useSelection()
  const writeEdits = useStore((s) => s.writeEdits)
  const openModal = useStore((s) => s.openModal)
  const busy = useStore((s) => s.busy)
  const [mode, setMode] = useState<'shift' | 'sequence' | 'zone'>(initial ?? 'shift')
  const [sign, setSign] = useState<'+' | '-'>('+')
  const [amt, setAmt] = useState({ d: '0', h: '0', m: '0', s: '0' })
  const [targets, setTargets] = useState<FieldKey[]>([...DATE_FIELDS])
  const firstDate = sel.find((r) => typeof r.fields.DateTimeOriginal === 'string')?.fields.DateTimeOriginal as string | undefined
  const [start, setStart] = useState(firstDate ?? msToExifDate(Date.now() - new Date().getTimezoneOffset() * 60000))
  const [interval, setInterval] = useState('60')

  const offsetMs = (sign === '-' ? -1 : 1) * ((+amt.d || 0) * 86400 + (+amt.h || 0) * 3600 + (+amt.m || 0) * 60 + (+amt.s || 0)) * 1000

  const edits = useMemo<FileEdit[]>(() => {
    const out: FileEdit[] = []
    if (mode === 'shift') {
      if (!offsetMs) return out
      for (const r of sel) {
        const set: FieldMap = {}
        for (const k of targets) {
          const ms = exifDateToMs(r.fields[k] as string)
          if (ms !== null) set[k] = msToExifDate(ms + offsetMs)
        }
        if (Object.keys(set).length) out.push({ path: r.path, set })
      }
    } else if (mode === 'zone') {
      for (const r of sel) {
        const lat = r.fields.GPSLatitude
        const lon = r.fields.GPSLongitude
        if (typeof lat !== 'number' || typeof lon !== 'number') continue
        const tz = offsetFromGps(lat, lon, r.fields.DateTimeOriginal as string | undefined)
        if (tz && tz !== r.fields.OffsetTimeOriginal) out.push({ path: r.path, set: { OffsetTimeOriginal: tz } })
      }
    } else {
      const base = exifDateToMs(start)
      const step = Math.max(0, parseFloat(interval) || 0) * 1000
      if (base === null) return out
      sel.forEach((r, i) => {
        const v = msToExifDate(base + i * step)
        const set: FieldMap = {}
        for (const k of targets) set[k] = v
        out.push({ path: r.path, set })
      })
    }
    return out
  }, [mode, sel, targets, offsetMs, start, interval])

  const preview = edits.slice(0, 4)
  const label = { shift: 'Shifted dates', sequence: 'Sequenced dates', zone: 'Set time zone' }[mode] + ` on ${edits.length} photos`
  const withGps = sel.filter((r) => typeof r.fields.GPSLatitude === 'number' && typeof r.fields.GPSLongitude === 'number').length

  return (
    <Shell
      title="Date tools"
      width={560}
      footer={
        <>
          <span className="muted small">
            {edits.length} of {sel.length} selected photo{sel.length === 1 ? '' : 's'} will change
          </span>
          <button className="btn ghost" onClick={() => openModal(null)}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={!edits.length || busy}
            onClick={async () => {
              await writeEdits(edits, label)
              openModal(null)
            }}
          >
            Apply
          </button>
        </>
      }
    >
      <Segmented<'shift' | 'sequence' | 'zone'>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'shift', label: 'Shift by offset' },
          { value: 'sequence', label: 'Sequence (film scans)' },
          { value: 'zone', label: 'Time zone from GPS' }
        ]}
      />
      {mode === 'zone' ? (
        <div className="form-block">
          <p className="muted small">
            Looks up the time zone at each photo's location, daylight saving included, and writes it as the UTC offset. The clock time itself isn't changed.
            {withGps < sel.length && ` ${sel.length - withGps} of the selected photos have no location and will be skipped.`}
          </p>
        </div>
      ) : mode === 'shift' ? (
        <div className="form-block">
          <p className="muted small">Fix a camera clock that was wrong or in the wrong time zone. Photos without a date are skipped.</p>
          <div className="shift-row">
            <Segmented<'+' | '-'> value={sign} onChange={setSign} options={[{ value: '+', label: 'Later +' }, { value: '-', label: 'Earlier −' }]} />
            {(['d', 'h', 'm', 's'] as const).map((k) => (
              <label key={k} className="unit-input">
                <input inputMode="numeric" value={amt[k]} onChange={(e) => setAmt({ ...amt, [k]: e.target.value.replace(/\D/g, '') })} />
                <span>{{ d: 'days', h: 'hours', m: 'min', s: 'sec' }[k]}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="form-block">
          <p className="muted small">Gives each photo a date in the order shown on screen. Handy for a roll of film scans that only has a rough date.</p>
          <div className="shift-row">
            <label className="stack-label">
              <span>Start</span>
              <DateTimeField value={start} onCommit={setStart} />
            </label>
            <label className="unit-input">
              <input inputMode="numeric" value={interval} onChange={(e) => setInterval(e.target.value.replace(/[^\d.]/g, ''))} />
              <span>sec apart</span>
            </label>
          </div>
        </div>
      )}
      {mode !== 'zone' && (
        <div className="form-block">
          <span className="small muted">Apply to</span>
        <div className="chipset">
          {DATE_FIELDS.map((k) => (
            <Check key={k} checked={targets.includes(k)} onChange={(v) => setTargets(v ? [...targets, k] : targets.filter((t) => t !== k))}>
              {FIELD_BY_KEY[k].label}
            </Check>
          ))}
          </div>
        </div>
      )}
      {preview.length > 0 && (
        <div className="preview-table">
          {preview.map((e) => {
            const r = sel.find((x) => x.path === e.path)!
            const k = (Object.keys(e.set)[0] ?? 'DateTimeOriginal') as FieldKey
            const show = (v: unknown): string => (k === 'OffsetTimeOriginal' ? (typeof v === 'string' ? `UTC${v}` : '—') : fmtDate(v as string))
            return (
              <div key={e.path}>
                <span className="pt-name">{r.name}</span>
                <span className="muted">{show(r.fields[k])}</span>
                <span className="arrow">→</span>
                <span>{show(e.set[k])}</span>
              </div>
            )
          })}
          {edits.length > preview.length && <div className="muted small">…and {edits.length - preview.length} more</div>}
        </div>
      )}
    </Shell>
  )
}


function SyncModal(): JSX.Element {
  const sel = useSelection()
  const focus = useStore((s) => s.focus)
  const records = useStore((s) => s.records)
  const index = useStore((s) => s.index)
  const setDraft = useStore((s) => s.setDraft)
  const openModal = useStore((s) => s.openModal)
  const toast = useStore((s) => s.toast)
  const src = focus ? records[index.get(focus) ?? -1] : undefined
  const defaults = new Set(['Camera', 'Lens', 'Exposure'])
  const [keys, setKeys] = useState<FieldKey[]>(() => FIELDS.filter((f) => defaults.has(f.group) && src?.fields[f.key] != null).map((f) => f.key))

  if (!src) return <Shell title="Sync metadata">Select a photo to copy from first.</Shell>
  const show = (v: FieldValue | undefined): string => (v == null ? '(empty, will be cleared)' : Array.isArray(v) ? v.join(', ') : String(v))

  return (
    <Shell
      title={<>Sync from <em>{src.name}</em></>}
      width={560}
      footer={
        <>
          <span className="muted small">to {sel.length - 1} other selected photos</span>
          <button className="btn ghost" onClick={() => openModal(null)}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={!keys.length}
            onClick={() => {
              const patch: FieldMap = {}
              for (const k of keys) patch[k] = src.fields[k] ?? null
              setDraft(patch)
              openModal(null)
              toast('info', `Loaded ${keys.length} fields into the editor. Check them, then Apply`)
            }}
          >
            Load into editor
          </button>
        </>
      }
    >
      <div className="sync-list">
        {FIELDS.map((f) => (
          <Check key={f.key} checked={keys.includes(f.key)} onChange={(v) => setKeys(v ? [...keys, f.key] : keys.filter((k) => k !== f.key))}>
            <span className="sync-label">{f.label}</span>
            <span className={`sync-val ${src.fields[f.key] == null ? 'muted' : ''}`}>{show(src.fields[f.key])}</span>
          </Check>
        ))}
      </div>
    </Shell>
  )
}


function SettingsModal(): JSX.Element {
  const settings = useStore((s) => s.settings)
  const update = useStore((s) => s.updateSettings)
  return (
    <Shell title="Settings" width={600}>
      <div className="about">
        <img src={logo} alt="Exify" />
        <span className="muted small">Batch EXIF editor · powered by ExifTool</span>
      </div>
      <div className="settings-list">
        <Toggle
          checked={settings.keepBackups}
          onChange={(v) => void update({ keepBackups: v })}
          label="Keep backup copies"
          hint="Saves the untouched original next to each file as “name.jpg_original”. Undo works either way during a session."
        />
        <Toggle
          checked={settings.preserveFileDates}
          onChange={(v) => void update({ preserveFileDates: v })}
          label="Preserve file modified dates"
          hint="Editing metadata won't change the file's date in Explorer, so sorting by date still works."
        />
        <Toggle
          checked={settings.rawSidecars}
          onChange={(v) => void update({ rawSidecars: v })}
          label="Write RAW edits to XMP sidecars"
          hint="Edits to CR3, NEF, ARW and other RAW files go into a “name.xmp” file next to them, which Lightroom, Capture One and darktable all read. RAW files that already have a sidecar always use it. Clearing a field in a sidecar can't remove a value stored inside the RAW."
        />
        <Toggle
          checked={settings.recursive}
          onChange={(v) => void update({ recursive: v })}
          label="Include subfolders"
          hint="Scan every folder below the one you open."
        />
        <Toggle
          checked={settings.autoUpdate}
          onChange={(v) => void update({ autoUpdate: v })}
          label="Check for updates on startup"
          hint="Downloads new versions from GitHub in the background and installs them when you quit."
        />
      </div>
      <UpdateRow />
      <GearList title="My cameras" items={settings.customCameras} onRemove={(i) => void update({ customCameras: settings.customCameras.filter((_, j) => j !== i) })} />
      <GearList title="My lenses" items={settings.customLenses} onRemove={(i) => void update({ customLenses: settings.customLenses.filter((_, j) => j !== i) })} />
    </Shell>
  )
}

function UpdateRow(): JSX.Element {
  const status = useStore((s) => s.update)
  const [version, setVersion] = useState('')
  useEffect(() => {
    void api.appVersion().then(setVersion)
  }, [])
  const text = (() => {
    switch (status.state) {
      case 'checking':
        return 'Checking…'
      case 'none':
        return "You're on the latest version"
      case 'available':
        return `Version ${status.version} is out`
      case 'downloading':
        return `Downloading ${status.version}… ${status.percent}%`
      case 'ready':
        return `Version ${status.version} is ready to install`
      case 'error':
        return `Couldn't check: ${status.message}`
      case 'unsupported':
        return status.reason
      default:
        return ''
    }
  })()
  return (
    <div className="update-row">
      <span>
        Exify {version}
        {text && <span className="muted"> · {text}</span>}
      </span>
      {status.state === 'ready' ? (
        <button className="btn primary sm" onClick={() => void api.installUpdate()}>
          Restart and update
        </button>
      ) : status.state === 'available' ? (
        <button className="btn sm" onClick={() => window.open('https://github.com/wrrnstrpn/exify/releases/latest')}>
          Download
        </button>
      ) : (
        <button className="btn sm" disabled={status.state === 'checking' || status.state === 'downloading'} onClick={() => void api.checkForUpdates()}>
          Check now
        </button>
      )}
    </div>
  )
}

function GearList({ title, items, onRemove }: { title: string; items: { make: string; model: string }[]; onRemove(i: number): void }): JSX.Element {
  return (
    <div className="gear">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="muted small">Gear you type that isn't in the built-in list is remembered here and offered in the dropdowns.</p>
      ) : (
        items.map((g, i) => (
          <div key={`${g.make}|${g.model}`} className="gear-row">
            <span>{g.model}</span>
            <span className="muted">{g.make}</span>
            <button className="icon-btn ghost xs" onClick={() => onRemove(i)}>
              <IX size={12} />
            </button>
          </div>
        ))
      )}
    </div>
  )
}


function SavePresetModal(): JSX.Element {
  const sel = useSelection()
  const draft = useStore((s) => s.draft)
  const presets = useStore((s) => s.presets)
  const savePresets = useStore((s) => s.savePresets)
  const openModal = useStore((s) => s.openModal)
  const toast = useStore((s) => s.toast)

  const candidates = useMemo(() => {
    const out: FieldMap = {}
    for (const f of FIELDS) {
      if (DATE_FIELDS.includes(f.key) || f.group === 'Location') continue
      if (f.key in draft) {
        if (draft[f.key] != null) out[f.key] = draft[f.key]
        continue
      }
      const v = sel[0]?.fields[f.key]
      if (v != null && sel.every((r) => valuesEqual(r.fields[f.key], v))) out[f.key] = v
    }
    return out
  }, [sel, draft])

  const [keys, setKeys] = useState<FieldKey[]>(() => {
    const d = Object.keys(draft).filter((k) => k in candidates) as FieldKey[]
    return d.length ? d : (Object.keys(candidates) as FieldKey[]).filter((k) => ['Camera', 'Lens'].includes(FIELD_BY_KEY[k].group))
  })
  const [name, setName] = useState(() => [candidates.Model, candidates.LensModel].filter(Boolean).join(' + ') || 'My preset')

  return (
    <Shell
      title="Save preset"
      footer={
        <>
          <button className="btn ghost" onClick={() => openModal(null)}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={!keys.length || !name.trim()}
            onClick={async () => {
              const fields: FieldMap = {}
              for (const k of keys) fields[k] = candidates[k]
              await savePresets([...presets, { id: `${Date.now()}`, name: name.trim(), fields }])
              openModal(null)
              toast('success', `Saved preset “${name.trim()}”`)
            }}
          >
            Save preset
          </button>
        </>
      }
    >
      <label className="stack-label">
        <span>Name</span>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      {Object.keys(candidates).length === 0 ? (
        <p className="muted">Set some fields (or select photos that share values) first.</p>
      ) : (
        <div className="sync-list">
          {(Object.keys(candidates) as FieldKey[]).map((k) => (
            <Check key={k} checked={keys.includes(k)} onChange={(v) => setKeys(v ? [...keys, k] : keys.filter((x) => x !== k))}>
              <span className="sync-label">{FIELD_BY_KEY[k].label}</span>
              <span className="sync-val">{Array.isArray(candidates[k]) ? (candidates[k] as string[]).join(', ') : String(candidates[k])}</span>
            </Check>
          ))}
        </div>
      )}
    </Shell>
  )
}


function StripModal(): JSX.Element {
  const sel = useSelection()
  const keep = useStore((s) => s.settings.keepBackups)
  const strip = useStore((s) => s.strip)
  const openModal = useStore((s) => s.openModal)
  const busy = useStore((s) => s.busy)
  return (
    <Shell
      title="Strip all metadata"
      footer={
        <>
          <button className="btn ghost" onClick={() => openModal(null)}>
            Cancel
          </button>
          <button
            className="btn danger"
            disabled={busy}
            onClick={async () => {
              openModal(null)
              await strip(sel.map((r) => r.path))
            }}
          >
            Strip {sel.length} photo{sel.length === 1 ? '' : 's'}
          </button>
        </>
      }
    >
      <p>
        Removes EXIF, XMP, IPTC, GPS and maker notes from <b>{sel.length}</b> photo{sel.length === 1 ? '' : 's'}. The colour profile and
        orientation are kept so images still look right.
      </p>
      <p className={keep ? 'muted' : 'warn-text'}>
        {keep ? 'Backups are on, so the originals are kept as “*_original” files.' : "This can't be undone. Turn on “Keep backup copies” in Settings if you want a safety net."}
      </p>
    </Shell>
  )
}


function ErrorsModal({ results }: { results: { path: string; error?: string }[] }): JSX.Element {
  return (
    <Shell title="Some files couldn't be written" width={640}>
      <div className="errors">
        {results.map((r) => (
          <div key={r.path} className="error-row">
            <IError size={14} />
            <div>
              <strong>{r.path.split(/[\\/]/).pop()}</strong>
              <span>{r.error}</span>
            </div>
            <button className="icon-btn ghost xs" onClick={() => api.showInFolder(r.path)} title={revealLabel}>
              <IFolder size={13} />
            </button>
          </div>
        ))}
      </div>
    </Shell>
  )
}


function Lightbox({ path }: { path: string }): JSX.Element {
  const visible = useStore((s) => s.visible)
  const records = useStore((s) => s.records)
  const index = useStore((s) => s.index)
  const versions = useStore((s) => s.versions)
  const openModal = useStore((s) => s.openModal)
  const select = useStore((s) => s.select)
  const rec = records[index.get(path) ?? -1]
  const i = visible.indexOf(path)

  const go = (d: number): void => {
    const next = visible[i + d]
    if (!next) return
    select(next, 'single')
    openModal({ kind: 'lightbox', path: next })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') openModal(null)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const f = rec?.fields ?? {}
  return (
    <div className="lightbox" onMouseDown={(e) => e.target === e.currentTarget && openModal(null)}>
      <img src={api.previewUrl(path, versions[path])} alt="" />
      <button className="lb-nav left" onClick={() => go(-1)} disabled={i <= 0}>
        <IChevronLeft size={22} />
      </button>
      <button className="lb-nav right" onClick={() => go(1)} disabled={i >= visible.length - 1}>
        <IChevronRight size={22} />
      </button>
      <div className="lb-info">
        <strong>{rec?.name}</strong>
        <span>
          {[f.Model, f.LensModel, typeof f.FocalLength === 'number' ? `${f.FocalLength}mm` : null, typeof f.FNumber === 'number' ? `ƒ/${f.FNumber}` : null, f.ExposureTime ? `${f.ExposureTime}s` : null, f.ISO ? `ISO ${f.ISO}` : null, fmtDate(f.DateTimeOriginal as string)]
            .filter((x) => x && x !== '—')
            .join('  ·  ')}
        </span>
        <span className="muted small">
          {i + 1} / {visible.length}
        </span>
      </div>
      <button className="lb-close icon-btn" onClick={() => openModal(null)}>
        <IX size={18} />
      </button>
    </div>
  )
}
