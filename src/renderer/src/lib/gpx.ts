export interface TrackPoint {
  lat: number
  lon: number
  ele?: number
  /** UTC, ms since epoch */
  t: number
}

const attr = (tag: string, name: string): number => {
  const m = new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`).exec(tag)
  return m ? parseFloat(m[1]) : NaN
}

/**
 * Pull timestamped points out of a GPX file. Track points are what phones and
 * watches record; route points and waypoints are only used if they carry a time.
 * Regex rather than DOMParser so it also runs in the tests under Node.
 */
export function parseGpx(xml: string): TrackPoint[] {
  const out: TrackPoint[] = []
  const re = /<(trkpt|rtept|wpt)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) {
    const lat = attr(m[2], 'lat')
    const lon = attr(m[2], 'lon')
    const body = m[3] ?? ''
    const time = /<time>\s*([^<]+?)\s*<\/time>/.exec(body)?.[1]
    if (!isFinite(lat) || !isFinite(lon) || !time) continue
    const t = Date.parse(time)
    if (isNaN(t)) continue
    const ele = parseFloat(/<ele>\s*([^<]+?)\s*<\/ele>/.exec(body)?.[1] ?? '')
    out.push({ lat, lon, t, ele: isFinite(ele) ? ele : undefined })
  }
  return out.sort((a, b) => a.t - b.t)
}

export function mergeTracks(tracks: TrackPoint[][]): TrackPoint[] {
  return tracks.flat().sort((a, b) => a.t - b.t)
}

export interface TrackMatch {
  lat: number
  lon: number
  ele?: number
  /** Seconds to the nearest real track point; 0 when interpolated between two. */
  gap: number
}

export interface LocateLimits {
  /** Interpolate between two points at most this far apart. */
  interpolateMs: number
  /** Otherwise use the nearest point if it's at most this far away. */
  snapMs: number
}

export const DEFAULT_LIMITS: LocateLimits = { interpolateMs: 30 * 60_000, snapMs: 5 * 60_000 }

/** Where the track was at `t`, or null if it's too far from any point. Same idea as ExifTool's GeoMaxIntSecs/ExtSecs. */
export function locate(track: TrackPoint[], t: number, limits: LocateLimits = DEFAULT_LIMITS): TrackMatch | null {
  if (!track.length) return null
  let lo = 0
  let hi = track.length - 1
  if (t <= track[0].t) return near(track[0], t, limits.snapMs)
  if (t >= track[hi].t) return near(track[hi], t, limits.snapMs)
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (track[mid].t <= t) lo = mid
    else hi = mid
  }
  const a = track[lo]
  const b = track[hi]
  if (b.t - a.t <= limits.interpolateMs) {
    const f = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t)
    const ele = a.ele !== undefined && b.ele !== undefined ? a.ele + (b.ele - a.ele) * f : (a.ele ?? b.ele)
    return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f, ele, gap: 0 }
  }
  return near(t - a.t < b.t - t ? a : b, t, limits.snapMs)
}

function near(p: TrackPoint, t: number, maxMs: number): TrackMatch | null {
  const d = Math.abs(t - p.t)
  return d <= maxMs ? { lat: p.lat, lon: p.lon, ele: p.ele, gap: Math.round(d / 1000) } : null
}
