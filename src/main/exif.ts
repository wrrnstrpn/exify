import { DefaultExiftoolArgs, ExifTool } from 'exiftool-vendored'
import { existsSync, rmSync } from 'node:fs'
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
import type { FileEdit, HistoryInfo, PhotoRecord, RenameMove, WriteResult } from '@shared/types'
import { exiftoolConfigPath } from './exiftool-config'
import { moveFiles, retireFile } from './files'
import { findSidecar, isRaw, newSidecarPath } from './sidecar'

export const exiftool = new ExifTool({
  maxProcs: Math.max(2, Math.min(8, Math.floor(cpus().length / 2))),
  taskTimeoutMillis: 60_000,
  ignoreMinorErrors: true,
  // -config has to come before everything else on the command line.
  exiftoolArgs: ['-config', exiftoolConfigPath(), ...DefaultExiftoolArgs]
})

// GPS coordinates only come out signed (S/W negative) from the Composite group.
const COMPOSITE_TAGS = new Set(['GPSLatitude', 'GPSLongitude', 'GPSAltitude'])
const FILE_TAGS = ['FileType', 'FileSize', 'ImageWidth', 'ImageHeight', 'FileModifyDate']

const FIELD_TAGS = Array.from(new Set(FIELDS.flatMap((f) => f.read)))

// readRaw() without -G returns bare tag names, even when we asked for "XMP-foo:Bar".
const bare = (tag: string): string => tag.slice(tag.lastIndexOf(':') + 1)
const numeric = (tag: string): string => (NUMERIC_READ_TAGS.has(bare(tag)) ? '#' : '')

const READ_ARGS = [
  '-fast',
  ...[...FIELD_TAGS, ...FILE_TAGS].map((t) => `-${COMPOSITE_TAGS.has(t) ? `Composite:${t}` : t}${numeric(t)}`)
]

// An .xmp file has no EXIF block, and XMP GPS values are already signed.
const SIDECAR_READ_ARGS = ['-fast', ...FIELD_TAGS.map((t) => `-${t}${numeric(t)}`)]

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
      const v = raw[bare(tag)]
      if (isBlank(v)) continue
      for (const k of Array.isArray(v) ? v : [v]) {
        const s = String(k).trim()
        if (s && !out.includes(s)) out.push(s)
      }
    }
    return out.length ? out : undefined
  }
  for (const tag of def.read) {
    const v = raw[bare(tag)]
    if (isBlank(v)) continue
    switch (def.kind) {
      case 'number':
      case 'select': {
        const n = typeof v === 'number' ? v : parseFloat(String(v))
        if (isFinite(n)) return n
        continue
      }
      case 'exposure':
        if (typeof v === 'number') return formatExposure(v) || undefined
        return String(v)
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
  // XMP has no OffsetTime tags; the zone rides along at the end of the date instead.
  if (fields.OffsetTimeOriginal === undefined) {
    const tz = /([+-]\d{2}:\d{2})$/.exec(String(raw.DateTimeOriginal ?? ''))
    if (tz) fields.OffsetTimeOriginal = tz[1]
  }
  return {
    ...fileInfo(path),
    fileType: raw.FileType ? String(raw.FileType) : undefined,
    fileSize: typeof raw.FileSize === 'number' ? raw.FileSize : undefined,
    width: typeof raw.ImageWidth === 'number' ? raw.ImageWidth : undefined,
    height: typeof raw.ImageHeight === 'number' ? raw.ImageHeight : undefined,
    fileModifyDate: raw.FileModifyDate ? String(raw.FileModifyDate) : undefined,
    fields
  }
}

function fileInfo(path: string): Pick<PhotoRecord, 'path' | 'name' | 'rel' | 'ext' | 'fields' | 'hasBackup'> {
  const rel = rootFolder ? relative(rootFolder, dirname(path)) : ''
  return {
    path,
    name: basename(path),
    rel: rel === '.' ? '' : rel,
    ext: extname(path).slice(1).toLowerCase(),
    fields: {},
    hasBackup: existsSync(`${path}_original`) || undefined
  }
}

type Raw = Record<string, unknown>

export async function readRecord(path: string): Promise<PhotoRecord> {
  try {
    let raw = (await exiftool.readRaw(path, { readArgs: READ_ARGS })) as Raw
    const sidecar = findSidecar(path)
    if (sidecar) {
      // Same precedence as Lightroom: whatever the sidecar says wins.
      const xmp = (await exiftool.readRaw(sidecar, { readArgs: SIDECAR_READ_ARGS })) as Raw
      raw = { ...raw }
      for (const [k, v] of Object.entries(xmp)) if (k !== 'SourceFile' && !isBlank(v)) raw[k] = v
    }
    const rec = toRecord(path, raw)
    if (sidecar) rec.sidecar = sidecar
    recordCache.set(path, rec)
    return rec
  } catch (err) {
    return { ...fileInfo(path), error: errMessage(err) }
  }
}

export async function readAllTags(path: string): Promise<Record<string, unknown>> {
  const raw = (await exiftool.readRaw(path, { readArgs: ['-G1', '-a'] })) as Raw
  delete raw.SourceFile
  const sidecar = findSidecar(path)
  if (sidecar) {
    const xmp = (await exiftool.readRaw(sidecar, { readArgs: ['-G1', '-a', '-XMP:all'] })) as Raw
    for (const [k, v] of Object.entries(xmp)) if (k !== 'SourceFile') raw[`Sidecar ${k}`] = v
  }
  return raw
}

function errMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.replace(/^Error:\s*/, '').split('\n')[0]
}

