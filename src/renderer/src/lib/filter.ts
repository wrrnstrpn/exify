import { exifDateToMs, type FieldKey } from '@shared/fields'
import type { PhotoRecord } from '@shared/types'
import { validateCached, worstLevel } from './validate'

export type MissingKey = 'date' | 'gps' | 'camera' | 'lens' | 'exposure' | 'copyright' | 'artist' | 'film'

export interface Filters {
  text: string
  cameras: string[]
  lenses: string[]
  types: string[]
  folders: string[]
  dateFrom: string
  dateTo: string
  isoMin: string
  isoMax: string
  focalMin: string
  focalMax: string
  apMin: string
  apMax: string
  ratingMin: number
  missing: MissingKey[]
  issues: 'all' | 'any' | 'errors' | 'clean'
}

export const DEFAULT_FILTERS: Filters = {
  text: '',
  cameras: [],
  lenses: [],
  types: [],
  folders: [],
  dateFrom: '',
  dateTo: '',
  isoMin: '',
  isoMax: '',
  focalMin: '',
  focalMax: '',
  apMin: '',
  apMax: '',
  ratingMin: 0,
  missing: [],
  issues: 'all'
}

export type SortKey = 'name' | 'date' | 'camera' | 'lens' | 'focal' | 'aperture' | 'shutter' | 'iso' | 'size' | 'folder'
export interface SortState {
  key: SortKey
  dir: 1 | -1
}

export const NONE = '(none)'

export const cameraKey = (r: PhotoRecord): string =>
  typeof r.fields.Model === 'string' ? r.fields.Model : typeof r.fields.Make === 'string' ? r.fields.Make : NONE
export const lensKey = (r: PhotoRecord): string => (typeof r.fields.LensModel === 'string' ? r.fields.LensModel : NONE)
export const typeKey = (r: PhotoRecord): string => (r.fileType ?? r.ext.toUpperCase()) || NONE
export const folderKey = (r: PhotoRecord): string => r.rel || '.'

const num = (v: unknown): number | undefined => (typeof v === 'number' && isFinite(v) ? v : undefined)

function inRange(v: number | undefined, min: string, max: string): boolean {
  if (min === '' && max === '') return true
  if (v === undefined) return false
  if (min !== '' && v < parseFloat(min)) return false
  if (max !== '' && v > parseFloat(max)) return false
  return true
}

const MISSING_TEST: Record<MissingKey, (r: PhotoRecord) => boolean> = {
  date: (r) => !r.fields.DateTimeOriginal,
  gps: (r) => r.fields.GPSLatitude == null || r.fields.GPSLongitude == null,
  camera: (r) => !r.fields.Model && !r.fields.Make,
  lens: (r) => !r.fields.LensModel,
  exposure: (r) => r.fields.FNumber == null || !r.fields.ExposureTime || r.fields.ISO == null,
  copyright: (r) => !r.fields.Copyright,
  artist: (r) => !r.fields.Artist,
  film: (r) => !r.fields.FilmStock
}

const SEARCH_FIELDS: FieldKey[] = ['Make', 'Model', 'LensModel', 'FilmStock', 'Title', 'ImageDescription', 'Keywords', 'Artist', 'Copyright', 'Sublocation', 'City', 'State', 'Country']

