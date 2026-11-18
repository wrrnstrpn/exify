import { describe, expect, it } from 'vitest'
import { CAMERAS, MOUNTS } from '@renderer/data/cameras'
import { LENSES, findLens, isPrime, parseLensSpecs } from '@renderer/data/lenses'

describe('parseLensSpecs', () => {
  it.each([
    ['RF24-70mm F2.8 L IS USM', { minFocal: 24, maxFocal: 70, wideAperture: 2.8, teleAperture: 2.8 }],
    ['EF-S18-55mm f/3.5-5.6 IS STM', { minFocal: 18, maxFocal: 55, wideAperture: 3.5, teleAperture: 5.6 }],
    ['XF23mmF1.4 R LM WR', { minFocal: 23, maxFocal: 23, wideAperture: 1.4 }],
    ['Summilux-M 1:1.4/50 ASPH.', { minFocal: 50, maxFocal: 50, wideAperture: 1.4 }],
    ['XCD 2,5/55V', { minFocal: 55, wideAperture: 2.5 }],
    ['LUMIX S 20-60/F3.5-5.6', { minFocal: 20, maxFocal: 60, wideAperture: 3.5, teleAperture: 5.6 }],
    ['FD 50mm f/1.4', { minFocal: 50, wideAperture: 1.4 }],
    ['28-75mm F/2.8 Di III VXD G2', { minFocal: 28, maxFocal: 75, wideAperture: 2.8 }],
    ['MP-E65mm f/2.8 1-5x Macro Photo', { minFocal: 65, maxFocal: 65, wideAperture: 2.8 }]
  ])('%s', (name, expected) => {
    expect(parseLensSpecs(name)).toMatchObject(expected)
  })

  it('applies teleconverters baked into the name', () => {
    const s = parseLensSpecs('RF100-500mm F4.5-7.1 L IS USM +RF1.4x')
    expect(s.extender).toBe(1.4)
    expect(s.minFocal).toBeCloseTo(140)
    expect(s.maxFocal).toBeCloseTo(700)
    expect(s.teleAperture).toBeCloseTo(9.94)
  })

  it('parses focal length and aperture for nearly every lens in the database', () => {
    const unparsed = LENSES.filter((l) => {
      const s = parseLensSpecs(l.model)
      return s.minFocal === undefined || s.wideAperture === undefined
    })
    expect(unparsed.length).toBeLessThanOrEqual(2)
  })

  it('detects primes', () => {
    expect(isPrime(parseLensSpecs('EF50mm f/1.8 STM'))).toBe(true)
    expect(isPrime(parseLensSpecs('RF24-105mm F4 L IS USM'))).toBe(false)
  })
})

describe('gear database', () => {
  it('has no duplicate camera or lens entries', () => {
    const cams = new Set(CAMERAS.map((c) => `${c.make}|${c.model}`))
    const lenses = new Set(LENSES.map((l) => `${l.make}|${l.model}`))
    expect(cams.size).toBe(CAMERAS.length)
    expect(lenses.size).toBe(LENSES.length)
  })

  it('only references known mounts', () => {
    for (const c of CAMERAS) expect(MOUNTS[c.mount], `${c.model} → ${c.mount}`).toBeDefined()
    for (const l of LENSES) expect(MOUNTS[l.mount], `${l.model} → ${l.mount}`).toBeDefined()
  })

  it('finds lenses with or without a "Canon " prefix', () => {
    expect(findLens('EF50mm f/1.8 STM')?.mount).toBe('EF')
    expect(findLens('Canon EF50mm f/1.8 STM')?.mount).toBe('EF')
  })
})
