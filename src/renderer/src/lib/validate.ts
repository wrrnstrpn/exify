import { parseExposure, exifDateToMs, type FieldKey, type FieldMap } from '@shared/fields'
import { CAMERAS, MOUNTS, findCamera, sameMake, type CameraModel } from '../data/cameras'
import { findLens, isPrime, parseLensSpecs, type LensModel } from '../data/lenses'

export type IssueLevel = 'error' | 'warning'

export interface Issue {
  field: FieldKey
  level: IssueLevel
  message: string
}

const f1 = (n: number): string => (Math.round(n * 10) / 10).toString()
const mm = (n: number): string => `${f1(n)}mm`

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))) return Number(v)
  return undefined
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function cameraName(c: CameraModel): string {
  return c.label ?? c.model
}

export function isFixedLensBody(c: CameraModel): boolean {
  return c.mount.startsWith('Fixed') || c.mount === 'Phone' || c.mount === 'Drone'
}

/** Why `lens` can't go on `camera`, or null if it fits (natively or via a common first-party adapter). */
export function mountProblem(camera: CameraModel | undefined, lens: LensModel | undefined): string | null {
  if (!camera || !lens) return null
  if (isFixedLensBody(camera)) return `${cameraName(camera)} has a built-in lens`
  if (lens.mount.startsWith('Fixed')) return null
  const body = MOUNTS[camera.mount]
  if (!body?.accepts) return null
  if (body.accepts.includes(lens.mount)) return null
  const lensMount = MOUNTS[lens.mount]?.name ?? lens.mount
  if (camera.mount === 'EF' && lens.mount === 'EF-S') return `EF-S lenses don't fit full-frame EF bodies like the ${cameraName(camera)}`
  if (camera.mount === 'EF-C' && lens.mount === 'EF-S') return `The ${cameraName(camera)} predates EF-S and can't mount EF-S lenses`
  if (camera.mount === 'EF-H' && lens.mount === 'EF-S') return `EF-S lenses don't fit APS-H bodies like the ${cameraName(camera)}`
  if ((camera.mount === 'EF' || camera.mount === 'EF-S' || camera.mount === 'EF-H' || camera.mount === 'EF-C') && (lens.mount === 'RF' || lens.mount === 'RF-S'))
    return `RF lenses can't be mounted on EF DSLRs like the ${cameraName(camera)}`
  return `${lensMount} lens doesn't fit the ${cameraName(camera)} (${body.name})`
}

/** Widest aperture the lens supports at `focal` (linear interpolation for variable-aperture zooms). */
export function maxApertureAt(lensName: string, focal?: number): number | undefined {
  const s = parseLensSpecs(lensName)
  if (s.wideAperture === undefined) return undefined
  const tele = s.teleAperture ?? s.wideAperture
  if (focal === undefined || s.minFocal === undefined || s.maxFocal === undefined || s.maxFocal === s.minFocal) {
    return s.wideAperture
  }
  const t = Math.min(1, Math.max(0, (focal - s.minFocal) / (s.maxFocal - s.minFocal)))
  return s.wideAperture + (tele - s.wideAperture) * t
}

