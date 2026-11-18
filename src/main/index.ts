import { app, BrowserWindow, dialog, ipcMain, shell, type WebContents } from 'electron'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import icon from '../../resources/icon.png?asset'
import {
  configureWrites,
  historyInfo,
  readAllTags,
  readRecord,
  runPool,
  setRoot,
  shutdownExiftool,
  stripMetadata,
  undo,
  writeEdits
} from './exif'
import { scanFolder } from './scan'
import { getPresets, getSettings, savePresets, setSettings } from './store'
import { cleanupThumbs, registerProtocolHandler, registerSchemePrivileges } from './thumbs'
import type { FileEdit, Preset, ProgressEvent, Settings } from '@shared/types'

registerSchemePrivileges()

let win: BrowserWindow | null = null
let currentJob = 0

function createWindow(): void {
  win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 980,
    minHeight: 620,
    show: false,
    backgroundColor: '#0f1013',
    icon,
    title: 'Exify',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#00000000', symbolColor: '#c9cbd3', height: 48 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })
  win.once('ready-to-show', () => win?.show())
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })
  if (process.env.ELECTRON_RENDERER_URL) void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  else void win.loadFile(join(__dirname, '../renderer/index.html'))
}

function send(wc: WebContents, channel: string, ...args: unknown[]): void {
  if (!wc.isDestroyed()) wc.send(channel, ...args)
}

function progress(wc: WebContents, p: ProgressEvent): void {
  send(wc, 'progress', p)
}

function applyWriteSettings(s: Settings): void {
  configureWrites({ keepBackups: s.keepBackups, preserveFileDates: s.preserveFileDates })
}

function registerIpc(): void {
  ipcMain.handle('openFolderDialog', async () => {
    const r = await dialog.showOpenDialog(win!, { properties: ['openDirectory'], title: 'Open photo folder' })
    return r.canceled ? null : r.filePaths[0]
  })

  ipcMain.handle('loadFolder', async (e, folder: string, recursive: boolean) => {
    const jobId = ++currentJob
    const wc = e.sender
    setRoot(folder)
    progress(wc, { jobId, phase: 'scan', done: 0, total: 0 })
    const paths = await scanFolder(folder, recursive)

    const s = getSettings()
    setSettings({ recentFolders: [folder, ...s.recentFolders.filter((f) => f !== folder)].slice(0, 10) })

    void (async () => {
      const BATCH = 48
      let done = 0
      for (let i = 0; i < paths.length; i += BATCH) {
        if (jobId !== currentJob) return
        const chunk = paths.slice(i, i + BATCH)
        const records = await Promise.all(chunk.map((p) => readRecord(p)))
        if (jobId !== currentJob) return
        done += chunk.length
        send(wc, 'records', jobId, records)
        progress(wc, { jobId, phase: 'read', done, total: paths.length })
      }
      if (!paths.length) progress(wc, { jobId, phase: 'read', done: 0, total: 0 })
    })()
    return { jobId, total: paths.length }
  })

  ipcMain.handle('cancelLoad', () => {
    currentJob++
  })

  ipcMain.handle('readRecords', (_e, paths: string[]) => runPool(paths, 16, (p) => readRecord(p)))
  ipcMain.handle('readAllTags', (_e, path: string) => readAllTags(path))

  ipcMain.handle('write', (e, edits: FileEdit[], label: string) =>
    writeEdits(edits, label, (done, total) => progress(e.sender, { jobId: 0, phase: 'write', done, total }))
  )
  ipcMain.handle('stripMetadata', (e, paths: string[]) =>
    stripMetadata(paths, (done, total) => progress(e.sender, { jobId: 0, phase: 'write', done, total }))
  )
  ipcMain.handle('undo', (e) => undo((done, total) => progress(e.sender, { jobId: 0, phase: 'undo', done, total })))
  ipcMain.handle('historyInfo', () => historyInfo())

  ipcMain.handle('getSettings', () => getSettings())
  ipcMain.handle('setSettings', (_e, patch: Partial<Settings>) => {
    const s = setSettings(patch)
    applyWriteSettings(s)
    return s
  })
  ipcMain.handle('getPresets', () => getPresets())
  ipcMain.handle('savePresets', (_e, presets: Preset[]) => savePresets(presets))

  ipcMain.handle('showInFolder', (_e, path: string) => shell.showItemInFolder(path))
  ipcMain.handle('saveTextFile', async (_e, defaultName: string, content: string) => {
    const r = await dialog.showSaveDialog(win!, {
      defaultPath: defaultName,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (r.canceled || !r.filePath) return false
    await writeFile(r.filePath, '﻿' + content, 'utf8')
    return true
  })
}

app.whenReady().then(() => {
  app.setAppUserModelId('app.exify.desktop')
  applyWriteSettings(getSettings())
  registerProtocolHandler()
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

let quitting = false
app.on('before-quit', (e) => {
  if (quitting) return
  quitting = true
  e.preventDefault()
  cleanupThumbs()
  shutdownExiftool().finally(() => app.quit())
})
