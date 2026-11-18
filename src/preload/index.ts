import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { ExifyApi, PhotoRecord, ProgressEvent } from '@shared/types'

const enc = encodeURIComponent

const api: ExifyApi = {
  openFolderDialog: () => ipcRenderer.invoke('openFolderDialog'),
  loadFolder: (folder, recursive) => ipcRenderer.invoke('loadFolder', folder, recursive),
  cancelLoad: () => ipcRenderer.invoke('cancelLoad'),
  onRecords: (cb) => {
    const h = (_e: unknown, jobId: number, records: PhotoRecord[]): void => cb(jobId, records)
    ipcRenderer.on('records', h)
    return () => ipcRenderer.removeListener('records', h)
  },
  onProgress: (cb) => {
    const h = (_e: unknown, p: ProgressEvent): void => cb(p)
    ipcRenderer.on('progress', h)
    return () => ipcRenderer.removeListener('progress', h)
  },
  readRecords: (paths) => ipcRenderer.invoke('readRecords', paths),
  readAllTags: (path) => ipcRenderer.invoke('readAllTags', path),
  write: (edits, label) => ipcRenderer.invoke('write', edits, label),
  stripMetadata: (paths) => ipcRenderer.invoke('stripMetadata', paths),
  undo: () => ipcRenderer.invoke('undo'),
  historyInfo: () => ipcRenderer.invoke('historyInfo'),
  getSettings: () => ipcRenderer.invoke('getSettings'),
  setSettings: (patch) => ipcRenderer.invoke('setSettings', patch),
  getPresets: () => ipcRenderer.invoke('getPresets'),
  savePresets: (presets) => ipcRenderer.invoke('savePresets', presets),
  showInFolder: (path) => ipcRenderer.invoke('showInFolder', path),
  saveTextFile: (name, content) => ipcRenderer.invoke('saveTextFile', name, content),
  thumbUrl: (path, size, version = 0) => `exify://thumb/?p=${enc(path)}&s=${size}&v=${version}`,
  previewUrl: (path, version = 0) => `exify://preview/?p=${enc(path)}&v=${version}`,
  pathForFile: (file) => webUtils.getPathForFile(file)
}

contextBridge.exposeInMainWorld('exify', api)
