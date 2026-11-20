import { create } from 'zustand'
import { FIELD_BY_KEY, valuesEqual, type FieldKey, type FieldMap, type FieldValue } from '@shared/fields'
import {
  DEFAULT_SETTINGS,
  type FileEdit,
  type HistoryInfo,
  type PhotoRecord,
  type Preset,
  type ProgressEvent,
  type RenameMove,
  type Settings,
  type UpdateStatus,
  type WriteResult
} from '@shared/types'
import { findCamera } from './data/cameras'
import { findLens } from './data/lenses'
import { DEFAULT_FILTERS, type Filters, type SortState } from './lib/filter'

export const api = window.exify

export interface Toast {
  id: number
  kind: 'info' | 'success' | 'error'
  text: string
  detail?: WriteResult[]
  action?: { label: string; run(): void }
}

export type ModalState =
  | { kind: 'dates'; mode?: 'shift' | 'sequence' | 'zone' }
  | { kind: 'sync' }
  | { kind: 'settings' }
  | { kind: 'savePreset' }
  | { kind: 'strip' }
  | { kind: 'errors'; results: WriteResult[] }
  | { kind: 'lightbox'; path: string }
  | { kind: 'rename' }
  | { kind: 'import' }
  | { kind: 'geotag' }
  | { kind: 'map'; pick?: boolean }
  | { kind: 'compare' }
  | { kind: 'backups' }

export interface KeywordOps {
  add: string[]
  remove: string[]
}

interface State {
  folder: string | null
  jobId: number
  loading: boolean
  progress: ProgressEvent | null
  records: PhotoRecord[]
  index: Map<string, number>
  selected: Set<string>
  anchor: string | null
  focus: string | null
  filters: Filters
  sort: SortState
  settings: Settings
  presets: Preset[]
  history: HistoryInfo
  versions: Record<string, number>
  draft: FieldMap
  keywordOps: KeywordOps
  busy: boolean
  toasts: Toast[]
  modal: ModalState | null
  visible: string[]
  update: UpdateStatus

  init(): Promise<void>
  openFolder(path?: string): Promise<void>
  reload(): Promise<void>
  receiveRecords(jobId: number, recs: PhotoRecord[]): void
  setProgress(p: ProgressEvent): void
  setVisible(paths: string[]): void
  select(path: string, mode: 'single' | 'toggle' | 'range'): void
  selectAll(): void
  clearSelection(): void
  setFilters(patch: Partial<Filters>): void
  resetFilters(): void
  setSort(s: SortState): void
  setDraft(patch: FieldMap): void
  dropDraft(key: FieldKey): void
  setKeywordOps(ops: KeywordOps): void
  discardDraft(): void
  applyDraft(): Promise<void>
  writeEdits(edits: FileEdit[], label: string): Promise<WriteResult[]>
  undo(): Promise<void>
  strip(paths: string[]): Promise<void>
  rename(moves: RenameMove[], label: string): Promise<WriteResult[]>
  restoreBackups(paths: string[]): Promise<void>
  refreshRecords(paths: string[]): Promise<void>
  setUpdate(u: UpdateStatus): void
  updateSettings(patch: Partial<Settings>): Promise<void>
  savePresets(presets: Preset[]): Promise<void>
  toast(kind: Toast['kind'], text: string, detail?: WriteResult[], action?: Toast['action']): void
  dismissToast(id: number): void
  openModal(m: ModalState | null): void
}

let toastId = 0

function indexOf(records: PhotoRecord[]): Map<string, number> {
  return new Map(records.map((r, i) => [r.path, i]))
}

/** Compute the per-file patch for the current draft, skipping values that already match. */
export function buildEdit(rec: PhotoRecord, draft: FieldMap, kw: KeywordOps): FieldMap {
  const set: FieldMap = {}
  for (const [k, v] of Object.entries(draft) as [FieldKey, FieldValue][]) {
    if (k === 'Keywords') continue
    if (!valuesEqual(rec.fields[k], v)) set[k] = v
  }
  if ('Keywords' in draft) {
    if (!valuesEqual(rec.fields.Keywords, draft.Keywords)) set.Keywords = draft.Keywords
  } else if (kw.add.length || kw.remove.length) {
    const cur = Array.isArray(rec.fields.Keywords) ? rec.fields.Keywords : []
    const next = cur.filter((k) => !kw.remove.includes(k))
    for (const k of kw.add) if (!next.includes(k)) next.push(k)
    if (!valuesEqual(cur, next)) set.Keywords = next.length ? next : null
  }
  return set
}

