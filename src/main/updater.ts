import { app, type WebContents } from 'electron'
import { autoUpdater } from 'electron-updater'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { UpdateStatus } from '@shared/types'

// Updates come from GitHub Releases (see `publish` in electron-builder.yml).
// macOS can only install updates for signed apps, so there we just say a new
// version exists and link to the release page.

let status: UpdateStatus = { state: 'idle' }
let target: WebContents | null = null
let wired = false

function set(s: UpdateStatus): void {
  status = s
  if (target && !target.isDestroyed()) target.send('updateStatus', s)
}

function unsupportedReason(): string | null {
  if (!app.isPackaged) return 'Updates are only checked in the installed app'
  if (process.platform === 'linux' && !process.env.APPIMAGE) return 'Install updates through your package manager'
  // Only installer builds carry this file; a portable or unpacked copy can't update itself.
  if (!existsSync(join(process.resourcesPath, 'app-update.yml'))) return "This copy wasn't installed with the installer, so it can't update itself"
  return null
}

function wire(): void {
  if (wired) return
  wired = true
  autoUpdater.autoDownload = process.platform !== 'darwin'
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('checking-for-update', () => set({ state: 'checking' }))
  autoUpdater.on('update-not-available', () => set({ state: 'none' }))
  autoUpdater.on('update-available', (info) => set({ state: autoUpdater.autoDownload ? 'downloading' : 'available', version: info.version, percent: 0 } as UpdateStatus))
  autoUpdater.on('download-progress', (p) => {
    if (status.state === 'downloading') set({ ...status, percent: Math.round(p.percent) })
  })
  autoUpdater.on('update-downloaded', (info) => set({ state: 'ready', version: info.version }))
  autoUpdater.on('error', (err) => set({ state: 'error', message: err?.message?.split('\n')[0] ?? String(err) }))
}

export function attachUpdater(wc: WebContents): void {
  target = wc
}

export async function checkForUpdates(): Promise<void> {
  const reason = unsupportedReason()
  if (reason) return set({ state: 'unsupported', reason })
  wire()
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    set({ state: 'error', message: err instanceof Error ? err.message.split('\n')[0] : String(err) })
  }
}

export function installUpdate(): void {
  if (status.state === 'ready') autoUpdater.quitAndInstall()
}

export function updateStatus(): UpdateStatus {
  return status
}