export function applyFilters(records: PhotoRecord[], f: Filters): PhotoRecord[] {
  const tokens = f.text.toLowerCase().split(/\s+/).filter(Boolean)
  const cams = new Set(f.cameras)
  const lenses = new Set(f.lenses)
  const types = new Set(f.types)
  const folders = new Set(f.folders)
  const from = f.dateFrom ? Date.UTC(+f.dateFrom.slice(0, 4), +f.dateFrom.slice(5, 7) - 1, +f.dateFrom.slice(8, 10)) : null
  const to = f.dateTo ? Date.UTC(+f.dateTo.slice(0, 4), +f.dateTo.slice(5, 7) - 1, +f.dateTo.slice(8, 10)) + 86_399_999 : null

  return records.filter((r) => {
    if (cams.size && !cams.has(cameraKey(r))) return false
    if (lenses.size && !lenses.has(lensKey(r))) return false
    if (types.size && !types.has(typeKey(r))) return false
    if (folders.size && !folders.has(folderKey(r))) return false
    if (from !== null || to !== null) {
      const ms = exifDateToMs(r.fields.DateTimeOriginal as string)
      if (ms === null) return false
      if (from !== null && ms < from) return false
      if (to !== null && ms > to) return false
    }
    if (!inRange(num(r.fields.ISO), f.isoMin, f.isoMax)) return false
    if (!inRange(num(r.fields.FocalLength), f.focalMin, f.focalMax)) return false
    if (!inRange(num(r.fields.FNumber), f.apMin, f.apMax)) return false
    if (f.ratingMin > 0 && (num(r.fields.Rating) ?? 0) < f.ratingMin) return false
    for (const m of f.missing) if (!MISSING_TEST[m](r)) return false
    if (f.issues !== 'all') {
      const lvl = worstLevel(validateCached(r.fields))
      if (f.issues === 'any' && !lvl) return false
      if (f.issues === 'errors' && lvl !== 'error') return false
      if (f.issues === 'clean' && lvl) return false
    }
    if (tokens.length) {
      const hay = [r.name, r.rel, ...SEARCH_FIELDS.map((k) => {
        const v = r.fields[k]
        return Array.isArray(v) ? v.join(' ') : v == null ? '' : String(v)
      })]
        .join(' ')
        .toLowerCase()
      if (!tokens.every((t) => hay.includes(t))) return false
    }
    return true
  })
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function sortValue(r: PhotoRecord, key: SortKey): string | number | undefined {
  switch (key) {
    case 'name':
      return r.name
    case 'folder':
      return `${r.rel}/${r.name}`
    case 'date':
      return exifDateToMs(r.fields.DateTimeOriginal as string) ?? undefined
    case 'camera':
      return cameraKey(r)
    case 'lens':
      return lensKey(r)
    case 'focal':
      return num(r.fields.FocalLength)
    case 'aperture':
      return num(r.fields.FNumber)
    case 'shutter': {
      const v = r.fields.ExposureTime
      if (typeof v !== 'string') return undefined
      const m = /^1\/(\d+(?:\.\d+)?)$/.exec(v)
      return m ? 1 / parseFloat(m[1]) : parseFloat(v)
    }
    case 'iso':
      return num(r.fields.ISO)
    case 'size':
      return r.fileSize
  }
}

export function sortRecords(list: PhotoRecord[], s: SortState): PhotoRecord[] {
  const keyed = list.map((r) => [sortValue(r, s.key), r] as const)
  keyed.sort((a, b) => {
    const [va] = a
    const [vb] = b
    if (va === undefined && vb === undefined) return collator.compare(a[1].name, b[1].name)
    if (va === undefined) return 1
    if (vb === undefined) return -1
    const c = typeof va === 'number' && typeof vb === 'number' ? va - vb : collator.compare(String(va), String(vb))
    return c !== 0 ? c * s.dir : collator.compare(a[1].name, b[1].name)
  })
  return keyed.map(([, r]) => r)
}

export function facetCounts(records: PhotoRecord[], keyFn: (r: PhotoRecord) => string): [string, number][] {
  const m = new Map<string, number>()
  for (const r of records) {
    const k = keyFn(r)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0]))
}

export function activeFilterCount(f: Filters): number {
  let n = 0
  if (f.text) n++
  n += f.cameras.length + f.lenses.length + f.types.length + f.folders.length + f.missing.length
  if (f.dateFrom || f.dateTo) n++
  if (f.isoMin || f.isoMax) n++
  if (f.focalMin || f.focalMax) n++
  if (f.apMin || f.apMax) n++
  if (f.ratingMin) n++
  if (f.issues !== 'all') n++
  return n
}
