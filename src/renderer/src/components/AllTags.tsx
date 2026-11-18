import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../store'
import { ISearch } from './Icons'

/** Read-only inspector of every tag ExifTool can see in a file, grouped by family. */
export function AllTags({ path, version }: { path: string; version: unknown }): JSX.Element {
  const [tags, setTags] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    let live = true
    setTags(null)
    setError(null)
    api
      .readAllTags(path)
      .then((t) => live && setTags(t))
      .catch((e: unknown) => live && setError(String(e)))
    return () => {
      live = false
    }
  }, [path, version])

  const groups = useMemo(() => {
    if (!tags) return []
    const needle = q.toLowerCase()
    const m = new Map<string, [string, string][]>()
    for (const [key, raw] of Object.entries(tags)) {
      const [g, name] = key.includes(':') ? [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)] : ['Other', key]
      const value = Array.isArray(raw) ? raw.join(', ') : typeof raw === 'object' && raw !== null ? JSON.stringify(raw) : String(raw)
      if (needle && !`${g} ${name} ${value}`.toLowerCase().includes(needle)) continue
      const list = m.get(g) ?? []
      list.push([name, value])
      m.set(g, list)
    }
    return [...m.entries()]
  }, [tags, q])

  return (
    <div className="alltags">
      <div className="alltags-search">
        <ISearch size={14} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter tags…" spellCheck={false} />
      </div>
      <div className="alltags-body">
        {error && <div className="err-text">{error}</div>}
        {!tags && !error && <div className="muted pad">Reading tags…</div>}
        {groups.map(([g, rows]) => (
          <div key={g} className="tag-group">
            <div className="tag-group-head">
              {g} <span>{rows.length}</span>
            </div>
            {rows.map(([n, v]) => (
              <div key={n} className="tag-row">
                <span className="tag-name">{n}</span>
                <span className="tag-value" title={v}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