export const useStore = create<State>((set, get) => ({
  folder: null,
  jobId: 0,
  loading: false,
  progress: null,
  records: [],
  index: new Map(),
  selected: new Set(),
  anchor: null,
  focus: null,
  filters: { ...DEFAULT_FILTERS },
  sort: { key: 'name', dir: 1 },
  settings: DEFAULT_SETTINGS,
  presets: [],
  history: { canUndo: false, count: 0 },
  versions: {},
  draft: {},
  keywordOps: { add: [], remove: [] },
  busy: false,
  toasts: [],
  modal: null,
  visible: [],
  update: { state: 'idle' },

  async init() {
    const [settings, presets, history] = await Promise.all([api.getSettings(), api.getPresets(), api.historyInfo()])
    set({ settings, presets, history })
  },

  async openFolder(path) {
    const folder = path ?? (await api.openFolderDialog())
    if (!folder) return
    set({
      folder,
      records: [],
      index: new Map(),
      selected: new Set(),
      anchor: null,
      focus: null,
      loading: true,
      progress: null
    })
    const { jobId, total } = await api.loadFolder(folder, get().settings.recursive)
    set((s) => ({ jobId: Math.max(s.jobId, jobId), loading: total > 0 }))
    if (total === 0) get().toast('info', 'No supported images found in this folder')
    const settings = await api.getSettings()
    set({ settings })
  },

  async reload() {
    const f = get().folder
    if (f) await get().openFolder(f)
  },

  receiveRecords(jobId, recs) {
    if (jobId < get().jobId) return
    set((s) => {
      const records = jobId > s.jobId ? recs : s.records.concat(recs)
      return { jobId, records, index: indexOf(records) }
    })
  },

  setProgress(p) {
    set((s) => {
      const loading = p.phase === 'read' || p.phase === 'scan' ? p.done < p.total || p.phase === 'scan' : s.loading
      return { progress: p.done >= p.total && p.phase !== 'scan' ? null : p, loading }
    })
  },

  setVisible(paths) {
    set({ visible: paths })
  },

  select(path, mode) {
    const s = get()
    if (mode === 'single') {
      set({ selected: new Set([path]), anchor: path, focus: path })
    } else if (mode === 'toggle') {
      const sel = new Set(s.selected)
      if (sel.has(path)) sel.delete(path)
      else sel.add(path)
      set({ selected: sel, anchor: path, focus: path })
    } else {
      const order = s.visible
      const a = s.anchor ? order.indexOf(s.anchor) : -1
      const b = order.indexOf(path)
      if (a < 0 || b < 0) return set({ selected: new Set([path]), anchor: path, focus: path })
      const [lo, hi] = a < b ? [a, b] : [b, a]
      set({ selected: new Set(order.slice(lo, hi + 1)), focus: path })
    }
  },

  selectAll() {
    set((s) => ({ selected: new Set(s.visible) }))
  },

  clearSelection() {
    set({ selected: new Set(), anchor: null })
  },

  setFilters(patch) {
    set((s) => ({ filters: { ...s.filters, ...patch } }))
  },

  resetFilters() {
    set({ filters: { ...DEFAULT_FILTERS } })
  },

  setSort(sort) {
    set({ sort })
  },

  setDraft(patch) {
    set((s) => ({ draft: { ...s.draft, ...patch } }))
  },

  dropDraft(key) {
    set((s) => {
      const d = { ...s.draft }
      delete d[key]
      return { draft: d }
    })
  },

  setKeywordOps(ops) {
    set({ keywordOps: ops })
  },

  discardDraft() {
    set({ draft: {}, keywordOps: { add: [], remove: [] } })
  },

  async applyDraft() {
    const s = get()
    const targets = [...s.selected].map((p) => s.records[s.index.get(p) ?? -1]).filter(Boolean)
    const edits: FileEdit[] = []
    for (const rec of targets) {
      const e = buildEdit(rec, s.draft, s.keywordOps)
      if (Object.keys(e).length) edits.push({ path: rec.path, set: e })
    }
    if (!edits.length) {
      get().toast('info', 'The selected photos already have these values')
      get().discardDraft()
      return
    }
    const fields = Array.from(new Set(edits.flatMap((e) => Object.keys(e.set)))) as FieldKey[]
    const label =
      fields.length === 1
        ? `${FIELD_BY_KEY[fields[0]].label} on ${edits.length} photo${edits.length > 1 ? 's' : ''}`
        : `${fields.length} fields on ${edits.length} photo${edits.length > 1 ? 's' : ''}`
    const results = await get().writeEdits(edits, label)
    if (results.every((r) => r.ok)) get().discardDraft()
    rememberGear(get, edits)
  },

  async writeEdits(edits, label) {
    set({ busy: true })
    try {
      const results = await api.write(edits, label)
      applyResults(set, results)
      const ok = results.filter((r) => r.ok).length
      const failed = results.length - ok
      if (failed) get().toast('error', `${failed} of ${results.length} files could not be written`, results.filter((r) => !r.ok))
      else get().toast('success', `Updated ${label}`)
      set({ history: await api.historyInfo() })
      return results
    } finally {
      set({ busy: false })
    }
  },

  async undo() {
    const h = get().history
    if (!h.canUndo || get().busy) return
    set({ busy: true })
    try {
      const results = await api.undo()
      applyResults(set, results)
      get().toast('success', `Undid: ${h.label}`)
      set({ history: await api.historyInfo() })
    } finally {
      set({ busy: false })
    }
  },

  async strip(paths) {
    set({ busy: true })
    try {
      const results = await api.stripMetadata(paths)
      applyResults(set, results)
      const failed = results.filter((r) => !r.ok)
      if (failed.length) get().toast('error', `${failed.length} files could not be stripped`, failed)
      else get().toast('success', `Stripped metadata from ${results.length} photo${results.length > 1 ? 's' : ''}`)
      set({ history: await api.historyInfo() })
    } finally {
      set({ busy: false })
    }
  },

  async rename(moves, label) {
    set({ busy: true })
    try {
      const results = await api.rename(moves, label)
      applyResults(set, results)
      const failed = results.filter((r) => !r.ok)
      if (failed.length) get().toast('error', `${failed.length} of ${results.length} files couldn't be renamed`, failed)
      else get().toast('success', `Renamed ${results.length} file${results.length > 1 ? 's' : ''}`)
      set({ history: await api.historyInfo() })
      return results
    } finally {
      set({ busy: false })
    }
  },

  async restoreBackups(paths) {
    set({ busy: true })
    try {
      const results = await api.restoreBackups(paths)
      applyResults(set, results)
      const failed = results.filter((r) => !r.ok)
      if (failed.length) get().toast('error', `${failed.length} backups couldn't be restored`, failed)
      else get().toast('success', `Restored ${results.length} original${results.length > 1 ? 's' : ''}`)
      set({ history: await api.historyInfo() })
    } finally {
      set({ busy: false })
    }
  },

  async refreshRecords(paths) {
    const recs = await api.readRecords(paths)
    applyResults(
      set,
      recs.map((record) => ({ path: record.path, ok: true, record }))
    )
  },

  setUpdate(update) {
    const was = get().update.state
    set({ update })
    if (update.state === 'ready' && was !== 'ready') {
      get().toast('info', `Exify ${update.version} is ready to install`, undefined, { label: 'Restart', run: () => void api.installUpdate() })
    }
  },

  async updateSettings(patch) {
    const settings = await api.setSettings(patch)
    set({ settings })
  },

  async savePresets(presets) {
    await api.savePresets(presets)
    set({ presets })
  },

  toast(kind, text, detail, action) {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, kind, text, detail, action }] }))
    if (kind !== 'error' && !action) setTimeout(() => get().dismissToast(id), 3800)
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },

  openModal(modal) {
    set({ modal })
  }
}))

