import { app } from 'electron'
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_SETTINGS, type Preset, type Settings } from '@shared/types'

const dir = (): string => app.getPath('userData')

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(dir(), file), 'utf8')) as T
  } catch {
    return fallback
  }
}

function writeJson(file: string, data: unknown): void {
  mkdirSync(dir(), { recursive: true })
  const target = join(dir(), file)
  const tmp = `${target}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, target)
}

let settings: Settings | null = null

export function getSettings(): Settings {
  if (!settings) settings = { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>('settings.json', {}) }
  return settings
}

export function setSettings(patch: Partial<Settings>): Settings {
  settings = { ...getSettings(), ...patch }
  writeJson('settings.json', settings)
  return settings
}

export function getPresets(): Preset[] {
  return readJson<Preset[]>('presets.json', [])
}

export function savePresets(presets: Preset[]): void {
  writeJson('presets.json', presets)
}
