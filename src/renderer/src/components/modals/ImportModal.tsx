import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { FIELDS, FIELD_BY_KEY, valuesEqual, type FieldKey, type FieldMap } from '@shared/fields'
import type { FileEdit, TextFile } from '@shared/types'
import { buildImport, guessTarget, looksLikeHeader, parseCsv, type ColumnTarget, type DateOrder, type MatchMode } from '../../lib/csvImport'
import { api, useStore } from '../../store'
import { Select } from '../Combobox'
import { Check, Segmented } from '../Controls'
import { IDownload } from '../Icons'
import { Shell, useSelection } from '../Shell'

const TARGETS: { value: ColumnTarget; label: string; group: string }[] = [
  { value: '', label: 'Ignore', group: 'Skip' },
  { value: 'file', label: 'File name', group: 'Match by' },
  { value: 'frame', label: 'Frame number', group: 'Match by' },
  { value: 'date', label: 'Date (and time)', group: 'Date' },
  { value: 'time', label: 'Time only', group: 'Date' },
  { value: 'latlon', label: 'Latitude, longitude', group: 'Location' },
  ...FIELDS.filter((f) => f.kind !== 'datetime' && f.key !== 'OffsetTimeOriginal').map((f) => ({ value: f.key as ColumnTarget, label: f.label, group: f.group }))
]

const labelOf = (t: ColumnTarget): string => TARGETS.find((x) => x.value === t)?.label ?? t

