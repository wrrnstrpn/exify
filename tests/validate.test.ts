import { describe, expect, it } from 'vitest'
import type { FieldKey, FieldMap } from '@shared/fields'
import { maxApertureAt, validate } from '@renderer/lib/validate'

const R6 = { Make: 'Canon', Model: 'Canon EOS R6 Mark II' }

const flags = (f: FieldMap): FieldKey[] => validate(f).map((i) => i.field)

describe('mismatch validation', () => {
  it.each<[string, FieldMap, FieldKey]>([
    ['f/1.8 on an f/4 zoom', { ...R6, LensModel: 'RF24-105mm F4 L IS USM', FocalLength: 50, FNumber: 1.8 }, 'FNumber'],
    ['70mm on a 50mm prime', { LensModel: 'EF50mm f/1.8 STM', FocalLength: 70 }, 'FocalLength'],
    ['f/3.5 at the long end of an f/3.5-5.6 zoom', { LensModel: 'EF-S18-55mm f/3.5-5.6 IS STM', FocalLength: 55, FNumber: 3.5 }, 'FNumber'],
    ['RF lens on an EF DSLR', { Make: 'Canon', Model: 'Canon EOS 5D Mark IV', LensModel: 'RF50mm F1.8 STM' }, 'LensModel'],
    ['EF-S lens on full frame', { Make: 'Canon', Model: 'Canon EOS 6D', LensModel: 'EF-S24mm f/2.8 STM' }, 'LensModel'],
    ['EF-S lens on the pre-EF-S 10D', { Make: 'Canon', Model: 'Canon EOS 10D', LensModel: 'EF-S24mm f/2.8 STM' }, 'LensModel'],
    ['wrong 35mm equivalent for 1.6x crop', { Make: 'Canon', Model: 'Canon EOS R7', FocalLength: 50, FocalLengthIn35mmFormat: 50 }, 'FocalLengthIn35mmFormat'],
    ['camera model with the wrong make', { Make: 'NIKON CORPORATION', Model: 'Canon EOS R5' }, 'Make'],
    ['lens with the wrong lens make', { LensMake: 'Sony', LensModel: 'RF50mm F1.8 STM' }, 'LensMake'],
    ['unparseable shutter speed', { ExposureTime: 'fast' }, 'ExposureTime'],
    ['date in the future', { DateTimeOriginal: '2099:01:01 00:00:00' }, 'DateTimeOriginal'],
    ['malformed time zone', { OffsetTimeOriginal: '2 hours' }, 'OffsetTimeOriginal'],
    ['latitude out of range', { GPSLatitude: 123, GPSLongitude: 10 }, 'GPSLatitude']
  ])('flags %s', (_name, fields, field) => {
    expect(flags(fields)).toContain(field)
  })

  it.each<[string, FieldMap]>([
    ['f/4 on an f/4 zoom', { ...R6, LensModel: 'RF24-105mm F4 L IS USM', FocalLength: 50, FNumber: 4 }],
    ['f/3.5 at the wide end of an f/3.5-5.6 zoom', { LensModel: 'EF-S18-55mm f/3.5-5.6 IS STM', FocalLength: 18, FNumber: 3.5 }],
    ['adapted EF lens on an RF body', { Make: 'Canon', Model: 'Canon EOS R5', LensModel: 'EF70-200mm f/2.8L IS III USM' }],
    ['EF-S lens on an APS-C DSLR', { Make: 'Canon', Model: 'Canon EOS 90D', LensModel: 'EF-S18-135mm f/3.5-5.6 IS USM' }],
    ['correct 1.6x crop equivalent', { Make: 'Canon', Model: 'Canon EOS R7', FocalLength: 50, FocalLengthIn35mmFormat: 80 }],
    ['correct 1.3x APS-H equivalent', { Make: 'Canon', Model: 'Canon EOS-1D Mark IV', FocalLength: 100, FocalLengthIn35mmFormat: 130 }],
    ['teleconverter combo at its real focal length', { LensModel: 'RF100-500mm F4.5-7.1 L IS USM +RF1.4x', FocalLength: 700, FNumber: 10 }],
    ['an empty record', {}]
  ])('accepts %s', (_name, fields) => {
    expect(validate(fields)).toEqual([])
  })

  it('interpolates the widest aperture across a variable-aperture zoom', () => {
    expect(maxApertureAt('EF-S18-55mm f/3.5-5.6 IS STM', 18)).toBeCloseTo(3.5)
    expect(maxApertureAt('EF-S18-55mm f/3.5-5.6 IS STM', 55)).toBeCloseTo(5.6)
    const mid = maxApertureAt('EF-S18-55mm f/3.5-5.6 IS STM', 36.5)!
    expect(mid).toBeGreaterThan(3.5)
    expect(mid).toBeLessThan(5.6)
  })
})
