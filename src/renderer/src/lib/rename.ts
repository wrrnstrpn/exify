import type { PhotoRecord, RenameMove } from '@shared/types'
import { findCamera } from '../data/cameras'

export const RENAME_TOKENS: { token: string; hint: string }[] = [
  { token: '{name}', hint: 'current name' },
  { token: '{YYYY}', hint: 'year' },
  { token: '{MM}', hint: 'month' },
  { token: '{DD}', hint: 'day' },
  { token: '{hh}', hint: 'hour' },
  { token: '{mm}', hint: 'minute' },
  { token: '{ss}', hint: 'second' },
  { token: '{camera}', hint: 'e.g. EOS R6' },
  { token: '{make}', hint: 'e.g. Canon' },
  { token: '{lens}', hint: 'lens model' },
  { token: '{focal}', hint: 'e.g. 35mm' },
  { token: '{iso}', hint: 'e.g. 400' },
  { token: '{film}', hint: 'film stock' },
  { token: '{city}', hint: 'city' },
  { token: '{folder}', hint: 'folder name' },
  { token: '{n}', hint: 'counter, {n:3} = 001' }
]

const stemOf = (name: string): string => name.replace(/\.[^.]+$/, '')
const extOf = (name: string): string => /\.[^.]+$/.exec(name)?.[0] ?? ''
const dirOf = (path: string, name: string): string => path.slice(0, path.length - name.length)

const MAKE_PREFIX = /^(canon|nikon|sony|fujifilm|panasonic|leica|olympus|om system|pentax|ricoh|hasselblad|sigma)\s+/i

function cameraName(r: PhotoRecord): string {
  const model = typeof r.fields.Model === 'string' ? r.fields.Model : ''
  if (!model) return ''
  const known = findCamera(typeof r.fields.Make === 'string' ? r.fields.Make : undefined, model)
  return (known?.label ?? model).replace(MAKE_PREFIX, '')
}

function clean(s: string): string {
  // Windows is the strictest about file names, so its rules apply everywhere.
  return s
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

export function renderName(pattern: string, r: PhotoRecord, n: number): string {
  const date = typeof r.fields.DateTimeOriginal === 'string' ? r.fields.DateTimeOriginal : ''
  const d = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(date)
  const f = r.fields
  const text = (v: unknown): string => (typeof v === 'string' ? clean(v) : typeof v === 'number' ? String(v) : '')
  const values: Record<string, string> = {
    name: stemOf(r.name),
    YYYY: d?.[1] ?? '',
    MM: d?.[2] ?? '',
    DD: d?.[3] ?? '',
    hh: d?.[4] ?? '',
    mm: d?.[5] ?? '',
    ss: d?.[6] ?? '',
    camera: clean(cameraName(r)),
    make: text(f.Make),
    lens: text(f.LensModel),
    focal: typeof f.FocalLength === 'number' ? `${Math.round(f.FocalLength)}mm` : '',
    iso: text(f.ISO),
    film: text(f.FilmStock),
    city: text(f.City),
    folder: clean(r.rel.split(/[\\/]/).pop() ?? '')
  }
  let out = pattern.replace(/\{(\w+)(?::(\d+))?\}/g, (whole, key: string, width?: string) => {
    if (key === 'n') return String(n).padStart(width ? Number(width) : 1, '0')
    return key in values ? values[key] : whole
  })
  // Missing values leave stray separators behind ("2024-06-15__R6"); tidy those up.
  out = clean(out)
    .replace(/([_\-. ])[_\-. ]+/g, '$1')
    .replace(/^[_\-. ]+|[_\-. ]+$/g, '')
  return out || stemOf(r.name)
}

export interface PlannedRename extends RenameMove {
  name: string
  changed: boolean
}

const key = (p: string, caseless: boolean): string => (caseless ? p.toLowerCase() : p)

/**
 * New names for `records`, in order. Clashes, with each other or with files
 * already on disk (`taken`), get a -2, -3… suffix rather than failing.
 */
export function planRenames(
  records: PhotoRecord[],
  pattern: string,
  opts: { start?: number; taken?: Set<string>; caseless?: boolean } = {}
): PlannedRename[] {
  const caseless = opts.caseless ?? true
  const sources = new Set(records.map((r) => key(r.path, caseless)))
  const used = new Set<string>()
  for (const t of opts.taken ?? []) if (!sources.has(key(t, caseless))) used.add(key(t, caseless))
  return records.map((r, i) => {
    const base = renderName(pattern, r, (opts.start ?? 1) + i)
    const dir = dirOf(r.path, r.name)
    const ext = extOf(r.name)
    let name = base + ext
    for (let k = 2; used.has(key(dir + name, caseless)); k++) name = `${base}-${k}${ext}`
    used.add(key(dir + name, caseless))
    return { from: r.path, to: dir + name, name, changed: name !== r.name }
  })
}
