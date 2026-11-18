import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import logo from './assets/logo-dark.png'
import { Browser, gridMetrics } from './components/Browser'
import { Editor } from './components/Editor'
import { IError, IFolder, IX } from './components/Icons'
import { Modals } from './components/Modals'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { applyFilters, sortRecords } from './lib/filter'
import { api, useStore } from './store'

export default function App(): JSX.Element {
  const init = useStore((s) => s.init)
  const folder = useStore((s) => s.folder)
  const records = useStore((s) => s.records)
  const filters = useStore((s) => s.filters)
  const sort = useStore((s) => s.sort)
  const setVisible = useStore((s) => s.setVisible)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    void init()
    const offR = api.onRecords((jobId, recs) => useStore.getState().receiveRecords(jobId, recs))
    const offP = api.onProgress((p) => useStore.getState().setProgress(p))
    return () => {
      offR()
      offP()
    }
  }, [init])

  const visible = useMemo(() => sortRecords(applyFilters(records, filters), sort), [records, filters, sort])
  useEffect(() => setVisible(visible.map((r) => r.path)), [visible, setVisible])

  useKeyboard()

  return (
    <div
      className="app"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (!f) return
        const p = api.pathForFile(f)
        if (p) void useStore.getState().openFolder(/\.[a-z0-9]{2,5}$/i.test(p) ? p.replace(/[\\/][^\\/]+$/, '') : p)
      }}
    >
      <Toolbar visible={visible} />
      <div className="main">
        <Sidebar records={records} />
        <section className="center">{folder ? <Browser list={visible} /> : <Welcome />}</section>
        <Editor />
      </div>
      <StatusBar shown={visible.length} />
      <Modals />
      <Toasts />
      {dragging && (
        <div className="drop-hint">
          <IFolder size={36} />
          <span>Drop a folder to open it</span>
        </div>
      )}
    </div>
  )
}

function Welcome(): JSX.Element {
  const openFolder = useStore((s) => s.openFolder)
  const recent = useStore((s) => s.settings.recentFolders)
  return (
    <div className="welcome">
      <img src={logo} alt="Exify" className="welcome-logo" />
      <p>Batch-edit camera, lens, exposure, date and location metadata for whole folders of photos — JPEG, HEIC, TIFF and RAW.</p>
      <button className="btn primary lg" onClick={() => void openFolder()}>
        <IFolder size={17} /> Open a folder
      </button>
      <span className="muted small">or drop one anywhere in this window</span>
      {recent.length > 0 && (
        <div className="recent">
          <span className="muted small">Recent</span>
          {recent.slice(0, 5).map((f) => (
            <button key={f} className="recent-item" onClick={() => void openFolder(f)}>
              <IFolder size={14} />
              <span>{f}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBar({ shown }: { shown: number }): JSX.Element {
  const total = useStore((s) => s.records.length)
  const selected = useStore((s) => s.selected.size)
  const progress = useStore((s) => s.progress)
  const loading = useStore((s) => s.loading)
  const history = useStore((s) => s.history)
  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0
  const phase = progress?.phase === 'scan' ? 'Scanning folder…' : progress?.phase === 'read' ? 'Reading metadata' : progress?.phase === 'undo' ? 'Undoing' : 'Writing'
  return (
    <footer className="statusbar">
      <span>
        {shown === total ? `${total} photos` : `${shown} of ${total} photos`}
        {selected > 0 && <> · <b>{selected} selected</b></>}
      </span>
      {history.canUndo && <span className="muted">Last change: {history.label}</span>}
      <span className="sb-spacer" />
      {(progress || loading) && (
        <span className="sb-progress">
          <span>
            {phase} {progress?.total ? `${progress.done} / ${progress.total}` : ''}
          </span>
          <span className="bar">
            <span style={{ width: `${progress?.phase === 'scan' ? 100 : pct}%` }} className={progress?.phase === 'scan' ? 'indeterminate' : ''} />
          </span>
        </span>
      )}
    </footer>
  )
}

function Toasts(): JSX.Element {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  const openModal = useStore((s) => s.openModal)
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.kind === 'error' && <IError size={15} />}
          <span>{t.text}</span>
          {t.detail && (
            <button className="link" onClick={() => openModal({ kind: 'errors', results: t.detail! })}>
              Details
            </button>
          )}
          <button className="icon-btn ghost xs" onClick={() => dismiss(t.id)}>
            <IX size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}

function isTyping(): boolean {
  const el = document.activeElement as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

function useKeyboard(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const s = useStore.getState()
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        void s.openFolder()
        return
      }
      if (mod && e.key === 'Enter') {
        e.preventDefault()
        ;(document.activeElement as HTMLElement | null)?.blur()
        setTimeout(() => void useStore.getState().applyDraft(), 0)
        return
      }
      if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        document.getElementById('global-search')?.focus()
        return
      }
      if (e.key === 'F5') {
        e.preventDefault()
        void s.reload()
        return
      }
      if (s.modal || isTyping()) return
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        void s.undo()
      } else if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        s.selectAll()
      } else if (e.key === 'Escape') {
        s.clearSelection()
      } else if (e.key === ' ' && s.focus) {
        e.preventDefault()
        s.openModal({ kind: 'lightbox', path: s.focus })
      } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
        const order = s.visible
        if (!order.length) return
        e.preventDefault()
        const cur = s.focus ? order.indexOf(s.focus) : -1
        const cols = s.settings.view === 'grid' ? gridMetrics.cols : 1
        const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols, Home: -1e9, End: 1e9 }[e.key] ?? 0
        const next = order[Math.max(0, Math.min(order.length - 1, cur < 0 ? 0 : cur + delta))]
        s.select(next, e.shiftKey ? 'range' : 'single')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
