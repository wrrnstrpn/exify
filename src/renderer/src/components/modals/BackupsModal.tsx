import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BackupInfo } from '@shared/types'
import { api, useStore } from '../../store'
import { Shell, useSelection } from '../Shell'

const fmtSize = (b: number): string =>
  b > 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : b >= 1e3 ? `${Math.round(b / 1e3)} KB` : `${b} bytes`

export function BackupsModal(): JSX.Element {
  const selection = useSelection()
  const records = useStore((s) => s.records)
  const restore = useStore((s) => s.restoreBackups)
  const reloadRecords = useStore((s) => s.refreshRecords)
  const toast = useStore((s) => s.toast)
  const busy = useStore((s) => s.busy)
  const [list, setList] = useState<BackupInfo[] | null>(null)
  const [confirm, setConfirm] = useState<'restore' | 'delete' | null>(null)

  const scope = useMemo(() => (selection.length ? selection : records), [selection, records])
  const scopeLabel = selection.length ? `the ${selection.length} selected photo${selection.length === 1 ? '' : 's'}` : 'this folder'

  const refresh = useCallback(() => {
    void api.listBackups(scope.map((r) => r.path)).then(setList)
  }, [scope])
  useEffect(refresh, [refresh])

  const photos = useMemo(() => [...new Set((list ?? []).map((b) => b.path))], [list])
  const total = (list ?? []).reduce((n, b) => n + b.size, 0)

  return (
    <Shell
      title="Backups"
      width={600}
      footer={
        list && list.length > 0 ? (
          confirm ? (
            <>
              <span className="warn-text small">
                {confirm === 'restore'
                  ? `Put the originals back for ${photos.length} photo${photos.length === 1 ? '' : 's'}? Every edit since the backup was made is lost.`
                  : `Delete ${list.length} backup file${list.length === 1 ? '' : 's'}? This can't be undone.`}
              </span>
              <button className="btn ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn danger"
                disabled={busy}
                onClick={async () => {
                  if (confirm === 'restore') await restore(photos)
                  else {
                    const n = await api.deleteBackups(photos)
                    await reloadRecords(photos)
                    toast('success', `Deleted ${n} backup${n === 1 ? '' : 's'}, ${fmtSize(total)} freed`)
                  }
                  setConfirm(null)
                  refresh()
                }}
              >
                {confirm === 'restore' ? 'Restore' : 'Delete'}
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => setConfirm('delete')}>
                Delete backups
              </button>
              <button className="btn primary" onClick={() => setConfirm('restore')}>
                Restore originals
              </button>
            </>
          )
        ) : undefined
      }
    >
      {list === null ? (
        <p className="muted">Looking…</p>
      ) : list.length === 0 ? (
        <p className="muted">No backups for {scopeLabel}. They're made when “Keep backup copies” is on in Settings.</p>
      ) : (
        <>
          <p>
            {photos.length} of {scope.length} photo{scope.length === 1 ? '' : 's'} {photos.length === 1 ? 'has' : 'have'} a backup, taking up {fmtSize(total)}.
          </p>
          <div className="preview-table">
            {list.slice(0, 10).map((b) => (
              <div key={b.backup}>
                <span className="pt-name">{b.backup.split(/[\\/]/).pop()}</span>
                <span className="muted">{fmtSize(b.size)}</span>
              </div>
            ))}
            {list.length > 10 && <div className="muted small">…and {list.length - 10} more</div>}
          </div>
          <p className="muted small">
            A backup is the file as it was before Exify first wrote to it. Restoring swaps it back in; deleting just frees the space.
          </p>
        </>
      )}
    </Shell>
  )
}
