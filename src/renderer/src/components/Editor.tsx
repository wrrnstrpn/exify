import type { JSX } from 'react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  EXPOSURE_PROGRAMS,
  FIELDS,
  FIELD_GROUPS,
  ORIENTATIONS,
  formatExposure,
  parseExposure,
  valuesEqual,
  type FieldDef,
  type FieldGroup,
  type FieldKey,
  type FieldMap,
  type FieldValue
} from '@shared/fields'
import type { PhotoRecord } from '@shared/types'
import { sameMake } from '../data/cameras'
import { findLens, isPrime, parseLensSpecs, type LensModel } from '../data/lenses'
import {
  apertureOptions,
  cropFor,
  focalOptions,
  isoOptions,
  lensMakeOptions,
  lensOptions,
  makeOptions,
  modelOptions,
  shutterOptions,
  textOptions,
  type Context,
  type Option
} from '../lib/options'
import { validate, type Issue } from '../lib/validate'
import { api, buildEdit, selectedRecords, useStore } from '../store'
import { Combobox, Select } from './Combobox'
import { DateTimeField, Stars, TextField, Toggle } from './Controls'
import { AllTags } from './AllTags'
import {
  ICalendar,
  IChevronDown,
  IError,
  IExternal,
  IFolder,
  IImage,
  IPin,
  IRevert,
  ISync,
  IWarn,
  IX,
  ILayers,
  IBolt
} from './Icons'
import { KeywordsField } from './KeywordsField'

interface Common {
  value: FieldValue | undefined
  mixed: boolean
  distinct: number
}

function commonValue(recs: PhotoRecord[], key: FieldKey): Common {
  if (!recs.length) return { value: undefined, mixed: false, distinct: 0 }
  const first = recs[0].fields[key]
  let distinct = 1
  const seen: (FieldValue | undefined)[] = [first]
  for (let i = 1; i < recs.length; i++) {
    const v = recs[i].fields[key]
    if (!seen.some((s) => valuesEqual(s, v))) {
      seen.push(v)
      distinct++
      if (distinct > 50) break
    }
  }
  return { value: distinct === 1 ? first : undefined, mixed: distinct > 1, distinct }
}

const str = (v: FieldValue | undefined): string =>
  v === undefined || v === null ? '' : Array.isArray(v) ? v.join(', ') : String(v)

const TZ_OPTIONS: Option[] = Array.from({ length: 27 * 4 }, (_, i) => -12 * 60 + i * 15)
  .filter((m) => m <= 14 * 60 && (m % 60 === 0 || [-570, -210, 210, 270, 330, 345, 390, 525, 570, 630, 765, 825].includes(m)))
  .map((m) => {
    const sign = m < 0 ? '-' : '+'
    const a = Math.abs(m)
    const v = `${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`
    return { value: v, label: `UTC${v}` }
  })

const EV_OPTIONS: Option[] = Array.from({ length: 31 }, (_, i) => Math.round((-5 + i / 3) * 10) / 10)
  .filter((v) => Math.abs(v) <= 3)
  .map((v) => ({ value: String(v), label: `${v > 0 ? '+' : ''}${v} EV` }))

const parseNum = (s: string): number | null => {
  const n = parseFloat(s.replace(/^(ƒ|f)\s*\/?\s*/i, '').replace(/^iso\s*/i, '').replace(/mm$/i, '').replace(',', '.'))
  return isFinite(n) ? n : null
}

const GROUP_ICON: Record<FieldGroup, ReactNode> = {
  Camera: null,
  Lens: null,
  Exposure: null,
  'Date & Time': null,
  Description: null,
  Location: null,
  Image: null
}

function loadCollapsed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem('exify.collapsed') ?? '{}')
  } catch {
    return {}
  }
}

