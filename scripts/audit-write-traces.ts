// Synthetic finger traces for audit-write.ts: a path as a finger would report
// it (at a given speed), with wobble, an off-dot start, stopping short or
// overshooting, plus the wrong-way-round-a-loop variant.
import type { RNG } from "../src/engine/rng";
import { dist, distToSegment, polyLength } from "../src/engine/write/geom";
import type { Point } from "../src/engine/write/types";

/** Points along a polyline every `spacing` units (a finger reporting at a given speed). */
export function sampleEvery(points: readonly Point[], spacing: number): Point[] {
  const out: Point[] = [[points[0][0], points[0][1]]];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = dist(a, b);
    let s = spacing - carry;
    while (s <= len) {
      out.push([a[0] + ((b[0] - a[0]) * s) / len, a[1] + ((b[1] - a[1]) * s) / len]);
      s += spacing;
    }
    carry = len - (s - spacing);
  }
  const last = points[points.length - 1];
  out.push([last[0], last[1]]);
  return out;
}

export interface Finger {
  /** Largest sideways wobble, units (it varies slowly along the stroke). */
  wobble: number;
  /** Per-event jitter, ± units. */
  jitter: number;
  /** How far off the start dot the finger lands, units (fades as it finds the path). */
  startOff: number;
}

export const STEADY: Finger = { wobble: 22, jitter: 9, startOff: 35 };
/** A fast touch screen: a point every 2 units, each up to ±7 units (≈ 2 px) off. */
export const JITTERY: Finger = { wobble: 15, jitter: 7, startOff: 30 };
/** A 7-year-old on a phone: a bigger wobble and landing well off the dot. */
export const SHAKY: Finger = { wobble: 40, jitter: 12, startOff: 70 };

export function wobble(points: readonly Point[], rng: RNG, finger: Finger): Point[] {
  const phase = rng() * Math.PI * 2;
  const wave = 120 + rng() * 120;
  const amp = finger.wobble * (0.6 + rng() * 0.4);
  const angle = rng() * Math.PI * 2;
  const off = finger.startOff * (0.5 + rng() * 0.5);
  let s = 0;
  return points.map((p, i) => {
    if (i > 0) s += dist(points[i - 1], p);
    const next = points[Math.min(points.length - 1, i + 1)];
    const prev = points[Math.max(0, i - 1)];
    const len = dist(prev, next) || 1;
    const side = amp * Math.sin((2 * Math.PI * s) / wave + phase);
    const fade = Math.max(0, 1 - s / 150);
    return [
      p[0] - ((next[1] - prev[1]) / len) * side + (rng() * 2 - 1) * finger.jitter + Math.cos(angle) * off * fade,
      p[1] + ((next[0] - prev[0]) / len) * side + (rng() * 2 - 1) * finger.jitter + Math.sin(angle) * off * fade,
    ];
  });
}

/** The path cut to a share of its length. */
export function cutTo(points: readonly Point[], share: number): Point[] {
  const want = polyLength(points) * share;
  const out: Point[] = [points[0]];
  let s = 0;
  for (let i = 1; i < points.length; i++) {
    const step = dist(points[i - 1], points[i]);
    if (s + step >= want) {
      const t = (want - s) / step;
      out.push([points[i - 1][0] + (points[i][0] - points[i - 1][0]) * t, points[i - 1][1] + (points[i][1] - points[i - 1][1]) * t]);
      return out;
    }
    s += step;
    out.push(points[i]);
  }
  return out;
}

/** The path minus its last `units`. */
export function cutBy(points: readonly Point[], units: number): Point[] {
  return cutTo(points, Math.max(0.05, 1 - units / polyLength(points)));
}

/** The path carried on past its end, straight along its last direction. */
export function overshoot(points: readonly Point[], by: number): Point[] {
  const a = points[Math.max(0, points.length - 4)];
  const b = points[points.length - 1];
  const len = dist(a, b) || 1;
  return [...points, [b[0] + ((b[0] - a[0]) / len) * by, b[1] + ((b[1] - a[1]) / len) * by]];
}

export function maxDeviationFromChord(points: readonly Point[]): number {
  const a = points[0];
  const b = points[points.length - 1];
  return Math.max(...points.map((p) => distToSegment(p, a, b)));
}

export function isSymmetric(points: readonly Point[]): boolean {
  return points.every((p, i) => dist(p, points[points.length - 1 - i]) < 30);
}

/**
 * Closed loops inside a stroke (the path comes back to a point it passed ≥ 30
 * samples earlier) that are real loops, not an up-and-down retrace of a tooth:
 * returns [from, to] index pairs.
 */
export function loopsOf(points: readonly Point[]): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let i = 0;
  while (i < points.length) {
    let to = -1;
    for (let j = i + 30; j < points.length; j++) if (dist(points[i], points[j]) < 15) to = j;
    if (to >= 0 && !isSymmetric(points.slice(i, to + 1))) out.push([i, to]);
    i = to >= 0 ? to + 1 : i + 1;
  }
  return out;
}

/** The same path, but going round loop [from, to] the other way. */
export function wrongWayRound(points: readonly Point[], [from, to]: [number, number]): Point[] {
  return [...points.slice(0, from), ...points.slice(from, to + 1).reverse(), ...points.slice(to + 1)];
}
