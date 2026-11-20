import { nativeImage, protocol, type NativeImage } from 'electron'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { exiftool } from './exif'

// Thumbnails and previews, served over our own scheme:
//   exify://thumb/?p=<path>&s=<px>&v=<version>
//   exify://preview/?p=<path>&v=<version>
// `v` only exists to bust the cache after a write.
//
// The OS thumbnailer goes first (Windows Explorer / macOS Quick Look): it's fast,
// cached, and handles RAW if codecs are installed. Linux doesn't have one, so
// there we decode JPEG/PNG directly or pull the preview ExifTool finds inside RAWs.

export const SCHEME = 'exify'

export function registerSchemePrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
  ])
}

const tempDir = mkdtempSync(join(tmpdir(), 'exify-'))
const cache = new Map<string, Buffer>()
const MAX_CACHE = 1500

function remember(key: string, buf: Buffer): void {
  if (cache.size >= MAX_CACHE) {
    const first = cache.keys().next().value
    if (first !== undefined) cache.delete(first)
  }
  cache.set(key, buf)
}

// A fast scroll would otherwise fire hundreds of thumbnail calls at once.
let active = 0
const waiters: (() => void)[] = []
async function acquire(): Promise<void> {
  if (active < 6) {
    active++
    return
  }
  await new Promise<void>((r) => waiters.push(r))
  active++
}
function release(): void {
  active--
  waiters.shift()?.()
}

const DIRECT_DECODE = new Set(['jpg', 'jpeg', 'jpe', 'png'])
let tmpCounter = 0

async function fromEmbedded(path: string): Promise<NativeImage | null> {
  const attempts: ((src: string, dst: string) => Promise<void>)[] = [
    (s, d) => exiftool.extractPreview(s, d),
    (s, d) => exiftool.extractJpgFromRaw(s, d),
    (s, d) => exiftool.extractThumbnail(s, d)
  ]
  for (const extract of attempts) {
    const out = join(tempDir, `t${tmpCounter++}.jpg`)
    try {
      await extract(path, out)
      if (existsSync(out)) {
        const img = nativeImage.createFromBuffer(await readFile(out))
        if (!img.isEmpty()) return img
      }
    } catch {
      /* try next */
    } finally {
      rmSync(out, { force: true })
    }
  }
  return null
}

async function render(path: string, size: number): Promise<Buffer | null> {
  let img: NativeImage | null = null
  try {
    img = await nativeImage.createThumbnailFromPath(path, { width: size, height: size })
    if (img.isEmpty()) img = null
  } catch {
    img = null
  }
  if (!img && DIRECT_DECODE.has(extname(path).slice(1).toLowerCase())) {
    const direct = nativeImage.createFromPath(path)
    if (!direct.isEmpty()) img = direct
  }
  if (!img) img = await fromEmbedded(path)
  if (!img) return null
  const { width, height } = img.getSize()
  const scale = Math.min(1, size / Math.max(width, height))
  if (scale < 1) img = img.resize({ width: Math.round(width * scale), height: Math.round(height * scale), quality: 'good' })
  return img.toJPEG(85)
}

export function registerProtocolHandler(): void {
  protocol.handle(SCHEME, async (req) => {
    const url = new URL(req.url)
    const path = url.searchParams.get('p')
    if (!path) return new Response('missing path', { status: 400 })
    const size = url.hostname === 'preview' ? 2048 : Math.min(1024, Math.max(32, Number(url.searchParams.get('s')) || 256))
    const key = `${path}|${size}|${url.searchParams.get('v') ?? ''}`
    let buf = cache.get(key)
    if (!buf) {
      await acquire()
      try {
        buf = (await render(path, size)) ?? undefined
      } finally {
        release()
      }
      if (!buf) return new Response('no preview', { status: 404 })
      if (size <= 512) remember(key, buf)
    }
    return new Response(new Uint8Array(buf), {
      headers: { 'content-type': 'image/jpeg', 'cache-control': 'no-store' }
    })
  })
}

export function cleanupThumbs(): void {
  rmSync(tempDir, { recursive: true, force: true })
}