export function validate(f: FieldMap): Issue[] {
  const issues: Issue[] = []
  const add = (field: FieldKey, level: IssueLevel, message: string): void => {
    issues.push({ field, level, message })
  }

  const make = str(f.Make)
  const model = str(f.Model)
  const lensName = str(f.LensModel)
  const lensMake = str(f.LensMake)
  const focal = num(f.FocalLength)
  const focal35 = num(f.FocalLengthIn35mmFormat)
  const fnum = num(f.FNumber)

  // ---- camera identity
  const camera = findCamera(make, model)
  if (model && make) {
    const byModel = CAMERAS.find((c) => c.model.toLowerCase() === model.toLowerCase())
    if (byModel && !sameMake(byModel.make, make)) {
      add('Make', 'warning', `“${cameraName(byModel)}” is a ${byModel.make} camera, not ${make}`)
    }
  }

  // ---- lens identity & mount
  const lens = findLens(lensName)
  if (lens && lensMake && !sameMake(lens.make, lensMake)) {
    add('LensMake', 'warning', `“${lens.model}” is made by ${lens.make}, not ${lensMake}`)
  }
  const mp = mountProblem(camera, lens)
  if (mp) add('LensModel', 'warning', mp)

  // ---- focal length vs lens
  const spec = lensName ? parseLensSpecs(lensName) : {}
  if (focal !== undefined) {
    if (focal <= 0) add('FocalLength', 'error', 'Focal length must be greater than 0')
    else if (spec.minFocal !== undefined && spec.maxFocal !== undefined) {
      const tol = Math.max(0.6, spec.maxFocal * 0.01)
      if (focal < spec.minFocal - tol || focal > spec.maxFocal + tol) {
        add(
          'FocalLength',
          'error',
          isPrime(spec)
            ? `${mm(focal)} isn't possible on a ${mm(spec.minFocal)} prime`
            : `${mm(focal)} is outside this lens's ${f1(spec.minFocal)}–${mm(spec.maxFocal)} range`
        )
      }
    }
  }

  // ---- aperture vs lens
  if (fnum !== undefined) {
    if (fnum < 0.7) add('FNumber', 'error', `ƒ/${f1(fnum)} is not a real aperture`)
    else if (fnum > 128) add('FNumber', 'warning', `ƒ/${f1(fnum)} is an unusually small aperture`)
    if (lensName) {
      const inRange = focal !== undefined && spec.minFocal !== undefined && focal >= spec.minFocal - 1 && focal <= (spec.maxFocal ?? 0) + 1
      const limit = maxApertureAt(lensName, inRange ? focal : undefined)
      if (limit !== undefined && fnum < limit - 0.05) {
        const variable = spec.teleAperture !== undefined && spec.wideAperture !== spec.teleAperture
        let msg = `ƒ/${f1(fnum)} is wider than this lens can open (ƒ/${f1(limit)} max`
        if (variable && inRange) msg += ` at ${mm(focal!)}`
        else if (variable) msg += ' at its widest'
        add('FNumber', 'error', msg + ')')
      }
    }
  }

  // ---- 35mm equivalent vs crop
  if (focal !== undefined && focal35 !== undefined && camera) {
    const crop = MOUNTS[camera.mount]?.crop ?? 0
    if (crop > 0) {
      const expected = focal * crop
      if (Math.abs(focal35 - expected) / expected > 0.1) {
        add('FocalLengthIn35mmFormat', 'warning', `Expected ≈${Math.round(expected)}mm for a ${crop}× crop ${cameraName(camera)}`)
      }
    }
  }

  // ---- exposure
  const exp = str(f.ExposureTime)
  if (exp) {
    const s = parseExposure(exp)
    if (s === null) add('ExposureTime', 'error', `“${exp}” isn't a shutter speed (use 1/125, 0.5 or 30)`)
    else if (s < 1 / 64000) add('ExposureTime', 'warning', 'Faster than any camera shutter')
  }
  const iso = num(f.ISO)
  if (iso !== undefined && (iso < 1 || iso > 4_000_000)) add('ISO', 'warning', `ISO ${iso} is out of the usual range`)

  // ---- dates
  const now = Date.now() - new Date().getTimezoneOffset() * 60_000
  for (const key of ['DateTimeOriginal', 'CreateDate', 'ModifyDate'] as FieldKey[]) {
    const ms = exifDateToMs(str(f[key]))
    if (ms === null) continue
    if (ms > now + 86_400_000) add(key, 'warning', 'Date is in the future')
    if (new Date(ms).getUTCFullYear() < 1826) add(key, 'error', 'Earlier than the first photograph (1826)')
  }
  const dto = exifDateToMs(str(f.DateTimeOriginal))
  const cd = exifDateToMs(str(f.CreateDate))
  if (dto !== null && cd !== null && cd < dto - 1000) add('CreateDate', 'warning', 'Digitized before the photo was taken')

  const tz = str(f.OffsetTimeOriginal)
  if (tz && !/^[+-](0\d|1[0-4]):[0-5]\d$/.test(tz)) add('OffsetTimeOriginal', 'error', 'Use the form +HH:MM, e.g. +01:00')

  // ---- GPS
  const lat = num(f.GPSLatitude)
  const lon = num(f.GPSLongitude)
  if (lat !== undefined && Math.abs(lat) > 90) add('GPSLatitude', 'error', 'Latitude must be between -90 and 90')
  if (lon !== undefined && Math.abs(lon) > 180) add('GPSLongitude', 'error', 'Longitude must be between -180 and 180')
  if ((lat === undefined) !== (lon === undefined)) add(lat === undefined ? 'GPSLatitude' : 'GPSLongitude', 'warning', 'Latitude and longitude should both be set')
  if (lat === 0 && lon === 0) add('GPSLatitude', 'warning', '0, 0 is in the ocean off West Africa — probably a placeholder')

  const rating = num(f.Rating)
  if (rating !== undefined && (rating < -1 || rating > 5)) add('Rating', 'error', 'Rating must be -1 (rejected) to 5')

  return issues
}

const cache = new WeakMap<FieldMap, Issue[]>()
/** Memoised validate() for immutable record field maps. */
export function validateCached(f: FieldMap): Issue[] {
  let r = cache.get(f)
  if (!r) {
    r = validate(f)
    cache.set(f, r)
  }
  return r
}

export function worstLevel(issues: Issue[]): IssueLevel | null {
  if (issues.some((i) => i.level === 'error')) return 'error'
  return issues.length ? 'warning' : null
}