function toWriteTags(set: FieldMap): Raw {
  const tags: Raw = {}
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
  // Without this, non-ASCII IPTC text (city names, keywords) gets mangled.
  if (Object.keys(tags).some((t) => t.startsWith('IPTC:'))) tags['IPTC:CodedCharacterSet'] = 'UTF8'
  return tags
}

/**
 * The same patch, rewritten for an .xmp sidecar. EXIF tag names are fine
 * (ExifTool files them under their XMP equivalents), IPTC isn't, and the time
 * zone has to be folded into the date because XMP has no OffsetTime tag.
 */
function toSidecarTags(set: FieldMap, current: FieldMap): Raw {
  const tags = toWriteTags(set)
  for (const t of Object.keys(tags)) if (t.startsWith('IPTC:') || t === 'ImageDescription') delete tags[t]
  delete tags.OffsetTimeOriginal
  if ('DateTimeOriginal' in set || 'OffsetTimeOriginal' in set) {
    const date = 'DateTimeOriginal' in set ? set.DateTimeOriginal : current.DateTimeOriginal
    const tz = 'OffsetTimeOriginal' in set ? set.OffsetTimeOriginal : current.OffsetTimeOriginal
    delete tags.DateTimeOriginal
    tags['XMP-exif:DateTimeOriginal'] = date ? `${date}${tz ?? ''}` : null
  }
  return tags
}

let writeOpts = { keepBackups: false, preserveFileDates: true, rawSidecars: true }

export function configureWrites(o: Partial<typeof writeOpts>): void {
  writeOpts = { ...writeOpts, ...o }
}

function writeArgs(): string[] {
  const args: string[] = []
  if (!writeOpts.keepBackups) args.push('-overwrite_original')
  if (writeOpts.preserveFileDates) args.push('-P')
  return args
}

/** Where an edit to `path` actually lands. A RAW that already has a sidecar always goes through it. */
function writeTarget(path: string): { file: string; sidecar: boolean; created: boolean } {
  const existing = findSidecar(path)
  if (existing) return { file: existing, sidecar: true, created: false }
  if (writeOpts.rawSidecars && isRaw(path)) return { file: newSidecarPath(path), sidecar: true, created: true }
  return { file: path, sidecar: false, created: false }
}

// Undo history. Everything is undone last-in-first-out, which is what keeps the
// paths in older entries valid after a rename further up the stack.

interface FieldItem {
  path: string
  before: FieldMap
  /** The write created this sidecar, so undo just deletes it. */
  createdSidecar?: string
}

type HistoryEntry = { kind: 'fields'; label: string; items: FieldItem[] } | { kind: 'rename'; label: string; moves: RenameMove[] }

