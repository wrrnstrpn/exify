// Generates the Exify mark (aperture iris) and wordmark lockup as SVG.
// Usage: node scripts/make-logo.mjs
//   → resources/icon.svg, resources/logo-{dark,light}.svg, src/renderer/src/assets/mark.svg
import { writeFileSync, mkdirSync } from 'node:fs'

const C = 512
const R = 318 // iris outer radius
const r = 112 // hexagon opening radius
const ROT = -8 // degrees: gives the blades a gentle twist
const BLADES = [
  ['#FFC46B', '#F59E2E'], // amber
  ['#FF8A5B', '#E9573A'], // coral
  ['#F7609A', '#D23673'], // magenta
  ['#B66CF5', '#8A42E0'], // violet
  ['#6F7CFF', '#4552E6'], // indigo
  ['#3FD0D4', '#1B9FB0'] // teal
]

const rad = (d) => (d * Math.PI) / 180
const pt = (a, rr) => [C + rr * Math.cos(rad(a)), C + rr * Math.sin(rad(a))]
const V = Array.from({ length: 6 }, (_, i) => pt(ROT + i * 60 - 90, r))
const f = (n) => n.toFixed(2)

// Intersection of the ray p1→p2 (continuing beyond p2) with the outer circle.
function extendToCircle(p1, p2) {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  const fx = p2[0] - C
  const fy = p2[1] - C
  const a = dx * dx + dy * dy
  const b = 2 * (fx * dx + fy * dy)
  const c = fx * fx + fy * fy - R * R
  const t = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
  return [p2[0] + t * dx, p2[1] + t * dy]
}

// Each hexagon edge, extended, becomes the leading edge of one blade.
const P = V.map((_, i) => extendToCircle(V[i], V[(i + 1) % 6]))
const blades = V.map((_, i) => {
  const a = V[(i + 1) % 6]
  const pi = P[i]
  const pn = P[(i + 1) % 6]
  return `M${f(a[0])} ${f(a[1])} L${f(pi[0])} ${f(pi[1])} A${R} ${R} 0 0 1 ${f(pn[0])} ${f(pn[1])} Z`
})

const bladeDefs = (p) =>
  BLADES.map(([c1, c2], i) => {
    const mid = ROT + i * 60 - 30
    const [x1, y1] = pt(mid + 180, 60)
    const [x2, y2] = pt(mid, R)
    return `<linearGradient id="${p}b${i}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`
  }).join('')

const ringDef = (p) =>
  `<linearGradient id="${p}ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.30"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.05"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.22"/></linearGradient>`

const tileDefs = (p) =>
  `<linearGradient id="${p}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262833"/><stop offset="1" stop-color="#0E0F14"/></linearGradient>` +
  `<linearGradient id="${p}edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.18"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.02"/></linearGradient>`

const iris = (p, gap = 9) =>
  [
    `<circle cx="${C}" cy="${C}" r="${R + 26}" fill="none" stroke="url(#${p}ring)" stroke-width="6"/>`,
    `<g stroke="#121318" stroke-width="${gap}" stroke-linejoin="round">`,
    ...blades.map((d, i) => `<path d="${d}" fill="url(#${p}b${i})"/>`),
    `</g>`,
    `<polygon points="${V.map((v) => `${f(v[0])},${f(v[1])}`).join(' ')}" fill="#0B0C10"/>`,
    `<circle cx="${C - 34}" cy="${C - 38}" r="17" fill="#FFFFFF" opacity="0.92"/>`,
    `<circle cx="${C + 30}" cy="${C + 26}" r="7" fill="#FFFFFF" opacity="0.45"/>`
  ].join('\n')

const tile = (p) =>
  `<rect x="40" y="40" width="944" height="944" rx="224" fill="url(#${p}bg)"/>\n` +
  `<rect x="42" y="42" width="940" height="940" rx="222" fill="none" stroke="url(#${p}edge)" stroke-width="4"/>`

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<defs>${tileDefs('i')}${ringDef('i')}${bladeDefs('i')}</defs>
${tile('i')}
${iris('i')}
</svg>
`

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="150 150 724 724">
<defs>${ringDef('m')}${bladeDefs('m')}</defs>
${iris('m', 11)}
</svg>
`

const hex = (cx, cy, rr) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = rad(ROT + i * 60 - 90)
    return `${f(cx + rr * Math.cos(a))},${f(cy + rr * Math.sin(a))}`
  }).join(' ')

// Horizontal lockup. The dotless ı gets a tiny gradient hexagon — the aperture again.
const FONT = `'Segoe UI Variable Display','Segoe UI','Inter','Helvetica Neue',Arial,sans-serif`
const lockup = (text1, text2) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2240 1024" width="2240" height="1024">
<defs>${tileDefs('l')}${ringDef('l')}${bladeDefs('l')}
<linearGradient id="lword" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${text1}"/><stop offset="1" stop-color="${text2}"/></linearGradient>
<linearGradient id="ldot" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC46B"/><stop offset="0.5" stop-color="#F7609A"/><stop offset="1" stop-color="#6F7CFF"/></linearGradient>
</defs>
${tile('l')}
${iris('l')}
<text x="1120" y="700" font-family="${FONT}" font-weight="600" font-size="440" letter-spacing="-10" fill="url(#lword)">ex<tspan>ı</tspan>fy</text>
<polygon points="${hex(1603, 404, 42)}" fill="url(#ldot)"/>
</svg>
`

mkdirSync('resources', { recursive: true })
mkdirSync('src/renderer/src/assets', { recursive: true })
writeFileSync('resources/icon.svg', icon)
writeFileSync('resources/logo-dark.svg', lockup('#FFFFFF', '#C9CBD6'))
writeFileSync('resources/logo-light.svg', lockup('#1A1B22', '#3A3D4A'))
writeFileSync('src/renderer/src/assets/mark.svg', mark)
console.log('wrote resources/icon.svg, resources/logo.svg, src/renderer/src/assets/mark.svg')
