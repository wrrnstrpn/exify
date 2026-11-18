// Rasterises the SVG logos with Electron's Chromium so output matches what users see.
// Renders in 512px tiles at 1x scale and stitches them, so the output size never
// depends on the size or DPI of the screen.
// Usage (from repo root): npx electron scripts/render-icons.cjs
const { app, BrowserWindow, nativeImage } = require('electron')
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs')
const { join } = require('node:path')
const { tmpdir } = require('node:os')

const root = join(__dirname, '..')
const TILE = 512
const jobs = [
  { svg: 'resources/icon.svg', w: 1024, h: 1024, out: ['resources/icon.png', 'build/icon.png'] },
  { svg: 'resources/logo-dark.svg', w: 2240, h: 1024, out: ['resources/logo-dark.png', 'src/renderer/src/assets/logo-dark.png'] },
  { svg: 'resources/logo-light.svg', w: 2240, h: 1024, out: ['resources/logo-light.png'] }
]

app.commandLine.appendSwitch('force-device-scale-factor', '1')
app.disableHardwareAcceleration()
app.on('window-all-closed', () => {})

async function renderTile(win, svg, x, y, w, h) {
  const tileSvg = svg
    .replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`)
    .replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`)
  const html = `<!doctype html><html><body style="margin:0;background:transparent;overflow:hidden">${tileSvg}</body></html>`
  const file = join(tmpdir(), 'exify-render-tile.html')
  writeFileSync(file, html)
  await win.loadFile(file)
  await new Promise((r) => setTimeout(r, 250))
  const img = await win.webContents.capturePage({ x: 0, y: 0, width: w, height: h })
  const size = img.getSize()
  if (size.width !== w || size.height !== h) throw new Error(`tile size ${JSON.stringify(size)} != ${w}x${h}`)
  return img.toBitmap() // BGRA
}

app.whenReady().then(async () => {
  mkdirSync(join(root, 'build'), { recursive: true })
  const win = new BrowserWindow({
    show: false,
    width: TILE,
    height: TILE,
    useContentSize: true,
    transparent: true,
    frame: false,
    webPreferences: { offscreen: true }
  })
  for (const job of jobs) {
    const svg = readFileSync(join(root, job.svg), 'utf8')
    const out = Buffer.alloc(job.w * job.h * 4)
    for (let ty = 0; ty < job.h; ty += TILE) {
      for (let tx = 0; tx < job.w; tx += TILE) {
        const w = Math.min(TILE, job.w - tx)
        const h = Math.min(TILE, job.h - ty)
        win.setContentSize(w, h)
        const bmp = await renderTile(win, svg, tx, ty, w, h)
        for (let row = 0; row < h; row++) {
          bmp.copy(out, ((ty + row) * job.w + tx) * 4, row * w * 4, (row + 1) * w * 4)
        }
      }
    }
    const png = nativeImage.createFromBitmap(out, { width: job.w, height: job.h }).toPNG()
    for (const o of job.out) writeFileSync(join(root, o), png)
    console.log('rendered', job.out.join(', '), `${job.w}x${job.h}`)
  }
  win.destroy()
  app.exit(0)
})
