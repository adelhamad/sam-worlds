// Icon art — classic world planets: numbers, measuring and making (Number Forge, Coin Quest, Ruler…).
// Drawn to read at 40–56 px in the middle of a planet on the home page.
// 32×32 grid; see geom.ts for the part format.
import { C, circ, ell, rr, soft, sparkle, starPoints, type IconArt, type Part } from "./geom";
import { thick } from "./art-things";

type Pt = readonly [number, number];

const r2 = (n: number) => Math.round(n * 100) / 100;
const deg = (a: number) => (a * Math.PI) / 180;

/** Ruler and pencil are drawn flat along `t` (across: `s`), then laid on the diagonal. */
const U: Pt = [Math.SQRT1_2, -Math.SQRT1_2];
const N: Pt = [Math.SQRT1_2, Math.SQRT1_2];

function along([t, s]: Pt): Pt {
  return [r2(16 + t * U[0] + s * N[0]), r2(16 + t * U[1] + s * N[1])];
}

function diag(points: Pt[], round: number): string {
  return soft(points.map(along), round);
}

/** Pairs of (t, s) points → diagonal line segments. */
function diagLines(points: Pt[]): string {
  return points.map((pt, i) => `${i % 2 ? "L" : "M"}${along(pt).join(" ")}`).join("");
}

/** A point at angle `a`° (0° = right, clockwise) and radius `r` around (cx, cy). */
function polar(cx: number, cy: number, a: number, r: number): Pt {
  return [r2(cx + Math.cos(deg(a)) * r), r2(cy + Math.sin(deg(a)) * r)];
}

/** A pie wedge, clockwise from a0° to a1°. */
function wedge(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, a0, r);
  const [x1, y1] = polar(cx, cy, a1, r);
  return `M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}Z`;
}

/** A small tooth: base centred on `t` of the edge a→b, tip pointing along `n`. */
function tooth(a: Pt, b: Pt, t: number, n: Pt): Part {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy);
  const [ux, uy] = [dx / len, dy / len];
  const [px, py] = [a[0] + dx * t, a[1] + dy * t];
  return {
    b: soft([[px - ux * 1.2, py - uy * 1.2], [px + ux * 1.2, py + uy * 1.2], [px + n[0] * 2.4, py + n[1] * 2.4]], 0.3),
    f: C.white,
    w: 1.2,
    m: false,
  };
}

/** A die face turned by `turnDeg` around its centre, with pips at (x, y) offsets. */
function die(cx: number, cy: number, half: number, turnDeg: number, pips: Pt[], fill: string): Part[] {
  const [c, s] = [Math.cos(deg(turnDeg)), Math.sin(deg(turnDeg))];
  const at = ([x, y]: Pt): Pt => [r2(cx + x * c - y * s), r2(cy + x * s + y * c)];
  const corners: Pt[] = [[-half, -half], [half, -half], [half, half], [-half, half]];
  return [
    { b: soft(corners.map(at), half * 0.42), f: fill },
    ...pips.map((p): Part => ({ d: circ(...at(p), 1.5) })),
  ];
}

/** A point on the bead string (quadratic curve) at t ∈ [0, 1]. */
function onString(t: number): Pt {
  const [p0, p1, p2] = [[1.4, 11.6], [16, 27.6], [30.6, 11.6]];
  const k = (i: number) => (1 - t) ** 2 * p0[i] + 2 * t * (1 - t) * p1[i] + t * t * p2[i];
  return [r2(k(0)), r2(k(1))];
}

const BEADS: Part[] = [0.14, 0.38, 0.62, 0.86].flatMap((t, i): Part[] => {
  const [x, y] = onString(t);
  if (i % 2 === 0) return [{ b: circ(x, y, 3.9), f: C.red }, { s: `M${r2(x - 2.4)} ${r2(y - 0.2)}Q${r2(x - 2)} ${r2(y - 2)} ${r2(x - 0.4)} ${r2(y - 2.4)}`, w: 1.4 }];
  return [{ b: rr(x - 3.4, y - 3.4, 6.8, 6.8, 1.6), f: C.blue }, { a: rr(x + 1, y - 2.2, 1.4, 4.4, 0.7), f: C.blueDeep, o: 0.7 }];
});

