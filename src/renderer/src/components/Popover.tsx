import type { JSX } from 'react'
import { useLayoutEffect, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  anchor: RefObject<HTMLElement | null>
  open: boolean
  children: ReactNode
  /** Minimum width; defaults to the anchor's width. */
  minWidth?: number
  maxHeight?: number
  align?: 'start' | 'end'
  className?: string
  /** Keep focus in the anchor input when clicking inside (true for list-style popovers). */
  keepFocus?: boolean
}

/**
 * Floating panel rendered into <body> and pinned to an anchor element, so it is
 * never clipped by scrolling sidebars. Flips above the anchor when there's no room below.
 */
export function Popover({
  anchor,
  open,
  children,
  minWidth,
  maxHeight = 340,
  align = 'start',
  className,
  keepFocus = true
}: Props): JSX.Element | null {
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; width: number; maxH: number } | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    const update = (): void => {
      const el = anchor.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const width = Math.max(minWidth ?? 0, r.width)
      const below = window.innerHeight - r.bottom - 12
      const above = r.top - 12
      const flip = below < Math.min(maxHeight, 220) && above > below
      let left = align === 'end' ? r.right - width : r.left
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
      setPos(
        flip
          ? { left, bottom: window.innerHeight - r.top + 4, width, maxH: Math.min(maxHeight, above) }
          : { left, top: r.bottom + 4, width, maxH: Math.min(maxHeight, below) }
      )
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, anchor, minWidth, maxHeight, align])

  if (!open || !pos) return null
  return createPortal(
    <div
      className={`popover ${className ?? ''}`}
      style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxH }}
      onMouseDown={(e) => {
        if (keepFocus && !(e.target as HTMLElement).closest('input')) e.preventDefault()
      }}
    >
      {children}
    </div>,
    document.body
  )
}
