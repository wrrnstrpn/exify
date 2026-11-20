import { FIELD_BY_KEY, formatExposure, parseExposure, type FieldKey, type FieldMap } from '@shared/fields'
import type { PhotoRecord } from '@shared/types'

/** What a CSV column can feed: a field, or something used to build one or to match rows to photos. */
export type ColumnTarget = FieldKey | 'file' | 'frame' | 'date' | 'time' | 'latlon' | ''

export function parseCsv(text: string): string[][] {
  const firstLine = text.slice(0, text.search(/\r?\n|$/))
  const delim = [',', ';', '\t'].map((d) => [d, firstLine.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0]
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"' && cell === '') quoted = true
    else if (c === delim) {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''))
}

// Header names seen in spreadsheets and shooting-log apps, squashed to lowercase letters/digits.
const GUESSES: [RegExp, ColumnTarget][] = [
  [/^(file|filename|image|photo|scan)$/, 'file'],
  [/^(frame|frameno|framenumber|frameno\d*|exposureno|shot|no|nr|number)$/, 'frame'],
  [/^(datetime|datetaken|timestamp|taken|datetimeoriginal)$/, 'date'],
  [/^date$/, 'date'],
  [/^time$/, 'time'],
  [/^(aperture|fstop|fnumber|f)$/, 'FNumber'],
  [/^(shutter|shutterspeed|exposuretime|speed)$/, 'ExposureTime'],
  [/^(iso|asa|ei|filmspeed)$/, 'ISO'],
  [/^(focal|focallength|mm)$/, 'FocalLength'],
  [/^lens(model|name)?$/, 'LensModel'],
  [/^(camera|body|model|cameramodel)$/, 'Model'],
  [/^(make|brand|cameramake)$/, 'Make'],
  [/^(film|filmstock|stock|emulsion)$/, 'FilmStock'],
  [/^(push|pull|pushpull)$/, 'PushPull'],
  [/^(exposurecomp|exposurecompensation|expcomp|ec|ev|compensation)$/, 'ExposureCompensation'],
  [/^(note|notes|comment|comments|description|caption)$/, 'ImageDescription'],
  [/^title$/, 'Title'],
  [/^(keywords|tags)$/, 'Keywords'],
  [/^(location|coordinates|gps|latlon|latlng|position)$/, 'latlon'],
  [/^(lat|latitude)$/, 'GPSLatitude'],
  [/^(lon|lng|long|longitude)$/, 'GPSLongitude'],
  [/^(alt|altitude|elevation)$/, 'GPSAltitude'],
  [/^(place|sublocation|address|spot)$/, 'Sublocation'],
  [/^city$/, 'City'],
  [/^(state|province|region)$/, 'State'],
  [/^country$/, 'Country'],
  [/^(rating|stars)$/, 'Rating'],
  [/^(artist|photographer|author|creator)$/, 'Artist'],
  [/^copyright$/, 'Copyright']
]

export function guessTarget(header: string): ColumnTarget {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '')
  return GUESSES.find(([re]) => re.test(h))?.[1] ?? ''
}

export function looksLikeHeader(row: string[]): boolean {
  return row.filter((c) => guessTarget(c)).length >= Math.min(2, row.length)
}

export type DateOrder = 'dmy' | 'mdy'

const pad = (n: number | string): string => String(n).padStart(2, '0')

/** Dates in whatever shape people type them. Slash dates need to be told the day/month order. */
export function parseLooseDate(s: string, order: DateOrder): { date?: string; time?: string } {
  const t = s.trim()
  let date: string | undefined
  let rest = t
  let m = /^(\d{4})[-:/.](\d{1,2})[-:/.](\d{1,2})/.exec(t)
  if (m) date = `${m[1]}:${pad(m[2])}:${pad(m[3])}`
  else if ((m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(t))) date = `${m[3]}:${pad(m[2])}:${pad(m[1])}`
  else if ((m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(t))) {
    const [d, mo] = order === 'dmy' ? [m[1], m[2]] : [m[2], m[1]]
    date = `${m[3]}:${pad(mo)}:${pad(d)}`
  }
  if (m) rest = t.slice(m[0].length)
  const time = parseLooseTime(rest)
  return { date, time }
}

export function parseLooseTime(s: string): string | undefined {
  const m = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i.exec(s)
  if (!m) return undefined
  let h = Number(m[1])
  if (m[4]) h = (h % 12) + (/pm/i.test(m[4]) ? 12 : 0)
  if (h > 23) return undefined
  return `${pad(h)}:${m[2]}:${m[3] ?? '00'}`
}

const num = (s: string): number | null => {
  const n = parseFloat(s.replace(',', '.').replace(/[^\d.+-]/g, ''))
  return isFinite(n) ? n : null
}

/**
 * Shutter speeds the way a shooting log has them. A bare whole number is read
 * the way it's printed on a shutter dial, so "125" is 1/125; seconds need a
 * unit ("2s", 2") or a decimal ("0.5").
 */
export function parseLogShutter(s: string): string | null {
  const t = s.trim().replace(/\s*sec(onds?)?$/i, 's')
  if (!t) return null
  if (/^\d+$/.test(t) && Number(t) >= 2) return `1/${Number(t)}`
  const secs = parseExposure(t.replace(/″|''/, '"'))
  if (secs === null) return null
  return secs < 0.3 ? formatExposure(secs) : String(Math.round(secs * 10) / 10)
}

