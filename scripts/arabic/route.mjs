// Turns a stroke recipe into an ordered centreline: waypoints are snapped onto
// the letter's skeleton and joined by the shortest path ALONG the skeleton, so
// the geometry always comes from the font; the recipe only says where to start,
// which way to go round loops and where to end.
import { endpoints, junctions } from "./skeleton.mjs";

const DIRS = {
  top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0],
  "top-right": [Math.SQRT1_2, -Math.SQRT1_2], "top-left": [-Math.SQRT1_2, -Math.SQRT1_2],
  "bottom-right": [Math.SQRT1_2, Math.SQRT1_2], "bottom-left": [-Math.SQRT1_2, Math.SQRT1_2],
};

const xy = (p, w) => [p % w, (p - (p % w)) / w];

function nearest(pixels, w, [x, y]) {
  let best = -1, bestD = Infinity;
  for (const p of pixels) {
    const [px, py] = xy(p, w);
    const d = (px - x) ** 2 + (py - y) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

function extreme(pixels, w, [dx, dy]) {
  let best = -1, bestV = -Infinity;
  for (const p of pixels) {
    const [px, py] = xy(p, w);
    const v = px * dx + py * dy;
    if (v > bestV) { bestV = v; best = p; }
  }
  return best;
}

/**
 * A waypoint is one of
 *   { end: "top-right" }   the skeleton line end furthest in that direction
 *   { end: [x, y] }        the line end nearest a design-box point
 *   { at: [x, y] }         the skeleton pixel nearest a design-box point
 *   { fork: [x, y] }       the branch point nearest a design-box point
 *   { apex: "top" }        (first waypoint only) the pointed tip of the ink in that
 *                          direction — for a stroke that starts in a sharp corner the
 *                          skeleton does not reach (the top of the round ه); the stroke
 *                          runs straight from just inside the tip to the nearest
 *                          skeleton point, then on along the skeleton
 */
export function snap(waypoint, skel, w, scale) {
  let pool = skel.list;
  if (waypoint.end) pool = endpoints(skel, w);
  else if (waypoint.fork) pool = junctions(skel, w);
  const target = waypoint.end ?? waypoint.fork ?? waypoint.at;
  if (!pool.length) throw new Error(`no skeleton pixels to snap ${JSON.stringify(waypoint)}`);
  if (typeof target === "string") {
    if (!DIRS[target]) throw new Error(`unknown direction ${target}`);
    return extreme(pool, w, DIRS[target]);
  }
  return nearest(pool, w, [target[0] * scale, target[1] * scale]);
}

class Heap {
  constructor() { this.items = []; }
  push(item) {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (a[parent][0] <= a[i][0]) break;
      [a[parent], a[i]] = [a[i], a[parent]];
      i = parent;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
  get size() { return this.items.length; }
}

/** Shortest 8-connected path between two skeleton pixels, staying on the skeleton. */
export function shortestPath(img, w, from, to) {
  const dist = new Map([[from, 0]]);
  const prev = new Map();
  const heap = new Heap();
  heap.push([0, from]);
  while (heap.size) {
    const [d, p] = heap.pop();
    if (p === to) break;
    if (d > dist.get(p)) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const q = p + dy * w + dx;
      if (!img[q]) continue;
      const nd = d + (dx && dy ? Math.SQRT2 : 1);
      if (nd < (dist.get(q) ?? Infinity)) { dist.set(q, nd); prev.set(q, p); heap.push([nd, q]); }
    }
  }
  if (!dist.has(to)) throw new Error("waypoints are not connected on the skeleton");
  const path = [to];
  while (path[path.length - 1] !== from) path.push(prev.get(path[path.length - 1]));
  return path.reverse();
}

export function polyLength(points) {
  let s = 0;
  for (let i = 1; i < points.length; i++) s += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return s;
}

export function resample(points, spacing) {
  const total = polyLength(points);
  const n = Math.max(1, Math.round(total / spacing));
  const out = [points[0]];
  let seg = 1, acc = 0;
  for (let k = 1; k < n; k++) {
    const want = (total * k) / n;
    while (seg < points.length) {
      const [ax, ay] = points[seg - 1], [bx, by] = points[seg];
      const len = Math.hypot(bx - ax, by - ay);
      if (acc + len >= want) {
        const t = len ? (want - acc) / len : 0;
        out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
        break;
      }
      acc += len;
      seg++;
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Gaussian smoothing along the line; the two end points stay where they are. */
function smooth(points, sigmaSamples) {
  const k = Math.ceil(sigmaSamples * 2.5);
  return points.map((p, i) => {
    if (i === 0 || i === points.length - 1) return p;
    const reach = Math.min(k, i, points.length - 1 - i);
    let sx = 0, sy = 0, sw = 0;
    for (let j = -reach; j <= reach; j++) {
      const wgt = Math.exp(-(j * j) / (2 * sigmaSamples * sigmaSamples));
      sx += points[i + j][0] * wgt; sy += points[i + j][1] * wgt; sw += wgt;
    }
    return [sx / sw, sy / sw];
  });
}

/**
 * Pushes a free line end out along its own direction while the ink stays
 * thick around it: the skeleton stops about one stroke radius short of a
 * square-cut end and bends towards one corner; this restores a straight end.
 */
function extendEnd(points, inside, radius, scale) {
  const trim = Math.max(2, Math.round(radius * 0.8));
  const body = points.slice(trim);
  if (body.length < 4) return points;
  const back = body[Math.min(body.length - 1, Math.round(radius * 1.5))];
  const [ex, ey] = body[0];
  let dx = ex - back[0], dy = ey - back[1];
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  const added = [];
  for (let s = 1; s <= radius * 1.2; s += 1) {
    const x = ex + dx * s, y = ey + dy * s;
    if (inside(x * scale, y * scale) < radius * 0.45 * scale) break;
    added.push([x, y]);
  }
  return [...added.reverse(), ...body];
}

/** A straight lead-in from just inside a pointed tip of the ink to skeleton pixel `pin`. */
function apexLeadIn(direction, pin, ctx) {
  const { pixels, w, scale, inkDepth, radius } = ctx;
  const [ax, ay] = xy(extreme(pixels, w, DIRS[direction]), w).map((v) => v / scale);
  const [bx, by] = xy(pin, w).map((v) => v / scale);
  const lead = resample([[ax, ay], [bx, by]], 1);
  const first = lead.findIndex(([x, y]) => inkDepth(x * scale, y * scale) >= radius * 0.5 * scale);
  return lead.slice(Math.max(0, first), -1);
}

/** Builds one `line` stroke (design units) from its recipe waypoints. */
export function routeStroke(recipe, ctx) {
  const { skel, w, scale, inkDepth, radius } = ctx;
  const apex = recipe.via[0].apex;
  const via = apex ? recipe.via.slice(1) : recipe.via;
  const pins = via.map((wp) => snap(wp, skel, w, scale));
  let pixels = [pins[0]];
  for (let i = 1; i < pins.length; i++) pixels = pixels.concat(shortestPath(skel.img, w, pins[i - 1], pins[i]).slice(1));
  let points = pixels.map((p) => xy(p, w)).map(([x, y]) => [x / scale, y / scale]);
  if (apex) points = [...apexLeadIn(apex, pins[0], ctx), ...points];
  points = resample(points, 1);
  if (via[0].end && !apex) points = extendEnd(points, inkDepth, radius, scale);
  if (recipe.via[recipe.via.length - 1].end) points = extendEnd(points.slice().reverse(), inkDepth, radius, scale).reverse();
  points = smooth(resample(points, 2), 2.5);
  return resample(points, 10).map(([x, y]) => [Math.round(x), Math.round(y)]);
}