type SetFn = (fn: (s: State) => Partial<State>) => void

/** Fold write results back into the store. A result with `from` is a file that moved. */
function applyResults(set: SetFn, results: WriteResult[]): void {
  set((s) => {
    const records = s.records.slice()
    const versions = { ...s.versions }
    let moved = false
    const remap = new Map<string, string>()
    for (const r of results) {
      if (!r.record) continue
      const i = s.index.get(r.from ?? r.path)
      if (i === undefined) continue
      records[i] = r.record
      if (r.from && r.from !== r.path) {
        moved = true
        remap.set(r.from, r.path)
        delete versions[r.from]
      }
      versions[r.path] = (versions[r.path] ?? 0) + 1
    }
    if (!moved) return { records, versions }
    const re = (p: string | null): string | null => (p === null ? null : (remap.get(p) ?? p))
    return {
      records,
      versions,
      index: indexOf(records),
      selected: new Set([...s.selected].map((p) => re(p)!)),
      focus: re(s.focus),
      anchor: re(s.anchor)
    }
  })
}

/** Gear typed by hand (not in the built-in database) is remembered for future dropdowns. */
function rememberGear(get: () => State, edits: FileEdit[]): void {
  const s = get()
  const cams = [...s.settings.customCameras]
  const lenses = [...s.settings.customLenses]
  let changed = false
  for (const e of edits) {
    const rec = s.records[s.index.get(e.path) ?? -1]
    const f = rec?.fields ?? e.set
    const model = typeof f.Model === 'string' ? f.Model : null
    const make = typeof f.Make === 'string' ? f.Make : ''
    if (model && !findCamera(make, model) && !cams.some((c) => c.model === model && c.make === make)) {
      cams.push({ make, model })
      changed = true
    }
    const lens = typeof f.LensModel === 'string' ? f.LensModel : null
    const lensMake = typeof f.LensMake === 'string' ? f.LensMake : ''
    if (lens && !findLens(lens) && !lenses.some((l) => l.model === lens)) {
      lenses.push({ make: lensMake, model: lens })
      changed = true
    }
  }
  if (changed) void s.updateSettings({ customCameras: cams.slice(-200), customLenses: lenses.slice(-300) })
}

export function selectedRecords(s: Pick<State, 'selected' | 'records' | 'index'>): PhotoRecord[] {
  const out: PhotoRecord[] = []
  for (const p of s.selected) {
    const i = s.index.get(p)
    if (i !== undefined) out.push(s.records[i])
  }
  return out
}
