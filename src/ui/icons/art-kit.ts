// Small helpers shared by the vocabulary icon files (art-food, art-home, …).
import { circ, ell, type Part } from "./geom";

const r2 = (n: number) => Math.round(n * 100) / 100;

/** An ellipse turned by `deg` degrees about its centre, as a path. */
export function tell(cx: number, cy: number, rx: number, ry: number, deg: number): string {
  const a = (deg * Math.PI) / 180;
  const dx = r2(2 * rx * Math.cos(a));
  const dy = r2(2 * rx * Math.sin(a));
  const sx = r2(cx - rx * Math.cos(a));
  const sy = r2(cy - rx * Math.sin(a));
  return `M${sx} ${sy}a${rx} ${ry} ${deg} 1 0 ${dx} ${dy}a${rx} ${ry} ${deg} 1 0 ${-dx} ${-dy}Z`;
}

/** A chunky coloured stroke: ink under-stroke + colour on top (mono: one line). */
export function stroke(d: string, fill: string, w = 2.8, mono = 2.4): Part[] {
  return [
    { i: d, w: w + 3.4, m: false },
    { i: d, w, f: fill, m: mono },
  ];
}

/** Skin and hair tones for the people and body icons. */
export const SKIN = "#f7c9a3";
export const SKIN_DEEP = "#e8a67e";
export const MOUTH_DARK = "#7a1d3a";

export { circ, ell };
