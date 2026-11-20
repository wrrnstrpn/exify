import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { configureWrites, readAllTags, readRecord, setRoot, shutdownExiftool, undo, writeEdits } from '../src/main/exif'
import { deleteBackups, listBackups, renameFiles, restoreBackups } from '../src/main/files'

// Sidecars, renames and backups, against real files and the real ExifTool.

let dir: string
const fixture = join(__dirname, 'fixtures', 'sample.jpg')

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'exify-files-'))
  setRoot(dir)
})

afterAll(async () => {
  await shutdownExiftool()
  rmSync(dir, { recursive: true, force: true })
})

describe('XMP sidecars', () => {
  // A JPEG with a RAW extension: ExifTool reads it by content, and in sidecar mode we never write to it.
  let raw: string
  beforeAll(() => {
    raw = join(dir, 'IMG_0001.CR2')
    copyFileSync(fixture, raw)
    configureWrites({ keepBackups: false, rawSidecars: true })
  })

  it('writes RAW edits to IMG_0001.xmp and leaves the RAW alone', async () => {
    const before = readFileSync(raw)
    const [res] = await writeEdits(
      [{ path: raw, set: { Model: 'Canon EOS R5', FNumber: 4, City: 'Sydney', DateTimeOriginal: '2024:06:15 18:30:05', OffsetTimeOriginal: '+10:00', FilmStock: 'Portra 400' } }],
      'sidecar'
    )
    expect(res.ok, res.error).toBe(true)
    expect(existsSync(join(dir, 'IMG_0001.xmp'))).toBe(true)
    expect(readFileSync(raw).equals(before)).toBe(true)
    expect(res.record!.sidecar).toBeTruthy()
    expect(res.record!.fields).toMatchObject({ Model: 'Canon EOS R5', FNumber: 4, City: 'Sydney', DateTimeOriginal: '2024:06:15 18:30:05', OffsetTimeOriginal: '+10:00', FilmStock: 'Portra 400' })
    const all = await readAllTags(raw)
    expect(Object.keys(all).some((k) => k.startsWith('Sidecar '))).toBe(true)
  })

  it('undo deletes a sidecar the write created', async () => {
    await undo()
    expect(existsSync(join(dir, 'IMG_0001.xmp'))).toBe(false)
    expect((await readRecord(raw)).fields.Model).not.toBe('Canon EOS R5')
  })
})

describe('rename', () => {
  it('swaps names, carries backups along, and undoes', async () => {
    const a = join(dir, 'a.jpg')
    const b = join(dir, 'b.jpg')
    copyFileSync(fixture, a)
    copyFileSync(fixture, b)
    configureWrites({ keepBackups: true, rawSidecars: true })
    await writeEdits([{ path: a, set: { Artist: 'A' } }], 'tag a')
    expect(existsSync(`${a}_original`)).toBe(true)

    const res = await renameFiles([{ from: a, to: b }, { from: b, to: a }], 'swap')
    expect(res.every((r) => r.ok)).toBe(true)
    expect((await readRecord(b)).fields.Artist).toBe('A')
    expect(existsSync(`${b}_original`)).toBe(true)
    expect(existsSync(`${a}_original`)).toBe(false)

    await undo()
    expect((await readRecord(a)).fields.Artist).toBe('A')
    expect(existsSync(`${a}_original`)).toBe(true)
  })

  it('refuses to overwrite a file outside the batch', async () => {
    const c = join(dir, 'c.jpg')
    copyFileSync(fixture, c)
    const [res] = await renameFiles([{ from: c, to: join(dir, 'b.jpg') }], 'clash')
    expect(res.ok).toBe(false)
    expect(existsSync(c)).toBe(true)
  })
})

describe('backups', () => {
  it('restores the original and then deletes leftovers', async () => {
    const d = join(dir, 'd.jpg')
    copyFileSync(fixture, d)
    configureWrites({ keepBackups: true })
    const original = (await readRecord(d)).fields.Artist
    await writeEdits([{ path: d, set: { Artist: 'Changed' } }], 'change')
    expect(listBackups([d])).toHaveLength(1)

    const [res] = await restoreBackups([d])
    expect(res.ok, res.error).toBe(true)
    expect(res.record!.fields.Artist).toBe(original)
    expect(listBackups([d])).toHaveLength(0)

    await writeEdits([{ path: d, set: { Artist: 'Again' } }], 'again')
    expect(deleteBackups([d])).toBe(1)
    expect(existsSync(`${d}_original`)).toBe(false)
  })
})
