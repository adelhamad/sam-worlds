// Geometry self-check of the stroke builder against the raster it came from:
//   on-ink  — every stroke sample lies on the glyph's ink (within ON_INK units);
//   cover   — the strokes, brushed at the glyph's stroke width, cover ≥ COVER of the ink;
//   spill   — and at most SPILL of that brush falls outside the ink.
export const ON_INK = 15; // 1.5 % of the 1000-unit box
export const COVER = 0.92;
export const SPILL = 0.08;

function stamp(brush, w, cx, cy, r) {
  const r2 = r * r;
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(w - 1, Math.ceil(cy + r)); y++) {
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(w - 1, Math.ceil(cx + r)); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) brush[y * w + x] = 1;
    }
  }
}

/** Ink depth along the normal on each side of every line sample: |left − right| / 2 is how far it sits off the stroke's centre. */
function centring(strokes, mask, w, scale) {
  const offsets = [];
  const reach = (x, y, dx, dy) => {
    let s = 0;
    while (s < 120 && mask[Math.round((y + dy * s) * scale) * w + Math.round((x + dx * s) * scale)]) s += 0.5;
    return s;
  };
  for (const stroke of strokes) {
    if (stroke.kind !== "line") continue;
    const p = stroke.points;
    for (let i = 2; i < p.length - 2; i++) {
      const tx = p[i + 2][0] - p[i - 2][0], ty = p[i + 2][1] - p[i - 2][1];
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len, ny = tx / len;
      const a = reach(p[i][0], p[i][1], nx, ny), b = reach(p[i][0], p[i][1], -nx, -ny);
      if (a < 120 && b < 120) offsets.push(Math.abs(a - b) / 2);
    }
  }
  offsets.sort((x, y) => x - y);
  const at = (q) => offsets[Math.min(offsets.length - 1, Math.floor(q * offsets.length))] ?? 0;
  return { median: at(0.5), p95: at(0.95) };
}

/**
 * strokes: [{ kind, points, radius? }] in design units. outside: distance (px)
 * from each pixel to the nearest ink pixel. Returns the measured numbers and a
 * list of problems (empty = pass).
 */
export function checkGeometry({ strokes, mask, outside, w, scale, radius }) {
  const problems = [];
  let worst = 0;
  for (const [i, stroke] of strokes.entries()) {
    for (const [x, y] of stroke.points) {
      const px = Math.round(x * scale), py = Math.round(y * scale);
      const off = outside[py * w + px] / scale;
      worst = Math.max(worst, off);
      if (off > ON_INK) { problems.push(`stroke ${i + 1} leaves the ink by ${off.toFixed(1)} at ${x},${y}`); break; }
    }
  }
  const brush = new Uint8Array(w * w);
  for (const stroke of strokes) {
    const r = (stroke.radius ?? radius) * scale;
    const pts = stroke.points;
    stamp(brush, w, pts[0][0] * scale, pts[0][1] * scale, r);
    for (let k = 1; k < pts.length; k++) {
      const [ax, ay] = pts[k - 1], [bx, by] = pts[k];
      const steps = Math.ceil(Math.hypot(bx - ax, by - ay) * scale / 2);
      for (let s = 1; s <= steps; s++) stamp(brush, w, (ax + ((bx - ax) * s) / steps) * scale, (ay + ((by - ay) * s) / steps) * scale, r);
    }
  }
  let ink = 0, covered = 0, brushed = 0, spilled = 0;
  for (let p = 0; p < mask.length; p++) {
    if (mask[p]) { ink++; if (brush[p]) covered++; }
    if (brush[p]) { brushed++; if (!mask[p]) spilled++; }
  }
  const cover = covered / ink, spill = spilled / brushed;
  if (cover < COVER) problems.push(`covers ${(cover * 100).toFixed(1)} % of the ink (< ${COVER * 100} %)`);
  if (spill > SPILL) problems.push(`spills ${(spill * 100).toFixed(1)} % outside the ink (> ${SPILL * 100} %)`);
  return { cover, spill, worst, centre: centring(strokes, mask, w, scale), problems };
}
