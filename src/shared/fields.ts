// Every field the app shows, filters on or writes lives in FIELDS below, along
// with the ExifTool tags it reads from (first non-empty wins) and writes to.

export type FieldValue = string | number | string[] | null

export type FieldKind = 'text' | 'longtext' | 'number' | 'datetime' | 'select' | 'keywords' | 'exposure'

export interface SelectOption {
  value: number
  label: string
}

export interface FieldDef {
  key: FieldKey
  label: string
  group: FieldGroup
  kind: FieldKind
  /** Tags read (in priority order) to build this field's value. `#` = numeric. */
  read: string[]
  /** Tags written when this field is set. `#` = write the numeric value. */
  write: string[]
  options?: SelectOption[]
  unit?: string
  placeholder?: string
  step?: number
  min?: number
  max?: number
}

export type FieldGroup = 'Camera' | 'Lens' | 'Exposure' | 'Film' | 'Date & Time' | 'Description' | 'Location' | 'Image'

export const FIELD_KEYS = [
  'Make',
  'Model',
  'SerialNumber',
  'Software',
  'LensMake',
  'LensModel',
  'LensSerialNumber',
  'LensInfo',
  'FocalLength',
  'FocalLengthIn35mmFormat',
  'FNumber',
  'ExposureTime',
  'ISO',
  'ExposureProgram',
  'ExposureCompensation',
  'FilmStock',
  'PushPull',
  'DateTimeOriginal',
  'CreateDate',
  'ModifyDate',
  'OffsetTimeOriginal',
  'Title',
  'ImageDescription',
  'Keywords',
  'Artist',
  'Copyright',
  'Rating',
  'GPSLatitude',
  'GPSLongitude',
  'GPSAltitude',
  'Sublocation',
  'City',
  'State',
  'Country',
  'Orientation'
] as const

export type FieldKey = (typeof FIELD_KEYS)[number]

export type FieldMap = Partial<Record<FieldKey, FieldValue>>

export const EXPOSURE_PROGRAMS: SelectOption[] = [
  { value: 0, label: 'Not defined' },
  { value: 1, label: 'Manual' },
  { value: 2, label: 'Program AE' },
  { value: 3, label: 'Aperture priority' },
  { value: 4, label: 'Shutter priority' },
  { value: 5, label: 'Creative (slow speed)' },
  { value: 6, label: 'Action (high speed)' },
  { value: 7, label: 'Portrait' },
  { value: 8, label: 'Landscape' },
  { value: 9, label: 'Bulb' }
]

export const ORIENTATIONS: SelectOption[] = [
  { value: 1, label: 'Horizontal (normal)' },
  { value: 2, label: 'Mirror horizontal' },
  { value: 3, label: 'Rotate 180°' },
  { value: 4, label: 'Mirror vertical' },
  { value: 5, label: 'Mirror horizontal, rotate 270° CW' },
  { value: 6, label: 'Rotate 90° CW' },
  { value: 7, label: 'Mirror horizontal, rotate 90° CW' },
  { value: 8, label: 'Rotate 270° CW' }
]

export const RATINGS: SelectOption[] = [
  { value: 0, label: '☆ No rating' },
  { value: 1, label: '★' },
  { value: 2, label: '★★' },
  { value: 3, label: '★★★' },
  { value: 4, label: '★★★★' },
  { value: 5, label: '★★★★★' },
  { value: -1, label: 'Rejected' }
]

