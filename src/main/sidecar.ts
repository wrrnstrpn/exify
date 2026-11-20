import { existsSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'

// DNG is left out on purpose: Lightroom and friends write XMP straight into DNGs.
const RAW_EXT = new Set([
  'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'orf', 'rw2', 'raf', 'pef',
  'srw', 'x3f', '3fr', 'fff', 'iiq', 'erf', 'mef', 'mos', 'kdc', 'dcr', 'rwl', 'gpr'
])

export function isRaw(path: string): boolean {
  return RAW_EXT.has(extname(path).slice(1).toLowerCase())
}

const stem = (path: string): string => basename(path, extname(path))

/**
 * The sidecar a RAW file already has, if any. Lightroom, Capture One and
 * Bridge use IMG_0001.xmp; darktable uses IMG_0001.CR3.xmp. We look for both.
 */
export function findSidecar(path: string): string | null {
  if (!isRaw(path)) return null
  const dir = dirname(path)
  const candidates = [
    join(dir, `${stem(path)}.xmp`),
    join(dir, `${stem(path)}.XMP`),
    `${path}.xmp`,
    `${path}.XMP`
  ]
  return candidates.find((c) => existsSync(c)) ?? null
}

/** Where a new sidecar goes: the Lightroom-style name, since that's what most apps read. */
export function newSidecarPath(path: string): string {
  return join(dirname(path), `${stem(path)}.xmp`)
}

/** Sidecar path after the RAW file is renamed, keeping whichever naming style it used. */
export function movedSidecarPath(sidecar: string, from: string, to: string): string {
  const name = basename(sidecar)
  if (name.toLowerCase().startsWith(basename(from).toLowerCase() + '.')) {
    return join(dirname(to), basename(to) + name.slice(basename(from).length))
  }
  return join(dirname(to), stem(to) + extname(sidecar))
}
