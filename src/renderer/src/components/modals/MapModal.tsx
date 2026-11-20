import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { useStore } from '../../store'
import { LeafletMap, type MapPoint } from '../LeafletMap'
import { Shell } from '../Shell'

/**
 * Every visible photo that has a location. In pick mode a click on the map
 * puts that spot into the editor for the selected photos instead.
 */
export function MapModal({ pick }: { pick?: boolean }): JSX.Element {
  const records = useStore((s) => s.records)
  const index = useStore((s) => s.index)
  const visible = useStore((s) => s.visible)
  const selected = useStore((s) => s.selected)
  const select = useStore((s) => s.select)
  const setDraft = useStore((s) => s.setDraft)
  const openModal = useStore((s) => s.openModal)
  const toast = useStore((s) => s.toast)
  const [picked, setPicked] = useState<[number, number] | null>(null)

  const points = useMemo<MapPoint[]>(() => {
    const out: MapPoint[] = []
    for (const p of visible) {
      const r = records[index.get(p) ?? -1]
      const lat = r?.fields.GPSLatitude
      const lon = r?.fields.GPSLongitude
      if (typeof lat === 'number' && typeof lon === 'number') out.push({ id: r.path, lat, lon, label: r.name, selected: selected.has(r.path) })
    }
    if (picked) out.push({ id: '__picked', lat: picked[0], lon: picked[1], label: 'New location', selected: true })
    return out
  }, [visible, records, index, selected, picked])

  const missing = visible.length - points.filter((p) => p.id !== '__picked').length

  return (
    <Shell
      title={pick ? `Pick a location for ${selected.size} photo${selected.size === 1 ? '' : 's'}` : 'Map'}
      width={960}
      footer={
        pick ? (
          <>
            <span className="muted small">{picked ? `${picked[0].toFixed(6)}, ${picked[1].toFixed(6)}` : 'Click the map to drop a point'}</span>
            <button className="btn ghost" onClick={() => openModal(null)}>
              Cancel
            </button>
            <button
              className="btn primary"
              disabled={!picked}
              onClick={() => {
                const [lat, lon] = picked!
                setDraft({ GPSLatitude: Math.round(lat * 1e6) / 1e6, GPSLongitude: Math.round(lon * 1e6) / 1e6 })
                openModal(null)
                toast('info', 'Location loaded into the editor. Apply to save it')
              }}
            >
              Use this location
            </button>
          </>
        ) : (
          <span className="muted small">
            {points.length} photo{points.length === 1 ? '' : 's'} on the map{missing > 0 && ` · ${missing} without a location`}. Click a dot to select that photo.
          </span>
        )
      }
    >
      <LeafletMap
        points={points}
        height={560}
        onPick={pick ? (lat, lon) => setPicked([lat, lon]) : undefined}
        onPointClick={(id) => {
          if (id === '__picked') return
          // While picking, a click on another photo borrows its location rather than changing the selection.
          if (!pick) return select(id, 'single')
          const p = points.find((x) => x.id === id)
          if (p) setPicked([p.lat, p.lon])
        }}
      />
    </Shell>
  )
}
