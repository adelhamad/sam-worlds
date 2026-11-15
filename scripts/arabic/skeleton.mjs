// Raster geometry for the Arabic stroke builder: connected components, a
// Euclidean distance transform, Zhang–Suen thinning with a one-pixel cleanup
// and spur pruning. Masks are Uint8Array (1 = ink), row-major, size w × h.

const N8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

/** 8-connected components of the ink, largest first: { pixels, area, bbox:[x0,y0,x1,y1] }. */
export function components(mask, w, h) {
  const label = new Int32Array(w * h).fill(-1);
  const out = [];
  const stack = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || label[start] >= 0) continue;
    const id = out.length;
    const pixels = [];
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    label[start] = id;
    stack.push(start);
    while (stack.length) {
      const p = stack.pop();
      pixels.push(p);
      const x = p % w, y = (p - x) / w;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const [dx, dy] of N8) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (mask[q] && label[q] < 0) { label[q] = id; stack.push(q); }
      }
    }
    out.push({ pixels: Int32Array.from(pixels), area: pixels.length, bbox: [x0, y0, x1, y1] });
  }
  return out.sort((a, b) => b.area - a.area);
}

function edt1d(f, n) {
  const d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  let k = 0;
  v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
  return d;
}

/** Distance (pixels) from every pixel where `inside(i)` is true to the nearest pixel where it is false. */
export function distanceTransform(w, h, inside) {
  const INF = 1e12;
  const grid = new Float64Array(w * h);
  for (let i = 0; i < grid.length; i++) grid[i] = inside(i) ? INF : 0;
  const col = new Float64Array(h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) col[y] = grid[y * w + x];
    const d = edt1d(col, h);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  const row = new Float64Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) row[x] = grid[y * w + x];
    const d = edt1d(row, w);
    for (let x = 0; x < w; x++) grid[y * w + x] = Math.sqrt(d[x]);
  }
  return grid;
}

function ring(img, w, p) {
  // P2..P9 clockwise from north, as in Zhang & Suen (1984).
  return [img[p - w], img[p - w + 1], img[p + 1], img[p + w + 1], img[p + w], img[p + w - 1], img[p - 1], img[p - w - 1]];
}

function transitions(n) {
  let t = 0;
  for (let i = 0; i < 8; i++) if (!n[i] && n[(i + 1) % 8]) t++;
  return t;
}

function zhangSuenPass(img, w, list, first) {
  const del = [];
  for (const p of list) {
    if (!img[p]) continue;
    const n = ring(img, w, p);
    const b = n.reduce((s, v) => s + v, 0);
    if (b < 2 || b > 6 || transitions(n) !== 1) continue;
    const [p2, , p4, , p6, , p8] = n;
    const ok = first ? !(p2 && p4 && p6) && !(p4 && p6 && p8) : !(p2 && p4 && p8) && !(p2 && p6 && p8);
    if (ok) del.push(p);
  }
  for (const p of del) img[p] = 0;
  return del.length;
}

/** Zhang–Suen thinning of one component (pixels must not touch the image border). */
export function thin(pixels, w, h) {
  const img = new Uint8Array(w * h);
  for (const p of pixels) img[p] = 1;
  let list = Array.from(pixels);
  for (let guard = 0; guard < 400; guard++) {
    const changed = zhangSuenPass(img, w, list, true) + zhangSuenPass(img, w, list, false);
    list = list.filter((p) => img[p]);
    if (!changed) break;
  }
  // One-pixel cleanup: drop staircase corner pixels that are simple points, so
  // every remaining pixel on a line has exactly two neighbours.
  for (const p of list) {
    if (!img[p]) continue;
    const n = ring(img, w, p);
    const [p2, , p4, , p6, , p8] = n;
    const corner = (p2 && p4) || (p4 && p6) || (p6 && p8) || (p8 && p2);
    if (corner && transitions(n) === 1 && n.reduce((s, v) => s + v, 0) >= 2) img[p] = 0;
  }
  return { img, list: list.filter((p) => img[p]) };
}

export function degree(img, w, p) {
  let d = 0;
  for (const [dx, dy] of N8) d += img[p + dy * w + dx];
  return d;
}

export function neighbours(img, w, p) {
  const out = [];
  for (const [dx, dy] of N8) {
    const q = p + dy * w + dx;
    if (img[q]) out.push(q);
  }
  return out;
}

/** Crossing number: 1 = line end, 2 = on a line, ≥ 3 = branch point. */
export function crossing(img, w, p) {
  return transitions(ring(img, w, p));
}

/**
 * Splits the skeleton at branch points: returns the pixel runs between them,
 * each with the branch-point pixels it touches and whether it has a free end.
 */
export function segments(skel, w) {
  const { img, list } = skel;
  const isJunction = new Set(list.filter((p) => crossing(img, w, p) >= 3));
  const seen = new Set();
  const out = [];
  for (const start of list) {
    if (isJunction.has(start) || seen.has(start)) continue;
    const pixels = [];
    const touches = new Set();
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const p = stack.pop();
      pixels.push(p);
      for (const q of neighbours(img, w, p)) {
        if (isJunction.has(q)) touches.add(q);
        else if (!seen.has(q)) { seen.add(q); stack.push(q); }
      }
    }
    const free = pixels.some((p) => degree(img, w, p) === 1 || (crossing(img, w, p) === 1 && degree(img, w, p) <= 2));
    out.push({ pixels, touches: [...touches], free });
  }
  return { segments: out, junctions: [...isJunction] };
}

/** Removes spurs: free-ended runs hanging off a branch point, shorter than factor × the local stroke radius. */
export function prune(skel, w, dist, factor) {
  for (let round = 0; round < 8; round++) {
    const { segments: runs } = segments(skel, w);
    let removed = 0;
    for (const run of runs) {
      if (!run.free || !run.touches.length) continue;
      const radius = Math.max(...run.touches.map((j) => dist[j]));
      if (run.pixels.length < radius * factor + 2) {
        for (const p of run.pixels) skel.img[p] = 0;
        removed++;
      }
    }
    skel.list = skel.list.filter((p) => skel.img[p]);
    // A removed spur can leave a lone branch-point pixel bump: thin again.
    if (removed) skel = thin(skel.list, w, Math.ceil(skel.img.length / w));
    else break;
  }
  return skel;
}

export function endpoints(skel, w) {
  return skel.list.filter((p) => degree(skel.img, w, p) === 1 || (crossing(skel.img, w, p) === 1 && degree(skel.img, w, p) <= 2));
}

export function junctions(skel, w) {
  return skel.list.filter((p) => crossing(skel.img, w, p) >= 3);
}
