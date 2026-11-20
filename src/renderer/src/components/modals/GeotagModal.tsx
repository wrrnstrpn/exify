import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { exifDateToMs, type FieldMap } from '@shared/fields'
import type { FileEdit } from '@shared/types'
import { locate, mergeTracks, parseGpx, type TrackPoint } from '../../lib/gpx'
import { formatOffset, offsetFromGps, parseOffset } from '../../lib/tz'
import { TZ_OPTIONS } from '../../lib/options'
import { useStore } from '../../store'
import { api } from '../../store'
import { Combobox } from '../Combobox'
import { Check, Segmented } from '../Controls'
import { IPin } from '../Icons'
import { LeafletMap, type MapPoint } from '../LeafletMap'
import { fmtDate, Shell, useSelection } from '../Shell'

const fmtUtc = (ms: number): string => new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'

export function GeotagModal(): JSX.Element {
  const sel = useSelection()
  const writeEdits = useStore((s) => s.writeEdits)
  const openModal = useStore((s) => s.openModal)
  const busy = useStore((s) => s.busy)

  const [names, setNames] = useState<string[]>([])
  const [track, setTrack] = useState<TrackPoint[]>([])
  const [zone, setZone] = useState(formatOffset(-new Date().getTimezoneOffset()))
  const [ownZone, setOwnZone] = useState(true)
  const [clockSign, setClockSign] = useState<'ahead' | 'behind'>('ahead')
  const [clock, setClock] = useState({ m: '0', s: '0' })
  const [snapMin, setSnapMin] = useState('5')
  const [overwrite, setOverwrite] = useState(false)
  const [setZoneToo, setSetZoneToo] = useState(true)

  const load = async (): Promise<void> => {
    const files = await api.openTextFiles('gpx', true)
    if (!files.length) return
    setNames(files.map((f) => f.name))
    setTrack(mergeTracks(files.map((f) => parseGpx(f.content))))
  }

  // A camera that's ahead stamped its photos later than they really were taken.
  const clockMs = (clockSign === 'ahead' ? -1 : 1) * ((+clock.m || 0) * 60 + (+clock.s || 0)) * 1000

  const matches = useMemo(() => {
    const out: { name: string; path: string; date: string; utc: number | null; hit: ReturnType<typeof locate>; had: boolean; tz?: string }[] = []
    const fallback = parseOffset(zone) ?? 0
    for (const r of sel) {
      const date = typeof r.fields.DateTimeOriginal === 'string' ? r.fields.DateTimeOriginal : ''
      const wall = exifDateToMs(date)
      const own = ownZone ? parseOffset(r.fields.OffsetTimeOriginal as string) : null
      const utc = wall === null ? null : wall - (own ?? fallback) * 60_000 + clockMs
      const hit = utc === null ? null : locate(track, utc, { interpolateMs: 30 * 60_000, snapMs: Math.max(0, +snapMin || 0) * 60_000 })
      const had = typeof r.fields.GPSLatitude === 'number'
      out.push({ name: r.name, path: r.path, date, utc, hit, had, tz: r.fields.OffsetTimeOriginal as string | undefined })
    }
    return out
  }, [sel, track, zone, ownZone, clockMs, snapMin])

  const edits = useMemo<FileEdit[]>(() => {
    const out: FileEdit[] = []
    for (const m of matches) {
      if (!m.hit || (m.had && !overwrite)) continue
      const set: FieldMap = { GPSLatitude: Math.round(m.hit.lat * 1e6) / 1e6, GPSLongitude: Math.round(m.hit.lon * 1e6) / 1e6 }
      if (m.hit.ele !== undefined) set.GPSAltitude = Math.round(m.hit.ele * 10) / 10
      // Save the zone the match was based on, so the photo's time and position agree.
      if (setZoneToo && !m.tz) set.OffsetTimeOriginal = zone
      out.push({ path: m.path, set })
    }
    return out
  }, [matches, overwrite, setZoneToo, zone])

  // The usual mistake: camera set to local time abroad, matched with the home time zone.
  const zoneHint = useMemo(() => {
    const m = matches.find((x) => x.hit && !(ownZone && x.tz))
    if (!m?.hit) return null
    const there = offsetFromGps(m.hit.lat, m.hit.lon, m.date)
    return there && there !== zone ? there : null
  }, [matches, ownZone, zone])

  const noDate = matches.filter((m) => m.utc === null).length
  const missed = matches.filter((m) => m.utc !== null && !m.hit).length
  const skipped = matches.filter((m) => m.hit && m.had && !overwrite).length

  const points = useMemo<MapPoint[]>(
    () => edits.map((e) => ({ id: e.path, lat: e.set.GPSLatitude as number, lon: e.set.GPSLongitude as number, label: e.path.split(/[\\/]/).pop(), selected: true })),
    [edits]
  )
  const line = useMemo<[number, number][]>(() => {
    // Thousands of points add nothing visible; thin them for the map.
    const step = Math.max(1, Math.floor(track.length / 2000))
    return track.filter((_, i) => i % step === 0).map((p) => [p.lat, p.lon])
  }, [track])

  if (!track.length) {
    return (
      <Shell title="Geotag from a GPS track" width={560}>
        <p>
          Match {sel.length} selected photo{sel.length === 1 ? '' : 's'} to a GPX track from your phone, watch or GPS logger by time, and write the
          location into each one.
        </p>
        <p className="muted small">You can load several files at once, for example one per day of a trip.</p>
        {names.length > 0 && <p className="warn-text small">No timestamped points found in {names.join(', ')}.</p>}
        <button className="btn primary" onClick={() => void load()}>
          <IPin size={15} /> Choose GPX files…
        </button>
      </Shell>
    )
  }

  return (
    <Shell
      title="Geotag from a GPS track"
      width={900}
      footer={
        <>
          <span className="muted small">
            {edits.length} of {sel.length} will get a location
            {missed > 0 && ` · ${missed} too far from the track`}
            {noDate > 0 && ` · ${noDate} without a date`}
            {skipped > 0 && ` · ${skipped} already have one`}
          </span>
          <button className="btn ghost" onClick={() => openModal(null)}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={!edits.length || busy}
            onClick={async () => {
              await writeEdits(edits, `Geotagged ${edits.length} photos`)
              openModal(null)
            }}
          >
            Write locations
          </button>
        </>
      }
    >
      <div className="geotag">
        <div className="geotag-side">
          <div className="form-block">
            <span className="small">
              <b>{names.join(', ')}</b>
            </span>
            <span className="muted small">
              {track.length.toLocaleString()} points · {fmtUtc(track[0].t)} to {fmtUtc(track[track.length - 1].t)}
            </span>
            <button className="link small" onClick={() => void load()}>
              Load different files
            </button>
          </div>

          <div className="form-block">
            <span className="small muted">Camera clock time zone</span>
            <Combobox value={zone} options={TZ_OPTIONS} onCommit={(v) => parseOffset(v) !== null && setZone(v)} />
            {zoneHint && (
              <p className="warn-text small">
                The track is in UTC{zoneHint}. If the camera was set to local time there,{' '}
                <button className="link small" onClick={() => setZone(zoneHint)}>
                  use UTC{zoneHint}
                </button>
                .
              </p>
            )}
            <Check checked={ownZone} onChange={setOwnZone}>
              Prefer each photo's own time zone
            </Check>
          </div>

          <div className="form-block">
            <span className="small muted">Camera clock was</span>
            <div className="shift-row">
              <Segmented<'ahead' | 'behind'>
                value={clockSign}
                onChange={setClockSign}
                options={[
                  { value: 'ahead', label: 'ahead' },
                  { value: 'behind', label: 'behind' }
                ]}
              />
              {(['m', 's'] as const).map((k) => (
                <label key={k} className="unit-input">
                  <input inputMode="numeric" value={clock[k]} onChange={(e) => setClock({ ...clock, [k]: e.target.value.replace(/\D/g, '') })} />
                  <span>{k === 'm' ? 'min' : 'sec'}</span>
                </label>
              ))}
            </div>
            <span className="muted small">Photograph your phone's clock with the camera to find this exactly.</span>
          </div>

          <div className="form-block">
            <label className="unit-input">
              <input inputMode="numeric" value={snapMin} onChange={(e) => setSnapMin(e.target.value.replace(/\D/g, ''))} />
              <span>min max distance from a track point</span>
            </label>
            <Check checked={overwrite} onChange={setOverwrite}>
              Replace existing locations
            </Check>
            <Check checked={setZoneToo} onChange={setSetZoneToo}>
              Save this zone where it's missing
            </Check>
          </div>
        </div>
        <div className="geotag-main">
          <LeafletMap points={points} track={line} height={360} />
          <div className="preview-table geotag-list">
            {matches.slice(0, 8).map((m) => (
              <div key={m.path}>
                <span className="pt-name">{m.name}</span>
                <span className="muted">{fmtDate(m.date)}</span>
                <span className={m.hit ? '' : 'muted'}>
                  {m.utc === null
                    ? 'no date'
                    : m.hit
                      ? `${m.hit.lat.toFixed(5)}, ${m.hit.lon.toFixed(5)}${m.hit.gap ? ` (${m.hit.gap}s off)` : ''}${m.had && !overwrite ? ' · keeping existing' : ''}`
                      : 'not on the track'}
                </span>
              </div>
            ))}
            {matches.length > 8 && <div className="muted small">…and {matches.length - 8} more</div>}
          </div>
        </div>
      </div>
    </Shell>
  )
}
