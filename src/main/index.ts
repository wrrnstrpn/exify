import { app, BrowserWindow, dialog, ipcMain, Menu, session, shell, type WebContents } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
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
import { deleteBackups, existingPaths, listBackups, renameFiles, restoreBackups } from './files'
import { scanFolder } from './scan'
import { getPresets, getSettings, savePresets, setSettings } from './store'
import { cleanupThumbs, registerProtocolHandler, registerSchemePrivileges } from './thumbs'
import { attachUpdater, checkForUpdates, installUpdate, updateStatus } from './updater'
import type { FileEdit, Preset, ProgressEvent, RenameMove, Settings, TextFile } from '@shared/types'

registerSchemePrivileges()

let win: BrowserWindow | null = null
let currentJob = 0
const isMac = process.platform === 'darwin'

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
    // macOS keeps its traffic lights; Windows and Linux get overlay buttons drawn over our toolbar.
    ...(isMac ? { trafficLightPosition: { x: 16, y: 16 } } : { titleBarOverlay: { color: '#00000000', symbolColor: '#c9cbd3', height: 48 } }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true
    }
  })
  win.once('ready-to-show', () => win?.show())
  attachUpdater(win.webContents)
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
  configureWrites({ keepBackups: s.keepBackups, preserveFileDates: s.preserveFileDates, rawSidecars: s.rawSidecars })
}

const writeProgress = (wc: WebContents, phase: ProgressEvent['phase'] = 'write') => (done: number, total: number) =>
  progress(wc, { jobId: 0, phase, done, total })

const BOM = String.fromCharCode(0xfeff)
const stripBom = (s: string): string => (s.startsWith(BOM) ? s.slice(1) : s)

const FILE_FILTERS = {
  csv: [{ name: 'CSV or text', extensions: ['csv', 'tsv', 'txt'] }],
  gpx: [{ name: 'GPS track', extensions: ['gpx'] }]
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

  ipcMain.handle('write', (e, edits: FileEdit[], label: string) => writeEdits(edits, label, writeProgress(e.sender)))
  ipcMain.handle('stripMetadata', (e, paths: string[]) => stripMetadata(paths, writeProgress(e.sender)))
  ipcMain.handle('undo', (e) => undo(writeProgress(e.sender, 'undo')))
  ipcMain.handle('historyInfo', () => historyInfo())
  ipcMain.handle('rename', (e, moves: RenameMove[], label: string) => renameFiles(moves, label, writeProgress(e.sender, 'rename')))
  ipcMain.handle('existingPaths', (_e, paths: string[]) => existingPaths(paths))

  ipcMain.handle('listBackups', (_e, paths: string[]) => listBackups(paths))
  ipcMain.handle('restoreBackups', (e, paths: string[]) => restoreBackups(paths, writeProgress(e.sender)))
  ipcMain.handle('deleteBackups', (_e, paths: string[]) => deleteBackups(paths))

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
    // The BOM makes Excel open the file as UTF-8.
    await writeFile(r.filePath, BOM + content, 'utf8')
    return true
  })
  ipcMain.handle('openTextFiles', async (_e, kind: keyof typeof FILE_FILTERS, multiple: boolean): Promise<TextFile[]> => {
    const r = await dialog.showOpenDialog(win!, {
      properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'],
      filters: FILE_FILTERS[kind]
    })
    if (r.canceled) return []
    return Promise.all(r.filePaths.map(async (path) => ({ path, name: basename(path), content: stripBom(await readFile(path, 'utf8')) })))
  })

  ipcMain.handle('appVersion', () => app.getVersion())
  ipcMain.handle('checkForUpdates', () => checkForUpdates())
  ipcMain.handle('installUpdate', () => installUpdate())
  ipcMain.handle('updateStatus', () => updateStatus())
}

// The OpenStreetMap tile servers ask every app to identify itself.
function identifyToTileServers(): void {
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['https://tile.openstreetmap.org/*'] }, (details, cb) => {
    details.requestHeaders['User-Agent'] = `Exify/${app.getVersion()} (+https://github.com/wrrnstrpn/exify)`
    details.requestHeaders.Referer = 'https://github.com/wrrnstrpn/exify'
    cb({ requestHeaders: details.requestHeaders })
  })
}

// Without an Edit menu, copy and paste don't work in text fields on macOS.
function setMenu(): void {
  if (!isMac) {
    Menu.setApplicationMenu(null)
    return
  }
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }])
  )
}

app.whenReady().then(() => {
  app.setAppUserModelId('app.exify.desktop')
  applyWriteSettings(getSettings())
  registerProtocolHandler()
  registerIpc()
  identifyToTileServers()
  setMenu()
  createWindow()
  if (getSettings().autoUpdate) setTimeout(() => void checkForUpdates(), 8000)
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
