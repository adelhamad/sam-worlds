// Polyline helpers for the handwriting judge. Pure.
import type { Point } from "./types";

export function dist(a: Point, b: Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function polyLength(points: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
  return total;
}

/** Drops consecutive duplicates (a finger resting still reports the same point many times). */
export function dedupe(points: readonly Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push([p[0], p[1]]);
  }
  return out;
}

/**
 * Keeps a point only once it is `spacing` away from the last kept one (the
 * last point always stays). A fast touch screen reports a point every pixel or
 * two with a pixel of jitter; measured raw, that zigzag makes a trail look
 * several times longer than the line it draws.
 */
export function decimate(points: readonly Point[], spacing: number): Point[] {
  if (points.length < 3) return points.map((p) => [p[0], p[1]] as Point);
  const out: Point[] = [[points[0][0], points[0][1]]];
  for (let i = 1; i < points.length - 1; i++) {
    if (dist(points[i], out[out.length - 1]) >= spacing) out.push([points[i][0], points[i][1]]);
  }
  const last = points[points.length - 1];
  if (out.length > 1 && dist(last, out[out.length - 1]) < spacing / 2) out.pop();
  out.push([last[0], last[1]]);
  return out;
}

/** `n` points evenly spaced by arc length (n ≥ 2). A single point is repeated. */
export function resampleN(points: readonly Point[], n: number): Point[] {
  if (points.length === 0) return [];
  const total = polyLength(points);
  if (points.length === 1 || total === 0) return Array.from({ length: n }, () => [points[0][0], points[0][1]] as Point);
  const out: Point[] = [[points[0][0], points[0][1]]];
  let seg = 1;
  let acc = 0;
  for (let k = 1; k < n - 1; k++) {
    const want = (total * k) / (n - 1);
    while (seg < points.length - 1 && acc + dist(points[seg - 1], points[seg]) < want) {
      acc += dist(points[seg - 1], points[seg]);
      seg++;
    }
    const a = points[seg - 1];
    const b = points[seg];
    const len = dist(a, b);
    const t = len ? Math.min(1, (want - acc) / len) : 0;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  const last = points[points.length - 1];
  out.push([last[0], last[1]]);
  return out;
}

export function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
  return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t));
}

export function distToPolyline(p: Point, line: readonly Point[]): number {
  if (line.length === 1) return dist(p, line[0]);
  let best = Infinity;
  for (let i = 1; i < line.length; i++) best = Math.min(best, distToSegment(p, line[i - 1], line[i]));
  return best;
}

/** Value at fraction q (0–1) of the sorted values. */
export function quantile(values: readonly number[], q: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

/**
 * Dynamic time warping: the best IN-ORDER match of `a` onto `b` (both ends
 * matched to both ends). Returns the point-to-point distances along the
 * matching path — small when `a` follows `b` in the same order, large on the
 * part where it runs the other way round a loop, even if every point sits on
 * the path.
 */
function cheapestPrevious(cost: Float64Array, i: number, j: number, m: number): number {
  const k = i * m + j;
  let from = -1;
  for (const prev of [i > 0 && j > 0 ? k - m - 1 : -1, i > 0 ? k - m : -1, j > 0 ? k - 1 : -1]) {
    if (prev >= 0 && (from < 0 || cost[prev] < cost[from])) from = prev;
  }
  return from;
}

export function orderedDistances(a: readonly Point[], b: readonly Point[]): number[] {
  const n = a.length;
  const m = b.length;
  const cost = new Float64Array(n * m);
  const from = new Int32Array(n * m).fill(-1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const k = i * m + j;
      from[k] = cheapestPrevious(cost, i, j, m);
      cost[k] = (from[k] >= 0 ? cost[from[k]] : 0) + dist(a[i], b[j]);
    }
  }
  const out: number[] = [];
  for (let k = n * m - 1; k >= 0; k = from[k]) out.push(dist(a[Math.floor(k / m)], b[k % m]));
  return out.reverse();
}
