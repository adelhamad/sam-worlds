// Icon art — everyday things for question cards (tree, apple, bus…), drawn to
// be recognised by a 7-year-old at 40–64 px: classic silhouettes, bold colours.
// 32×32 grid; see geom.ts for the part format.
import { C, circ, ell, rr, soft, type IconArt, type Part } from "./geom";

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A chunky coloured stroke: ink under-stroke + colour on top (mono: one line). */
export function thick(d: string, fill: string, w = 2.8, mono = 2.4): Part[] {
  return [
    { i: d, w: w + 3.4, m: false },
    { i: d, w, f: fill, m: mono },
  ];
}

/** Spokes around a centre: `count` lines from radius `from` to `to`. */
export function rays(cx: number, cy: number, from: number, to: number, count: number, turn = -90): string {
  return Array.from({ length: count }, (_, i) => {
    const a = ((turn + (360 / count) * i) * Math.PI) / 180;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return `M${r1(cx + c * from)} ${r1(cy + s * from)}L${r1(cx + c * to)} ${r1(cy + s * to)}`;
  }).join("");
}

/** The little V twigs on each arm of a snowflake. */
function twigs(cx: number, cy: number, at: number, len: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    const [bx, by] = [cx + Math.cos(a) * at, cy + Math.sin(a) * at];
    const tip = (da: number) => {
      const t = a + (da * Math.PI) / 180;
      return `${r1(bx + Math.cos(t) * len)} ${r1(by + Math.sin(t) * len)}`;
    };
    return `M${tip(-45)}L${r1(bx)} ${r1(by)}L${tip(45)}`;
  }).join("");
}

const TILT = (-42 * Math.PI) / 180;

/** A point turned about the centre (toothbrush is drawn flat, then tilted). */
function turn([x, y]: readonly [number, number]): [number, number] {
  const [dx, dy] = [x - 16, y - 16.6];
  return [r1(16 + dx * Math.cos(TILT) - dy * Math.sin(TILT)), r1(16 + dx * Math.sin(TILT) + dy * Math.cos(TILT))];
}

function tilt(points: [number, number][], round: number): string {
  return soft(points.map(turn), round);
}

/** Pairs of points → tilted line segments. */
function tiltLines(points: [number, number][]): string {
  return points.map((pt, i) => `${i % 2 ? "L" : "M"}${turn(pt).join(" ")}`).join("");
}

/** A fluffy cloud, shifted by (dx, dy). */
export function cloudPath(dx: number, dy: number): string {
  const p = (x: number, y: number) => `${r1(x + dx)} ${r1(y + dy)}`;
  return [
    `M${p(8, 25)}C${p(3.6, 25)} ${p(1.8, 21.4)} ${p(3.4, 18.8)}C${p(4.4, 17)} ${p(6.2, 16.4)} ${p(7.8, 16.6)}`,
    `C${p(7.6, 11.8)} ${p(11, 8.8)} ${p(15, 9.4)}C${p(17.8, 6.4)} ${p(23.4, 7.2)} ${p(25, 11.8)}`,
    `C${p(28.4, 12.2)} ${p(30.4, 15.8)} ${p(29.6, 19.2)}C${p(29.2, 22.8)} ${p(26.6, 25)} ${p(24, 25)}Z`,
  ].join("");
}

/** A raindrop with its tip at the top. */
function drop(cx: number, cy: number): string {
  return `M${cx} ${cy - 3.6}C${cx + 0.8} ${cy - 2}${" "}${cx + 2.4} ${cy}${" "}${cx + 2.4} ${cy + 1.4}A2.4 2.4 0 0 1 ${cx - 2.4} ${cy + 1.4}C${cx - 2.4} ${cy} ${cx - 0.8} ${cy - 2} ${cx} ${cy - 3.6}Z`;
}

