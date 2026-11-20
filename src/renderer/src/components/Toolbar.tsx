import type { JSX } from 'react'
import { useRef, useState } from 'react'
import { FIELDS } from '@shared/fields'
import mark from '../assets/mark.svg'
import { api, useStore } from '../store'
import { Segmented } from './Controls'
import {
  IArchive,
  ICalendar,
  ICompare,
  IChevronDown,
  IDownload,
  IFolder,
  IGrid,
  IList,
  IMap,
  IMore,
  IPin,
  IRefresh,
  IRename,
  IRoute,
  ISearch,
  ISettings,
  ITrash,
  IUndo,
  IUpload,
  IX
} from './Icons'
import { Popover } from './Popover'
import type { PhotoRecord } from '@shared/types'

export function Toolbar({ visible }: { visible: PhotoRecord[] }): JSX.Element {
  const folder = useStore((s) => s.folder)
  const settings = useStore((s) => s.settings)
  const filters = useStore((s) => s.filters)
  const history = useStore((s) => s.history)
  const busy = useStore((s) => s.busy)
  const selectedCount = useStore((s) => s.selected.size)
  const openFolder = useStore((s) => s.openFolder)
  const reload = useStore((s) => s.reload)
  const setFilters = useStore((s) => s.setFilters)
  const updateSettings = useStore((s) => s.updateSettings)
  const undo = useStore((s) => s.undo)
  const openModal = useStore((s) => s.openModal)
  const setDraft = useStore((s) => s.setDraft)
  const toast = useStore((s) => s.toast)

  const recentRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const [recentOpen, setRecentOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const exportCsv = async (): Promise<void> => {
    const cols = FIELDS.map((f) => f.key)
    const esc = (v: unknown): string => {
      const s = v == null ? '' : Array.isArray(v) ? v.join('; ') : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines = [['File', 'Folder', ...cols].join(',')]
    for (const r of visible) lines.push([r.name, r.rel, ...cols.map((c) => r.fields[c])].map(esc).join(','))
    const ok = await api.saveTextFile('exify-metadata.csv', lines.join('\r\n'))
    if (ok) toast('success', `Exported ${visible.length} rows`)
  }

  const folderName = folder ? folder.split(/[\\/]/).filter(Boolean).pop() : null

  return (
    <header className="toolbar">
      <div className="brand">
        <img src={mark} alt="" />
        <span>Exify</span>
      </div>

      <div className="tb-group no-drag" ref={recentRef}>
        <button className="btn primary sm" onClick={() => void openFolder()} title="Open folder (Ctrl+O)">
          <IFolder size={15} /> Open folder
        </button>
        {settings.recentFolders.length > 0 && (
          <button className="btn sm square" onClick={() => setRecentOpen((o) => !o)} onBlur={() => setRecentOpen(false)} title="Recent folders">
            <IChevronDown size={14} />
          </button>
        )}
        <Popover anchor={recentRef} open={recentOpen} minWidth={340}>
          <div className="menu">
            <div className="combo-group">Recent folders</div>
            {settings.recentFolders.map((f) => (
              <button
                key={f}
                className="menu-item"
                onClick={() => {
                  setRecentOpen(false)
                  void openFolder(f)
                }}
              >
                <IFolder size={14} />
                <span className="menu-label">{f.split(/[\\/]/).filter(Boolean).pop()}</span>
                <span className="menu-hint">{f}</span>
              </button>
            ))}
          </div>
        </Popover>
      </div>

      {folder && (
        <div className="folder-chip no-drag" title={folder}>
          <span>{folderName}</span>
          <button className="icon-btn ghost xs" onClick={() => void reload()} title="Rescan folder (F5)">
            <IRefresh size={13} />
          </button>
        </div>
      )}

      <div className="tb-spacer" />

      <div className="search no-drag">
        <ISearch size={14} />
        <input
          id="global-search"
          value={filters.text}
          placeholder="Search name, camera, lens, keywords…"
          onChange={(e) => setFilters({ text: e.target.value })}
          spellCheck={false}
        />
        {filters.text && (
          <button className="icon-btn ghost xs" onClick={() => setFilters({ text: '' })}>
            <IX size={12} />
          </button>
        )}
      </div>

      <div className="no-drag">
        <Segmented
          value={settings.view}
          onChange={(v) => void updateSettings({ view: v })}
          options={[
            { value: 'grid', label: <IGrid size={15} />, title: 'Grid' },
            { value: 'list', label: <IList size={15} />, title: 'List' }
          ]}
        />
      </div>

      {settings.view === 'grid' && (
        <input
          className="slider no-drag"
          type="range"
          min={110}
          max={320}
          step={10}
          value={settings.thumbSize}
          onChange={(e) => void updateSettings({ thumbSize: Number(e.target.value) })}
          title="Thumbnail size"
        />
      )}

      <button className="btn ghost sm no-drag" disabled={!history.canUndo || busy} onClick={() => void undo()} title={history.label ? `Undo: ${history.label} (Ctrl+Z)` : 'Nothing to undo'}>
        <IUndo size={15} /> Undo
      </button>

      <div className="no-drag" ref={moreRef}>
        <button className="icon-btn" onClick={() => setMoreOpen((o) => !o)} onBlur={() => setMoreOpen(false)} title="Batch tools">
          <IMore size={16} />
        </button>
        <Popover anchor={moreRef} open={moreOpen} minWidth={280} maxHeight={560} align="end">
          <div className="menu" onClick={() => setMoreOpen(false)}>
            <div className="combo-group">Selected photos ({selectedCount})</div>
            <button className="menu-item" disabled={!selectedCount} onClick={() => openModal({ kind: 'rename' })}>
              <IRename size={14} /> <span className="menu-label">Rename files…</span>
              <span className="menu-hint">F2</span>
            </button>
            <button className="menu-item" disabled={!selectedCount} onClick={() => openModal({ kind: 'dates' })}>
              <ICalendar size={14} /> <span className="menu-label">Shift, sequence or zone dates…</span>
            </button>
            <button className="menu-item" disabled={!selectedCount} onClick={() => openModal({ kind: 'geotag' })}>
              <IRoute size={14} /> <span className="menu-label">Geotag from GPX track…</span>
            </button>
            <button className="menu-item" disabled={selectedCount < 2} onClick={() => openModal({ kind: 'compare' })}>
              <ICompare size={14} /> <span className="menu-label">Compare</span>
            </button>
            <button className="menu-item" disabled={!selectedCount} onClick={() => setDraft({ GPSLatitude: null, GPSLongitude: null, GPSAltitude: null })}>
              <IPin size={14} /> <span className="menu-label">Remove location</span>
            </button>
            <button className="menu-item danger" disabled={!selectedCount} onClick={() => openModal({ kind: 'strip' })}>
              <ITrash size={14} /> <span className="menu-label">Strip all metadata…</span>
            </button>
            <div className="combo-group">{selectedCount ? 'Selected, or everything shown' : 'Everything shown'}</div>
            <button className="menu-item" disabled={!visible.length} onClick={() => openModal({ kind: 'import' })}>
              <IUpload size={14} /> <span className="menu-label">Import CSV or shooting log…</span>
            </button>
            <button className="menu-item" disabled={!visible.length} onClick={() => void exportCsv()}>
              <IDownload size={14} /> <span className="menu-label">Export visible as CSV</span>
            </button>
            <button className="menu-item" disabled={!visible.length} onClick={() => openModal({ kind: 'map' })}>
              <IMap size={14} /> <span className="menu-label">Map</span>
            </button>
            <button className="menu-item" disabled={!visible.length} onClick={() => openModal({ kind: 'backups' })}>
              <IArchive size={14} /> <span className="menu-label">Backups…</span>
            </button>
          </div>
        </Popover>
      </div>

      <button className="icon-btn no-drag" onClick={() => openModal({ kind: 'settings' })} title="Settings">
        <ISettings size={16} />
      </button>
    </header>
  )
}
