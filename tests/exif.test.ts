import { copyFileSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FieldMap } from '@shared/fields'
import {
  configureWrites,
  historyInfo,
  readAllTags,
  readRecord,
  setRoot,
  shutdownExiftool,
  stripMetadata,
  undo,
  writeEdits
} from '../src/main/exif'
import { scanFolder } from '../src/main/scan'

// End-to-end tests against the real ExifTool binary, on copies of the fixtures.

let dir: string
let jpg: string
let png: string

const SAMPLE: FieldMap = {
  Make: 'Canon',
  Model: 'Canon EOS R6 Mark II',
  LensMake: 'Canon',
  LensModel: 'RF24-70mm F2.8 L IS USM',
  LensInfo: '24-70mm f/2.8',
  LensSerialNumber: '0000123',
  FocalLength: 35,
  FocalLengthIn35mmFormat: 35,
  FNumber: 2.8,
  ExposureTime: '1/250',
  ISO: 400,
  ExposureProgram: 3,
  ExposureCompensation: -0.7,
  FilmStock: 'Kodak Portra 400',
  PushPull: 1,
  DateTimeOriginal: '2024:06:15 18:30:05',
  CreateDate: '2024:06:15 18:30:05',
  OffsetTimeOriginal: '+02:00',
  Title: 'Sunset ünïcödé',
  ImageDescription: 'Line one, with "quotes"',
  Keywords: ['travel', 'sunset', 'film'],
  Artist: 'Test Artist',
  Copyright: '© 2024 Test Artist',
  Rating: 4,
  GPSLatitude: -33.856784,
  GPSLongitude: 151.215297,
  GPSAltitude: 12.5,
  Sublocation: 'Opera House',
  City: 'Zürich',
  State: 'NSW',
  Country: 'Australia',
  Orientation: 1,
  SerialNumber: '123456',
  Software: 'Exify'
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'exify-test-'))
  jpg = join(dir, 'photo.jpg')
  png = join(dir, 'graphic.png')
  copyFileSync(join(__dirname, 'fixtures', 'sample.jpg'), jpg)
  copyFileSync(join(__dirname, 'fixtures', 'sample.png'), png)
  copyFileSync(join(__dirname, 'fixtures', 'sample.jpg'), join(dir, 'second.jpg'))
  setRoot(dir)
  configureWrites({ keepBackups: false, preserveFileDates: true })
})

afterAll(async () => {
  await shutdownExiftool()
  rmSync(dir, { recursive: true, force: true })
})

describe('ExifTool engine', () => {
  it('scans supported images', async () => {
    const files = await scanFolder(dir, true)
    expect(files.map((f) => f.split(/[\\/]/).pop())).toEqual(['graphic.png', 'photo.jpg', 'second.jpg'])
  })

  it.each(['jpg', 'png'])('round-trips every editable field (%s)', async (kind) => {
    const path = kind === 'jpg' ? jpg : png
    const [res] = await writeEdits([{ path, set: SAMPLE }], 'write all')
    expect(res.ok, res.error).toBe(true)
    const fields = res.record!.fields
    for (const [k, v] of Object.entries(SAMPLE)) {
      const got = fields[k as keyof FieldMap]
      if (typeof v === 'number') expect(got, k).toBeCloseTo(v, 4)
      else expect(got, k).toEqual(v)
    }
  })

  it('clears tags and undoes the last write exactly', async () => {
    const before = (await readRecord(jpg)).fields
    const count = historyInfo().count
    await writeEdits([{ path: jpg, set: { ISO: 3200, Artist: null } }], 'second')
    const mid = (await readRecord(jpg)).fields
    expect(mid.ISO).toBe(3200)
    expect(mid.Artist).toBeUndefined()
    expect(historyInfo().count).toBe(count + 1)

    await undo()
    const after = (await readRecord(jpg)).fields
    expect(after.ISO).toBe(before.ISO)
    expect(after.Artist).toBe(before.Artist)
  })

  it('reads every tag grouped by family', async () => {
    const tags = await readAllTags(jpg)
    expect(Object.keys(tags).some((k) => k.startsWith('IFD0:') || k.startsWith('ExifIFD:'))).toBe(true)
  })

  it('strips metadata', async () => {
    const [res] = await stripMetadata([jpg])
    expect(res.ok, res.error).toBe(true)
    expect(res.record!.fields.Model).toBeUndefined()
    expect(res.record!.fields.GPSLatitude).toBeUndefined()
    expect(res.record!.fields.Keywords).toBeUndefined()
  })

  it('leaves no backup files when backups are off', () => {
    expect(readdirSync(dir).some((f) => f.endsWith('_original'))).toBe(false)
  })
})
