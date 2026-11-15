// SVG helpers for stroke polylines (design-box units). Pure.
import type { GlyphStrokes, Point } from "../../engine/write/types";

/** Radius of a written dot. */
export function dotRadius(glyph: GlyphStrokes): number {
  return glyph.width * 0.6;
}

export function pathD(points: readonly Point[]): string {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
}

function cumulative(points: readonly Point[]): number[] {
  const out = [0];
  for (let i = 1; i < points.length; i++) {
    out.push(out[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  return out;
}

export function lengthOf(points: readonly Point[]): number {
  return cumulative(points)[points.length - 1];
}

/** Position and heading (radians) at `distance` along the line, clamped to it. */
export function poseAt(points: readonly Point[], distance: number): { x: number; y: number; angle: number } {
  if (points.length < 2) return { x: points[0][0], y: points[0][1], angle: 0 };
  const acc = cumulative(points);
  const d = Math.max(0, Math.min(acc[acc.length - 1], distance));
  let i = 1;
  while (i < points.length - 1 && acc[i] < d) i++;
  const [ax, ay] = points[i - 1];
  const [bx, by] = points[i];
  const seg = acc[i] - acc[i - 1] || 1;
  const t = (d - acc[i - 1]) / seg;
  return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, angle: Math.atan2(by - ay, bx - ax) };
}

/** Chevron arrowheads every `every` units along the line, skipping the very start. */
export function chevrons(points: readonly Point[], every: number, first = every * 0.6): Array<{ x: number; y: number; angle: number }> {
  const total = lengthOf(points);
  const out: Array<{ x: number; y: number; angle: number }> = [];
  for (let d = first; d < total - every * 0.3; d += every) out.push(poseAt(points, d));
  return out;
}

/** Chevron "›" shape pointing along +x, centred on the origin, size in units. */
export function chevronD(size: number): string {
  const h = size * 0.55;
  return `M${-size * 0.45} ${-h} L${size * 0.35} 0 L${-size * 0.45} ${h}`;
}

/** Where to put a stroke's number badge: just behind its start, against the direction of travel. */
export function badgeSpot(points: readonly Point[], offset: number, away?: Point): Point {
  const [sx, sy] = points[0];
  if (points.length < 2) {
    const dx = away ? sx - away[0] : 0;
    const dy = away ? sy - away[1] : 0;
    const len = Math.hypot(dx, dy);
    return len > 5 ? [sx + (dx / len) * offset, sy + (dy / len) * offset] : [sx + offset * 0.75, sy - offset * 0.75];
  }
  const { angle } = poseAt(points, Math.min(30, lengthOf(points) / 2));
  return [sx - Math.cos(angle) * offset, sy - Math.sin(angle) * offset];
}
