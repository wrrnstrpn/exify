import type { JSX } from 'react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Option } from '../lib/options'
import { ICheck, IChevronDown, IWarn } from './Icons'
import { Popover } from './Popover'

interface Props {
  value: string
  options: Option[] | (() => Option[])
  onCommit(value: string, option?: Option): void
  placeholder?: string
  /** Free text allowed (combobox). False = pick from list only (select). */
  allowCustom?: boolean
  /** Typing filters the list. False = plain select that opens on click. */
  searchable?: boolean
  tone?: 'error' | 'warning' | null
  changed?: boolean
  disabled?: boolean
  maxItems?: number
  className?: string
  leading?: ReactNode
  popoverWidth?: number
  inputMode?: 'text' | 'decimal' | 'numeric'
  /** Format the committed value for display (e.g. ƒ/ prefix for selects). */
  display?: (value: string) => string
  /**
   * Commit typed text when focus leaves. Turn off for catalog pickers, where the
   * text is usually a search query; custom values then need an explicit Enter.
   */
  commitOnBlur?: boolean
}

function matches(o: Option, tokens: string[]): boolean {
  if (!tokens.length) return true
  const hay = `${o.label} ${o.value} ${o.hint ?? ''} ${o.group ?? ''}`.toLowerCase()
  return tokens.every((t) => hay.includes(t))
}

/**
 * The one dropdown used everywhere in Exify: a searchable, keyboard-driven
 * list with group headers, hints and per-option mismatch warnings.
 */
export function Combobox({
  value,
  options,
  onCommit,
  placeholder,
  allowCustom = true,
  searchable = true,
  tone,
  changed,
  disabled,
  maxItems = 300,
  className,
  leading,
  popoverWidth,
  inputMode = 'text',
  display,
  commitOnBlur = true
}: Props): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(value)
  const [dirty, setDirty] = useState(false)
  const [hi, setHi] = useState(0)

  const all = useMemo(() => (open ? (typeof options === 'function' ? options() : options) : []), [open, options])

  const selectedOpt = useMemo(() => {
    if (searchable) return undefined
    const list = typeof options === 'function' ? options() : options
    return list.find((o) => o.value === value)
  }, [searchable, options, value])

  const tokens = searchable && dirty ? text.toLowerCase().split(/\s+/).filter(Boolean) : []
  const filtered = useMemo(() => all.filter((o) => matches(o, tokens)), [all, tokens.join(' ')]) // eslint-disable-line react-hooks/exhaustive-deps
  const shown = filtered.slice(0, maxItems)

  useEffect(() => {
    if (!focused) setText(value)
  }, [value, focused])

  useEffect(() => {
    if (!open) return
    const i = dirty ? 0 : Math.max(0, shown.findIndex((o) => o.value === value))
    setHi(i)
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' }))
  }, [open, dirty]) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (o: Option): void => {
    setOpen(false)
    setDirty(false)
    setText(o.value)
    onCommit(o.value, o)
    if (!searchable) inputRef.current?.blur()
  }

  const commitText = (): void => {
    if (dirty && allowCustom && text.trim() !== value) onCommit(text.trim())
    setDirty(false)
  }

  const move = (d: number): void => {
    if (!open) return setOpen(true)
    const n = Math.max(0, Math.min(shown.length - 1, hi + d))
    setHi(n)
    listRef.current?.querySelector(`[data-i="${n}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      move(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    } else if (e.key === 'PageDown') {
      e.preventDefault()
      move(10)
    } else if (e.key === 'PageUp') {
      e.preventDefault()
      move(-10)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && shown[hi] && (dirty || !allowCustom || !searchable)) choose(shown[hi])
      else {
        commitText()
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.stopPropagation()
        setOpen(false)
      }
      setText(value)
      setDirty(false)
    } else if (e.key === ' ' && !searchable) {
      e.preventDefault()
      setOpen((o) => !o)
    }
  }

  const shownText = focused && searchable ? text : display ? (value ? display(value) : '') : selectedOpt?.label ?? value

  let lastGroup: string | undefined
  return (
    <div
      ref={wrapRef}
      className={`combo ${tone ? `tone-${tone}` : ''} ${changed ? 'changed' : ''} ${open ? 'open' : ''} ${disabled ? 'disabled' : ''} ${
        searchable ? '' : 'is-select'
      } ${className ?? ''}`}
      onMouseDown={(e) => {
        // Events from the portalled list bubble here through the React tree; ignore them.
        if (disabled || !wrapRef.current?.contains(e.target as Node)) return
        if (e.target !== inputRef.current) e.preventDefault()
        inputRef.current?.focus()
        setOpen((o) => (searchable ? true : !o))
      }}
    >
      {leading}
      <input
        ref={inputRef}
        value={shownText}
        placeholder={placeholder}
        readOnly={!searchable}
        disabled={disabled}
        inputMode={inputMode}
        spellCheck={false}
        onFocus={(e) => {
          setFocused(true)
          setText(value)
          if (searchable) e.currentTarget.select()
        }}
        onBlur={() => {
          setFocused(false)
          if (commitOnBlur) commitText()
          else setDirty(false)
          setOpen(false)
        }}
        onChange={(e) => {
          setText(e.target.value)
          setDirty(true)
          setOpen(true)
          setHi(0)
        }}
        onKeyDown={onKey}
      />
      <IChevronDown className="combo-caret" size={14} />
      <Popover anchor={wrapRef} open={open} minWidth={popoverWidth ?? 260}>
        <div className="combo-list" ref={listRef} role="listbox">
          {shown.length === 0 && (
            <div className="combo-empty">{allowCustom && text.trim() ? <>Press Enter to use “{text.trim()}”</> : 'No matches'}</div>
          )}
          {shown.map((o, i) => {
            const header = o.group && o.group !== lastGroup ? o.group : null
            lastGroup = o.group
            return (
              <div key={`${o.group ?? ''}|${o.value}|${i}`}>
                {header && <div className="combo-group">{header}</div>}
                <div
                  data-i={i}
                  role="option"
                  aria-selected={o.value === value}
                  className={`combo-item ${i === hi ? 'hi' : ''} ${o.value === value ? 'sel' : ''} ${o.issue ? 'flagged' : ''}`}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => choose(o)}
                  title={o.issue}
                >
                  <span className="combo-check">{o.value === value && <ICheck size={13} />}</span>
                  <span className="combo-label">{o.label}</span>
                  {o.hint && <span className="combo-hint">{o.hint}</span>}
                  {o.issue && (
                    <span className="combo-issue" title={o.issue}>
                      <IWarn size={13} />
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length > shown.length && (
            <div className="combo-more">
              Showing {shown.length} of {filtered.length} — keep typing to narrow down
            </div>
          )}
        </div>
      </Popover>
    </div>
  )
}

/** Pick-one dropdown with the same look and keyboard behaviour as Combobox. */
export function Select(props: Omit<Props, 'allowCustom' | 'searchable'> & { searchable?: boolean }): JSX.Element {
  return <Combobox {...props} allowCustom={false} searchable={props.searchable ?? false} />
}