// Pizza: a whole pie with one slice (top right) pulled out.
const PZ: Pt = [14.2, 17.8];
const PZ_R = 11.6;
const SLICE: Pt = polar(PZ[0], PZ[1], -60, 3.4);

function pie(o: Pt, a0: number, a1: number, bisectors: number[]): Part[] {
  const [cx, cy] = o;
  const cuts = [a0, a1, ...bisectors.map((b) => b + 30)].filter((a) => a < a1 + 1);
  return [
    { b: wedge(cx, cy, PZ_R, a0, a1), f: C.woodLight },
    { a: wedge(cx, cy, PZ_R - 2.2, a0, a1), f: C.red },
    { a: wedge(cx, cy, PZ_R - 3.3, a0, a1), f: C.gold },
    ...bisectors.map((b): Part => ({ d: circ(...polar(cx, cy, b, 5.8), 1.7), f: C.red })),
    { i: cuts.map((a) => `M${cx} ${cy}L${polar(cx, cy, a, PZ_R - 0.4).join(" ")}`).join(""), w: 1.6 },
  ];
}

const PZ_SHINE = (() => {
  const [x0, y0] = polar(PZ[0], PZ[1], 196, PZ_R - 1.1);
  const [x1, y1] = polar(PZ[0], PZ[1], 228, PZ_R - 1.1);
  return `M${x0} ${y0}A${PZ_R - 1.1} ${PZ_R - 1.1} 0 0 1 ${x1} ${y1}`;
})();

// Croc: head in side view, jaws open like a "<" sign.
const HINGE: Pt = [12.4, 16];
const UPPER_TIP: Pt = [29.4, 7.6];
const LOWER_TIP: Pt = [28.8, 22.4];

/** Tower of Tens: four chunky toy blocks, slightly staggered, each with a face. */
const TOWER: Part[] = ([[7.4, 23.2, C.blue, C.blueDeep], [8.8, 17.4, C.gold, C.goldDeep], [7.6, 11.6, C.green, C.greenDeep], [9, 5.8, C.purple, C.purpleDeep]] as const)
  .flatMap(([x, y, fill, deep]): Part[] => [
    { b: rr(x, y, 11.2, 5.8, 1.4), f: fill, w: 2 },
    { a: rr(x + 8.4, y + 1.1, 1.6, 3.6, 0.8), f: deep, o: 0.8 },
    { a: rr(x + 1.6, y + 1.2, 2.4, 1.4, 0.7), f: C.white, o: 0.55 },
  ]);

const TICKS = Array.from({ length: 11 }, (_, i) => {
  const t = -12.5 + i * 2.5;
  return [[t, -4], [t, i % 2 === 0 ? -0.6 : -2.2]] as Pt[];
}).flat();

