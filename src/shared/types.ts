import type { FieldMap } from './fields'

export interface PhotoRecord {
  path: string
  name: string
  /** Folder path relative to the opened root ('' for the root itself). */
  rel: string
  ext: string
  fileType?: string
  fileSize?: number
  width?: number
  height?: number
  fileModifyDate?: string
  fields: FieldMap
  error?: string
}

export interface FileEdit {
  path: string
  set: FieldMap
}

export interface WriteResult {
  path: string
  ok: boolean
  error?: string
  record?: PhotoRecord
}

export interface Settings {
  recursive: boolean
  keepBackups: boolean
  preserveFileDates: boolean
  thumbSize: number
  view: 'grid' | 'list'
  recentFolders: string[]
  customCameras: { make: string; model: string }[]
  customLenses: { make: string; model: string }[]
  /** Fields the editor shows; empty = all. */
  hiddenGroups: string[]
}

export const DEFAULT_SETTINGS: Settings = {
  recursive: true,
  keepBackups: false,
  preserveFileDates: true,
  thumbSize: 168,
  view: 'grid',
  recentFolders: [],
  customCameras: [],
  customLenses: [],
  hiddenGroups: []
}

export interface Preset {
  id: string
  name: string
  fields: FieldMap
}

export interface ProgressEvent {
  jobId: number
  phase: 'scan' | 'read' | 'write' | 'undo'
  done: number
  total: number
}

export interface HistoryInfo {
  canUndo: boolean
  label?: string
  count: number
}

export interface ExifyApi {
  openFolderDialog(): Promise<string | null>
  loadFolder(folder: string, recursive: boolean): Promise<{ jobId: number; total: number }>
  cancelLoad(): Promise<void>
  onRecords(cb: (jobId: number, records: PhotoRecord[]) => void): () => void
  onProgress(cb: (p: ProgressEvent) => void): () => void
  readRecords(paths: string[]): Promise<PhotoRecord[]>
  readAllTags(path: string): Promise<Record<string, unknown>>
  write(edits: FileEdit[], label: string): Promise<WriteResult[]>
  stripMetadata(paths: string[]): Promise<WriteResult[]>
  undo(): Promise<WriteResult[]>
  historyInfo(): Promise<HistoryInfo>
  getSettings(): Promise<Settings>
  setSettings(patch: Partial<Settings>): Promise<Settings>
  getPresets(): Promise<Preset[]>
  savePresets(presets: Preset[]): Promise<void>
  showInFolder(path: string): Promise<void>
  saveTextFile(defaultName: string, content: string): Promise<boolean>
  thumbUrl(path: string, size: number, version?: number): string
  previewUrl(path: string, version?: number): string
  pathForFile(file: File): string
}
