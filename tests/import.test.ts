import { describe, expect, it } from 'vitest'
import type { PhotoRecord } from '@shared/types'
import { buildImport, guessTarget, parseCsv, parseLogShutter, parseLooseDate } from '@renderer/lib/csvImport'
import { locate, parseGpx } from '@renderer/lib/gpx'
import { planRenames, renderName } from '@renderer/lib/rename'
import { offsetFromGps } from '@renderer/lib/tz'

const rec = (name: string, fields: PhotoRecord['fields'] = {}): PhotoRecord => ({ path: `C:/roll/${name}`, name, rel: '', ext: 'jpg', fields })

describe('CSV import', () => {
  it('parses quoted cells, semicolons and CRLF', () => {
    expect(parseCsv('a;b;c\r\n1;"two; 2";"say ""hi"""\r\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', 'two; 2', 'say "hi"']
    ])
  })

  it('guesses columns from common header names', () => {
    expect(['Frame #', 'Shutter Speed', 'f-stop', 'Film Stock', 'Notes', 'Lat/Lon'].map(guessTarget)).toEqual([
      'frame',
      'ExposureTime',
      'FNumber',
      'FilmStock',
      'ImageDescription',
      'latlon'
    ])
  })

  it('reads shutter speeds like a shutter dial', () => {
    expect(parseLogShutter('125')).toBe('1/125')
    expect(parseLogShutter('1/60')).toBe('1/60')
    expect(parseLogShutter('2s')).toBe('2')
    expect(parseLogShutter('0.5')).toBe('0.5')
    expect(parseLogShutter('B')).toBeNull()
  })

  it('reads dates in several shapes', () => {
    expect(parseLooseDate('2024-06-15 18:30', 'dmy')).toEqual({ date: '2024:06:15', time: '18:30:00' })
    expect(parseLooseDate('15.06.2024', 'mdy').date).toBe('2024:06:15')
    expect(parseLooseDate('06/15/2024 6:30 pm', 'mdy')).toEqual({ date: '2024:06:15', time: '18:30:00' })
  })

  it('matches rows to scans by frame number', () => {
    const photos = [rec('Scan_001.jpg'), rec('Scan_002.jpg'), rec('Scan_003.jpg')]
    const rows = [
      ['3', 'f/8', '250', '15/06/2024', '-1/3'],
      ['1', '2.8', '1/60', '14/06/2024', '+1']
    ]
    const out = buildImport(rows, photos, {
      mapping: ['frame', 'FNumber', 'ExposureTime', 'date', 'ExposureCompensation'],
      match: 'frame',
      dateOrder: 'dmy'
    })
    expect(out[0].photo?.name).toBe('Scan_003.jpg')
    expect(out[0].set).toEqual({ FNumber: 8, ExposureTime: '1/250', DateTimeOriginal: '2024:06:15 00:00:00', ExposureCompensation: -0.33 })
    expect(out[1].photo?.name).toBe('Scan_001.jpg')
    expect(out[1].problems).toEqual([])
  })
})

describe('GPX', () => {
  const gpx = `<?xml version="1.0"?><gpx><trk><trkseg>
    <trkpt lat="48.0" lon="2.0"><ele>100</ele><time>2024-06-15T10:00:00Z</time></trkpt>
    <trkpt lat="48.1" lon="2.2"><ele>200</ele><time>2024-06-15T10:10:00Z</time></trkpt>
    <trkpt lat="49.0" lon="3.0"><time>2024-06-15T14:00:00Z</time></trkpt>
  </trkseg></trk></gpx>`

  it('interpolates between close points and refuses big gaps', () => {
    const track = parseGpx(gpx)
    expect(track).toHaveLength(3)
    const limits = { interpolateMs: 30 * 60_000, snapMs: 5 * 60_000 }
    const mid = locate(track, Date.parse('2024-06-15T10:05:00Z'), limits)!
    expect(mid.lat).toBeCloseTo(48.05)
    expect(mid.lon).toBeCloseTo(2.1)
    expect(mid.ele).toBeCloseTo(150)
    expect(locate(track, Date.parse('2024-06-15T12:00:00Z'), limits)).toBeNull()
    expect(locate(track, Date.parse('2024-06-15T10:12:00Z'), limits)?.gap).toBe(120)
  })
})

describe('rename', () => {
  const r = rec('IMG_0042.CR3', { DateTimeOriginal: '2024:06:15 18:30:05', Make: 'Canon', Model: 'Canon EOS R6 Mark II' })

  it('fills tokens and tidies separators left by missing values', () => {
    expect(renderName('{YYYY}-{MM}-{DD}_{lens}_{camera}', r, 1)).toBe('2024-06-15_EOS R6 Mark II')
    expect(renderName('roll7_{n:3}', r, 4)).toBe('roll7_004')
  })

  it('suffixes clashes instead of failing', () => {
    const plan = planRenames([r, { ...r, path: 'C:/roll/IMG_0043.CR3', name: 'IMG_0043.CR3' }], '{YYYY}{MM}{DD}', {
      taken: new Set(['C:/roll/20240615.CR3'])
    })
    expect(plan.map((p) => p.name)).toEqual(['20240615-2.CR3', '20240615-3.CR3'])
  })
})

describe('time zone from GPS', () => {
  it('knows about daylight saving', () => {
    expect(offsetFromGps(48.8584, 2.2945, '2024:07:01 12:00:00')).toBe('+02:00')
    expect(offsetFromGps(48.8584, 2.2945, '2024:01:15 12:00:00')).toBe('+01:00')
    expect(offsetFromGps(-33.8568, 151.2153, '2024:01:15 12:00:00')).toBe('+11:00')
    expect(offsetFromGps(28.6139, 77.209, '2024:01:15 12:00:00')).toBe('+05:30')
  })
})
