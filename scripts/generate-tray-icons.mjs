/**
 * generate-tray-icons.mjs
 * Generates 11 retro-hacker tray icons (0%..100% step 10) as pure PNGs.
 * No dependencies — uses zlib + a minimal PNG encoder.
 *
 * Usage: node scripts/generate-tray-icons.mjs
 * Output: resources/tray/tray-0.png ... tray-100.png
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(here, '../resources/tray')
fs.mkdirSync(outDir, { recursive: true })

// ---- CRC32 (PNG chunk checksums) ----
const crcTable = new Int32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c
}
function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}
function encodePNG(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ])
}

// ---- Icon art: retro terminal droplet / bottle ----
const S = 32
// Neon palette per level (mirrors renderer mood themes)
function paletteFor(pct) {
  if (pct <= 30) return { glow: [255, 176, 32], water: [255, 140, 0], waterTop: [255, 220, 120] } // amber alert
  if (pct <= 70) return { glow: [0, 229, 255], water: [0, 180, 255], waterTop: [160, 255, 255] } // cyan
  if (pct < 100) return { glow: [52, 255, 150], water: [0, 220, 140], waterTop: [190, 255, 220] } // matrix green
  return { glow: [170, 130, 255], water: [90, 80, 255], waterTop: [210, 200, 255] } // midnight purple
}

function drawIcon(pct) {
  const { glow, water, waterTop } = paletteFor(pct)
  const rgba = Buffer.alloc(S * S * 4, 0)
  const set = (x, y, r, g, b, a) => {
    if (x < 0 || y < 0 || x >= S || y >= S) return
    const i = (y * S + x) * 4
    rgba[i] = r
    rgba[i + 1] = g
    rgba[i + 2] = b
    rgba[i + 3] = a
  }
  // Bottle bounds
  const x0 = 8, x1 = 23, y0 = 6, y1 = 28
  const innerH = y1 - y0 - 3
  const fillH = Math.round((pct / 100) * innerH)
  const waterTopY = y1 - 2 - fillH
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const onLeft = x === x0 || x === x0 + 1 - 1
      const border =
        (x >= x0 && x <= x1 && (y === y0 || y === y1)) || ((y >= y0 && y <= y1) && (x === x0 || x === x1))
      const inside = x > x0 && x < x1 && y > y0 && y < y1
      if (border) {
        // neon border, dimmer at top cap gap
        const dim = y === y0 && x > x0 + 3 && x < x1 - 3 ? 0.25 : 1
        set(x, y, glow[0] * dim, glow[1] * dim, glow[2] * dim, 255)
      } else if (inside) {
        if (y >= waterTopY) {
          const isSurface = y <= waterTopY + 1
          const c = isSurface ? waterTop : water
          // subtle vertical dither for "phosphor" feel
          const d = ((x + y) % 2 === 0 ? 8 : 0)
          set(x, y, Math.max(0, c[0] - d), Math.max(0, c[1] - d), Math.max(0, c[2] - d), 255)
        } else {
          // empty region: faint grid dots so tray icon reads on dark + light bars
          if (x % 2 === 0 && y % 2 === 0) set(x, y, glow[0], glow[1], glow[2], 34)
          else set(x, y, 0, 0, 0, 0)
        }
      }
      void onLeft
    }
  }
  // Cap / antenna nubs
  for (let x = x0 + 3; x <= x1 - 3; x++) {
    set(x, y0 - 2, glow[0], glow[1], glow[2], 255)
    set(x, y0 - 1, glow[0], glow[1], glow[2], 120)
  }
  return encodePNG(S, S, rgba)
}

const levels = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
for (const lvl of levels) {
  const png = drawIcon(lvl)
  const file = path.join(outDir, `tray-${lvl}.png`)
  fs.writeFileSync(file, png)
  console.log(`wrote ${path.relative(process.cwd(), file)} (${png.length} bytes)`)
}
console.log('done: 11 tray icons generated.')
