// Generates the "S" emblem PWA icons as PNGs with zero image dependencies.
// Run: bun scripts/make-icons.ts
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  out.set([...type].map((ch) => ch.charCodeAt(0)), 4);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function encodePNG(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  const raw = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (1 + width * 4) + 1);
  }
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = chunk("IDAT", new Uint8Array(deflateSync(raw)));
  const parts = [sig, chunk("IHDR", ihdr), idat, chunk("IEND", new Uint8Array(0))];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const png = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    png.set(p, off);
    off += p.length;
  }
  return png;
}

// 7x9 pixel grid for the "S"
const S_GRID = [
  ".#####.",
  "##...##",
  "##.....",
  "##.....",
  ".#####.",
  ".....##",
  ".....##",
  "##...##",
  ".#####.",
];

const BG = [11, 27, 58, 255]; // deep night blue
const FG = [34, 211, 238, 255]; // signature electric cyan
const GLOW = [16, 80, 120, 255];

function drawBackground(px: Uint8Array, size: number): void {
  const radius = size * 0.18;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // rounded-rect background, transparent corners
      const cx = Math.max(radius - x, x - (size - 1 - radius), 0);
      const cy = Math.max(radius - y, y - (size - 1 - radius), 0);
      const inside = cx * cx + cy * cy <= radius * radius;
      const i = (y * size + x) * 4;
      px.set(inside ? BG : [0, 0, 0, 0], i);
    }
  }
}

function paintGlyphCell(
  px: Uint8Array,
  size: number,
  x0: number,
  y0: number,
  cell: number,
  glowPad: number,
): void {
  for (let y = y0 - glowPad; y < y0 + cell + glowPad; y++) {
    for (let x = x0 - glowPad; x < x0 + cell + glowPad; x++) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const i = (y * size + x) * 4;
      if (px[i + 3] === 0) continue;
      const isCore = x >= x0 && x < x0 + cell && y >= y0 && y < y0 + cell;
      if (isCore) px.set(FG, i);
      else if (px[i] === BG[0] && px[i + 1] === BG[1]) px.set(GLOW, i);
    }
  }
}

function drawIcon(size: number, padFrac: number): Uint8Array {
  const px = new Uint8Array(size * size * 4);
  drawBackground(px, size);
  // scale the S grid into the padded center
  const pad = Math.floor(size * padFrac);
  const inner = size - pad * 2;
  const gw = S_GRID[0].length;
  const gh = S_GRID.length;
  const cell = Math.floor(Math.min(inner / gw, inner / gh));
  const ox = Math.floor((size - cell * gw) / 2);
  const oy = Math.floor((size - cell * gh) / 2);
  const glowPad = Math.max(1, Math.floor(cell * 0.25));
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      if (S_GRID[gy][gx] !== "#") continue;
      paintGlyphCell(px, size, ox + gx * cell, oy + gy * cell, cell, glowPad);
    }
  }
  return px;
}

mkdirSync("public/icons", { recursive: true });
for (const [name, size, pad] of [
  ["icon-192.png", 192, 0.16],
  ["icon-512.png", 512, 0.16],
  ["icon-512-maskable.png", 512, 0.26],
] as const) {
  writeFileSync(`public/icons/${name}`, encodePNG(size, size, drawIcon(size, pad)));
  console.log(`wrote public/icons/${name}`);
}
