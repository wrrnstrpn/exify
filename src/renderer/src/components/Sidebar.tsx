import type { JSX } from 'react'
import { useMemo, useState, type ReactNode } from 'react'
import type { PhotoRecord } from '@shared/types'
import { findCamera } from '../data/cameras'
import {
  activeFilterCount,
  cameraKey,
  facetCounts,
  folderKey,
  lensKey,
  NONE,
  typeKey,
  type Filters,
  type MissingKey
} from '../lib/filter'
import { validateCached, worstLevel } from '../lib/validate'
import { useStore } from '../store'
import { Check, DateTimeField, Segmented, Stars } from './Controls'
import { IChevronDown, IFilter, ISearch, IX } from './Icons'

const MISSING: { key: MissingKey; label: string }[] = [
  { key: 'date', label: 'Date taken' },
  { key: 'camera', label: 'Camera' },
  { key: 'lens', label: 'Lens' },
  { key: 'exposure', label: 'Exposure' },
  { key: 'gps', label: 'Location' },
  { key: 'artist', label: 'Artist' },
  { key: 'copyright', label: 'Copyright' }
]

export function Sidebar({ records }: { records: PhotoRecord[] }): JSX.Element {
  const filters = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const resetFilters = useStore((s) => s.resetFilters)
  const n = activeFilterCount(filters)

  const cams = useMemo(() => facetCounts(records, cameraKey), [records])
  const lenses = useMemo(() => facetCounts(records, lensKey), [records])
  const types = useMemo(() => facetCounts(records, typeKey), [records])
  const folders = useMemo(() => facetCounts(records, folderKey), [records])
  const issueCounts = useMemo(() => {
    let warn = 0
    let err = 0
    for (const r of records) {
      const l = worstLevel(validateCached(r.fields))
      if (l === 'error') err++
      else if (l === 'warning') warn++
    }
    return { warn, err }
  }, [records])

  const toggleIn = (key: 'cameras' | 'lenses' | 'types' | 'folders', v: string): void => {
    const cur = filters[key]
    setFilters({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as Partial<Filters>)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <IFilter size={14} />
        <span>Filters</span>
        {n > 0 && (
          <button className="link" onClick={resetFilters}>
            Clear {n}
          </button>
        )}
      </div>
      <div className="sidebar-scroll">
        <Section title="Metadata check" defaultOpen>
          <Segmented
            value={filters.issues}
            onChange={(v) => setFilters({ issues: v })}
            options={[
              { value: 'all', label: 'All' },
              { value: 'any', label: <>Flagged <b className="pill warn">{issueCounts.warn + issueCounts.err}</b></> },
              { value: 'errors', label: <>Errors <b className="pill err">{issueCounts.err}</b></> },
              { value: 'clean', label: 'Clean' }
            ]}
          />
        </Section>

        <Facet title="Camera" items={cams} selected={filters.cameras} onToggle={(v) => toggleIn('cameras', v)} labelFor={(v) => (v === NONE ? 'No camera' : findCamera(undefined, v)?.label ?? v)} />
        <Facet title="Lens" items={lenses} selected={filters.lenses} onToggle={(v) => toggleIn('lenses', v)} labelFor={(v) => (v === NONE ? 'No lens' : v)} />

        <Section title="Missing" defaultOpen>
          <div className="chipset">
            {MISSING.map((m) => (
              <button
                key={m.key}
                className={`tagbtn ${filters.missing.includes(m.key) ? 'on' : ''}`}
                onClick={() =>
                  setFilters({ missing: filters.missing.includes(m.key) ? filters.missing.filter((x) => x !== m.key) : [...filters.missing, m.key] })
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Date taken">
          <div className="range-pair">
            <DateTimeField dateOnly value={filters.dateFrom} placeholder="From" onCommit={(v) => setFilters({ dateFrom: v })} />
            <DateTimeField dateOnly value={filters.dateTo} placeholder="To" onCommit={(v) => setFilters({ dateTo: v })} />
          </div>
        </Section>

        <Section title="Exposure">
          <Range label="ISO" min={filters.isoMin} max={filters.isoMax} onChange={(a, b) => setFilters({ isoMin: a, isoMax: b })} />
          <Range label="Focal mm" min={filters.focalMin} max={filters.focalMax} onChange={(a, b) => setFilters({ focalMin: a, focalMax: b })} />
          <Range label="Aperture ƒ" min={filters.apMin} max={filters.apMax} onChange={(a, b) => setFilters({ apMin: a, apMax: b })} />
        </Section>

        <Section title="Rating">
          <Stars value={filters.ratingMin || null} onChange={(v) => setFilters({ ratingMin: v })} />
          <span className="muted small">and above</span>
        </Section>

        {folders.length > 1 && (
          <Facet title="Folder" items={folders} selected={filters.folders} onToggle={(v) => toggleIn('folders', v)} labelFor={(v) => (v === '.' ? '(root)' : v)} />
        )}
        <Facet title="File type" items={types} selected={filters.types} onToggle={(v) => toggleIn('types', v)} labelFor={(v) => v} />
      </div>
    </aside>
  )
}

function Section({ title, children, defaultOpen = false, extra }: { title: string; children: ReactNode; defaultOpen?: boolean; extra?: ReactNode }): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={`fsec ${open ? '' : 'collapsed'}`}>
      <button className="fsec-head" onClick={() => setOpen(!open)}>
        <IChevronDown size={13} className="group-caret" />
        <span>{title}</span>
        {extra}
      </button>
      {open && <div className="fsec-body">{children}</div>}
    </section>
  )
}

function Facet({
  title,
  items,
  selected,
  onToggle,
  labelFor
}: {
  title: string
  items: [string, number][]
  selected: string[]
  onToggle(v: string): void
  labelFor(v: string): string
}): JSX.Element {
  const [q, setQ] = useState('')
  const [all, setAll] = useState(false)
  const shown = items.filter(([v]) => !q || labelFor(v).toLowerCase().includes(q.toLowerCase()))
  const limit = all ? shown.length : 8
  return (
    <Section title={title} defaultOpen extra={selected.length ? <b className="pill">{selected.length}</b> : null}>
      {items.length > 8 && (
        <div className="mini-search">
          <ISearch size={12} />
          <input value={q} placeholder={`Find ${title.toLowerCase()}…`} onChange={(e) => setQ(e.target.value)} />
          {q && (
            <button onClick={() => setQ('')}>
              <IX size={11} />
            </button>
          )}
        </div>
      )}
      {items.length === 0 && <span className="muted small">Nothing loaded yet</span>}
      {shown.slice(0, limit).map(([v, n]) => (
        <Check key={v} checked={selected.includes(v)} onChange={() => onToggle(v)} count={n}>
          <span className={v === NONE ? 'muted' : ''}>{labelFor(v)}</span>
        </Check>
      ))}
      {shown.length > limit && (
        <button className="link" onClick={() => setAll(true)}>
          Show all {shown.length}
        </button>
      )}
    </Section>
  )
}

function Range({ label, min, max, onChange }: { label: string; min: string; max: string; onChange(a: string, b: string): void }): JSX.Element {
  const clean = (s: string): string => s.replace(/[^\d.]/g, '')
  return (
    <div className="range">
      <span>{label}</span>
      <input inputMode="decimal" value={min} placeholder="min" onChange={(e) => onChange(clean(e.target.value), max)} />
      <i>–</i>
      <input inputMode="decimal" value={max} placeholder="max" onChange={(e) => onChange(min, clean(e.target.value))} />
    </div>
  )
}