const history: HistoryEntry[] = []
const MAX_HISTORY = 50

function remember(entry: HistoryEntry): void {
  history.push(entry)
  if (history.length > MAX_HISTORY) history.shift()
}

/** Drop history for files whose contents were replaced wholesale (strip, restore). */
function forget(path: string): void {
  for (const h of history) if (h.kind === 'fields') h.items = h.items.filter((i) => i.path !== path)
}

export function historyInfo(): HistoryInfo {
  const last = history[history.length - 1]
  return { canUndo: !!last, label: last?.label, count: history.length }
}

type Progress = (done: number, total: number) => void

export async function runPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>, onDone?: Progress): Promise<R[]> {
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

async function applyEdits(edits: FileEdit[], onProgress?: Progress): Promise<{ results: WriteResult[]; items: FieldItem[] }> {
  const items: FieldItem[] = []
  const results = await runPool(
    edits,
    16,
    async (edit): Promise<WriteResult> => {
      const keys = Object.keys(edit.set) as FieldKey[]
      if (!keys.length) return { path: edit.path, ok: true, record: recordCache.get(edit.path) }
      const current = recordCache.get(edit.path) ?? (await readRecord(edit.path))
      const before: FieldMap = {}
      for (const k of keys) before[k] = current.fields[k] ?? null
      const target = writeTarget(edit.path)
      try {
        const tags = target.sidecar ? toSidecarTags(edit.set, current.fields) : toWriteTags(edit.set)
        // A brand-new sidecar has nothing to back up.
        const args = target.created ? writeArgs().concat('-overwrite_original') : writeArgs()
        await exiftool.write(target.file, tags as never, { writeArgs: args })
        items.push({ path: edit.path, before, createdSidecar: target.created ? target.file : undefined })
        return { path: edit.path, ok: true, record: await readRecord(edit.path) }
      } catch (err) {
        return { path: edit.path, ok: false, error: errMessage(err), record: await readRecord(edit.path) }
      }
    },
    onProgress
  )
  return { results, items }
}

export async function writeEdits(edits: FileEdit[], label: string, onProgress?: Progress): Promise<WriteResult[]> {
  const { results, items } = await applyEdits(edits, onProgress)
  if (items.length) remember({ kind: 'fields', label, items })
  return results
}

export async function undo(onProgress?: Progress): Promise<WriteResult[]> {
  const entry = history.pop()
  if (!entry) return []
  if (entry.kind === 'rename') {
    return moveFiles(entry.moves.map((m) => ({ from: m.to, to: m.from })), onProgress)
  }
  const created = entry.items.filter((i) => i.createdSidecar)
  for (const i of created) rmSync(i.createdSidecar!, { force: true })
  const createdResults = await Promise.all(created.map(async (i) => ({ path: i.path, ok: true, record: await readRecord(i.path) })))
  const { results } = await applyEdits(
    entry.items.filter((i) => !i.createdSidecar).map((i) => ({ path: i.path, set: i.before })),
    onProgress
  )
  return [...createdResults, ...results]
}

/** Keep cached records in step with files that were moved on disk. */
export function movedInCache(moves: RenameMove[]): void {
  for (const m of moves) {
    const rec = recordCache.get(m.from)
    recordCache.delete(m.from)
    if (rec) recordCache.set(m.to, { ...rec, path: m.to, name: basename(m.to) })
  }
}

export function rememberRename(label: string, moves: RenameMove[]): void {
  remember({ kind: 'rename', label, moves })
}

export function forgetFile(path: string): void {
  forget(path)
  recordCache.delete(path)
}

/** Remove all metadata except the colour profile and orientation. Can't be undone. */
export async function stripMetadata(paths: string[], onProgress?: Progress): Promise<WriteResult[]> {
  return runPool(
    paths,
    16,
    async (path): Promise<WriteResult> => {
      try {
        await exiftool.write(path, { all: null } as never, {
          writeArgs: ['--ICC_Profile:all', '-tagsFromFile', '@', '-Orientation', ...writeArgs()]
        })
        const sidecar = findSidecar(path)
        if (sidecar) retireFile(sidecar, writeOpts.keepBackups)
        forget(path)
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
