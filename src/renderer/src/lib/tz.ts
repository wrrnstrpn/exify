import tzlookup from '@photostructure/tz-lookup'
import { exifDateToMs } from '@shared/fields'

const fmt = (m: number): string => {
  const a = Math.abs(m)
  return `${m < 0 ? '-' : '+'}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`
}

/** UTC offset of an IANA zone at a given instant, in minutes. */
function offsetAt(zone: string, utcMs: number): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(new Date(utcMs))
    .find((p) => p.type === 'timeZoneName')?.value
  const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name ?? '')
  if (!m) return 0
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0))
}

export function zoneAt(lat: number, lon: number): string | null {
  try {
    return tzlookup(lat, lon)
  } catch {
    return null
  }
}

/**
 * The "+HH:MM" offset in force where (and when) a photo was taken. `date` is
 * the camera's local wall-clock time, so we guess the instant, look up the
 * offset there, and correct once, which settles everything except the hour a
 * DST change repeats.
 */
export function offsetFromGps(lat: number, lon: number, date: string | null | undefined): string | null {
  const zone = zoneAt(lat, lon)
  if (!zone) return null
  const wall = exifDateToMs(date) ?? Date.now()
  let off = offsetAt(zone, wall)
  off = offsetAt(zone, wall - off * 60_000)
  return fmt(off)
}

export function formatOffset(minutes: number): string {
  return fmt(minutes)
}

/** "+05:30" → 330 */
export function parseOffset(s: string | null | undefined): number | null {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(s ?? '')
  if (!m) return null
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]))
}