const summary = (set: FieldMap): string =>
  (Object.entries(set) as [FieldKey, unknown][])
    .map(([k, v]) => `${FIELD_BY_KEY[k].label}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
    .join(' · ')

export function ImportModal(): JSX.Element {
  const selection = useSelection()
  const records = useStore((s) => s.records)
  const index = useStore((s) => s.index)
  const visible = useStore((s) => s.visible)
  const writeEdits = useStore((s) => s.writeEdits)
  const openModal = useStore((s) => s.openModal)
  const busy = useStore((s) => s.busy)

  // With nothing selected, rows go to everything on screen.
  const photos = useMemo(
    () => (selection.length ? selection : visible.map((p) => records[index.get(p) ?? -1]).filter(Boolean)),
    [selection, visible, records, index]
  )

  const [file, setFile] = useState<TextFile | null>(null)
  const [grid, setGrid] = useState<string[][]>([])
  const [header, setHeader] = useState(true)
  const [mapping, setMapping] = useState<ColumnTarget[]>([])
  const [match, setMatch] = useState<MatchMode>('order')
  const [dateOrder, setDateOrder] = useState<DateOrder>('dmy')
  const [overwrite, setOverwrite] = useState(true)

  const load = async (): Promise<void> => {
    const [f] = await api.openTextFiles('csv', false)
    if (!f) return
    const rows = parseCsv(f.content)
    const hasHeader = rows.length > 0 && looksLikeHeader(rows[0])
    const width = Math.max(0, ...rows.map((r) => r.length))
    const m: ColumnTarget[] = Array.from({ length: width }, (_, i) => (hasHeader ? guessTarget(rows[0][i] ?? '') : ''))
    setFile(f)
    setGrid(rows)
    setHeader(hasHeader)
    setMapping(m)
    setMatch(m.includes('file') ? 'file' : m.includes('frame') ? 'frame' : 'order')
  }

  const body = header ? grid.slice(1) : grid
  const rows = useMemo(() => buildImport(body, photos, { mapping, match, dateOrder }), [body, photos, mapping, match, dateOrder])
  const usesSlashDates = mapping.some((t, i) => t === 'date' && body.some((r) => /\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(r[i] ?? '')))

  const edits = useMemo<FileEdit[]>(() => {
    const out: FileEdit[] = []
    for (const r of rows) {
      if (!r.photo) continue
      const set: FieldMap = {}
      for (const [k, v] of Object.entries(r.set) as [FieldKey, FieldMap[FieldKey]][]) {
        const cur = r.photo.fields[k]
        if (!overwrite && cur != null && cur !== '') continue
        if (!valuesEqual(cur, v)) set[k] = v
      }
      if (Object.keys(set).length) out.push({ path: r.photo.path, set })
    }
    return out
  }, [rows, overwrite])

  const unmatched = rows.filter((r) => !r.photo).length
  const problems = rows.reduce((n, r) => n + r.problems.length, 0)

  if (!file) {
    return (
      <Shell title="Import from CSV or shooting log" width={560}>
        <p>
          Fill in metadata from a spreadsheet or a film shooting log: aperture, shutter, lens, film stock, dates, notes, locations. Rows are matched
          to photos by file name, frame number, or simply in order.
        </p>
        <p className="muted small">
          It goes to the {selection.length ? `${selection.length} selected` : `${photos.length} visible`} photo{photos.length === 1 ? '' : 's'}. You'll
          see a preview before anything is written.
        </p>
        <button className="btn primary" onClick={() => void load()}>
          <IDownload size={15} /> Choose a file…
        </button>
      </Shell>
    )
  }

  const sample = (c: number): string => body.find((r) => r[c])?.[c] ?? ''

  return (
    <Shell
      title={<>Import <em>{file.name}</em></>}
      width={820}
      footer={
        <>
          <span className="muted small">
            {edits.length} photo{edits.length === 1 ? '' : 's'} will change
            {unmatched > 0 && ` · ${unmatched} row${unmatched === 1 ? '' : 's'} without a photo`}
            {problems > 0 && ` · ${problems} value${problems === 1 ? '' : 's'} couldn't be read`}
          </span>
          <button className="btn ghost" onClick={() => setFile(null)}>
            Other file
          </button>
          <button
            className="btn primary"
            disabled={!edits.length || busy}
            onClick={async () => {
              await writeEdits(edits, `Imported ${file.name} into ${edits.length} photos`)
              openModal(null)
            }}
          >
            Import
          </button>
        </>
      }
    >
      <div className="import-opts">
        <Check checked={header} onChange={setHeader}>
          First row is a header
        </Check>
        <Check checked={overwrite} onChange={setOverwrite}>
          Replace values photos already have
        </Check>
      </div>

      <div className="import-map">
        {mapping.map((t, c) => (
          <div key={c} className="import-col">
            <span className="import-head" title={header ? grid[0]?.[c] : undefined}>
              {header ? grid[0]?.[c] || `Column ${c + 1}` : `Column ${c + 1}`}
            </span>
            <span className="import-sample muted" title={sample(c)}>
              {sample(c) || '—'}
            </span>
            <Select
              value={t}
              placeholder="Ignore"
              popoverWidth={240}
              options={TARGETS.map((x) => ({ value: x.value, label: x.label, group: x.group }))}
              onCommit={(v) => setMapping(mapping.map((m, i) => (i === c ? (v as ColumnTarget) : m === v && v ? '' : m)))}
            />
          </div>
        ))}
      </div>

      <div className="shift-row">
        <span className="small muted">Match rows to photos</span>
        <Segmented<MatchMode>
          value={match}
          onChange={setMatch}
          options={[
            { value: 'order', label: 'In order' },
            { value: 'file', label: 'By file name' },
            { value: 'frame', label: 'By frame number' }
          ]}
        />
        {usesSlashDates && (
          <>
            <span className="small muted">Dates are</span>
            <Segmented<DateOrder>
              value={dateOrder}
              onChange={setDateOrder}
              options={[
                { value: 'dmy', label: 'day/month' },
                { value: 'mdy', label: 'month/day' }
              ]}
            />
          </>
        )}
      </div>
      {match === 'file' && !mapping.includes('file') && <p className="warn-text small">Pick which column holds the file name.</p>}
      {match === 'frame' && !mapping.includes('frame') && (
        <p className="warn-text small">Pick which column holds the frame number. It's matched against the last number in each file name, so “Scan_012.jpg” is frame 12.</p>
      )}
      {match === 'order' && (
        <p className="muted small">Row 1 goes to the first photo on screen, row 2 to the second, and so on. Sort the grid by name first if that's the order your scans are in.</p>
      )}

      <div className="preview-table import">
        {rows.slice(0, 12).map((r) => (
          <div key={r.row} className={r.problems.length ? 'has-problem' : ''}>
            <span className="pt-name">{r.photo?.name ?? <i className="muted">no photo</i>}</span>
            <span className="pt-set" title={[summary(r.set), ...r.problems].join('\n')}>
              {summary(r.set) || <span className="muted">nothing to import</span>}
              {r.problems.length > 0 && <span className="warn-text"> · {r.problems[0]}</span>}
            </span>
          </div>
        ))}
        {rows.length > 12 && <div className="muted small">…and {rows.length - 12} more rows</div>}
      </div>
      {mapping.every((t) => !t) && <p className="muted small">None of the column names were recognised. Choose a target for each column you want to use.</p>}
      <span className="muted small">Mapped: {mapping.filter(Boolean).map(labelOf).join(', ') || 'nothing yet'}</span>
    </Shell>
  )
}
