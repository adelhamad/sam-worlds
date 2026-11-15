// Icon art — classic world planets: everyday life, words and making (Smile, Shop, Palette, Hand…).
// Drawn to read at 40–56 px in the middle of a planet on the home page.
// 32×32 grid; see geom.ts for the part format.
import { thick } from "./art-things";
import { C, circ, ell, rr, soft, sparkle, starPoints, type IconArt, type Part } from "./geom";

type Pt = readonly [number, number];
const r2 = (n: number) => Math.round(n * 100) / 100;

/** The recycling loop: three corners, each arrow runs along one side into the next corner. */
const LOOP: Pt[] = [[16, 4.6], [27.6, 25.4], [4.4, 25.4]];

function along(p: Pt, q: Pt, t: number): Pt {
  return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
}

function chase(i: number): { line: string; head: string } {
  const prev = LOOP[(i + 2) % 3];
  const from = LOOP[i];
  const to = LOOP[(i + 1) % 3];
  const start = along(from, prev, 0.14);
  const bend = along(from, to, 0.16);
  const end = along(from, to, 0.6);
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const [ux, uy] = [(to[0] - from[0]) / len, (to[1] - from[1]) / len];
  const [nx, ny] = [-uy, ux];
  const tip: Pt = [end[0] + ux * 6, end[1] + uy * 6];
  const head = soft([tip, [end[0] + nx * 4.6, end[1] + ny * 4.6], [end[0] - nx * 4.6, end[1] - ny * 4.6]], 0.9);
  const line = `M${r2(start[0])} ${r2(start[1])}Q${from[0]} ${from[1]} ${r2(bend[0])} ${r2(bend[1])}L${r2(end[0])} ${r2(end[1])}`;
  return { line, head };
}

const CHASE = [0, 1, 2].map(chase);
const RECYCLE: Part[] = [
  ...CHASE.map((c): Part => ({ i: c.line, w: 6.8, m: false })),
  ...CHASE.map((c): Part => ({ b: c.head, f: C.green, w: 2 })),
  ...CHASE.map((c): Part => ({ i: c.line, w: 3.4, f: C.green, m: 2.4 })),
];

/** Head and shoulders of one person (crowd). */
function person(cx: number, hy: number, r: number, w: number, body: string, skin: string): Part[] {
  const top = hy + r + 0.4;
  const side = r2(top + w * 0.7);
  return [
    { b: `M${cx - w} 29.6V${side}Q${cx - w} ${top} ${cx} ${top}Q${cx + w} ${top} ${cx + w} ${side}V29.6Z`, f: body },
    { b: circ(cx, hy, r), f: skin, w: 2 },
  ];
}

const HAND =
  "M11 29.4C8.6 27.6 7.8 25.2 7.6 22.8L4.4 17.6Q3.4 15.4 5.2 14.6Q7 13.8 8.2 15.8L9.6 18V8.6Q9.6 6.4 11.6 6.4Q13.6 6.4 13.6 8.6V13.8V6.4Q13.6 4.2 15.8 4.2Q18 4.2 18 6.4V13.8V7.6Q18 5.4 20.1 5.4Q22.2 5.4 22.2 7.6V15V10.8Q22.2 8.8 24.1 8.8Q26 8.8 26 10.8V20.4C26 25.8 22.8 29.4 18 29.4Z";

