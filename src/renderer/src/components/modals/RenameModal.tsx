import type { JSX } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { planRenames, RENAME_TOKENS } from '../../lib/rename'
import { api, useStore } from '../../store'
import { Shell, useSelection } from '../Shell'

const PRESETS = ['{YYYY}-{MM}-{DD}_{hh}{mm}{ss}', '{YYYY}{MM}{DD}_{n:4}', '{name}_{camera}', '{film}_{n:2}']

export function RenameModal(): JSX.Element {
  const sel = useSelection()
  const saved = useStore((s) => s.settings.renamePattern)
  const updateSettings = useStore((s) => s.updateSettings)
  const rename = useStore((s) => s.rename)
  const openModal = useStore((s) => s.openModal)
  const busy = useStore((s) => s.busy)
  const [pattern, setPattern] = useState(saved)
  const [start, setStart] = useState('1')
  const [taken, setTaken] = useState<Set<string>>(new Set())
  const input = useRef<HTMLInputElement>(null)

  const caseless = api.platform !== 'linux'
  const draft = useMemo(() => planRenames(sel, pattern, { start: Number(start) || 1, caseless }), [sel, pattern, start, caseless])

  // Ask the main process which target names already exist on disk, so clashes get a suffix in the preview too.
  useEffect(() => {
    let live = true
    const t = setTimeout(() => {
      void api.existingPaths(draft.filter((p) => p.changed).map((p) => p.to)).then((paths) => live && setTaken(new Set(paths)))
    }, 200)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [draft])

  const plan = useMemo(() => planRenames(sel, pattern, { start: Number(start) || 1, taken, caseless }), [sel, pattern, start, taken, caseless])
  const changes = plan.filter((p) => p.changed)

  const insert = (token: string): void => {
    const el = input.current
    const at = el?.selectionStart ?? pattern.length
    const end = el?.selectionEnd ?? at
    setPattern(pattern.slice(0, at) + token + pattern.slice(end))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(at + token.length, at + token.length)
    })
  }

  return (
    <Shell
      title="Rename files"
      width={680}
      footer={
        <>
          <span className="muted small">
            {changes.length} of {sel.length} file{sel.length === 1 ? '' : 's'} will be renamed. Sidecars and backups move with them.
          </span>
          <button className="btn ghost" onClick={() => openModal(null)}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={!changes.length || busy}
            onClick={async () => {
              void updateSettings({ renamePattern: pattern })
              await rename(
                changes.map(({ from, to }) => ({ from, to })),
                `Renamed ${changes.length} file${changes.length > 1 ? 's' : ''}`
              )
              openModal(null)
            }}
          >
            Rename
          </button>
        </>
      }
    >
      <div className="form-block">
        <label className="stack-label">
          <span>Pattern</span>
          <input ref={input} className="field-input mono" value={pattern} spellCheck={false} onChange={(e) => setPattern(e.target.value)} autoFocus />
        </label>
        <div className="chipset">
          {RENAME_TOKENS.map((t) => (
            <button key={t.token} className="tagbtn" title={t.hint} onClick={() => insert(t.token)}>
              {t.token}
            </button>
          ))}
        </div>
        <div className="shift-row">
          <span className="small muted">Try</span>
          {PRESETS.map((p) => (
            <button key={p} className="link mono small" onClick={() => setPattern(p)}>
              {p}
            </button>
          ))}
          <span className="sb-spacer" />
          <label className="unit-input">
            <input inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value.replace(/\D/g, ''))} />
            <span>first {'{n}'}</span>
          </label>
        </div>
      </div>
      <div className="preview-table rename">
        {plan.slice(0, 10).map((p, i) => (
          <div key={p.from}>
            <span className="pt-name">{sel[i].name}</span>
            <span className="arrow">→</span>
            <span className={p.changed ? '' : 'muted'}>{p.name}</span>
          </div>
        ))}
        {plan.length > 10 && <div className="muted small">…and {plan.length - 10} more</div>}
      </div>
      <p className="muted small">The extension is kept. Values a photo doesn't have are left out, and names that would clash get -2, -3 and so on.</p>
    </Shell>
  )
}
