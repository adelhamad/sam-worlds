// Building blocks for the drawn icons: the part format the art files use, the
// shared palette, and small path helpers. Every icon is drawn on a 32×32 grid
// in the same chunky toy style as Pogo, the chess pieces and the course
// emblems: flat fills, one dark ink outline, a soft white shine.

/** One layer of an icon, drawn in array order (later parts sit on top). */
export type Part =
  /** Body: filled shape with the ink outline (`w` = outline width, 0 = none). */
  | { b: string; f: string; w?: number; m?: MonoMode }
  /** Accent: flat patch with no outline (shade / pattern), kept inside a body. */
  | { a: string; f: string; o?: number; m?: MonoMode }
  /** Line: open stroke, ink by default or the colour `f`; round caps. */
  | { i: string; w?: number; f?: string; m?: MonoMode }
  /** Dot: solid fill, ink by default (eyes, keyholes) or the colour `f`. */
  | { d: string; f?: string; m?: MonoMode }
  /** Shine: soft white highlight stroke. Hidden in mono. */
  | { s: string; w?: number };

/**
 * How a part shows in the single-colour (`mono`) variant, which follows
 * `currentColor`: `false` hides it, a number overrides the stroke width,
 * `"solid"` fills it fully. Defaults: bodies become a pale tint with a
 * currentColor outline, lines and ink dots become currentColor, accents,
 * coloured dots and shines disappear.
 */
export type MonoMode = false | number | "solid";

export type IconArt = readonly Part[];

/** The outline colour — the same deep indigo ink as the course emblems. */
export const INK = "#16123a";
export const SHINE = "rgba(255,255,255,0.8)";

/** Shared fills so the family stays in one palette. */
export const C = {
  gold: "#ffd166",
  goldDeep: "#f2a93b",
  orange: "#ff9f43",
  coral: "#ff7a59",
  red: "#ff5d73",
  pink: "#ff8fb1",
  rose: "#ffc2d4",
  green: "#5fd68b",
  greenDeep: "#2fae64",
  leaf: "#6fdc6a",
  sky: "#8fd3ff",
  blue: "#5aa2ff",
  blueDeep: "#3f7be0",
  cyan: "#7ff0ff",
  ice: "#d9fbff",
  purple: "#a98bff",
  purpleDeep: "#7b5ce0",
  wood: "#c27434",
  woodLight: "#dc8c45",
  woodDeep: "#8a4a1a",
  cream: "#fff4dc",
  white: "#ffffff",
  cloud: "#eef3ff",
  steel: "#c9d5e6",
  steelDeep: "#93a3bf",
  slate: "#5b6787",
  brown: "#9a5b2e",
  sand: "#f6d58e",
} as const;

const r2 = (n: number) => Math.round(n * 100) / 100;

/** A circle as a path. */
export function circ(cx: number, cy: number, r: number): string {
  return `M${r2(cx - r)} ${r2(cy)}a${r} ${r} 0 1 0 ${r2(2 * r)} 0a${r} ${r} 0 1 0 ${r2(-2 * r)} 0Z`;
}

/** An ellipse as a path. */
export function ell(cx: number, cy: number, rx: number, ry: number): string {
  return `M${r2(cx - rx)} ${r2(cy)}a${rx} ${ry} 0 1 0 ${r2(2 * rx)} 0a${rx} ${ry} 0 1 0 ${r2(-2 * rx)} 0Z`;
}

/** A rounded rectangle as a path. */
export function rr(x: number, y: number, w: number, h: number, r: number): string {
  const k = Math.min(r, w / 2, h / 2);
  return [
    `M${r2(x + k)} ${r2(y)}H${r2(x + w - k)}Q${r2(x + w)} ${r2(y)} ${r2(x + w)} ${r2(y + k)}`,
    `V${r2(y + h - k)}Q${r2(x + w)} ${r2(y + h)} ${r2(x + w - k)} ${r2(y + h)}`,
    `H${r2(x + k)}Q${r2(x)} ${r2(y + h)} ${r2(x)} ${r2(y + h - k)}`,
    `V${r2(y + k)}Q${r2(x)} ${r2(y)} ${r2(x + k)} ${r2(y)}Z`,
  ].join("");
}

type Pt = readonly [number, number];

/** A closed polygon whose corners are softened by `round` (toy-like). */
export function soft(points: readonly Pt[], round: number): string {
  const n = points.length;
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const [px, py] = points[(i - 1 + n) % n];
    const [x, y] = points[i];
    const [nx, ny] = points[(i + 1) % n];
    const before = towards(x, y, px, py, round);
    const after = towards(x, y, nx, ny, round);
    parts.push(`${i === 0 ? "M" : "L"}${r2(before[0])} ${r2(before[1])}Q${r2(x)} ${r2(y)} ${r2(after[0])} ${r2(after[1])}`);
  }
  return `${parts.join("")}Z`;
}

function towards(x: number, y: number, tx: number, ty: number, dist: number): Pt {
  const len = Math.hypot(tx - x, ty - y) || 1;
  const k = Math.min(dist, len / 2) / len;
  return [x + (tx - x) * k, y + (ty - y) * k];
}

/** The corner points of a star (`n` tips, outer radius `R`, inner `r`). */
export function starPoints(cx: number, cy: number, R: number, r: number, n = 5, turn = -90): Pt[] {
  return Array.from({ length: n * 2 }, (_, i) => {
    const angle = ((turn + (180 / n) * i) * Math.PI) / 180;
    const rad = i % 2 === 0 ? R : r;
    return [cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad] as const;
  });
}

/** A 4-point sparkle (Star Dust) centred on (cx, cy). */
export function sparkle(cx: number, cy: number, rx: number, ry: number, pinch = 0.22): string {
  const px = rx * pinch;
  const py = ry * pinch;
  return [
    `M${r2(cx)} ${r2(cy - ry)}`,
    `Q${r2(cx + px)} ${r2(cy - py)} ${r2(cx + rx)} ${r2(cy)}`,
    `Q${r2(cx + px)} ${r2(cy + py)} ${r2(cx)} ${r2(cy + ry)}`,
    `Q${r2(cx - px)} ${r2(cy + py)} ${r2(cx - rx)} ${r2(cy)}`,
    `Q${r2(cx - px)} ${r2(cy - py)} ${r2(cx)} ${r2(cy - ry)}Z`,
  ].join("");
}