export const WORLD_LIFE_ART: Record<string, IconArt> = {
  smile: [
    { b: circ(16, 16, 13), f: C.gold },
    { a: "M24.6 9.2A11 11 0 0 1 12.6 26.6A13 13 0 0 0 24.6 9.2Z", f: C.goldDeep, o: 0.6 },
    { a: circ(8.4, 18.2, 2.2), f: C.pink, o: 0.85 },
    { a: circ(23.6, 18.2, 2.2), f: C.pink, o: 0.85 },
    { d: ell(11.8, 12.6, 1.6, 2.2) },
    { d: ell(20.2, 12.6, 1.6, 2.2) },
    { b: "M9.6 17.8H22.4Q21.8 25.4 16 25.4Q10.2 25.4 9.6 17.8Z", f: C.red, w: 1.8, m: "solid" },
    { a: "M12.6 23.2Q16 21 19.4 23.2Q17.8 24.4 16 24.4Q14.2 24.4 12.6 23.2Z", f: C.pink },
    { s: "M6.2 12.6Q7.4 8.6 11 6.6", w: 1.8 },
  ],
  tophat: [
    { b: "M9.4 6.4Q16 5.2 22.6 6.4L21.4 24H10.6Z", f: C.slate },
    { a: "M10.3 18.2H21.7L21.45 22.2H10.55Z", f: C.red },
    { b: "M3 24.6Q3 22 6.6 22.4H25.4Q29 22 29 24.6Q29 27.8 16 27.8Q3 27.8 3 24.6Z", f: C.slate },
    { b: sparkle(26.6, 8.4, 3.2, 4.2), f: C.gold, w: 1.4 },
    { b: sparkle(5.2, 13, 2, 2.6), f: C.ice, w: 1.2, m: false },
    { s: "M12.8 8.8V15", w: 1.8 },
  ],
  "traffic-light": [
    { b: rr(14, 24, 4, 6.4, 1), f: C.steelDeep, w: 1.8 },
    { b: soft([[9, 4.8], [5, 4.8], [9, 9.8]], 0.8), f: C.slate, w: 1.6 },
    { b: soft([[23, 4.8], [27, 4.8], [23, 9.8]], 0.8), f: C.slate, w: 1.6 },
    { b: soft([[9, 11.3], [5, 11.3], [9, 16.3]], 0.8), f: C.slate, w: 1.6 },
    { b: soft([[23, 11.3], [27, 11.3], [23, 16.3]], 0.8), f: C.slate, w: 1.6 },
    { b: soft([[9, 17.8], [5, 17.8], [9, 22.8]], 0.8), f: C.slate, w: 1.6 },
    { b: soft([[23, 17.8], [27, 17.8], [23, 22.8]], 0.8), f: C.slate, w: 1.6 },
    { b: rr(8.6, 2.2, 14.8, 23.4, 4.6), f: C.slate },
    { b: circ(16, 7.6, 3.1), f: C.red, w: 1.8 },
    { b: circ(16, 13.9, 3.1), f: C.gold, w: 1.8 },
    { b: circ(16, 20.2, 3.1), f: C.green, w: 1.8 },
    { d: circ(14.9, 6.5, 0.9), f: C.white },
    { s: "M11 5.4V8.6", w: 1.6 },
  ],
  firetruck: [
    { b: rr(2.4, 11.4, 18.6, 13.6, 2.2), f: C.red },
    { b: "M19.4 25V9.6Q19.4 8 21 8H25Q26.4 8 27.2 9.4L29.6 14.6V22.6Q29.6 25 27.4 25Z", f: C.red },
    { a: rr(4.2, 19.4, 14.6, 2.2, 1.1), f: C.white, o: 0.85 },
    { b: "M21.6 10.4H24.6L26.8 15H21.6Z", f: C.sky, w: 1.6 },
    { i: "M5 9V11.6M17 9V11.6", w: 1.8 },
    ...thick("M3.4 6.6H18.6M3.4 9.6H18.6M6.4 6.6V9.6M10 6.6V9.6M13.6 6.6V9.6M17.2 6.6V9.6", C.steel, 1.6, 1.6),
    { b: rr(21.4, 4.8, 3.8, 3.2, 1.2), f: C.gold, w: 1.6 },
    { b: circ(8.6, 25, 3.6), f: C.slate },
    { d: circ(8.6, 25, 1.3), f: C.steel },
    { b: circ(24.4, 25, 3.6), f: C.slate },
    { d: circ(24.4, 25, 1.3), f: C.steel },
    { s: "M5 14.2H10", w: 1.8 },
  ],
  recycle: RECYCLE,
  piggy: [
    { b: rr(8, 20.4, 4.2, 7.4, 1.8), f: C.pink, w: 1.8 },
    { b: rr(19, 20.4, 4.2, 7.4, 1.8), f: C.pink, w: 1.8 },
    { i: "M4.4 15.6Q1.6 15 2.2 12.6Q3 10.8 4.4 12.4", w: 1.8 },
    { b: ell(15.4, 16.6, 11.6, 9), f: C.pink },
    { b: soft([[16.8, 9.4], [20.4, 4.6], [22.6, 10.4]], 1), f: C.pink, w: 1.8 },
    { b: ell(27, 17.6, 3.2, 3.8), f: C.rose, w: 1.8 },
    { d: ell(26.1, 17.6, 0.6, 1.1) },
    { d: ell(27.9, 17.6, 0.6, 1.1) },
    { d: circ(21.6, 13.8, 1.3) },
    { i: "M11.4 9.4H16.8", w: 2 },
    { b: circ(14.2, 4.2, 2.8), f: C.gold, w: 1.6 },
    { s: "M7.4 13.6Q8.4 10.8 11 9.8", w: 1.8 },
  ],
  shop: [
    { b: rr(4.6, 12.6, 22.8, 16.4, 1.4), f: C.cream },
    { b: rr(18.6, 17.6, 6.4, 11.4, 1.4), f: C.wood, w: 1.8 },
    { d: circ(20.2, 23.6, 0.8) },
    { b: rr(7.2, 17.6, 9, 7, 1.2), f: C.sky, w: 1.8 },
    {
      b: "M5 5H27L29.6 12.4Q26.88 16.4 24.16 12.4Q21.44 16.4 18.72 12.4Q16 16.4 13.28 12.4Q10.56 16.4 7.84 12.4Q5.12 16.4 2.4 12.4Z",
      f: C.red,
    },
    { a: "M9.7 6.1H13.7L13.2 12.6Q10.56 15.3 8 12.6Z", f: C.white },
    { a: "M18.3 6.1H22.3L24 12.6Q21.44 15.3 18.8 12.6Z", f: C.white },
    { s: "M9 19.6V22.2", w: 1.5 },
  ],
  pan: [
    ...thick("M22.4 15.8L29.8 12.8", C.woodDeep, 3.6, 2.6),
    { b: ell(12.8, 17, 10.6, 9), f: C.slate },
    { a: ell(12.8, 16.4, 8, 6.6), f: C.steelDeep },
    {
      b: "M7.2 14.8C7.4 11.2 11.4 10.2 13.8 11.6C16.8 10.8 19.2 13.2 18.2 16C19.8 18.6 17.2 22 14 21.4C11.4 23.2 7.4 21.8 7.6 19C5.8 17.8 6 15.6 7.2 14.8Z",
      f: C.white, w: 1.8,
    },
    { b: circ(13, 16.6, 3.2), f: C.gold, w: 1.8, m: "solid" },
    { s: "M3.8 15Q4.4 10.8 8.2 8.8", w: 1.8 },
  ],
  family: [
    { b: "M4.4 29.6V21.2Q4.4 15.4 10 15.4Q15.6 15.4 15.6 21.2V29.6Z", f: C.blue },
    { b: "M18.4 29.6V25.2Q18.4 20.6 22.8 20.6Q27.2 20.6 27.2 25.2V29.6Z", f: C.coral },
    ...thick("M14.8 22.4Q16.6 25.4 19.4 25", C.sand, 2.4, 2),
    { b: circ(10, 9.6, 4.8), f: C.sand },
    { a: "M5.8 8.6Q6.6 5.4 10 5.4Q13.4 5.4 14.2 8.6Q12.2 7.6 10 8Q7.8 7.6 5.8 8.6Z", f: C.brown },
    { b: circ(22.8, 15.6, 3.8), f: C.sand },
    { d: circ(8.4, 10.4, 0.8) },
    { d: circ(11.6, 10.4, 0.8) },
    { d: circ(21.6, 15.9, 0.7) },
    { d: circ(24, 15.9, 0.7) },
    {
      b: "M23.6 10.2C21.2 8.6 19 7 19 4.7C19 3.3 20.1 2.2 21.4 2.2C22.4 2.2 23.2 2.8 23.6 3.6C24 2.8 24.8 2.2 25.8 2.2C27.1 2.2 28.2 3.3 28.2 4.7C28.2 7 26 8.6 23.6 10.2Z",
      f: C.red, w: 1.6,
    },
    { s: "M6.8 21Q7.2 18.8 8.8 17.8", w: 1.6 },
  ],
  crowd: [
    ...person(10.4, 7.6, 3.4, 5, C.purple, C.woodLight),
    ...person(21.6, 7.6, 3.4, 5, C.gold, C.cream),
    ...person(6.6, 15.4, 3.6, 4.8, C.blue, C.sand),
    ...person(25.4, 15.4, 3.6, 4.8, C.green, C.woodLight),
    ...person(16, 16.4, 3.8, 5.2, C.red, C.cream),
    { d: circ(14.6, 16.6, 0.75) },
    { d: circ(17.4, 16.6, 0.75) },
    { s: "M12.6 26.4Q12.8 24.2 14.4 23.2", w: 1.6 },
  ],
  bricks: [
    { b: rr(2.6, 12.6, 26.8, 16.8, 1.6), f: C.orange },
    { a: rr(4, 16, 6, 1.4, 0.7), f: C.coral, m: false },
    { a: rr(17.8, 27, 9, 1.4, 0.7), f: C.coral, m: false },
    { i: "M2.8 18.2H29.2M2.8 23.8H29.2M11.6 12.8V18.2M20.4 12.8V18.2M7.2 18.2V23.8M16 18.2V23.8M24.8 18.2V23.8M11.6 23.8V29.2M20.4 23.8V29.2", w: 1.6 },
    { b: soft([[9.4, 5.6], [20.6, 3.2], [21.6, 8.2], [10.4, 10.6]], 1), f: C.coral, w: 2 },
    { s: "M4.8 14.6H8.6", w: 1.6 },
  ],
  pickaxe: [
    { i: "M4.6 28.4L21.2 11.8", w: 6.8, m: false },
    { i: "M4.6 28.4L21.2 11.8", w: 3.4, f: C.woodLight, m: 2.4 },
    { a: "M4.3 27.1L6.9 24.5L8 25.6L5.4 28.2Z", f: C.woodDeep, m: false },
    { b: "M8 4.2Q27.4 4.6 27.8 24Q22 10.2 8 4.2Z", f: C.steel },
    { b: circ(20.8, 12.2, 2), f: C.steelDeep, w: 1.6 },
    { s: "M12.2 5.8Q17.2 6.6 20.4 9.2", w: 1.6 },
  ],
  palette: [
    {
      b: "M16 4.8C24 4.8 29.4 9.4 29.4 15.2C29.4 19.4 26.2 20.6 23.6 19.8C21.2 19.2 19.4 20.6 20.2 23C21 25.4 19.6 27.6 15.6 27.6C8 27.6 2.6 22.4 2.6 15.8C2.6 9.4 8.4 4.8 16 4.8Z",
      f: C.woodLight,
    },
    { b: ell(24.8, 14.6, 1.9, 1.6), f: C.woodDeep, w: 1.6 },
    { b: circ(12.4, 10.6, 2.4), f: C.gold, w: 1.6 },
    { b: circ(18.2, 9, 2.4), f: C.red, w: 1.6 },
    { b: circ(23.2, 9.8, 2.1), f: C.green, w: 1.6 },
    { b: circ(8.4, 16.8, 2.5), f: C.blue, w: 1.6 },
    { b: circ(12, 22.6, 2.4), f: C.purple, w: 1.6 },
    ...thick("M29 28.8L21.6 21.4", C.red, 2.6, 2),
    ...thick("M22 21.8L19.8 19.6", C.steel, 3.4, 2.4),
    { b: "M19.8 17.8Q17.4 14.8 15 15Q14.8 17.4 17.8 19.8Z", f: C.blue, w: 1.6 },
    { s: "M5.2 12.4Q6.4 9.4 9 7.8", w: 1.8 },
  ],
  wizard: [
    { b: ell(16, 25.4, 13.4, 3.8), f: C.purpleDeep },
    {
      b: "M6.6 24.6C9.6 18 11.8 11 14.6 6.4C16.2 3.8 19.6 2.2 23.4 3.8C25.4 4.6 27.4 6.8 28.4 9.4C25.6 7.4 23 7.2 21.2 8.6C21.4 13.6 23.6 19.2 25.4 24.6Q16 27.6 6.6 24.6Z",
      f: C.purple,
    },
    { a: "M9 21.2Q16 23.8 23.6 21.2L24.2 23.4Q16 26.2 8.2 23.4Z", f: C.gold, m: "solid" },
    { b: soft(starPoints(15.4, 14.8, 3.4, 1.5), 0.4), f: C.gold, w: 1.4 },
    { b: soft(starPoints(18.4, 9.6, 2.1, 0.95), 0.3), f: C.gold, w: 1.2, m: false },
    { b: "M20.4 15.8A2.9 2.9 0 1 0 22.4 20.4A2.3 2.3 0 0 1 20.4 15.8Z", f: C.gold, w: 1.4 },
    { s: "M11.4 19.2Q12.4 15.2 14.2 11.4", w: 1.8 },
  ],
  slide: [
    ...thick("M7.4 7.6Q7.8 3.4 11.4 3.6Q14.8 3.8 15 7.6", C.steel, 2, 1.8),
    ...thick("M4.6 29.2L7.8 7.6M11.4 29.2L13.2 12M6 24.6H12M6.8 19.2H12.6M7.6 13.8H13.1", C.steel, 2.2, 2),
    { b: "M10.8 7.6H15.6Q20.2 7.6 21.8 14.4Q23.8 21.4 29.4 22.2V27.4Q19.6 27.6 17.2 17.4Q16 12 12.8 12Z", f: C.red },
    { a: "M15.6 9.4Q18.8 9.6 20 14.8Q22.2 22.6 27.8 23.8V24.8Q21.4 24.2 19.2 16.6Q18 11.6 15.6 10.6Z", f: C.gold, m: false },
    { i: "M2.4 29.6H29.6", w: 1.8, m: false },
    { s: "M12.6 9.4H14.4", w: 1.4 },
  ],
  ear: [
    ...thick("M8.2 12.2Q6 16 8.2 19.8M4 9.6Q0.8 16 4 22.4", C.cloud, 1.6, 2),
    {
      b: "M17.6 3.2C24 3.2 27.8 7.6 27.8 13.2C27.8 17.6 25.2 19.4 23.4 21.6C21.8 23.6 22.4 28.8 17.2 28.8C13.4 28.8 11.8 26 12.2 23.6C12.6 21.6 14.8 21 15.6 18.6C16.2 16.6 13.6 15.6 12.8 13.6C12.4 12.4 12.2 11.6 12.2 10.8C12.2 6.4 14.4 3.2 17.6 3.2Z",
      f: C.rose,
    },
    { a: ell(19.6, 13.4, 3.4, 4.6), f: C.pink, o: 0.8 },
    { i: "M23.4 13.6C23.4 9.6 21 7.6 18.4 7.6C16.2 7.6 15.6 9.8 16.8 11.4C18 13 19.6 13.6 19 16.4", w: 1.8 },
    { s: "M14.8 8Q15.6 5.8 17.8 5.4", w: 1.6 },
  ],
  hand: [
    { i: "M27.4 3.6Q29.8 5.4 30 8.4M4.6 10Q4.4 7.2 6.2 5.2", w: 1.8 },
    { b: HAND, f: C.sand },
    { a: "M12 21.4Q16 26.6 22.6 21.6Q22.4 26.4 17.6 27.4Q12.8 27.2 12 21.4Z", f: C.goldDeep, o: 0.35, m: false },
    { i: "M12.6 22.2Q15.8 24.2 19.8 22.2", w: 1.4, f: C.wood, m: false },
    { s: "M11.6 9.4V13.4", w: 1.6 },
  ],
};