const PETALS: Part[] = Array.from({ length: 5 }, (_, i) => {
  const a = ((-90 + 72 * i) * Math.PI) / 180;
  return { b: circ(r1(16 + Math.cos(a) * 5.4), r1(11.6 + Math.sin(a) * 5.4), 4.4), f: C.pink, w: 2 };
});

export const THING_ART: Record<string, IconArt> = {
  tree: [
    { b: rr(13.4, 17, 5.2, 12.6, 1.6), f: C.brown },
    {
      b: "M6 16C3 12 6 6 11 6.4C12.6 2.8 19.4 2.8 21 6.4C26 6 29 12 26 16C27.6 20.6 23 23.6 19.6 22C18 24 14 24 12.4 22C9 23.6 4.4 20.6 6 16Z",
      f: C.leaf,
    },
    { a: "M20.6 13.6C23.4 14 25 16.4 24.2 18.6C22.8 20.6 20.4 20.4 19 19.2C17.2 20.4 14.6 20.2 13.6 18.8C16.4 18.8 19.4 17 20.6 13.6Z", f: C.greenDeep, o: 0.45 },
    { s: "M8.4 12.2Q9 9.4 11.8 8.8", w: 1.8 },
  ],
  flower: [
    ...thick("M16 17V29.6", C.greenDeep, 2.6, 2.2),
    { b: "M16 25.6C18.6 21.6 23.6 21 25.4 22.4C23.6 26.4 19.2 27.2 16 25.6Z", f: C.leaf, w: 1.8 },
    { b: "M16 24.6C13.6 21 9 20.4 7.2 21.8C9 25.4 13 26 16 24.6Z", f: C.leaf, w: 1.8 },
    ...PETALS,
    { b: circ(16, 11.6, 3.8), f: C.gold, w: 2 },
    { s: "M14.4 10.6Q14.8 9.6 15.8 9.4", w: 1.4 },
  ],
  apple: [
    { i: "M16 10Q15.8 6.4 17.6 3.6", w: 2.6 },
    {
      b: "M16 10C12 6.8 4.4 7.8 4.4 16.6C4.4 24 9.4 29.6 13 29.6C14.6 29.6 15 28.8 16 28.8C17 28.8 17.4 29.6 19 29.6C22.6 29.6 27.6 24 27.6 16.6C27.6 7.8 20 6.8 16 10Z",
      f: C.red,
    },
    { a: "M24.2 15.4C24.8 20.4 22.4 25 19 27C22.8 26.8 26 22 25.6 17.4C25.4 16.4 24.9 15.8 24.2 15.4Z", f: "#d63a55", o: 0.7 },
    { b: "M17.8 6.6C19.2 3 24 2.4 25.6 3.8C24.2 7.4 20.2 8.4 17.8 6.6Z", f: C.leaf, w: 1.8 },
    { s: "M8.6 14.6Q9.2 11.6 11.8 10.6", w: 2 },
  ],
  car: [
    { b: "M7.6 15.4L11 8.8Q11.6 7.6 13 7.6H20.4Q21.8 7.6 22.6 8.8L26.6 15.4Z", f: C.red },
    { b: "M11.4 14.6L13.6 9.8H16.2V14.6Z", f: C.sky, w: 1.6 },
    { b: "M18 9.8H20.2L22.8 14.6H18Z", f: C.sky, w: 1.6 },
    { b: rr(2.4, 14.6, 27.2, 9.4, 3.6), f: C.red },
    { a: rr(4.6, 20.2, 22.8, 2, 1), f: "#d63a55", o: 0.7 },
    { b: rr(25.6, 16.6, 3, 2.6, 1), f: C.gold, w: 1.6 },
    { b: circ(9.4, 24.2, 3.8), f: C.slate },
    { d: circ(9.4, 24.2, 1.4), f: C.steel },
    { b: circ(22.8, 24.2, 3.8), f: C.slate },
    { d: circ(22.8, 24.2, 1.4), f: C.steel },
    { s: "M5.4 17.6H9.4", w: 1.8 },
  ],
  bike: [
    ...thick(circ(8, 21.4, 5.8), C.slate, 2.6, 2.4),
    ...thick(circ(24, 21.4, 5.8), C.slate, 2.6, 2.4),
    ...thick("M8 21.4H15.4L21.4 12.4H12.8L15.4 21.4M8 21.4L12.8 12.4M21.4 12.4L24 21.4", C.red, 2.4, 2),
    { i: "M21.4 12.4L20.6 8.6L24.4 8", w: 2.4 },
    { b: rr(9.4, 9.4, 6.4, 2.8, 1.4), f: C.slate, w: 1.8 },
    { d: circ(8, 21.4, 1.4) },
    { d: circ(24, 21.4, 1.4) },
    { b: circ(15.4, 21.4, 1.9), f: C.gold, w: 1.6 },
  ],
  ball: [
    { b: circ(16, 16, 13), f: C.red, w: 0 },
    { a: "M16 3.4C9.6 9 9.6 23 16 28.6C22.4 23 22.4 9 16 3.4Z", f: C.white },
    { a: "M16 3.4A12.6 12.6 0 0 1 16 28.6C22.4 23 22.4 9 16 3.4Z", f: C.blue },
    { i: "M16 3.4C9.6 9 9.6 23 16 28.6M16 3.4C22.4 9 22.4 23 16 28.6", w: 1.6 },
    { i: circ(16, 16, 13), w: 2.2 },
    { s: "M6.4 12.6Q7.6 9 10.4 7.2", w: 2 },
  ],
  shoe: [
    {
      b: "M4 22.6V12.4Q4 10.4 6 10.4H10.4Q12.4 10.4 13.2 12.6Q14.6 16.2 19 17L24.6 18Q28.6 18.8 28.6 22.6Z",
      f: C.blue,
    },
    { a: "M4.6 16.4H11.4Q13 19.8 17.6 20.6H4.6Z", f: C.blueDeep, o: 0.5 },
    { i: "M14.6 15.2L17 13.6M16.6 16.8L19 15.2", w: 1.8 },
    { b: rr(2.4, 22, 27.8, 5.4, 2.6), f: C.white },
    { i: "M6 24.8H10M13 24.8H17", w: 1.4, f: C.steelDeep, m: false },
    { s: "M6.4 13.6V16", w: 1.8 },
  ],
  cup: [
    ...thick("M22 12.6H24Q28.2 12.6 28.2 18Q28.2 23.4 24 23.4H22", C.coral, 2.6, 2.2),
    { b: "M5 9.4H23V24.2Q23 28.6 18.6 28.6H9.4Q5 28.6 5 24.2Z", f: C.coral },
    { b: ell(14, 9.6, 9, 2.4), f: C.woodDeep, w: 1.8 },
    { a: rr(7, 20.4, 14, 2.4, 1.2), f: C.white, o: 0.8 },
    { i: "M10.6 6Q9.6 4.6 10.6 3M15 6Q14 4.6 15 3", w: 1.6, f: C.steelDeep, m: 1.6 },
    { s: "M8 13.6V17.4", w: 1.8 },
  ],
  bed: [
    { b: rr(4.6, 21.6, 23, 3.8, 1.2), f: C.wood },
    { b: rr(2.4, 8.4, 4.8, 21, 2), f: C.woodLight },
    { b: rr(25, 14.4, 4.6, 15, 2), f: C.woodLight },
    { b: rr(6.6, 16.4, 19, 6.2, 2), f: C.white },
    { b: rr(13.2, 15.4, 12.6, 7.2, 2.2), f: C.blue },
    { i: "M16.4 18.2H22.6", w: 1.4, f: C.white, m: false },
    { b: rr(7.6, 12.2, 7.6, 4.8, 2.4), f: C.white, w: 2 },
    { s: "M4.6 11.4V15", w: 1.6 },
  ],
  bus: [
    { b: rr(2.4, 6.6, 27.2, 18.4, 3.6), f: C.gold },
    { a: rr(4.4, 19.6, 23.2, 2.6, 1.2), f: C.goldDeep, o: 0.8 },
    { b: rr(5, 10, 4.6, 5.4, 1), f: C.sky, w: 1.6 },
    { b: rr(10.8, 10, 4.6, 5.4, 1), f: C.sky, w: 1.6 },
    { b: rr(16.6, 10, 4.6, 5.4, 1), f: C.sky, w: 1.6 },
    { b: rr(22.6, 10, 4.6, 11.4, 1), f: C.sky, w: 1.6 },
    { i: "M3.6 17.8H21.4", w: 1.6 },
    { b: rr(27, 18.6, 2.6, 2.6, 1), f: C.white, w: 1.4 },
    { b: circ(8.6, 25, 3.6), f: C.slate },
    { d: circ(8.6, 25, 1.3), f: C.steel },
    { b: circ(23.4, 25, 3.6), f: C.slate },
    { d: circ(23.4, 25, 1.3), f: C.steel },
    { s: "M5.4 8.8H11", w: 1.6 },
  ],
  school: [
    { i: "M16 7V2.2", w: 1.8 },
    { b: "M16.6 2.2L21.4 3.6L16.6 5Z", f: C.red, w: 1.4 },
    { b: rr(5, 14, 22, 15.4, 1.6), f: C.cream },
    { b: soft([[2.6, 15.6], [16, 6.6], [29.4, 15.6]], 1.4), f: C.red },
    { b: circ(16, 12.6, 2.4), f: C.white, w: 1.6 },
    { b: rr(13, 20.4, 6, 9, 1.4), f: C.woodLight, w: 1.8 },
    { b: rr(7.4, 18, 4.2, 4.2, 0.8), f: C.sky, w: 1.6 },
    { b: rr(20.4, 18, 4.2, 4.2, 0.8), f: C.sky, w: 1.6 },
    { s: "M6.8 25.4V27.4", w: 1.6 },
  ],
  toothbrush: [
    { b: tilt([[0.6, 17.2], [20, 17.2], [20, 22.6], [0.6, 22.6]], 2.6), f: C.blue },
    { b: tilt([[16.6, 16], [31, 16], [31, 23.6], [16.6, 23.6]], 2.4), f: C.blue },
    { b: tilt([[18.4, 10.8], [30.2, 10.8], [30.2, 16.4], [18.4, 16.4]], 1.2), f: C.white, w: 2 },
    { i: tiltLines([[21.4, 12], [21.4, 15.6], [24.3, 12], [24.3, 15.6], [27.2, 12], [27.2, 15.6]]), w: 1.3, f: C.steel, m: false },
    {
      b: tilt([[18, 11.4], [18.4, 8.4], [21, 7.6], [22.6, 5.6], [25.4, 6], [27, 7.8], [29.8, 7.6], [31, 11.4]], 1.6),
      f: C.cyan, w: 1.8,
    },
    { i: tiltLines([[21, 9.4], [27.4, 9.6]]), w: 1.4, f: C.white, m: false },
    { s: tiltLines([[3.6, 19.4], [11, 19.4]]), w: 1.8 },
  ],
  plate: [
    { b: circ(16, 16, 10), f: C.white },
    { a: circ(16, 16, 6.6), f: C.cloud },
    { i: circ(16, 16, 6.6), w: 1.4, f: C.steelDeep, m: 1.4 },
    { i: "M3.4 13V28", w: 2.4 },
    { i: "M1.8 4.6V9.6Q1.8 12.4 3.4 12.4Q5 12.4 5 9.6V4.6M3.4 4.6V9.6", w: 1.6 },
    { i: "M29 15.6V28", w: 2.4 },
    { b: "M28 15.6V5.6Q28 4 29.2 4.6Q31 6.6 30.8 15.6Z", f: C.steel, w: 1.6 },
    { s: "M10.4 12.4Q11.4 10.4 13.4 9.8", w: 1.6 },
  ],
  shirt: [
    {
      b: "M12 4.4Q16 8.2 20 4.4L27 7.4L30 14L25.6 16L24 13.6V28.4H8V13.6L6.4 16L2 14L5 7.4Z",
      f: C.blue,
    },
    { a: "M20.6 17.4L24 17.4V27.4H20.6Z", f: C.blueDeep, o: 0.5 },
    { i: "M12 4.4Q16 8.8 20 4.4", w: 1.8 },
    { b: soft([[16, 13], [17.3, 15.4], [19.8, 15.6], [18, 17.4], [18.6, 20], [16, 18.8], [13.4, 20], [14, 17.4], [12.2, 15.6], [14.7, 15.4]], 0.5), f: C.gold, w: 1.4 },
    { s: "M10.2 11.4V15", w: 1.8 },
  ],
  umbrella: [
    { i: "M16 16V25.6Q16 29 13.4 29Q10.8 29 10.8 26.4", w: 2.6 },
    { i: "M16 5.4V2.6", w: 2.4 },
    {
      b: "M2.6 17Q2.6 5 16 5Q29.4 5 29.4 17Q27.2 14.8 24.9 17Q22.7 14.8 20.4 17Q18.2 14.8 16 17Q13.8 14.8 11.6 17Q9.3 14.8 7.1 17Q4.8 14.8 2.6 17Z",
      f: C.red,
    },
    { a: "M16 5.6Q20.6 9 20.4 16.4Q18.2 14.8 16 16.6Q13.8 14.8 11.6 16.4Q11.4 9 16 5.6Z", f: C.gold },
    { i: "M16 5.4Q11.2 9 11.6 16.8M16 5.4Q20.8 9 20.4 16.8", w: 1.6 },
    { s: "M5.6 13Q6.6 9.4 9.8 7.6", w: 1.8 },
  ],
  cloud: [
    { b: cloudPath(0, 0), f: C.cloud },
    { a: "M6 22.4H25.6Q27.2 22.4 27.6 21Q27 23.4 24 23.6H8Q6.4 23.6 6 22.4Z", f: C.steel, o: 0.9 },
    { s: "M10.2 14.6Q11.2 11.6 14 11.2", w: 1.8 },
  ],
  rain: [
    { b: drop(9, 26), f: C.blue, w: 1.8 },
    { b: drop(16.4, 28), f: C.blue, w: 1.8 },
    { b: drop(23.6, 26), f: C.blue, w: 1.8 },
    { b: cloudPath(0, -6), f: C.steel },
    { a: "M6 16.4H25.6Q27.2 16.4 27.6 15Q27 17.4 24 17.6H8Q6.4 17.6 6 16.4Z", f: C.steelDeep, o: 0.6 },
    { s: "M10.2 8.6Q11.2 5.6 14 5.2", w: 1.8 },
  ],
  snow: [
    ...thick(rays(16, 16, 0, 13, 6), C.sky, 2.8, 2.4),
    { i: twigs(16, 16, 8, 4.2), w: 5.4, m: false },
    { i: twigs(16, 16, 8, 4.2), w: 2.2, f: C.sky, m: 2 },
    { b: circ(16, 16, 3), f: C.ice, w: 1.8 },
  ],
  fish: [
    { b: "M20 16.6L28.4 9.8Q30.2 9 29.8 11L27.8 16.6L29.8 22.2Q30.2 24.2 28.4 23.4Z", f: C.orange },
    { b: "M14 9.4L17 4.6Q18 3.8 18.4 5.2L19.6 9.6Z", f: C.orange, w: 1.8 },
    {
      b: "M2.8 16.6C5.4 10.2 10.4 7.6 14.8 7.6C19.4 7.6 22.6 11 23.6 16.6C22.6 22.2 19.4 25.4 14.8 25.4C10.4 25.4 5.4 23 2.8 16.6Z",
      f: C.orange,
    },
    { a: "M5.4 19.6C8 22.6 11.4 24 14.8 24C18.6 24 21.4 21.6 22.6 18.4C18 21.4 10 21.6 5.4 19.6Z", f: C.coral, o: 0.6 },
    { a: "M13.8 9.6Q16.4 16.6 13.8 23.4L16.6 23.6Q19 16.6 16.6 9.4Z", f: C.white },
    { i: "M13.8 9.6Q16.4 16.6 13.8 23.4M16.6 9.4Q19 16.6 16.6 23.6", w: 1.4 },
    { d: circ(8.8, 14.6, 1.9) },
    { d: circ(9.4, 14, 0.6), f: C.white },
    { s: "M6.6 12Q8 10.2 10 9.6", w: 1.6 },
  ],
  cat: [
    {
      b: "M5.4 27C3.2 22.4 3.6 16.4 5.6 12.2L5.2 4Q5.2 2.6 6.4 3.4L12.6 8C14.9 7.4 17.1 7.4 19.4 8L25.6 3.4Q26.8 2.6 26.8 4L26.4 12.2C28.4 16.4 28.8 22.4 26.6 27C23.8 29.6 8.2 29.6 5.4 27Z",
      f: C.orange,
    },
    { a: "M7.4 6.8L11 9.6L7.8 11.8Z", f: C.pink },
    { a: "M24.6 6.8L21 9.6L24.2 11.8Z", f: C.pink },
    { i: "M14 9.6V12.4M16 9.4V12.8M18 9.6V12.4", w: 1.4, f: C.goldDeep, m: false },
    { d: circ(11.2, 17.6, 2) },
    { d: circ(20.8, 17.6, 2) },
    { d: circ(11.8, 17, 0.7), f: C.white },
    { d: circ(21.4, 17, 0.7), f: C.white },
    { b: soft([[14.2, 20.6], [17.8, 20.6], [16, 22.6]], 0.6), f: C.pink, w: 1.4 },
    { i: "M13.4 23.8Q16 25.6 16 22.6Q16 25.6 18.6 23.8", w: 1.4 },
    { i: "M1.8 19.6L8 20.8M1.8 23.4L8 22.6M30.2 19.6L24 20.8M30.2 23.4L24 22.6", w: 1.3 },
    { s: "M7.8 15Q8.6 12.8 10.6 12", w: 1.6 },
  ],
  dog: [
    { b: ell(16, 17.4, 10, 10.6), f: C.sand },
    { a: ell(20.6, 14.4, 3.6, 3.2), f: C.wood, o: 0.55 },
    { b: "M8.6 7.6C3.8 7.4 2 13 2.6 19.2C3 23.4 6.8 24 8.4 20.4C9.6 16.4 10.6 11 8.6 7.6Z", f: C.brown },
    { b: "M23.4 7.6C28.2 7.4 30 13 29.4 19.2C29 23.4 25.2 24 23.6 20.4C22.4 16.4 21.4 11 23.4 7.6Z", f: C.brown },
    { b: ell(16, 22.4, 6, 4.6), f: C.cream, w: 2 },
    { d: circ(12, 15, 1.9) },
    { d: circ(20.6, 15, 1.9) },
    { d: circ(12.6, 14.4, 0.6), f: C.white },
    { d: circ(21.2, 14.4, 0.6), f: C.white },
    { b: ell(16, 20.2, 2.6, 1.8), f: C.slate, w: 1.6, m: "solid" },
    { i: "M16 22V23.4Q14.4 25.4 12.8 24M16 23.4Q17.6 25.4 19.2 24", w: 1.4 },
    { s: "M8.4 11.2Q8.8 9.6 9.4 9", w: 1.4 },
  ],
  bird: [
    { i: "M13 25V29.4M18 25V29.4M11.4 29.4H14.4M16.4 29.4H19.4", w: 1.8 },
    { b: "M21.6 14.6L29.2 10Q30.8 9.4 30.2 11L27.4 18.4Z", f: C.blueDeep },
    { b: ell(15.4, 17, 10.4, 9.4), f: C.blue },
    { a: "M6.6 20C8.4 24 12 25.6 15.4 25.6C11.6 24 9 21.6 8.6 17.4Z", f: C.cream },
    { b: "M12 17.2C15 15 20.4 14.8 24.6 15.6C23 19.8 19.8 22.6 15.8 22.6C13.6 22.6 12.2 20.4 12 17.2Z", f: C.blueDeep, w: 1.8 },
    { i: "M15.4 19.4Q18.6 19.4 21.4 17.4", w: 1.4 },
    { b: soft([[6, 12.6], [1, 15.4], [6, 18]], 0.8), f: C.orange, w: 1.8 },
    { d: circ(9.8, 13.6, 1.7) },
    { d: circ(10.3, 13.1, 0.55), f: C.white },
    { s: "M10 9.6Q12 8.2 14.6 8", w: 1.6 },
  ],
  robot: [
    { i: "M16 9V5.4", w: 2 },
    { b: circ(16, 4, 2.2), f: C.red, w: 1.8 },
    { b: rr(2.4, 14, 4, 7.4, 1.6), f: C.steelDeep, w: 1.8 },
    { b: rr(25.6, 14, 4, 7.4, 1.6), f: C.steelDeep, w: 1.8 },
    { b: rr(5, 8.6, 22, 19, 5.4), f: C.steel },
    { b: circ(11.4, 15.8, 3), f: C.cyan, w: 1.8 },
    { b: circ(20.6, 15.8, 3), f: C.cyan, w: 1.8 },
    { d: circ(11.4, 15.8, 1.2) },
    { d: circ(20.6, 15.8, 1.2) },
    { b: rr(10.6, 21.2, 10.8, 3, 1.4), f: C.white, w: 1.6 },
    { i: "M14.2 21.4V24M17.8 21.4V24", w: 1.2 },
    { s: "M8.2 13.4Q8.8 11.2 11 11", w: 1.8 },
  ],
  sun: [
    ...thick(rays(16, 16, 11.2, 14.4, 8), C.orange, 2.8, 2.4),
    { b: circ(16, 16, 8.4), f: C.gold },
    { a: "M21.6 13.4A6.4 6.4 0 0 1 14 22.2A7.6 7.6 0 0 0 21.6 13.4Z", f: C.goldDeep, o: 0.8 },
    { d: circ(13.2, 15, 1.2) },
    { d: circ(18.8, 15, 1.2) },
    { i: "M13.2 18.4Q16 20.6 18.8 18.4", w: 1.5 },
    { s: "M10.4 13.6Q11 11.4 13 10.6", w: 1.6 },
  ],
  moon: [
    { b: "M19.4 3.4A13 13 0 1 0 28.6 22.2A10.4 10.4 0 0 1 19.4 3.4Z", f: C.gold },
    { a: "M23.4 24.4A11.4 11.4 0 0 1 9.8 25.4A13 13 0 0 0 23.4 24.4Z", f: C.goldDeep, o: 0.8 },
    { i: "M10.4 14.6Q12 16 13.6 14.6", w: 1.5 },
    { i: "M10.8 20Q13 21.6 15.2 20.2", w: 1.5 },
    { b: soft([[26, 5.4], [27, 8], [29.6, 9], [27, 10], [26, 12.6], [25, 10], [22.4, 9], [25, 8]], 0.4), f: C.ice, w: 1.4 },
    { s: "M6.6 12.2Q7.6 9 10.4 7", w: 1.8 },
  ],
};
