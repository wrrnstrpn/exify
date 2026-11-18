import { readdir } from 'node:fs/promises'
import { join, extname } from 'node:path'

export const SUPPORTED_EXTENSIONS = new Set([
  // common
  'jpg', 'jpeg', 'jpe', 'tif', 'tiff', 'png', 'webp', 'heic', 'heif', 'avif', 'jxl',
  // raw
  'dng', 'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'orf', 'rw2', 'raf', 'pef',
  'srw', 'x3f', '3fr', 'fff', 'iiq', 'erf', 'mef', 'mos', 'kdc', 'dcr', 'rwl', 'gpr'
])

const SKIP_DIRS = new Set(['$recycle.bin', 'system volume information', 'node_modules', '.git'])

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

export async function scanFolder(root: string, recursive: boolean): Promise<string[]> {
  const out: string[] = []
  const walk = async (dir: string): Promise<void> => {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    const subdirs: string[] = []
    for (const e of entries) {
      if (e.name.startsWith('.')) continue
      if (e.isDirectory()) {
        if (recursive && !SKIP_DIRS.has(e.name.toLowerCase())) subdirs.push(join(dir, e.name))
      } else if (e.isFile() && SUPPORTED_EXTENSIONS.has(extname(e.name).slice(1).toLowerCase())) {
        out.push(join(dir, e.name))
      }
    }
    for (const d of subdirs.sort(naturalCompare)) await walk(d)
  }
  await walk(root)
  return out.sort(naturalCompare)
}
