import { formatExposure } from '@shared/fields'
import type { PhotoRecord, Settings } from '@shared/types'
import { CAMERAS, CAMERA_MAKES, MOUNTS, findCamera, sameMake, type CameraModel } from '../data/cameras'
import { LENSES, LENS_MAKES, findLens, isPrime, parseLensSpecs } from '../data/lenses'
import { maxApertureAt, mountProblem } from './validate'

export interface Option {
  value: string
  label: string
  /** Secondary text shown right-aligned / under the label. */
  hint?: string
  group?: string
  /** Shown as a warning marker next to the option. */
  issue?: string
  /** Free-form payload (e.g. the camera/lens entry). */
  data?: unknown
}

export interface Context {
  make?: string
  model?: string
  lens?: string
  focal?: number
}

function folderValues(records: PhotoRecord[], key: 'Make' | 'Model' | 'LensModel' | 'LensMake' | 'Artist' | 'Copyright'): string[] {
  const s = new Set<string>()
  for (const r of records) {
    const v = r.fields[key]
    if (typeof v === 'string' && v) s.add(v)
  }
  return [...s].sort((a, b) => a.localeCompare(b))
}

export function makeOptions(records: PhotoRecord[], settings: Settings): Option[] {
  const seen = new Set<string>()
  const out: Option[] = []
  const push = (value: string, group: string): void => {
    if (seen.has(value.toLowerCase())) return
    seen.add(value.toLowerCase())
    out.push({ value, label: value, group })
  }
  folderValues(records, 'Make').forEach((m) => push(m, 'In this folder'))
  settings.customCameras.forEach((c) => c.make && push(c.make, 'My gear'))
  CAMERA_MAKES.forEach((m) => push(m, 'All makes'))
  return out
}

function cameraOption(c: CameraModel, ctx: Context, group: string): Option {
  const lens = findLens(ctx.lens)
  const problem = mountProblem(c, lens)
  return {
    value: c.model,
    label: c.label ?? c.model,
    hint: c.label && c.label !== c.model ? c.model : MOUNTS[c.mount]?.name,
    group,
    issue: problem ?? undefined,
    data: c
  }
}

export function modelOptions(records: PhotoRecord[], settings: Settings, ctx: Context): Option[] {
  const out: Option[] = []
  const seen = new Set<string>()
  const byMake = (m: string): boolean => !ctx.make || sameMake(m, ctx.make)

  for (const m of folderValues(records, 'Model')) {
    const known = findCamera(undefined, m)
    if (ctx.make && known && !byMake(known.make)) continue
    seen.add(m)
    out.push(known ? cameraOption(known, ctx, 'In this folder') : { value: m, label: m, group: 'In this folder' })
  }
  for (const c of settings.customCameras) {
    if (seen.has(c.model) || !byMake(c.make)) continue
    seen.add(c.model)
    out.push({ value: c.model, label: c.model, hint: c.make, group: 'My gear', data: { make: c.make, model: c.model } })
  }
  const pool = CAMERAS.filter((c) => byMake(c.make) && !seen.has(c.model))
  for (const c of pool.filter((c) => !c.film)) out.push(cameraOption(c, ctx, ctx.make ? `${c.brand} — digital` : c.brand))
  for (const c of pool.filter((c) => c.film)) out.push(cameraOption(c, ctx, ctx.make ? `${c.brand} — film` : `${c.brand} — film`))
  return out
}

export function lensMakeOptions(records: PhotoRecord[]): Option[] {
  const seen = new Set<string>()
  const out: Option[] = []
  for (const v of folderValues(records, 'LensMake')) {
    seen.add(v)
    out.push({ value: v, label: v, group: 'In this folder' })
  }
  for (const v of LENS_MAKES) if (!seen.has(v)) out.push({ value: v, label: v, group: 'All lens makers' })
  return out
}