export const WORLD_MATH_ART: Record<string, IconArt> = {
  anvil: [
    { b: sparkle(16.4, 6.2, 3.4, 4.4), f: C.gold, w: 1.6 },
    { b: circ(9.6, 8, 1.5), f: C.coral, w: 1.4, m: false },
    { b: sparkle(23, 7.6, 2.2, 2.8), f: C.gold, w: 1.4, m: false },
    {
      b: soft([[2.4, 12.2], [28, 12.2], [28, 16.8], [22.2, 17.6], [19.6, 21.2], [23.2, 24.6], [25.4, 24.6], [25.4, 28.6], [6.6, 28.6], [6.6, 24.6], [8.8, 24.6], [12.4, 21.2], [10, 17.6], [6.6, 16.8]], 1),
      f: C.steel,
    },
    { a: rr(8.6, 25.8, 15, 1.8, 0.9), f: C.steelDeep },
    { a: soft([[14, 18.2], [19.6, 18.2], [18.2, 21], [14.6, 21]], 0.4), f: C.steelDeep, o: 0.7 },
    { s: "M7 14H11.6", w: 1.8 },
  ],
  scales: [
    { i: "M7 10.4L3.4 19M7 10.4L10.6 19M25 10.4L21.4 19M25 10.4L28.6 19", w: 1.5 },
    { b: rr(14.6, 7.6, 2.8, 19.4, 1.2), f: C.goldDeep, w: 1.8 },
    { b: rr(9, 26, 14, 3.4, 1.6), f: C.brown },
    { b: rr(4.2, 7.6, 23.6, 3, 1.5), f: C.gold, w: 2 },
    { b: circ(16, 6.2, 2.4), f: C.gold, w: 1.8 },
    { b: "M2.2 18.6H11.8Q11.8 23.6 7 23.6Q2.2 23.6 2.2 18.6Z", f: C.gold, w: 2 },
    { b: "M20.2 18.6H29.8Q29.8 23.6 25 23.6Q20.2 23.6 20.2 18.6Z", f: C.gold, w: 2 },
    { s: "M4.4 20Q5 21.8 6.6 22", w: 1.6 },
  ],
  tower: [
    { i: "M14.6 6V1.6", w: 1.6 },
    { b: "M14.6 1.6L19.8 3.2L14.6 4.8Z", f: C.red, w: 1.4 },
    ...TOWER,
    { b: rr(22.6, 22.6, 6.4, 6.4, 1.4), f: C.red, w: 2 },
    { s: "M10.6 7.4V9.6", w: 1.4 },
  ],
  coin: [
    { b: circ(21.4, 12.2, 8.6), f: C.goldDeep },
    { i: "M24.8 6.6Q27.4 9 27.6 12.4", w: 1.4, f: C.gold, m: false },
    { b: circ(13.4, 18.6, 11.2), f: C.gold },
    { i: circ(13.4, 18.6, 8), w: 1.6, f: C.goldDeep, m: 1.2 },
    { b: soft(starPoints(13.4, 19, 5.4, 2.5), 0.6), f: C.goldDeep, w: 1.4 },
    { s: "M5.4 16.4Q6.2 12.2 9.8 10.2", w: 2 },
  ],
  ruler: [
    { b: diag([[-14.6, -4.2], [14.6, -4.2], [14.6, 4.2], [-14.6, 4.2]], 1.4), f: C.gold },
    { a: diag([[-13.6, 2], [13.6, 2], [13.6, 3.2], [-13.6, 3.2]], 0.6), f: C.goldDeep },
    { i: diagLines(TICKS), w: 1.5 },
    { s: diagLines([[-12.4, 0.9], [-8.4, 0.9]]), w: 1.6 },
  ],
  lighthouse: [
    ...thick("M10.4 7L6 5M10.4 9.8L6 11M21.6 7L26 5M21.6 9.8L26 11", C.gold, 1.8, 1.6),
    { b: "M3.6 29.6Q4.6 24.6 9.6 24.4H22.4Q27.4 24.6 28.4 29.6Z", f: C.steelDeep },
    { b: soft([[12.2, 12.4], [19.8, 12.4], [22, 25.4], [10, 25.4]], 0.8), f: C.white },
    { a: "M12.1 14.8H19.9L20.4 17.8H11.6Z", f: C.red },
    { a: "M11.2 20.4H20.8L21.3 23.4H10.7Z", f: C.red },
    { b: rr(9.4, 10.6, 13.2, 2.8, 1), f: C.slate, w: 1.8 },
    { b: rr(12.2, 5.6, 7.6, 5.4, 1), f: C.gold, w: 1.8 },
    { i: "M16 5.8V10.8", w: 1.2 },
    { b: "M11.2 6.2Q16 0.6 20.8 6.2Z", f: C.red, w: 1.8 },
    { s: "M12.8 14.2L12.4 17.6", w: 1.6 },
  ],
  pizza: [
    ...pie(PZ, -30, 270, [0, 60, 120, 180, 240]),
    { s: PZ_SHINE, w: 1.6 },
    ...pie(SLICE, -90, -30, [-60]),
  ],
  beads: [
    { i: "M1.4 11.6Q16 27.6 30.6 11.6", w: 1.8 },
    { b: circ(1.8, 11.8, 1.5), f: C.gold, w: 1.4 },
    { b: circ(30.2, 11.8, 1.5), f: C.gold, w: 1.4 },
    ...BEADS,
  ],
  croc: [
    { b: soft([HINGE, [29.6, 6.6], [29, 23.4]], 1), f: C.rose, w: 1.8 },
    { b: soft([[4.6, 18.2], [4, 10.8], [8.4, 7.2], [28.2, 4.2], [30, 7.6], HINGE], 1.6), f: C.green },
    { b: soft([[4.6, 18], HINGE, [28.8, 22.4], [28.4, 25.4], [10, 27.4], [4.8, 24.4]], 1.6), f: C.green },
    { a: soft([[7.4, 23.6], [24.6, 23.6], [11, 25.8], [6.6, 24.6]], 0.8), f: C.leaf },
    ...[0.38, 0.62, 0.86].map((t) => tooth(HINGE, UPPER_TIP, t, [0.45, 0.89])),
    ...[0.4, 0.66, 0.9].map((t) => tooth(HINGE, LOWER_TIP, t, [0.37, -0.93])),
    { b: ell(26.2, 5, 2.2, 1.7), f: C.green, w: 1.8 },
    { d: circ(26.4, 4.8, 0.7) },
    { b: circ(16.6, 6.2, 1.3), f: C.greenDeep, w: 1.4, m: false },
    { b: circ(20.6, 5.6, 1.2), f: C.greenDeep, w: 1.4, m: false },
    { b: circ(10.2, 7.6, 4), f: C.green, w: 2 },
    { b: circ(10.6, 7.2, 2.5), f: C.white, w: 1.4 },
    { d: circ(11.2, 7.4, 1.3) },
    { s: "M15.4 8.4L21.6 6.6", w: 1.6 },
  ],
  chart: [
    { b: rr(8, 18.2, 5.4, 10, 1.2), f: C.blue, w: 2 },
    { a: rr(11.2, 19.6, 1.4, 7.4, 0.7), f: C.blueDeep, o: 0.8 },
    { b: rr(14.8, 12.4, 5.4, 15.8, 1.2), f: C.gold, w: 2 },
    { a: rr(18, 13.8, 1.4, 13.2, 0.7), f: C.goldDeep, o: 0.8 },
    { b: rr(21.6, 5.4, 5.4, 22.8, 1.2), f: C.green, w: 2 },
    { a: rr(24.8, 6.8, 1.4, 20.2, 0.7), f: C.greenDeep, o: 0.8 },
    ...thick("M4.6 3.6V27.8H29", C.slate, 2, 2),
    { s: "M9.8 20.2V23", w: 1.6 },
  ],
  columns: [
    { b: rr(3.4, 23.6, 25.2, 3, 0.8), f: C.sand, w: 2 },
    { b: rr(1.8, 26.4, 28.4, 3.2, 1), f: C.cream, w: 2 },
    ...[7.3, 13.1, 18.9, 24.7].flatMap((x): Part[] => [
      { b: rr(x - 1.8, 13.4, 3.6, 10.6, 0.6), f: C.cream, w: 1.8 },
      { i: `M${r2(x + 0.3)} 15V22.4`, w: 1, f: C.sand, m: false },
    ]),
    { b: rr(3.2, 10.6, 25.6, 3.2, 0.8), f: C.sand, w: 2 },
    { b: soft([[16, 2.6], [29.6, 10.8], [2.4, 10.8]], 1.2), f: C.cream },
    { a: soft([[16, 5.6], [23.6, 9.6], [8.4, 9.6]], 0.6), f: C.sand },
    { s: "M6.6 8.6L10 6.6", w: 1.6 },
  ],
  podium: [
    { b: rr(2.8, 18.4, 9, 11, 1.2), f: C.steel },
    { a: rr(9, 19.8, 1.6, 8.4, 0.8), f: C.steelDeep, o: 0.8 },
    { b: rr(20.2, 21.6, 9, 7.8, 1.2), f: C.woodLight },
    { a: rr(26.6, 23, 1.6, 5.2, 0.8), f: C.wood, o: 0.8 },
    { b: rr(10.8, 13, 10.4, 16.4, 1.2), f: C.gold },
    { a: rr(18.4, 14.4, 1.6, 13.8, 0.8), f: C.goldDeep, o: 0.8 },
    { i: "M14.6 18.2L16.4 16.6V24", w: 2.2 },
    { b: soft(starPoints(16, 7.2, 5.2, 2.4), 0.6), f: C.gold, w: 1.8 },
    { s: "M5 20.6V24.4", w: 1.6 },
  ],
  butterfly: [
    { i: "M15.2 7Q13.8 3.6 11.4 3M16.8 7Q18.2 3.6 20.6 3", w: 1.6 },
    { d: circ(11.2, 3, 1.2) },
    { d: circ(20.8, 3, 1.2) },
    { b: "M15.4 13.2C12.6 6.4 5.6 3.4 3.4 6C1.6 8.4 2.8 14.6 7.8 16.8C10.6 17.8 13.6 16.8 15.4 15.2Z", f: C.pink },
    { b: "M16.6 13.2C19.4 6.4 26.4 3.4 28.6 6C30.4 8.4 29.2 14.6 24.2 16.8C21.4 17.8 18.4 16.8 16.6 15.2Z", f: C.pink },
    { b: "M15.4 16.6C12.2 17 6.6 19 6.2 23.4C6 26.8 9.6 28.4 12.2 26.6C14.2 25.2 15.2 21.6 15.6 18.8Z", f: C.purple },
    { b: "M16.6 16.6C19.8 17 25.4 19 25.8 23.4C26 26.8 22.4 28.4 19.8 26.6C17.8 25.2 16.8 21.6 16.4 18.8Z", f: C.purple },
    { a: circ(7.6, 9.6, 2.4), f: C.gold },
    { a: circ(24.4, 9.6, 2.4), f: C.gold },
    { a: circ(10.6, 23.2, 1.5), f: C.white, o: 0.85 },
    { a: circ(21.4, 23.2, 1.5), f: C.white, o: 0.85 },
    { b: ell(16, 17.2, 2, 8.6), f: C.slate, w: 1.8 },
    { b: circ(16, 7.8, 2.3), f: C.slate, w: 1.8 },
    { s: "M4.6 8.6Q5.2 6.6 7 6.2", w: 1.6 },
  ],
  dice: [
    ...die(21.2, 11.4, 6.8, 12, [[-3.4, -3.4], [0, 0], [3.4, 3.4]], C.cloud),
    ...die(11.8, 20.2, 7.6, -14, [[-3.6, -3.6], [3.6, -3.6], [0, 0], [-3.6, 3.6], [3.6, 3.6]], C.white),
    { s: "M6.2 16.4Q6 14.6 7.4 13.8", w: 1.6 },
  ],
  "set-square": [
    {
      b: `${soft([[3.4, 3.4], [28.8, 28.6], [3.4, 28.6]], 1.4)}${soft([[8.6, 24], [17.8, 24], [8.6, 14.8]], 0.8)}`,
      f: C.sky,
    },
    { a: soft([[4.8, 26], [24.6, 26], [26.6, 27.4], [4.8, 27.4]], 0.4), f: C.blue, o: 0.6 },
    { i: "M7.6 28.4V25.8M11.2 28.4V26.6M14.8 28.4V25.8M18.4 28.4V26.6M22 28.4V25.8", w: 1.4 },
    { s: "M5.6 9.8V20.4", w: 1.6 },
  ],
  pencil: [
    { b: diag([[-7.8, -3.6], [-7.8, 3.6], [-14, 0]], 0.8), f: C.sand },
    { b: diag([[-11.6, -1.3], [-11.6, 1.3], [-14.2, 0]], 0.3), f: C.slate, w: 1.4 },
    { b: diag([[-8, -3.6], [7.6, -3.6], [7.6, 3.6], [-8, 3.6]], 0.6), f: C.gold },
    { a: diag([[-7.2, 1.2], [7, 1.2], [7, 2.8], [-7.2, 2.8]], 0.4), f: C.goldDeep },
    { b: diag([[9.4, -3.6], [14.2, -3.6], [14.2, 3.6], [9.4, 3.6]], 1.8), f: C.pink, w: 2 },
    { b: diag([[7.2, -3.8], [10, -3.8], [10, 3.8], [7.2, 3.8]], 0.4), f: C.steel, w: 1.8 },
    { s: diagLines([[-5, -1.4], [3, -1.4]]), w: 1.6 },
  ],
};
