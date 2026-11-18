import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import type { PhotoRecord } from '@shared/types'
import { useStore } from '../store'
import { IPlus, IX } from './Icons'

/**
 * Keyword chips. With many photos selected, each chip shows how many photos have
 * it; removing a chip removes it from all, and "+" adds a partial keyword to all.
 */
export function KeywordsField({ sel }: { sel: PhotoRecord[] }): JSX.Element {
  const ops = useStore((s) => s.keywordOps)
  const setOps = useStore((s) => s.setKeywordOps)
  const draft = useStore((s) => s.draft)
  const dropDraft = useStore((s) => s.dropDraft)
  const allRecords = useStore((s) => s.records)
  const [text, setText] = useState('')

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of sel) {
      const kw = Array.isArray(r.fields.Keywords) ? r.fields.Keywords : []
      for (const k of kw) m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [sel])

  const suggestions = useMemo(() => {
    const s = new Set<string>()
    for (const r of allRecords) if (Array.isArray(r.fields.Keywords)) r.fields.Keywords.forEach((k) => s.add(k))
    return [...s].sort()
  }, [allRecords])

  // A cleared keyword field (draft null) means "remove all".
  const cleared = 'Keywords' in draft && draft.Keywords === null

  const chips: { k: string; n: number; added: boolean }[] = []
  if (!cleared) {
    for (const [k, n] of counts) if (!ops.remove.includes(k)) chips.push({ k, n: ops.add.includes(k) ? sel.length : n, added: false })
  }
  for (const k of ops.add) if (!counts.has(k) || cleared) chips.push({ k, n: sel.length, added: true })

  const add = (raw: string): void => {
    const words = raw.split(/[,;]/).map((w) => w.trim()).filter(Boolean)
    if (!words.length) return
    if (cleared) dropDraft('Keywords')
    setOps({ add: [...new Set([...ops.add, ...words])], remove: ops.remove.filter((r) => !words.includes(r)) })
    setText('')
  }
  const remove = (k: string): void => {
    setOps({ add: ops.add.filter((a) => a !== k), remove: counts.has(k) ? [...new Set([...ops.remove, k])] : ops.remove })
  }

  const matches = text ? suggestions.filter((s) => s.toLowerCase().includes(text.toLowerCase()) && !chips.some((c) => c.k === s)).slice(0, 6) : []

  return (
    <div className={`keywords ${ops.add.length || ops.remove.length || cleared ? 'changed' : ''}`}>
      <div className="chips">
        {chips.map((c) => (
          <span key={c.k} className={`chip ${c.added ? 'added' : ''} ${c.n < sel.length ? 'partial' : ''}`}>
            {c.k}
            {sel.length > 1 && c.n < sel.length && (
              <>
                <span className="chip-count">
                  {c.n}/{sel.length}
                </span>
                <button title="Add to all selected" onClick={() => add(c.k)}>
                  <IPlus size={11} />
                </button>
              </>
            )}
            <button title={sel.length > 1 ? 'Remove from all selected' : 'Remove'} onClick={() => remove(c.k)}>
              <IX size={11} />
            </button>
          </span>
        ))}
        {ops.remove.length > 0 && (
          <span className="chip removed" title="Will be removed">
            −{ops.remove.join(', ')}
          </span>
        )}
        <input
          value={text}
          placeholder={chips.length ? 'Add…' : 'Add keywords, comma separated'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add(text)
            } else if (e.key === 'Backspace' && !text && chips.length) remove(chips[chips.length - 1].k)
          }}
          onBlur={() => text && add(text)}
        />
      </div>
      {matches.length > 0 && (
        <div className="chip-suggest">
          {matches.map((m) => (
            <button key={m} onMouseDown={(e) => e.preventDefault()} onClick={() => add(m)}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
