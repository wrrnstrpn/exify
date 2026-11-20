import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { FIELDS, valuesEqual, type FieldDef, type FieldValue } from '@shared/fields'
import type { PhotoRecord } from '@shared/types'
import { api, useStore } from '../../store'
import { Check } from '../Controls'
import { IChevronLeft, IChevronRight } from '../Icons'
import { Shell, useSelection } from '../Shell'

const show = (v: FieldValue | undefined): string => (v == null || v === '' ? '' : Array.isArray(v) ? v.join(', ') : String(v))

const MAX = 4

export function CompareModal(): JSX.Element {
  const sel = useSelection()
  const versions = useStore((s) => s.versions)
  const writeEdits = useStore((s) => s.writeEdits)
  const busy = useStore((s) => s.busy)
  const [onlyDiff, setOnlyDiff] = useState(true)
  const photos = sel.slice(0, MAX)

  const rows = useMemo(() => {
    return FIELDS.map((f) => {
      const vals = photos.map((p) => p.fields[f.key])
      const same = vals.every((v) => valuesEqual(v, vals[0]))
      return { f, vals, same }
    }).filter((r) => (onlyDiff ? !r.same : r.vals.some((v) => v != null)))
  }, [photos, onlyDiff])

  // Only offered side by side, where "the other one" is unambiguous.
  const copy = (f: FieldDef, from: PhotoRecord, to: PhotoRecord): void => {
    void writeEdits([{ path: to.path, set: { [f.key]: from.fields[f.key] ?? null } }], `Copied ${f.label} to ${to.name}`)
  }

  return (
    <Shell title="Compare" width={photos.length > 2 ? 980 : 760}>
      {sel.length > MAX && <p className="muted small">Showing the first {MAX} of {sel.length} selected photos.</p>}
      <div className="compare" style={{ gridTemplateColumns: `150px repeat(${photos.length}, 1fr)${photos.length === 2 ? ' 64px' : ''}` }}>
        <span />
        {photos.map((p) => (
          <div key={p.path} className="compare-thumb">
            <img src={api.thumbUrl(p.path, 320, versions[p.path])} alt="" />
            <span title={p.name}>{p.name}</span>
          </div>
        ))}
        {photos.length === 2 && <span />}
        {rows.map(({ f, vals, same }) => (
          <div key={f.key} className={`compare-row ${same ? '' : 'diff'}`} style={{ display: 'contents' }}>
            <span className="compare-label">{f.label}</span>
            {vals.map((v, i) => (
              <span key={i} className={`compare-val ${v == null ? 'muted' : ''}`} title={show(v)}>
                {show(v) || 'not set'}
              </span>
            ))}
            {photos.length === 2 && (
              <span className="compare-copy">
                {!same && (
                  <>
                    <button className="icon-btn ghost xs" disabled={busy} title={`Copy to ${photos[0].name}`} onClick={() => copy(f, photos[1], photos[0])}>
                      <IChevronLeft size={13} />
                    </button>
                    <button className="icon-btn ghost xs" disabled={busy} title={`Copy to ${photos[1].name}`} onClick={() => copy(f, photos[0], photos[1])}>
                      <IChevronRight size={13} />
                    </button>
                  </>
                )}
              </span>
            )}
          </div>
        ))}
      </div>
      {rows.length === 0 && <p className="muted">{onlyDiff ? 'Every field matches.' : 'None of these photos have metadata.'}</p>}
      <Check checked={onlyDiff} onChange={setOnlyDiff}>
        Only show fields that differ
      </Check>
    </Shell>
  )
}
