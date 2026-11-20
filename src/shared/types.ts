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
  /** XMP sidecar the fields were partly read from (RAW files only). */
  sidecar?: string
  /** A `name.ext_original` backup sits next to the file. */
  hasBackup?: boolean
  error?: string
}

export interface FileEdit {
  path: string
  set: FieldMap
}

export interface WriteResult {
  path: string
  /** Set when the file was renamed: the path it had before. */
  from?: string
  ok: boolean
  error?: string
  record?: PhotoRecord
}

export interface RenameMove {
  from: string
  to: string
}

export interface BackupInfo {
  path: string
  backup: string
  size: number
}

export interface Settings {
  recursive: boolean
  keepBackups: boolean
  preserveFileDates: boolean
  /** Write RAW edits to an .xmp sidecar instead of into the RAW file. */
  rawSidecars: boolean
  autoUpdate: boolean
  thumbSize: number
  view: 'grid' | 'list'
  recentFolders: string[]
  customCameras: { make: string; model: string }[]
  customLenses: { make: string; model: string }[]
  renamePattern: string
}

export const DEFAULT_SETTINGS: Settings = {
  recursive: true,
  keepBackups: true,
  preserveFileDates: true,
  rawSidecars: true,
  autoUpdate: true,
  thumbSize: 168,
  view: 'grid',
  recentFolders: [],
  customCameras: [],
  customLenses: [],
  renamePattern: '{YYYY}-{MM}-{DD}_{hh}{mm}{ss}_{camera}'
}

export interface Preset {
  id: string
  name: string
  fields: FieldMap
}

export interface ProgressEvent {
  jobId: number
  phase: 'scan' | 'read' | 'write' | 'undo' | 'rename'
  done: number
  total: number
}

export interface HistoryInfo {
  canUndo: boolean
  label?: string
  count: number
}

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'none' }
  | { state: 'available'; version: string }
  | { state: 'downloading'; version: string; percent: number }
  | { state: 'ready'; version: string }
  | { state: 'error'; message: string }
  | { state: 'unsupported'; reason: string }

export interface TextFile {
  path: string
  name: string
  content: string
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
  openTextFiles(kind: 'csv' | 'gpx', multiple: boolean): Promise<TextFile[]>
  rename(moves: RenameMove[], label: string): Promise<WriteResult[]>
  existingPaths(paths: string[]): Promise<string[]>
  listBackups(paths: string[]): Promise<BackupInfo[]>
  restoreBackups(paths: string[]): Promise<WriteResult[]>
  deleteBackups(paths: string[]): Promise<number>
  platform: string
  appVersion(): Promise<string>
  checkForUpdates(): Promise<void>
  installUpdate(): Promise<void>
  onUpdateStatus(cb: (s: UpdateStatus) => void): () => void
  thumbUrl(path: string, size: number, version?: number): string
  previewUrl(path: string, version?: number): string
  pathForFile(file: File): string
}
