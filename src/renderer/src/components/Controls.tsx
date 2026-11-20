import type { JSX } from 'react'
import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react'
import { exifDateToInput } from '@shared/fields'
import { ICalendar, ICheck, IChevronLeft, IChevronRight, IStar } from './Icons'
import { Popover } from './Popover'

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange(v: boolean): void; label?: ReactNode; hint?: ReactNode }): JSX.Element {
  return (
    <button type="button" role="switch" aria-checked={checked} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      {label && (
        <span className="toggle-text">
          <span>{label}</span>
          {hint && <small>{hint}</small>}
        </span>
      )}
    </button>
  )
}

export function Check({ checked, onChange, children, count }: { checked: boolean; onChange(v: boolean): void; children: ReactNode; count?: number }): JSX.Element {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className={`check ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="check-box">{checked && <ICheck size={11} strokeWidth={3} />}</span>
      <span className="check-label">{children}</span>
      {count !== undefined && <span className="check-count">{count}</span>}
    </button>
  )
}

export function Segmented<const T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode; title?: string }[]; onChange(v: T): void }): JSX.Element {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} type="button" title={o.title} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stars({ value, onChange, mixed }: { value: number | null; onChange(v: number): void; mixed?: boolean }): JSX.Element {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value ?? 0
  return (
    <div className={`stars ${mixed && hover === null ? 'mixed' : ''}`} onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= shown ? 'on' : ''}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(value === n ? 0 : n)}
          title={`${n} star${n > 1 ? 's' : ''}`}
        >
          <IStar size={17} filled={n <= shown} />
        </button>
      ))}
      {mixed && hover === null && <span className="stars-mixed">Mixed</span>}
    </div>
  )
}

// Commits on Enter or blur, not per keystroke; with 2,000 photos selected every commit re-validates the lot.
export function TextField({
  value,
  onCommit,
  placeholder,
  tone,
  changed,
  multiline,
  inputMode,
  onPaste
}: {
  value: string
  onCommit(v: string): void
  placeholder?: string
  tone?: 'error' | 'warning' | null
  changed?: boolean
  multiline?: boolean
  inputMode?: 'text' | 'decimal' | 'numeric'
  onPaste?(text: string): boolean
}): JSX.Element {
  const [text, setText] = useState(value)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setText(value)
  }, [value, focused])
  const commit = (): void => {
    if (text.trim() !== value) onCommit(text.trim())
  }
  const common = {
    value: text,
    placeholder,
    spellCheck: false,
    className: `field-input ${tone ? `tone-${tone}` : ''} ${changed ? 'changed' : ''}`,
    onFocus: () => setFocused(true),
    onBlur: () => {
      setFocused(false)
      commit()
    },
    onPaste: (e: ClipboardEvent) => {
      if (onPaste && onPaste(e.clipboardData.getData('text'))) e.preventDefault()
    }
  }
  if (multiline) {
    return (
      <textarea
        {...common}
        rows={3}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commit()
          if (e.key === 'Escape') setText(value)
        }}
      />
    )
  }
  return (
    <input
      {...common}
      inputMode={inputMode}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') setText(value)
      }}
    />
  )
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const pad = (n: number, w = 2): string => String(n).padStart(w, '0')

interface Parts {
  y: number
  mo: number
  d: number
  h: number
  mi: number
  s: number
}

function parseLoose(text: string): Parts | null {
  const m = /^\s*(\d{4})[-:/.](\d{1,2})[-:/.](\d{1,2})(?:[ T]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?\s*$/.exec(text)
  if (!m) return null
  const p = { y: +m[1], mo: +m[2], d: +m[3], h: +(m[4] ?? 0), mi: +(m[5] ?? 0), s: +(m[6] ?? 0) }
  if (p.mo < 1 || p.mo > 12 || p.d < 1 || p.d > 31 || p.h > 23 || p.mi > 59 || p.s > 59) return null
  return p
}

const toExif = (p: Parts): string => `${pad(p.y, 4)}:${pad(p.mo)}:${pad(p.d)} ${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}`
const toDisplay = (p: Parts, dateOnly: boolean): string =>
  dateOnly ? `${pad(p.y, 4)}-${pad(p.mo)}-${pad(p.d)}` : `${pad(p.y, 4)}-${pad(p.mo)}-${pad(p.d)}  ${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}`

// Our own calendar rather than <input type="datetime-local">, which can't show
// seconds consistently and looks out of place in a dark UI. Takes and emits EXIF
// "YYYY:MM:DD HH:MM:SS", or "YYYY-MM-DD" in dateOnly mode.
export function DateTimeField({
  value,
  onCommit,
  placeholder,
  tone,
  changed,
  dateOnly = false
}: {
  value: string
  onCommit(v: string): void
  placeholder?: string
  tone?: 'error' | 'warning' | null
  changed?: boolean
  dateOnly?: boolean
}): JSX.Element {
  const wrap = useRef<HTMLDivElement>(null)
  const parsed = value ? parseLoose(dateOnly ? value : exifDateToInput(value).replace('T', ' ')) : null
  const [text, setText] = useState(parsed ? toDisplay(parsed, dateOnly) : '')
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const now = new Date()
  const [view, setView] = useState<{ y: number; mo: number }>({ y: parsed?.y ?? now.getFullYear(), mo: parsed?.mo ?? now.getMonth() + 1 })
  const [time, setTime] = useState({ h: parsed?.h ?? 12, mi: parsed?.mi ?? 0, s: parsed?.s ?? 0 })
  const [bad, setBad] = useState(false)

  useEffect(() => {
    if (focused) return
    const p = value ? parseLoose(dateOnly ? value : exifDateToInput(value).replace('T', ' ')) : null
    setText(p ? toDisplay(p, dateOnly) : '')
    setBad(false)
    if (p) {
      setView({ y: p.y, mo: p.mo })
      setTime({ h: p.h, mi: p.mi, s: p.s })
    }
  }, [value, focused, dateOnly])

  const emit = (p: Parts): void => {
    const out = dateOnly ? `${pad(p.y, 4)}-${pad(p.mo)}-${pad(p.d)}` : toExif(p)
    setText(toDisplay(p, dateOnly))
    setBad(false)
    if (out !== value) onCommit(out)
  }

  const commitText = (): void => {
    if (!text.trim()) {
      if (dateOnly && value) onCommit('')
      return
    }
    const p = parseLoose(text)
    if (!p) return setBad(true)
    emit(p)
  }

  const first = new Date(Date.UTC(view.y, view.mo - 1, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(view.y, view.mo, 0)).getUTCDate()
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  const shiftMonth = (d: number): void => {
    const m = view.mo - 1 + d
    setView({ y: view.y + Math.floor(m / 12), mo: ((m % 12) + 12) % 12 + 1 })
  }
  const pick = (d: number): void => {
    emit({ y: view.y, mo: view.mo, d, ...time })
    if (dateOnly) setOpen(false)
  }
  const setT = (k: 'h' | 'mi' | 's', raw: string, max: number): void => {
    const n = Math.max(0, Math.min(max, parseInt(raw.replace(/\D/g, '') || '0', 10)))
    const t = { ...time, [k]: n }
    setTime(t)
    if (parsed) emit({ ...parsed, ...t })
  }

  return (
    <div ref={wrap} className={`datefield ${tone ? `tone-${tone}` : ''} ${bad ? 'tone-error' : ''} ${changed ? 'changed' : ''}`}>
      <input
        value={text}
        placeholder={placeholder ?? (dateOnly ? 'YYYY-MM-DD' : 'YYYY-MM-DD  HH:MM:SS')}
        spellCheck={false}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          commitText()
        }}
        onChange={(e) => {
          setText(e.target.value)
          setBad(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitText()
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      <button type="button" className="icon-btn ghost" onClick={() => setOpen((o) => !o)} title="Pick from calendar">
        <ICalendar size={15} />
      </button>
      <Popover anchor={wrap} open={open} minWidth={272} maxHeight={420} keepFocus={false} align="end">
        <div className="cal" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
          <div className="cal-head">
            <button type="button" className="icon-btn ghost" onClick={() => shiftMonth(-1)}>
              <IChevronLeft size={15} />
            </button>
            <span>
              {MONTHS[view.mo - 1]} <input className="cal-year" value={view.y} onChange={(e) => setView({ ...view, y: parseInt(e.target.value.replace(/\D/g, '') || '0', 10) })} />
            </span>
            <button type="button" className="icon-btn ghost" onClick={() => shiftMonth(1)}>
              <IChevronRight size={15} />
            </button>
          </div>
          <div className="cal-grid">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <span key={d} className="cal-dow">
                {d}
              </span>
            ))}
            {cells.map((d, i) =>
              d === null ? (
                <span key={`e${i}`} />
              ) : (
                <button
                  type="button"
                  key={d}
                  className={`cal-day ${parsed && parsed.y === view.y && parsed.mo === view.mo && parsed.d === d ? 'sel' : ''}`}
                  onClick={() => pick(d)}
                >
                  {d}
                </button>
              )
            )}
          </div>
          {!dateOnly && (
            <div className="cal-time">
              <span>Time</span>
              <input value={pad(time.h)} onChange={(e) => setT('h', e.target.value.slice(-2), 23)} />:
              <input value={pad(time.mi)} onChange={(e) => setT('mi', e.target.value.slice(-2), 59)} />:
              <input value={pad(time.s)} onChange={(e) => setT('s', e.target.value.slice(-2), 59)} />
            </div>
          )}
          <div className="cal-foot">
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => {
                const n = new Date()
                emit({ y: n.getFullYear(), mo: n.getMonth() + 1, d: n.getDate(), h: n.getHours(), mi: n.getMinutes(), s: n.getSeconds() })
                setOpen(false)
              }}
            >
              Now
            </button>
            <button type="button" className="btn sm" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      </Popover>
    </div>
  )
}
