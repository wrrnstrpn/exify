import { ExifTool } from 'exiftool-vendored'
import { cpus } from 'node:os'
import { basename, extname, relative, dirname } from 'node:path'
import {
  FIELDS,
  FIELD_BY_KEY,
  NUMERIC_READ_TAGS,
  formatExposure,
  type FieldKey,
  type FieldMap,
  type FieldValue
} from '@shared/fields'
import type { FileEdit, HistoryInfo, PhotoRecord, WriteResult } from '@shared/types'

export const exiftool = new ExifTool({
  maxProcs: Math.max(2, Math.min(8, Math.floor(cpus().length / 2))),
  taskTimeoutMillis: 60_000,
  ignoreMinorErrors: true
})

/** Tags that only exist as signed values in the Composite group. */
const COMPOSITE_TAGS = new Set(['GPSLatitude', 'GPSLongitude', 'GPSAltitude'])

const READ_TAG_NAMES = Array.from(
  new Set([...FIELDS.flatMap((f) => f.read), 'FileType', 'FileSize', 'ImageWidth', 'ImageHeight', 'FileModifyDate'])
)

const READ_ARGS = [
  '-fast',
  ...READ_TAG_NAMES.map((t) => {
    const name = COMPOSITE_TAGS.has(t) ? `Composite:${t}` : t
    return `-${name}${NUMERIC_READ_TAGS.has(t) ? '#' : ''}`
  })
]

const recordCache = new Map<string, PhotoRecord>()
let rootFolder = ''

export function setRoot(folder: string): void {
  rootFolder = folder
  recordCache.clear()
}

function isBlank(v: unknown): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') {
    const t = v.trim()
    return t === '' || /^0{4}:0{2}:0{2}/.test(t) || t === '----' || /^unknown\b/i.test(t)
  }
  if (Array.isArray(v)) return v.length === 0
  return false
}

function normalizeField(key: FieldKey, raw: Record<string, unknown>): FieldValue | undefined {
  const def = FIELD_BY_KEY[key]
  if (def.kind === 'keywords') {
    const out: string[] = []
    for (const tag of def.read) {
      const v = raw[tag]
      if (isBlank(v)) continue
      const arr = Array.isArray(v) ? v : [v]
      for (const k of arr) {
        const s = String(k).trim()
        if (s && !out.includes(s)) out.push(s)
      }
    }
    return out.length ? out : undefined
  }
  for (const tag of def.read) {
    const v = raw[tag]
    if (isBlank(v)) continue
    switch (def.kind) {
      case 'number':
      case 'select': {
        const n = typeof v === 'number' ? v : parseFloat(String(v))
        if (isFinite(n)) return n
        continue
      }
      case 'exposure': {
        if (typeof v === 'number') return formatExposure(v) || undefined
        return String(v)
      }
      case 'datetime': {
        const m = /^(\d{4}:\d{2}:\d{2}[ T]\d{2}:\d{2}(?::\d{2})?)/.exec(String(v))
        if (!m) continue
        const s = m[1].replace('T', ' ')
        return s.length === 16 ? `${s}:00` : s
      }
      default:
        return Array.isArray(v) ? v.map(String).join(', ') : String(v).trim()
    }
  }
  return undefined
}

function toRecord(path: string, raw: Record<string, unknown>): PhotoRecord {
  const fields: FieldMap = {}
  for (const f of FIELDS) {
    const v = normalizeField(f.key, raw)
    if (v !== undefined) fields[f.key] = v
  }
  const rel = rootFolder ? relative(rootFolder, dirname(path)) : ''
  return {
    path,
    name: basename(path),
    rel: rel === '.' ? '' : rel,
    ext: extname(path).slice(1).toLowerCase(),
    fileType: raw.FileType ? String(raw.FileType) : undefined,
    fileSize: typeof raw.FileSize === 'number' ? raw.FileSize : undefined,
    width: typeof raw.ImageWidth === 'number' ? raw.ImageWidth : undefined,
    height: typeof raw.ImageHeight === 'number' ? raw.ImageHeight : undefined,
    fileModifyDate: raw.FileModifyDate ? String(raw.FileModifyDate) : undefined,
    fields
  }
}

export async function readRecord(path: string): Promise<PhotoRecord> {
  try {
    const raw = (await exiftool.readRaw(path, { readArgs: READ_ARGS })) as Record<string, unknown>
    const rec = toRecord(path, raw)
    recordCache.set(path, rec)
    return rec
  } catch (err) {
    const rec: PhotoRecord = {
      path,
      name: basename(path),
      rel: rootFolder ? relative(rootFolder, dirname(path)) : '',
      ext: extname(path).slice(1).toLowerCase(),
      fields: {},
      error: errMessage(err)
    }
    return rec
  }
}