export const FIELDS: FieldDef[] = [
  { key: 'Make', label: 'Camera make', group: 'Camera', kind: 'text', read: ['Make'], write: ['Make'] },
  { key: 'Model', label: 'Camera model', group: 'Camera', kind: 'text', read: ['Model'], write: ['Model'] },
  { key: 'SerialNumber', label: 'Body serial', group: 'Camera', kind: 'text', read: ['SerialNumber'], write: ['SerialNumber'] },
  { key: 'Software', label: 'Software', group: 'Camera', kind: 'text', read: ['Software'], write: ['Software'] },

  { key: 'LensMake', label: 'Lens make', group: 'Lens', kind: 'text', read: ['LensMake'], write: ['LensMake'] },
  { key: 'LensModel', label: 'Lens model', group: 'Lens', kind: 'text', read: ['LensModel', 'Lens', 'LensID'], write: ['LensModel'] },
  // LensInfo is kept in ExifTool's readable form ("24-70mm f/2.8"), which it also accepts on write.
  { key: 'LensInfo', label: 'Lens specs', group: 'Lens', kind: 'text', read: ['LensInfo'], write: ['LensInfo'], placeholder: '24-70mm f/2.8' },
  { key: 'LensSerialNumber', label: 'Lens serial', group: 'Lens', kind: 'text', read: ['LensSerialNumber'], write: ['LensSerialNumber'] },
  { key: 'FocalLength', label: 'Focal length', group: 'Lens', kind: 'number', read: ['FocalLength'], write: ['FocalLength'], unit: 'mm', step: 1, min: 0 },
  { key: 'FocalLengthIn35mmFormat', label: 'Focal (35mm eq.)', group: 'Lens', kind: 'number', read: ['FocalLengthIn35mmFormat'], write: ['FocalLengthIn35mmFormat'], unit: 'mm', step: 1, min: 0 },

  { key: 'FNumber', label: 'Aperture', group: 'Exposure', kind: 'number', read: ['FNumber'], write: ['FNumber'], unit: 'ƒ/', step: 0.1, min: 0.7 },
  { key: 'ExposureTime', label: 'Shutter speed', group: 'Exposure', kind: 'exposure', read: ['ExposureTime'], write: ['ExposureTime'], unit: 's', placeholder: '1/125' },
  { key: 'ISO', label: 'ISO', group: 'Exposure', kind: 'number', read: ['ISO'], write: ['ISO'], step: 1, min: 1 },
  { key: 'ExposureProgram', label: 'Exposure mode', group: 'Exposure', kind: 'select', read: ['ExposureProgram'], write: ['ExposureProgram#'], options: EXPOSURE_PROGRAMS },
  { key: 'ExposureCompensation', label: 'Exposure comp.', group: 'Exposure', kind: 'number', read: ['ExposureCompensation'], write: ['ExposureCompensation#'], unit: 'EV', step: 0.3 },

  // There's no standard tag for film, so these go in a small XMP namespace of our own (see main/exiftool-config.ts).
  { key: 'FilmStock', label: 'Film stock', group: 'Film', kind: 'text', read: ['XMP-exifyfilm:FilmStock'], write: ['XMP-exifyfilm:FilmStock'], placeholder: 'Kodak Portra 400' },
  { key: 'PushPull', label: 'Push / pull', group: 'Film', kind: 'number', read: ['XMP-exifyfilm:PushPull'], write: ['XMP-exifyfilm:PushPull'], unit: 'stops', step: 1 },

  { key: 'DateTimeOriginal', label: 'Date taken', group: 'Date & Time', kind: 'datetime', read: ['DateTimeOriginal'], write: ['DateTimeOriginal'] },
  { key: 'CreateDate', label: 'Date digitized', group: 'Date & Time', kind: 'datetime', read: ['CreateDate'], write: ['CreateDate'] },
  { key: 'ModifyDate', label: 'Date modified', group: 'Date & Time', kind: 'datetime', read: ['ModifyDate'], write: ['ModifyDate'] },
  { key: 'OffsetTimeOriginal', label: 'Time zone', group: 'Date & Time', kind: 'text', read: ['OffsetTimeOriginal'], write: ['OffsetTimeOriginal'], placeholder: '+01:00' },

  { key: 'Title', label: 'Title', group: 'Description', kind: 'text', read: ['Title', 'ObjectName'], write: ['XMP-dc:Title'] },
  { key: 'ImageDescription', label: 'Description', group: 'Description', kind: 'longtext', read: ['ImageDescription', 'Description', 'Caption-Abstract'], write: ['ImageDescription', 'XMP-dc:Description'] },
  { key: 'Keywords', label: 'Keywords', group: 'Description', kind: 'keywords', read: ['Subject', 'Keywords'], write: ['XMP-dc:Subject', 'IPTC:Keywords'] },
  { key: 'Artist', label: 'Artist', group: 'Description', kind: 'text', read: ['Artist', 'Creator', 'By-line'], write: ['Artist', 'XMP-dc:Creator'] },
  { key: 'Copyright', label: 'Copyright', group: 'Description', kind: 'text', read: ['Copyright', 'Rights', 'CopyrightNotice'], write: ['Copyright', 'XMP-dc:Rights'] },
  { key: 'Rating', label: 'Rating', group: 'Description', kind: 'select', read: ['Rating'], write: ['XMP-xmp:Rating'], options: RATINGS },

  { key: 'GPSLatitude', label: 'Latitude', group: 'Location', kind: 'number', read: ['GPSLatitude'], write: ['GPSLatitude'], step: 0.000001, min: -90, max: 90, placeholder: '48.858370' },
  { key: 'GPSLongitude', label: 'Longitude', group: 'Location', kind: 'number', read: ['GPSLongitude'], write: ['GPSLongitude'], step: 0.000001, min: -180, max: 180, placeholder: '2.294481' },
  { key: 'GPSAltitude', label: 'Altitude', group: 'Location', kind: 'number', read: ['GPSAltitude'], write: ['GPSAltitude'], unit: 'm', step: 1 },
  { key: 'Sublocation', label: 'Place', group: 'Location', kind: 'text', read: ['Location', 'Sub-location'], write: ['XMP-iptcCore:Location', 'IPTC:Sub-location'], placeholder: 'Opera House' },
  { key: 'City', label: 'City', group: 'Location', kind: 'text', read: ['City'], write: ['XMP-photoshop:City', 'IPTC:City'] },
  { key: 'State', label: 'State / province', group: 'Location', kind: 'text', read: ['State', 'Province-State'], write: ['XMP-photoshop:State', 'IPTC:Province-State'] },
  { key: 'Country', label: 'Country', group: 'Location', kind: 'text', read: ['Country', 'Country-PrimaryLocationName'], write: ['XMP-photoshop:Country', 'IPTC:Country-PrimaryLocationName'] },

  { key: 'Orientation', label: 'Orientation', group: 'Image', kind: 'select', read: ['Orientation'], write: ['Orientation#'], options: ORIENTATIONS }
]

