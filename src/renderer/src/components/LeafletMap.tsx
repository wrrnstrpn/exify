import type { JSX } from 'react'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface MapPoint {
  id: string
  lat: number
  lon: number
  label?: string
  selected?: boolean
}

interface Props {
  points: MapPoint[]
  track?: [number, number][]
  onPick?(lat: number, lon: number): void
  onPointClick?(id: string): void
  height?: number | string
}

// Leaflet is imperative, so the React side just hands it data and lets it draw.
// Circle markers instead of pin icons: no image assets to bundle, and they read
// fine at the density photos tend to cluster at.
export function LeafletMap({ points, track, onPick, onPointClick, height = 420 }: Props): JSX.Element {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const framed = useRef('')
  const pickRef = useRef(onPick)
  const clickRef = useRef(onPointClick)
  pickRef.current = onPick
  clickRef.current = onPointClick

  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, { zoomControl: true, attributionControl: true, worldCopyJump: true }).setView([20, 0], 2)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(m)
    m.on('click', (e: L.LeafletMouseEvent) => pickRef.current?.(e.latlng.lat, e.latlng.lng))
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    // The modal animates in, so the container's size isn't final on the first frame.
    const t = setTimeout(() => m.invalidateSize(), 60)
    return () => {
      clearTimeout(t)
      m.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const m = map.current
    const g = layer.current
    if (!m || !g) return
    g.clearLayers()
    const bounds: L.LatLngExpression[] = []
    if (track && track.length > 1) {
      L.polyline(track, { color: '#e0a64a', weight: 3, opacity: 0.8 }).addTo(g)
      bounds.push(...track)
    }
    for (const p of points) {
      const c = L.circleMarker([p.lat, p.lon], {
        radius: p.selected ? 7 : 5,
        color: p.selected ? '#ffffff' : '#0d0e12',
        weight: p.selected ? 2 : 1,
        fillColor: p.selected ? '#5b9cf5' : '#c9cbd3',
        fillOpacity: 0.95
      }).addTo(g)
      if (p.label) c.bindTooltip(p.label, { direction: 'top', offset: [0, -6] })
      c.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        clickRef.current?.(p.id)
      })
      bounds.push([p.lat, p.lon])
    }
    // Only reframe when the places change, not when the selection does.
    const key = `${bounds.length}:${bounds.slice(0, 50).join('|')}`
    if (key === framed.current) return
    framed.current = key
    if (bounds.length === 1) m.setView(bounds[0], 14)
    else if (bounds.length > 1) m.fitBounds(L.latLngBounds(bounds), { padding: [30, 30], maxZoom: 16 })
  }, [points, track])

  return <div ref={el} className="leaflet-host" style={{ height, cursor: onPick ? 'crosshair' : undefined }} />
}