export async function readAllTags(path: string): Promise<Record<string, unknown>> {
  const raw = (await exiftool.readRaw(path, { readArgs: ['-G1', '-a'] })) as Record<string, unknown>
  delete raw.SourceFile
  return raw
}

function errMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.replace(/^Error:\s*/, '').split('\n')[0]
}

/** Translate a field patch into ExifTool tag writes. */
function toWriteTags(set: FieldMap): Record<string, unknown> {
  const tags: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(set) as [FieldKey, FieldValue][]) {
    const def = FIELD_BY_KEY[k]
    if (!def) continue
    let out: unknown = v
    if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) out = null
    else if (def.kind === 'keywords') out = Array.isArray(v) ? v : String(v).split(',').map((s) => s.trim()).filter(Boolean)
    else if (def.kind === 'number' || def.kind === 'select') {
      const n = typeof v === 'number' ? v : parseFloat(String(v))
      out = isFinite(n) ? n : null
    } else out = String(v)
    for (const tag of def.write) tags[tag] = out
  }
  return tags
}

// ---------------------------------------------------------------- settings ----

let writeOpts = { keepBackups: false, preserveFileDates: true }

export function configureWrites(o: { keepBackups: boolean; preserveFileDates: boolean }): void {
  writeOpts = { ...o }
}

function writeArgs(): string[] {
  const args: string[] = []
  if (!writeOpts.keepBackups) args.push('-overwrite_original')
  if (writeOpts.preserveFileDates) args.push('-P')
  return args
}

// ----------------------------------------------------------------- history ----

interface HistoryEntry {
  label: string
  items: { path: string; before: FieldMap }[]
}

const history: HistoryEntry[] = []
const MAX_HISTORY = 50

export function historyInfo(): HistoryInfo {
  const last = history[history.length - 1]
  return { canUndo: !!last, label: last?.label, count: history.length }
}

// ------------------------------------------------------------------ writes ----

type Progress = (done: number, total: number) => void

async function runPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>, onDone?: Progress): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  let done = 0
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
      done++
      onDone?.(done, items.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export { runPool }

async function applyEdits(edits: FileEdit[], onProgress?: Progress): Promise<{ results: WriteResult[]; before: { path: string; before: FieldMap }[] }> {
  const before: { path: string; before: FieldMap }[] = []
  const results = await runPool(
    edits,
    16,
    async (edit): Promise<WriteResult> => {
      const keys = Object.keys(edit.set) as FieldKey[]
      if (!keys.length) return { path: edit.path, ok: true, record: recordCache.get(edit.path) }
      const current = recordCache.get(edit.path) ?? (await readRecord(edit.path))
      const prev: FieldMap = {}
      for (const k of keys) prev[k] = current.fields[k] ?? null
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await exiftool.write(edit.path, toWriteTags(edit.set) as any, { writeArgs: writeArgs() })
        before.push({ path: edit.path, before: prev })
        const record = await readRecord(edit.path)
        return { path: edit.path, ok: true, record }
      } catch (err) {
        const record = await readRecord(edit.path)
        return { path: edit.path, ok: false, error: errMessage(err), record }
      }
    },
    onProgress
  )
  return { results, before }
}

export async function writeEdits(edits: FileEdit[], label: string, onProgress?: Progress): Promise<WriteResult[]> {
  const { results, before } = await applyEdits(edits, onProgress)
  if (before.length) {
    history.push({ label, items: before })
    if (history.length > MAX_HISTORY) history.shift()
  }
  return results
}

export async function undo(onProgress?: Progress): Promise<WriteResult[]> {
  const entry = history.pop()
  if (!entry) return []
  const { results } = await applyEdits(
    entry.items.map((i) => ({ path: i.path, set: i.before })),
    onProgress
  )
  return results
}

/** Remove all metadata except the colour profile and orientation. Not undoable. */
export async function stripMetadata(paths: string[], onProgress?: Progress): Promise<WriteResult[]> {
  return runPool(
    paths,
    16,
    async (path): Promise<WriteResult> => {
      try {
        await exiftool.write(path, { all: null } as never, {
          writeArgs: ['--ICC_Profile:all', '-tagsFromFile', '@', '-Orientation', ...writeArgs()]
        })
        for (const h of history) h.items = h.items.filter((i) => i.path !== path)
        return { path, ok: true, record: await readRecord(path) }
      } catch (err) {
        return { path, ok: false, error: errMessage(err), record: await readRecord(path) }
      }
    },
    onProgress
  )
}

export async function shutdownExiftool(): Promise<void> {
  await exiftool.end()
}