export const FIELD_BY_KEY: Record<FieldKey, FieldDef> = Object.fromEntries(FIELDS.map((f) => [f.key, f])) as Record<
  FieldKey,
  FieldDef
>

export const FIELD_GROUPS: FieldGroup[] = ['Camera', 'Lens', 'Exposure', 'Film', 'Date & Time', 'Description', 'Location', 'Image']

export const DATE_FIELDS: FieldKey[] = ['DateTimeOriginal', 'CreateDate', 'ModifyDate']

/** Tags whose numeric (`-n`) value we want instead of ExifTool's print conversion. */
export const NUMERIC_READ_TAGS = new Set([
  'FocalLength',
  'FocalLengthIn35mmFormat',
  'FNumber',
  'ExposureTime',
  'ISO',
  'ExposureProgram',
  'ExposureCompensation',
  'PushPull',
  'Rating',
  'GPSLatitude',
  'GPSLongitude',
  'GPSAltitude',
  'Orientation',
  'FileSize',
  'ImageWidth',
  'ImageHeight'
])

/** Convert a seconds value (0.008) to a photographer's shutter string ("1/125"). */
export function formatExposure(v: number): string {
  if (!isFinite(v) || v <= 0) return ''
  if (v >= 0.3) {
    const r = Math.round(v * 10) / 10
    return String(r)
  }
  const denom = Math.round(1 / v)
  return `1/${denom}`
}

/** Parse "1/125", "0.5", "2\"", "30s" into seconds. */
export function parseExposure(s: string): number | null {
  const t = s.trim().replace(/["s]$/i, '').trim()
  if (!t) return null
  const frac = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(t)
  if (frac) {
    const n = parseFloat(frac[1])
    const d = parseFloat(frac[2])
    return d > 0 ? n / d : null
  }
  const n = parseFloat(t)
  return isFinite(n) && n > 0 ? n : null
}

/** "2024:05:01 14:03:22" <-> "2024-05-01T14:03:22" (for <input type=datetime-local>). */
export function exifDateToInput(v: string | null | undefined): string {
  if (!v) return ''
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(v)
  if (!m) return ''
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}`
}

export function inputDateToExif(v: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(v)
  if (!m) return null
  return `${m[1]}:${m[2]}:${m[3]} ${m[4]}:${m[5]}:${m[6] ?? '00'}`
}

/** Parse an EXIF date string as a local wall-clock time (ms since epoch, tz-agnostic). */
export function exifDateToMs(v: string | null | undefined): number | null {
  if (!v) return null
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(v)
  if (!m) return null
  const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
  return isNaN(ms) ? null : ms
}

export function msToExifDate(ms: number): string {
  const d = new Date(ms)
  const p = (n: number, w = 2): string => String(n).padStart(w, '0')
  return `${p(d.getUTCFullYear(), 4)}:${p(d.getUTCMonth() + 1)}:${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(
    d.getUTCMinutes()
  )}:${p(d.getUTCSeconds())}`
}

export function valuesEqual(a: FieldValue | undefined, b: FieldValue | undefined): boolean {
  const na = a === undefined || a === '' ? null : a
  const nb = b === undefined || b === '' ? null : b
  if (Array.isArray(na) || Array.isArray(nb)) {
    const aa = Array.isArray(na) ? na : na == null ? [] : [String(na)]
    const bb = Array.isArray(nb) ? nb : nb == null ? [] : [String(nb)]
    return aa.length === bb.length && aa.every((x, i) => x === bb[i])
  }
  if (typeof na === 'number' && typeof nb === 'number') return Math.abs(na - nb) < 1e-9
  return na === nb
}
