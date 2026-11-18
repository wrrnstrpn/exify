import { describe, expect, it } from 'vitest'
import type { PhotoRecord } from '@shared/types'
import { DEFAULT_FILTERS, applyFilters, sortRecords } from '@renderer/lib/filter'

const rec = (name: string, fields: PhotoRecord['fields']): PhotoRecord => ({ path: `C:/p/${name}`, name, rel: '', ext: 'jpg', fields })

const records = [
  rec('a.jpg', { Model: 'Canon EOS R5', ISO: 100, FNumber: 2.8, DateTimeOriginal: '2024:05:01 10:00:00', Keywords: ['travel'] }),
  rec('b.jpg', { Model: 'Canon EOS R7', ISO: 3200, FNumber: 1.4, LensModel: 'RF24-70mm F2.8 L IS USM', FocalLength: 50 }),
  rec('c.jpg', {})
]

describe('filters', () => {
  it('searches across names and metadata', () => {
    expect(applyFilters(records, { ...DEFAULT_FILTERS, text: 'travel' }).map((r) => r.name)).toEqual(['a.jpg'])
    expect(applyFilters(records, { ...DEFAULT_FILTERS, text: 'r7' }).map((r) => r.name)).toEqual(['b.jpg'])
  })

  it('filters by ISO range and missing fields', () => {
    expect(applyFilters(records, { ...DEFAULT_FILTERS, isoMin: '1000' }).map((r) => r.name)).toEqual(['b.jpg'])
    expect(applyFilters(records, { ...DEFAULT_FILTERS, missing: ['date'] }).map((r) => r.name)).toEqual(['b.jpg', 'c.jpg'])
  })

  it('filters by metadata issues', () => {
    // b.jpg: f/1.4 on an f/2.8 lens
    expect(applyFilters(records, { ...DEFAULT_FILTERS, issues: 'errors' }).map((r) => r.name)).toEqual(['b.jpg'])
    expect(applyFilters(records, { ...DEFAULT_FILTERS, issues: 'clean' }).map((r) => r.name)).toEqual(['a.jpg', 'c.jpg'])
  })

  it('sorts with missing values last in both directions', () => {
    expect(sortRecords(records, { key: 'iso', dir: 1 }).map((r) => r.name)).toEqual(['a.jpg', 'b.jpg', 'c.jpg'])
    expect(sortRecords(records, { key: 'iso', dir: -1 }).map((r) => r.name)).toEqual(['b.jpg', 'a.jpg', 'c.jpg'])
  })
})
