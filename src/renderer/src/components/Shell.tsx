import type { JSX } from 'react'
import { useEffect, useMemo, type ReactNode } from 'react'
import type { PhotoRecord } from '@shared/types'
import { api, selectedRecords, useStore } from '../store'
import { IX } from './Icons'

export function Shell({ title, children, footer, width = 520, onClose }: { title: ReactNode; children: ReactNode; footer?: ReactNode; width?: number; onClose?(): void }): JSX.Element {
  const openModal = useStore((s) => s.openModal)
  const close = onClose ?? (() => openModal(null))
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal" style={{ width }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn ghost" onClick={close}>
            <IX size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function useSelection(): PhotoRecord[] {
  const selected = useStore((s) => s.selected)
  const records = useStore((s) => s.records)
  const index = useStore((s) => s.index)
  const visible = useStore((s) => s.visible)
  // In on-screen order, so "sequence" follows what the user sees.
  return useMemo(() => {
    const sel = selectedRecords({ selected, records, index })
    const pos = new Map(visible.map((p, i) => [p, i]))
    return sel.sort((a, b) => (pos.get(a.path) ?? 1e9) - (pos.get(b.path) ?? 1e9))
  }, [selected, records, index, visible])
}

export const fmtDate = (s: string | undefined | null): string => (s ? s.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3') : '—')

export const revealLabel = api.platform === 'darwin' ? 'Show in Finder' : api.platform === 'win32' ? 'Show in Explorer' : 'Show in folder'
