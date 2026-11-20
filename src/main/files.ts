import { existsSync, renameSync, rmSync, statSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import type { BackupInfo, RenameMove, WriteResult } from '@shared/types'
import { forgetFile, movedInCache, readRecord, rememberRename } from './exif'
import { findSidecar, movedSidecarPath } from './sidecar'

type Progress = (done: number, total: number) => void

// Windows and macOS file systems ignore case, so "A.JPG" and "a.jpg" are the same file there.
const key = (p: string): string => (process.platform === 'linux' ? p : p.toLowerCase())

/** Every file that has to travel with a photo: itself, its backup, its sidecar and the sidecar's backup. */
function companions(m: RenameMove): RenameMove[] {
  const out: RenameMove[] = [m]
  if (existsSync(`${m.from}_original`)) out.push({ from: `${m.from}_original`, to: `${m.to}_original` })
  const sidecar = findSidecar(m.from)
  if (sidecar) {
    const to = movedSidecarPath(sidecar, m.from, m.to)
    out.push({ from: sidecar, to })
    if (existsSync(`${sidecar}_original`)) out.push({ from: `${sidecar}_original`, to: `${to}_original` })
  }
  return out
}

let tmpCounter = 0

/**
 * Move a batch of photos. Everything is first moved to a temporary name and
 * only then to its target, so swaps and chains (a→b, b→c) work.
 */
export async function moveFiles(moves: RenameMove[], onProgress?: Progress): Promise<WriteResult[]> {
  const results = new Map<string, WriteResult>()
  const sources = new Set(moves.map((m) => key(m.from)))
  const targets = new Map<string, number>()
  for (const m of moves) targets.set(key(m.to), (targets.get(key(m.to)) ?? 0) + 1)

  const fail = (m: RenameMove, error: string): void => {
    results.set(m.from, { path: m.from, ok: false, error })
  }

  const planned: { move: RenameMove; parts: (RenameMove & { tmp: string })[] }[] = []
  for (const m of moves) {
    if (m.from === m.to) continue
    if (!existsSync(m.from)) fail(m, 'File no longer exists')
    else if ((targets.get(key(m.to)) ?? 0) > 1) fail(m, `Another photo would also be named ${basename(m.to)}`)
    else if (existsSync(m.to) && !sources.has(key(m.to))) fail(m, `${basename(m.to)} already exists`)
    else {
      const parts = companions(m).map((p) => ({ ...p, tmp: join(dirname(p.from), `.exify-move-${process.pid}-${tmpCounter++}`) }))
      planned.push({ move: m, parts })
    }
  }

  // Phase one: out of the way.
  const staged: typeof planned = []
  for (const p of planned) {
    const done: (typeof p.parts)[number][] = []
    try {
      for (const part of p.parts) {
        renameSync(part.from, part.tmp)
        done.push(part)
      }
      staged.push(p)
    } catch (err) {
      for (const part of done.reverse()) tryRename(part.tmp, part.from)
      fail(p.move, errText(err))
    }
  }

  // Phase two: into place.
  const moved: RenameMove[] = []
  let count = 0
  for (const p of staged) {
    const done: (typeof p.parts)[number][] = []
    try {
      for (const part of p.parts) {
        if (existsSync(part.to)) throw new Error(`${basename(part.to)} already exists`)
        renameSync(part.tmp, part.to)
        done.push(part)
      }
      moved.push(p.move)
    } catch (err) {
      for (const part of done.reverse()) tryRename(part.to, part.tmp)
      for (const part of p.parts) tryRename(part.tmp, part.from)
      fail(p.move, errText(err))
    }
    onProgress?.(++count, staged.length)
  }

  movedInCache(moved)
  for (const m of moved) results.set(m.from, { path: m.to, from: m.from, ok: true, record: await readRecord(m.to) })
  return moves.filter((m) => results.has(m.from)).map((m) => results.get(m.from)!)
}

function tryRename(from: string, to: string): void {
  try {
    renameSync(from, to)
  } catch {
    // Nothing sensible left to do; the file keeps its temporary name and the error is reported.
  }
}

function errText(err: unknown): string {
  const e = err as NodeJS.ErrnoException
  if (e?.code === 'EBUSY' || e?.code === 'EPERM') return 'File is open in another program'
  return e instanceof Error ? e.message : String(err)
}

export async function renameFiles(moves: RenameMove[], label: string, onProgress?: Progress): Promise<WriteResult[]> {
  const results = await moveFiles(moves, onProgress)
  const done = results.filter((r) => r.ok && r.from).map((r) => ({ from: r.from!, to: r.path }))
  if (done.length) rememberRename(label, done)
  return results
}

/** Get rid of a file, or park it as a backup if backups are on and there isn't one already. */
export function retireFile(file: string, keepBackup: boolean): void {
  if (keepBackup && !existsSync(`${file}_original`)) renameSync(file, `${file}_original`)
  else rmSync(file, { force: true })
}

export function existingPaths(paths: string[]): string[] {
  return paths.filter((p) => existsSync(p))
}

function backupsOf(path: string): { file: string; backup: string }[] {
  const out: { file: string; backup: string }[] = []
  if (existsSync(`${path}_original`)) out.push({ file: path, backup: `${path}_original` })
  const sidecar = findSidecar(path)
  if (sidecar && existsSync(`${sidecar}_original`)) out.push({ file: sidecar, backup: `${sidecar}_original` })
  return out
}

export function listBackups(paths: string[]): BackupInfo[] {
  const out: BackupInfo[] = []
  for (const path of paths) {
    for (const b of backupsOf(path)) {
      try {
        out.push({ path, backup: b.backup, size: statSync(b.backup).size })
      } catch {
        // Deleted between the check and the stat; skip it.
      }
    }
  }
  return out
}

/** Put the `_original` copies back. History for these files is dropped, since it no longer applies. */
export async function restoreBackups(paths: string[], onProgress?: Progress): Promise<WriteResult[]> {
  const results: WriteResult[] = []
  let n = 0
  for (const path of paths) {
    try {
      const found = backupsOf(path)
      if (!found.length) throw new Error('No backup found')
      for (const b of found) renameSync(b.backup, b.file)
      forgetFile(path)
      results.push({ path, ok: true, record: await readRecord(path) })
    } catch (err) {
      results.push({ path, ok: false, error: errText(err), record: await readRecord(path) })
    }
    onProgress?.(++n, paths.length)
  }
  return results
}

export function deleteBackups(paths: string[]): number {
  let n = 0
  for (const path of paths) {
    for (const b of backupsOf(path)) {
      try {
        rmSync(b.backup)
        n++
      } catch {
        // Locked or already gone; it will show up again next time.
      }
    }
  }
  return n
}