/** "+1/3", "-2/3", "-1 1/3", "+0.7 EV" */
function parseEv(s: string): number | null {
  const t = s.replace(/ev$/i, '').replace('−', '-').trim()
  const m = /^([+-])?\s*(?:(\d+)\s+)?(\d+)\/(\d+)$/.exec(t)
  if (!m) return num(t)
  const v = (m[2] ? Number(m[2]) : 0) + Number(m[3]) / Number(m[4])
  return Math.round((m[1] === '-' ? -1 : 1) * v * 100) / 100
}

/** Turn one cell into field values. Returns null when the cell can't be read. */
export function cellToFields(target: ColumnTarget, raw: string): FieldMap | null {
  const v = raw.trim()
  if (!v || !target || target === 'file' || target === 'frame' || target === 'date' || target === 'time') return {}
  switch (target) {
    case 'FNumber': {
      const n = num(v.replace(/^f\s*\/?\s*/i, '').replace(/^ƒ\s*\/?/, ''))
      return n && n > 0 ? { FNumber: n } : null
    }
    case 'ExposureTime': {
      const s = parseLogShutter(v)
      return s ? { ExposureTime: s } : null
    }
    case 'ExposureCompensation': {
      const n = parseEv(v)
      return n === null ? null : { ExposureCompensation: n }
    }
    case 'latlon': {
      const m = /(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/.exec(v)
      if (!m) return null
      const lat = parseFloat(m[1])
      const lon = parseFloat(m[2])
      return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { GPSLatitude: lat, GPSLongitude: lon } : null
    }
    case 'Keywords':
      return { Keywords: v.split(/[;,|]/).map((k) => k.trim()).filter(Boolean) }
    default: {
      const def = FIELD_BY_KEY[target]
      if (def.kind === 'number' || def.kind === 'select') {
        const n = num(v)
        return n === null ? null : { [target]: n }
      }
      if (def.kind === 'datetime') {
        const { date, time } = parseLooseDate(v, 'dmy')
        return date ? { [target]: `${date} ${time ?? '00:00:00'}` } : null
      }
      return { [target]: v }
    }
  }
}

export type MatchMode = 'order' | 'file' | 'frame'

export interface ImportOptions {
  mapping: ColumnTarget[]
  match: MatchMode
  dateOrder: DateOrder
}

export interface ImportRow {
  row: number
  photo?: PhotoRecord
  set: FieldMap
  problems: string[]
}

const stem = (name: string): string => name.replace(/\.[^.]+$/, '').toLowerCase()
const lastNumber = (s: string): number | null => {
  const m = /(\d+)(?!.*\d)/.exec(s)
  return m ? Number(m[1]) : null
}

/** Pair CSV rows with photos and work out what each photo gets. `photos` should be in on-screen order. */
export function buildImport(rows: string[][], photos: PhotoRecord[], o: ImportOptions): ImportRow[] {
  const col = (t: ColumnTarget): number => o.mapping.indexOf(t)
  const fileCol = col('file')
  const frameCol = col('frame')
  const byName = new Map<string, PhotoRecord>()
  const byFrame = new Map<number, PhotoRecord>()
  for (const p of photos) {
    byName.set(p.name.toLowerCase(), p)
    if (!byName.has(stem(p.name))) byName.set(stem(p.name), p)
    const n = lastNumber(stem(p.name))
    if (n !== null && !byFrame.has(n)) byFrame.set(n, p)
  }

  return rows.map((cells, i) => {
    const problems: string[] = []
    let photo: PhotoRecord | undefined
    if (o.match === 'order') photo = photos[i]
    else if (o.match === 'file') {
      const name = (cells[fileCol] ?? '').trim().split(/[\\/]/).pop()!.toLowerCase()
      photo = byName.get(name) ?? byName.get(stem(name))
      if (!photo && name) problems.push(`No photo named “${cells[fileCol]}”`)
    } else {
      const n = lastNumber(cells[frameCol] ?? '')
      photo = n === null ? undefined : byFrame.get(n)
      if (!photo && n !== null) problems.push(`No photo with frame number ${n}`)
    }

    const set: FieldMap = {}
    let date: string | undefined
    let time: string | undefined
    o.mapping.forEach((target, c) => {
      const cell = cells[c] ?? ''
      if (!cell.trim()) return
      if (target === 'date') {
        const d = parseLooseDate(cell, o.dateOrder)
        if (!d.date) problems.push(`Can't read the date “${cell}”`)
        date = d.date ?? date
        time = d.time ?? time
        return
      }
      if (target === 'time') {
        time = parseLooseTime(cell) ?? time
        if (!parseLooseTime(cell)) problems.push(`Can't read the time “${cell}”`)
        return
      }
      const patch = cellToFields(target, cell)
      if (patch === null) problems.push(`Can't read ${target ? FIELD_BY_KEY[target as FieldKey]?.label ?? target : ''} “${cell}”`)
      else Object.assign(set, patch)
    })
    if (date) set.DateTimeOriginal = `${date} ${time ?? '00:00:00'}`
    return { row: i, photo, set, problems }
  })
}