export function Editor(): JSX.Element {
  const selected = useStore((s) => s.selected)
  const records = useStore((s) => s.records)
  const index = useStore((s) => s.index)
  const [tab, setTab] = useState<'meta' | 'tags'>('meta')
  const sel = useMemo(() => selectedRecords({ selected, records, index }), [selected, records, index])

  if (!sel.length) {
    return (
      <aside className="editor empty">
        <div className="editor-empty">
          <IImage size={34} />
          <h3>No photos selected</h3>
          <p>
            Click a photo to edit it. <kbd>Ctrl</kbd>/<kbd>Shift</kbd>-click or <kbd>Ctrl</kbd>+<kbd>A</kbd> to batch-edit many at once.
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="editor">
      <EditorHeader sel={sel} />
      {sel.length === 1 && (
        <div className="tabs">
          <button className={tab === 'meta' ? 'on' : ''} onClick={() => setTab('meta')}>
            Edit
          </button>
          <button className={tab === 'tags' ? 'on' : ''} onClick={() => setTab('tags')}>
            All tags
          </button>
        </div>
      )}
      {sel.length === 1 && tab === 'tags' ? <AllTags path={sel[0].path} version={sel[0]} /> : <MetaForm sel={sel} />}
    </aside>
  )
}

function EditorHeader({ sel }: { sel: PhotoRecord[] }): JSX.Element {
  const versions = useStore((s) => s.versions)
  const openModal = useStore((s) => s.openModal)
  if (sel.length === 1) {
    const r = sel[0]
    return (
      <div className="editor-head single">
        <div className="editor-preview" onDoubleClick={() => openModal({ kind: 'lightbox', path: r.path })}>
          <img src={api.thumbUrl(r.path, 480, versions[r.path])} alt="" draggable={false} />
        </div>
        <div className="editor-title">
          <strong title={r.name}>{r.name}</strong>
          <span>
            {[r.fileType, r.width && r.height ? `${r.width}×${r.height}` : null, r.fileSize ? fmtSize(r.fileSize) : null, r.rel || null]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {r.error && <span className="err-text">{r.error}</span>}
        </div>
        <div className="editor-head-actions">
          <button className="icon-btn" title="View larger" onClick={() => openModal({ kind: 'lightbox', path: r.path })}>
            <IImage size={15} />
          </button>
          <button className="icon-btn" title="Show in Explorer" onClick={() => api.showInFolder(r.path)}>
            <IFolder size={15} />
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="editor-head multi">
      <div className="stack">
        {sel.slice(0, 3).map((r, i) => (
          <img key={r.path} src={api.thumbUrl(r.path, 160, versions[r.path])} alt="" style={{ transform: `rotate(${(i - 1) * 6}deg) translateX(${(i - 1) * 10}px)`, zIndex: 3 - Math.abs(i - 1) }} />
        ))}
      </div>
      <div className="editor-title">
        <strong>{sel.length} photos selected</strong>
        <span>Changes apply to every selected photo. Fields marked “Mixed” keep their per-photo values unless you set them.</span>
      </div>
    </div>
  )
}

function fmtSize(b: number): string {
  if (b > 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`
  return `${Math.round(b / 1e3)} KB`
}

function MetaForm({ sel }: { sel: PhotoRecord[] }): JSX.Element {
  const draft = useStore((s) => s.draft)
  const keywordOps = useStore((s) => s.keywordOps)
  const setDraft = useStore((s) => s.setDraft)
  const dropDraft = useStore((s) => s.dropDraft)
  const discardDraft = useStore((s) => s.discardDraft)
  const applyDraft = useStore((s) => s.applyDraft)
  const busy = useStore((s) => s.busy)
  const allRecords = useStore((s) => s.records)
  const settings = useStore((s) => s.settings)
  const presets = useStore((s) => s.presets)
  const savePresets = useStore((s) => s.savePresets)
  const openModal = useStore((s) => s.openModal)
  const toast = useStore((s) => s.toast)
  const focus = useStore((s) => s.focus)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed)
  const [syncDates, setSyncDates] = useState(() => localStorage.getItem('exify.syncDates') !== '0')

  useEffect(() => {
    try {
      localStorage.setItem('exify.collapsed', JSON.stringify(collapsed))
    } catch {
      /* ignore */
    }
  }, [collapsed])

  const commons = useMemo(() => {
    const m = {} as Record<FieldKey, Common>
    for (const f of FIELDS) m[f.key] = commonValue(sel, f.key)
    return m
  }, [sel])

  const eff = (k: FieldKey): FieldValue | undefined => (k in draft ? draft[k] : commons[k].mixed ? undefined : commons[k].value)
  const effStr = (k: FieldKey): string => str(eff(k))
  const effNum = (k: FieldKey): number | undefined => {
    const v = eff(k)
    return typeof v === 'number' ? v : undefined
  }

  const ctx: Context = {
    make: effStr('Make') || undefined,
    model: effStr('Model') || undefined,
    lens: effStr('LensModel') || undefined,
    focal: effNum('FocalLength')
  }

  // Validate every selected photo as it would look after applying the draft.
  const issuesByField = useMemo(() => {
    const out = new Map<FieldKey, { level: 'error' | 'warning'; messages: Map<string, number> }>()
    const sample = sel.length > 1500 ? sel.slice(0, 1500) : sel
    for (const r of sample) {
      const merged: FieldMap = { ...r.fields, ...draft }
      for (const i of validate(merged)) {
        const e = out.get(i.field) ?? { level: 'warning' as const, messages: new Map() }
        if (i.level === 'error') e.level = 'error'
        e.messages.set(i.message, (e.messages.get(i.message) ?? 0) + 1)
        out.set(i.field, e)
      }
    }
    return out
  }, [sel, draft])

  const pending = useMemo(() => {
    let files = 0
    for (const r of sel) if (Object.keys(buildEdit(r, draft, keywordOps)).length) files++
    return files
  }, [sel, draft, keywordOps])
  const draftCount = Object.keys(draft).length + (keywordOps.add.length || keywordOps.remove.length ? 1 : 0)

  const crop = cropFor(ctx)

  // ------------------------------------------------------------ actions --
  const set = (patch: FieldMap): void => setDraft(patch)

  const onModel = (v: string, opt?: Option): void => {
    const patch: FieldMap = { Model: v || null }
    const data = opt?.data as { make?: string } | undefined
    if (data?.make && !sameMake(data.make, ctx.make)) patch.Make = data.make
    set(patch)
  }

  const onLens = (v: string, opt?: Option): void => {
    const patch: FieldMap = { LensModel: v || null }
    const lens = (opt?.data as LensModel | undefined) ?? findLens(v)
    if (lens?.make && !sameMake(lens.make, effStr('LensMake'))) patch.LensMake = lens.make
    const spec = parseLensSpecs(v)
    if (isPrime(spec) && spec.minFocal !== undefined) {
      patch.FocalLength = spec.minFocal
      if (crop) patch.FocalLengthIn35mmFormat = Math.round(spec.minFocal * crop)
      toast('info', `Prime lens: focal length set to ${spec.minFocal}mm`)
    }
    set(patch)
  }

  const onFocal = (v: string): void => {
    if (!v) return set({ FocalLength: null })
    const n = parseNum(v)
    if (n === null || n <= 0) return toast('error', `“${v}” isn't a focal length`)
    const patch: FieldMap = { FocalLength: n }
    if (crop) patch.FocalLengthIn35mmFormat = Math.round(n * crop)
    set(patch)
  }

  const onNumber = (k: FieldKey, label: string) => (v: string): void => {
    if (!v) return set({ [k]: null })
    const n = parseNum(v)
    if (n === null) return toast('error', `“${v}” isn't a valid ${label}`)
    set({ [k]: n })
  }

  const onShutter = (v: string): void => {
    if (!v) return set({ ExposureTime: null })
    const s = parseExposure(v)
    if (s === null) return toast('error', `“${v}” isn't a shutter speed — try 1/125, 0.5 or 30`)
    set({ ExposureTime: s < 0.3 ? formatExposure(s) : String(Math.round(s * 10) / 10) })
  }

  const onDate = (k: FieldKey) => (v: string): void => {
    if (k === 'DateTimeOriginal' && syncDates) set({ DateTimeOriginal: v || null, CreateDate: v || null, ModifyDate: v || null })
    else set({ [k]: v || null })
  }

  const onGpsPaste = (text: string): boolean => {
    const m = /(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/.exec(text)
    if (!m) return false
    set({ GPSLatitude: parseFloat(m[1]), GPSLongitude: parseFloat(m[2]) })
    return true
  }

  const applyPreset = (id: string): void => {
    if (id === '__save') return openModal({ kind: 'savePreset' })
    if (id.startsWith('__del:')) {
      void savePresets(presets.filter((p) => p.id !== id.slice(6)))
      return
    }
    const p = presets.find((x) => x.id === id)
    if (!p) return
    set(p.fields)
    toast('info', `Preset “${p.name}” loaded — review and apply`)
  }

  // ------------------------------------------------------------- render --
  const fieldProps = (k: FieldKey): { tone: 'error' | 'warning' | null; changed: boolean } => ({
    tone: issuesByField.get(k)?.level ?? null,
    changed: k in draft
  })

  const placeholderFor = (k: FieldKey, fallback = ''): string => (commons[k].mixed && !(k in draft) ? `Mixed · ${commons[k].distinct} values` : fallback)

  const renderInput = (def: FieldDef): ReactNode => {
    const k = def.key
    const p = fieldProps(k)
    const ph = placeholderFor(k, def.placeholder ?? '')
    switch (k) {
      case 'Make':
        return <Combobox {...p} value={effStr(k)} placeholder={ph || 'e.g. Canon'} options={() => makeOptions(allRecords, settings)} onCommit={(v) => set({ Make: v || null })} />
      case 'Model':
        return <Combobox {...p} value={effStr(k)} placeholder={ph || 'Search cameras…'} options={() => modelOptions(allRecords, settings, ctx)} onCommit={onModel} popoverWidth={380} />
      case 'LensMake':
        return <Combobox {...p} value={effStr(k)} placeholder={ph} options={() => lensMakeOptions(allRecords)} onCommit={(v) => set({ LensMake: v || null })} />
      case 'LensModel':
        return <Combobox {...p} value={effStr(k)} placeholder={ph || 'Search lenses…'} options={() => lensOptions(allRecords, settings, ctx)} onCommit={onLens} popoverWidth={420} />
      case 'FocalLength':
        return <Combobox {...p} value={effStr(k)} placeholder={ph || 'mm'} options={() => focalOptions(ctx)} onCommit={onFocal} inputMode="decimal" display={(v) => `${v} mm`} />
      case 'FocalLengthIn35mmFormat':
        return (
          <div className="row-inline">
            <TextField {...p} value={effStr(k)} placeholder={ph || 'mm'} inputMode="decimal" onCommit={onNumber(k, '35mm focal length')} />
            {crop && ctx.focal !== undefined && (
              <button className="btn ghost sm" title={`${ctx.focal}mm × ${crop} crop`} onClick={() => set({ FocalLengthIn35mmFormat: Math.round(ctx.focal! * crop) })}>
                <IBolt size={13} /> {Math.round(ctx.focal * crop)}
              </button>
            )}
          </div>
        )
      case 'FNumber':
        return <Combobox {...p} value={effStr(k)} placeholder={ph || 'ƒ/'} options={() => apertureOptions(ctx)} onCommit={onNumber(k, 'aperture')} inputMode="decimal" display={(v) => `ƒ/${v}`} />
      case 'ExposureTime':
        return <Combobox {...p} value={effStr(k)} placeholder={ph || '1/125'} options={shutterOptions} onCommit={onShutter} display={(v) => (v.includes('/') ? `${v} s` : `${v}″`)} />
      case 'ISO':
        return <Combobox {...p} value={effStr(k)} placeholder={ph || '100'} options={isoOptions} onCommit={onNumber(k, 'ISO')} inputMode="numeric" display={(v) => `ISO ${v}`} />
      case 'ExposureCompensation':
        return <Combobox {...p} value={effStr(k)} placeholder={ph || '0 EV'} options={EV_OPTIONS} onCommit={onNumber(k, 'exposure compensation')} inputMode="decimal" display={(v) => `${Number(v) > 0 ? '+' : ''}${v} EV`} />
      case 'ExposureProgram':
      case 'Orientation':
        return (
          <Select
            {...p}
            value={effStr(k)}
            placeholder={ph || 'Not set'}
            options={(k === 'Orientation' ? ORIENTATIONS : EXPOSURE_PROGRAMS).map((o) => ({ value: String(o.value), label: o.label }))}
            onCommit={(v) => set({ [k]: v === '' ? null : Number(v) })}
          />
        )
      case 'DateTimeOriginal':
      case 'CreateDate':
      case 'ModifyDate':
        return <DateTimeField {...p} value={effStr(k)} placeholder={ph || undefined} onCommit={onDate(k)} />
      case 'OffsetTimeOriginal':
        return <Combobox {...p} value={effStr(k)} placeholder={ph || '+00:00'} options={TZ_OPTIONS} onCommit={(v) => set({ OffsetTimeOriginal: v || null })} />
      case 'ImageDescription':
        return <TextField {...p} multiline value={effStr(k)} placeholder={ph} onCommit={(v) => set({ [k]: v || null })} />
      case 'Artist':
      case 'Copyright':
        return <Combobox {...p} value={effStr(k)} placeholder={ph || (k === 'Copyright' ? `© ${new Date().getFullYear()} Your Name` : 'Your name')} options={() => textOptions(allRecords, k)} onCommit={(v) => set({ [k]: v || null })} />
      case 'Keywords':
        return <KeywordsField sel={sel} />
      case 'Rating':
        return (
          <Stars
            value={typeof eff(k) === 'number' ? (eff(k) as number) : null}
            mixed={commons[k].mixed && !(k in draft)}
            onChange={(v) => set({ Rating: v })}
          />
        )
      case 'GPSLatitude':
      case 'GPSLongitude':
        return <TextField {...p} value={effStr(k)} placeholder={ph || def.placeholder} inputMode="decimal" onCommit={onNumber(k, def.label.toLowerCase())} onPaste={onGpsPaste} />
      default:
        return <TextField {...p} value={effStr(k)} placeholder={ph} onCommit={(v) => set({ [k]: def.kind === 'number' ? parseNum(v) : v || null })} />
    }
  }

  const lat = effNum('GPSLatitude')
  const lon = effNum('GPSLongitude')

  return (
    <>
      <div className="editor-tools">
        <Select
          value=""
          placeholder="Presets"
          className="preset-select"
          leading={<ILayers size={14} className="lead-icon" />}
          popoverWidth={280}
          options={[
            ...presets.map((p) => ({ value: p.id, label: p.name, hint: `${Object.keys(p.fields).length} fields`, group: 'Apply preset' })),
            { value: '__save', label: 'Save current values as preset…', group: 'Manage' },
            ...presets.map((p) => ({ value: `__del:${p.id}`, label: `Delete “${p.name}”`, group: 'Manage' }))
          ]}
          onCommit={applyPreset}
        />
        {sel.length > 1 && focus && (
          <button className="btn ghost sm" onClick={() => openModal({ kind: 'sync' })} title="Copy chosen fields from the focused photo to all selected">
            <ISync size={14} /> Sync
          </button>
        )}
        <button className="btn ghost sm" onClick={() => openModal({ kind: 'dates' })} title="Shift or sequence dates">
          <ICalendar size={14} /> Dates
        </button>
      </div>

      <div className="editor-scroll">
        {FIELD_GROUPS.map((g) => {
          const defs = FIELDS.filter((f) => f.group === g)
          const groupIssues = defs.map((d) => issuesByField.get(d.key)).filter(Boolean)
          const gLevel = groupIssues.some((i) => i!.level === 'error') ? 'error' : groupIssues.length ? 'warning' : null
          const gChanged = defs.some((d) => d.key in draft) || (g === 'Description' && (keywordOps.add.length > 0 || keywordOps.remove.length > 0))
          const isCollapsed = collapsed[g]
          return (
            <section key={g} className={`group ${isCollapsed ? 'collapsed' : ''}`}>
              <button className="group-head" onClick={() => setCollapsed((c) => ({ ...c, [g]: !c[g] }))}>
                <IChevronDown size={14} className="group-caret" />
                <span>{g}</span>
                {GROUP_ICON[g]}
                {gChanged && <span className="dot changed" title="Has pending changes" />}
                {gLevel && <span className={`group-flag ${gLevel}`}>{gLevel === 'error' ? <IError size={13} /> : <IWarn size={13} />}</span>}
              </button>
              {!isCollapsed && (
                <div className="group-body">
                  {g === 'Date & Time' && (
                    <div className="group-note">
                      <Toggle
                        checked={syncDates}
                        onChange={(v) => {
                          setSyncDates(v)
                          localStorage.setItem('exify.syncDates', v ? '1' : '0')
                        }}
                        label="Keep all three dates in sync"
                        hint="Setting “Date taken” also sets digitized & modified"
                      />
                    </div>
                  )}
                  {defs.map((def) => (
                    <FieldRow
                      key={def.key}
                      def={def}
                      issue={issuesByField.get(def.key)}
                      total={sel.length}
                      changed={def.key in draft}
                      hasValue={eff(def.key) != null && eff(def.key) !== ''}
                      onClear={() => set({ [def.key]: null })}
                      onRevert={() => dropDraft(def.key)}
                      wide={def.kind === 'longtext' || def.kind === 'keywords'}
                    >
                      {renderInput(def)}
                    </FieldRow>
                  ))}
                  {g === 'Location' && (
                    <div className="group-actions">
                      {lat !== undefined && lon !== undefined && (
                        <button className="btn ghost sm" onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`)}>
                          <IExternal size={13} /> Open map
                        </button>
                      )}
                      <button className="btn ghost sm" onClick={() => set({ GPSLatitude: null, GPSLongitude: null, GPSAltitude: null })}>
                        <IPin size={13} /> Remove location
                      </button>
                      <span className="muted small">Tip: paste “48.8584, 2.2945” into latitude</span>
                    </div>
                  )}
                  {g === 'Description' && (
                    <div className="group-actions">
                      <button
                        className="btn ghost sm"
                        onClick={() => {
                          const artist = effStr('Artist')
                          const year = (effStr('DateTimeOriginal') || String(new Date().getFullYear())).slice(0, 4)
                          set({ Copyright: `© ${year} ${artist || 'Your Name'}`.trim() })
                        }}
                      >
                        © Fill copyright from artist & year
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <div className={`editor-foot ${draftCount ? 'active' : ''}`}>
        <div className="foot-info">
          {draftCount ? (
            <>
              <strong>
                {draftCount} field{draftCount > 1 ? 's' : ''} changed
              </strong>
              <span>
                {pending} of {sel.length} photo{sel.length > 1 ? 's' : ''} will be updated
              </span>
            </>
          ) : (
            <span className="muted">Edit any field, then apply</span>
          )}
        </div>
        <button className="btn ghost" disabled={!draftCount || busy} onClick={discardDraft}>
          Discard
        </button>
        <button className="btn primary" disabled={!draftCount || !pending || busy} onClick={() => void applyDraft()} title="Ctrl+Enter">
          {busy ? 'Writing…' : `Apply to ${pending}`}
        </button>
      </div>
    </>
  )
}

function FieldRow({
  def,
  issue,
  total,
  changed,
  hasValue,
  onClear,
  onRevert,
  wide,
  children
}: {
  def: FieldDef
  issue?: { level: 'error' | 'warning'; messages: Map<string, number> }
  total: number
  changed: boolean
  hasValue: boolean
  onClear(): void
  onRevert(): void
  wide?: boolean
  children: ReactNode
}): JSX.Element {
  const msgs = issue ? [...issue.messages.entries()] : []
  const tip = msgs.map(([m, n]) => (total > 1 ? `${m} (${n} of ${total})` : m)).join('\n')
  return (
    <div className={`field ${wide ? 'wide' : ''} ${changed ? 'is-changed' : ''}`}>
      <div className="field-label">
        <label>
          {def.label}
          {def.unit && def.unit !== 'ƒ/' && <span className="unit">{def.unit}</span>}
        </label>
        {issue && (
          <span className={`field-flag ${issue.level}`} title={tip}>
            {issue.level === 'error' ? <IError size={14} /> : <IWarn size={14} />}
          </span>
        )}
        <span className="field-actions">
          {changed && (
            <button className="mini" title="Revert this field" onClick={onRevert}>
              <IRevert size={12} />
            </button>
          )}
          {hasValue && (
            <button className="mini" title="Clear this field (remove the tag)" onClick={onClear}>
              <IX size={12} />
            </button>
          )}
        </span>
      </div>
      {children}
      {msgs.length > 0 && (
        <div className={`field-msg ${issue!.level}`}>
          {msgs.slice(0, 2).map(([m, n]) => (
            <div key={m}>
              {m}
              {total > 1 && <span className="muted"> · {n === total ? 'all' : `${n} of ${total}`}</span>}
            </div>
          ))}
          {msgs.length > 2 && <div className="muted">+{msgs.length - 2} more</div>}
        </div>
      )}
    </div>
  )
}

export type { Issue }