/** Lenses ordered by relevance: in-folder, your gear, fits this body, then everything else (flagged). */
export function lensOptions(records: PhotoRecord[], settings: Settings, ctx: Context): Option[] {
  const camera = findCamera(ctx.make, ctx.model)
  const out: Option[] = []
  const seen = new Set<string>()
  const specsHint = (name: string): string | undefined => {
    const s = parseLensSpecs(name)
    if (s.minFocal === undefined) return undefined
    const f = s.minFocal === s.maxFocal ? `${s.minFocal}mm` : `${s.minFocal}–${s.maxFocal}mm`
    const a = s.wideAperture === undefined ? '' : s.wideAperture === s.teleAperture ? ` ƒ/${s.wideAperture}` : ` ƒ/${s.wideAperture}–${s.teleAperture}`
    return f + a
  }

  for (const m of folderValues(records, 'LensModel')) {
    seen.add(m)
    const lens = findLens(m)
    out.push({ value: m, label: m, hint: specsHint(m), group: 'In this folder', issue: mountProblem(camera, lens) ?? undefined, data: lens })
  }
  for (const l of settings.customLenses) {
    if (seen.has(l.model)) continue
    seen.add(l.model)
    out.push({ value: l.model, label: l.model, hint: specsHint(l.model), group: 'My gear', data: { make: l.make, model: l.model } })
  }

  const fits: Option[] = []
  const others: Option[] = []
  for (const l of LENSES) {
    if (seen.has(l.model)) continue
    const problem = mountProblem(camera, l)
    const opt: Option = {
      value: l.model,
      label: l.model,
      hint: specsHint(l.model),
      group: `${l.make} · ${MOUNTS[l.mount]?.name ?? l.mount}`,
      issue: problem ?? undefined,
      data: l
    }
    if (camera && !problem) fits.push({ ...opt, group: `Fits ${camera.label ?? camera.model} · ${opt.group}` })
    else others.push(opt)
  }
  return [...out, ...fits, ...others]
}

const STOPS = [0.95, 1, 1.2, 1.4, 1.7, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22, 32, 45, 64]

export function apertureOptions(ctx: Context): Option[] {
  const limit = ctx.lens ? maxApertureAt(ctx.lens, ctx.focal) : undefined
  return STOPS.map((s) => ({
    value: String(s),
    label: `ƒ/${s}`,
    issue: limit !== undefined && s < limit - 0.05 ? `Wider than this lens allows (ƒ/${Math.round(limit * 10) / 10} max)` : undefined
  }))
}

const SHUTTERS = [
  1 / 8000, 1 / 6400, 1 / 5000, 1 / 4000, 1 / 3200, 1 / 2500, 1 / 2000, 1 / 1600, 1 / 1250, 1 / 1000, 1 / 800, 1 / 640, 1 / 500,
  1 / 400, 1 / 320, 1 / 250, 1 / 200, 1 / 160, 1 / 125, 1 / 100, 1 / 80, 1 / 60, 1 / 50, 1 / 40, 1 / 30, 1 / 25, 1 / 20, 1 / 15,
  1 / 13, 1 / 10, 1 / 8, 1 / 6, 1 / 5, 1 / 4, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.3, 1.6, 2, 2.5, 3.2, 4, 5, 6, 8, 10, 13, 15, 20, 25, 30, 60, 120, 240
]

export function shutterOptions(): Option[] {
  return SHUTTERS.map((s) => {
    const v = formatExposure(s)
    return { value: v, label: s >= 0.3 ? `${v}″` : v, hint: s >= 1 ? 'seconds' : undefined }
  })
}

const ISOS = [25, 50, 64, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800, 16000, 25600, 51200, 102400]

export function isoOptions(): Option[] {
  return ISOS.map((i) => ({ value: String(i), label: `ISO ${i}`, hint: [25, 50, 100, 160, 200, 400, 800, 3200].includes(i) ? 'common film speed' : undefined }))
}

const FOCALS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 35, 40, 50, 55, 70, 85, 100, 105, 135, 150, 200, 300, 400, 500, 600, 800]

export function focalOptions(ctx: Context): Option[] {
  if (ctx.lens) {
    const s = parseLensSpecs(ctx.lens)
    if (s.minFocal !== undefined && s.maxFocal !== undefined) {
      if (isPrime(s)) return [{ value: String(s.minFocal), label: `${s.minFocal}mm`, hint: 'prime' }]
      const pts = new Set<number>([s.minFocal, s.maxFocal])
      for (const f of FOCALS) if (f > s.minFocal && f < s.maxFocal) pts.add(f)
      const inRange = [...pts].sort((a, b) => a - b).map((f) => ({ value: String(f), label: `${f}mm`, group: 'This lens' }))
      const outside = FOCALS.filter((f) => f < s.minFocal! || f > s.maxFocal!).map((f) => ({
        value: String(f),
        label: `${f}mm`,
        group: 'Outside lens range',
        issue: `This lens covers ${s.minFocal}–${s.maxFocal}mm`
      }))
      return [...inRange, ...outside]
    }
  }
  return FOCALS.map((f) => ({ value: String(f), label: `${f}mm` }))
}

export function textOptions(records: PhotoRecord[], key: 'Artist' | 'Copyright'): Option[] {
  return folderValues(records, key).map((v) => ({ value: v, label: v, group: 'In this folder' }))
}

export function cropFor(ctx: Context): number | undefined {
  const cam = findCamera(ctx.make, ctx.model)
  const c = cam ? MOUNTS[cam.mount]?.crop : undefined
  return c && c > 0 ? c : undefined
}
