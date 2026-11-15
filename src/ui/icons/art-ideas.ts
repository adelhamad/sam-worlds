// Icon art — doing and thinking (book, target, compass, clock…).
// 32×32 grid; see geom.ts for the part format.
import { C, circ, ell, rr, soft, type IconArt, type Part } from "./geom";

const r2 = (n: number) => Math.round(n * 100) / 100;

/** A thick curved arrow along a circle, clockwise from a0° to a1° (0° = right). */
function arcArrow(cx: number, cy: number, r: number, a0: number, a1: number, fill: string): { line: Part[]; head: Part } {
  const rad = (a: number) => (a * Math.PI) / 180;
  const at = (a: number) => [cx + Math.cos(rad(a)) * r, cy + Math.sin(rad(a)) * r] as const;
  const [x0, y0] = at(a0);
  const [x1, y1] = at(a1);
  const d = `M${r2(x0)} ${r2(y0)}A${r} ${r} 0 0 1 ${r2(x1)} ${r2(y1)}`;
  // head: tip ahead along the tangent, base across the circle
  const tx = -Math.sin(rad(a1));
  const ty = Math.cos(rad(a1));
  const nx = Math.cos(rad(a1));
  const ny = Math.sin(rad(a1));
  const head = soft([
    [x1 + tx * 5.2, y1 + ty * 5.2],
    [x1 + nx * 4.6 - tx * 0.6, y1 + ny * 4.6 - ty * 0.6],
    [x1 - nx * 4.6 - tx * 0.6, y1 - ny * 4.6 - ty * 0.6],
  ], 0.9);
  return {
    line: [{ i: d, w: 7.2, m: false }, { i: d, w: 3.6, f: fill, m: 2.4 }],
    head: { b: head, f: fill, w: 2 },
  };
}

const LOOP_A = arcArrow(16, 16, 10.5, 196, 318, C.blue);
const LOOP_B = arcArrow(16, 16, 10.5, 16, 138, C.blue);

function ring(d: string, fill: string): Part[] {
  return [{ i: d, w: 6.6, m: false }, { i: d, w: 3, f: fill, m: 2.2 }];
}

const LINK_A = rr(2.8, 11, 15.4, 10, 5);
const LINK_B = rr(13.8, 11, 15.4, 10, 5);
const LINK_OVER = "M12.6 21H13.2Q18.2 21 18.2 16";

/** One footprint: the left foot low on the left, or its mirror high on the right. */
function foot(right: boolean): Part[] {
  const x = (v: number) => r2(right ? 32 - v : v);
  const y = (v: number) => r2(right ? v - 8.2 : v + 0.4);
  const sole = `M${x(10.6)} ${y(14.8)}C${x(14)} ${y(14.8)} ${x(15)} ${y(18)} ${x(14.4)} ${y(21.4)}C${x(13.8)} ${y(25)} ${x(12.6)} ${y(28)} ${x(10.2)} ${y(28)}C${x(7.8)} ${y(28)} ${x(6.6)} ${y(25.4)} ${x(6.6)} ${y(22.4)}C${x(6.6)} ${y(18.4)} ${x(7.4)} ${y(14.8)} ${x(10.6)} ${y(14.8)}Z`;
  const toes: Array<[number, number, number]> = [[13.2, 11.8, 2], [9.9, 10.8, 1.6], [7.2, 11.7, 1.35], [5.5, 13.8, 1.15]];
  return [
    { b: sole, f: C.green, w: 1.9 },
    ...toes.map(([tx, ty, tr]): Part => ({ b: circ(x(tx), y(ty), tr), f: C.green, w: 1.5 })),
    { s: `M${x(8.4)} ${y(20.4)}Q${x(8.6)} ${y(18)} ${x(10)} ${y(17.2)}`, w: 1.6 },
  ];
}

const PLANET_BACK = "M3.31 20.62A13.5 4.6 -20 0 1 28.69 11.38";
const PLANET_FRONT = "M28.69 11.38A13.5 4.6 -20 0 1 3.31 20.62";

export const IDEA_ART: Record<string, IconArt> = {
  book: [
    { b: "M2 9.5V27.5C7 26 12 26.4 16 28.6C20 26.4 25 26 30 27.5V9.5Z", f: C.blueDeep },
    { b: "M16 8.6C12.4 6.2 7.6 5.8 3.8 7.2V25C7.6 23.8 12.4 24.2 16 26.6Z", f: C.cream, w: 1.9 },
    { b: "M16 8.6C19.6 6.2 24.4 5.8 28.2 7.2V25C24.4 23.8 19.6 24.2 16 26.6Z", f: C.cream, w: 1.9 },
    { i: "M6.6 11.6Q9.8 11 13 12.4M6.6 15.6Q9.8 15 13 16.4M6.6 19.6Q9.8 19 13 20.4", w: 1.4, f: C.steelDeep, m: false },
    { i: "M19 12.4Q22.2 11 25.4 11.6M19 16.4Q22.2 15 25.4 15.6", w: 1.4, f: C.steelDeep, m: false },
    { i: "M16 9V26", w: 1.6 },
  ],
  target: [
    { b: circ(15, 17, 12.6), f: C.red },
    { b: circ(15, 17, 8.6), f: C.white, w: 1.8 },
    { b: circ(15, 17, 4.6), f: C.red, w: 1.8, m: "solid" },
    { s: "M5.2 14.4Q6.2 10.6 9.4 8.4" },
    { i: "M15 17L26.5 5.5", w: 2.6 },
    { b: "M24.2 7.8L24.6 3.6L27.8 2.2L27.4 5.6Z", f: C.gold, w: 1.6 },
    { b: "M24.2 7.8L28.4 7.4L29.8 4.2L26.4 4.6Z", f: C.gold, w: 1.6 },
  ],
  bolt: [
    { b: soft([[17.5, 2.5], [6, 18], [14, 18], [11.5, 29.5], [26, 13], [18, 13], [23, 2.5]], 1.3), f: C.gold },
    { a: "M18.6 14.6H23.2L14.6 25L16.4 17.2Z", f: C.goldDeep },
    { s: "M12 12.4L15.8 7.2", w: 1.8 },
  ],
  compass: [
    { b: rr(13.6, 1.6, 4.8, 4, 1.4), f: C.gold, w: 1.8 },
    { b: circ(16, 17.4, 12.8), f: C.gold },
    { b: circ(16, 17.4, 9.6), f: C.cream, w: 1.8 },
    { i: "M16 9.4V10.6M16 24.2V25.4M8 17.4H9.2M22.8 17.4H24", w: 1.6, f: C.steelDeep, m: false },
    { b: "M16 8.6L19.2 17.4H12.8Z", f: C.red, w: 1.7, m: "solid" },
    { b: "M16 26.2L19.2 17.4H12.8Z", f: C.white, w: 1.7 },
    { d: circ(16, 17.4, 1.5) },
    { s: "M5.6 14.4Q6.8 10.2 10.2 7.8" },
  ],
  brain: [
    {
      b: "M9 9C9 5 15 4 16 6.6C17 4 23 5 23 9C27.8 9.2 29.6 13.8 27.6 16.6C29.6 19.6 27.6 24.2 23.4 23.6C22.6 27.6 17.6 28.2 16 25.2C14.4 28.2 9.4 27.6 8.6 23.6C4.4 24.2 2.4 19.6 4.4 16.6C2.4 13.8 4.2 9.2 9 9Z",
      f: C.pink,
    },
    { i: "M16 6.8V25", w: 1.7 },
    { i: "M9.6 13Q12.2 12.2 12.6 15.2M22.4 13Q19.8 12.2 19.4 15.2M8.4 19.4Q11 18.6 12.6 21M23.6 19.4Q21 18.6 19.4 21", w: 1.6 },
    { s: "M6.6 12.6Q7.4 10.2 9.8 9.6", w: 1.7 },
  ],
  bug: [
    { i: "M5.6 14.6L2.8 13.4M5 20L2.4 20.8M6.6 25.4L4.4 27.6M26.4 14.6L29.2 13.4M27 20L29.6 20.8M25.4 25.4L27.6 27.6", w: 1.8 },
    { i: "M13.6 5Q12.4 2.2 10 2.6M18.4 5Q19.6 2.2 22 2.6", w: 1.7 },
    { b: ell(16, 8, 6, 4.6), f: "#2b2456" },
    { b: ell(16, 18.6, 11, 11), f: C.red },
    { i: "M16 8V29.6", w: 1.8, m: false },
    { d: circ(10.6, 15.6, 2.2) },
    { d: circ(21.4, 15.6, 2.2) },
    { d: circ(10.8, 23, 1.9) },
    { d: circ(21.2, 23, 1.9) },
    { d: circ(13.6, 7.4, 1.1), f: C.white },
    { d: circ(18.4, 7.4, 1.1), f: C.white },
    { s: "M7.6 15.2Q8.2 12.4 10.4 11.2", w: 1.7 },
  ],
  loop: [LOOP_A.line[0], LOOP_B.line[0], LOOP_A.head, LOOP_B.head, LOOP_A.line[1], LOOP_B.line[1]],
  lens: [
    { i: "M20 20L27.4 27.4", w: 7.4, m: false },
    { i: "M20.4 20.4L27.4 27.4", w: 3.6, f: C.brown, m: 3.4 },
    { b: circ(13, 13, 10.4), f: C.steel },
    { b: circ(13, 13, 7.2), f: C.ice, w: 1.8 },
    { s: "M8.8 12Q9.4 9.4 12 8.6", w: 1.9 },
  ],
  puzzle: [
    {
      b: "M4 8H10.5C9.6 4.6 11.6 2.6 14 2.6S18.4 4.6 17.5 8H24V14.5C27.4 13.6 29.4 15.6 29.4 18S27.4 22.4 24 21.5V28H17.5C18.4 24.6 16.4 22.6 14 22.6S9.6 24.6 10.5 28H4Z",
      f: C.green,
    },
    { a: "M5.8 25.2H9.4Q9.2 24 9.6 23V26.2H5.8Z", f: C.greenDeep, o: 0.5 },
    { s: "M7 11.4V16", w: 1.9 },
  ],
  bulb: [
    { b: "M16 2.8C10 2.8 6 7.4 6 13C6 16.6 8 19.2 10.6 21.2V23.4H21.4V21.2C24 19.2 26 16.6 26 13C26 7.4 22 2.8 16 2.8Z", f: C.gold },
    { i: "M13.4 18.4V15.4Q13.4 12.4 16 12.4T18.6 15.4V18.4", w: 1.7, f: C.orange, m: 1.6 },
    { b: rr(10.4, 22.6, 11.2, 5.6, 1.6), f: C.steel, w: 2 },
    { i: "M11.4 25.4H20.6", w: 1.4, m: false },
    { b: rr(13.2, 28, 5.6, 2.6, 1.2), f: C.slate, w: 1.8 },
    { s: "M9.4 12.6Q9.8 8.6 13 7", w: 1.9 },
  ],
  flag: [
    { b: "M9 5C14.4 2.6 18.4 8 26.8 5.2V18C18.4 20.8 14.4 15.4 9 17.6Z", f: C.red },
    { a: "M9.8 14.6C14.4 12.8 18.4 18 26 15.6V17.4C18.4 19.8 14.4 14.6 9.8 16.4Z", f: "#e04560", o: 0.8 },
    { s: "M12.2 7.6Q14.2 6.8 16.4 7.8", w: 1.8 },
    { b: rr(6, 3.4, 3.2, 26.8, 1.6), f: C.brown },
    { b: circ(7.6, 3.6, 2.1), f: C.gold, w: 1.8 },
  ],
  map: [
    { b: "M3 7.4L11 4.4L21 7.4L29 4.4V24.8L21 27.8L11 24.8L3 27.8Z", f: C.sand },
    { a: "M11 4.4L21 7.4V27.8L11 24.8Z", f: "#ecc277" },
    { i: "M11 4.6V24.6M21 7.6V27.6", w: 1.6 },
    { d: circ(6.4, 22.4, 1.1), f: C.red },
    { d: circ(8.6, 19, 1.1), f: C.red },
    { d: circ(12, 16.8, 1.1), f: C.red },
    { d: circ(15.6, 16, 1.1), f: C.red },
    { d: circ(19, 14.2, 1.1), f: C.red },
    { i: "M22.4 9.6L26.2 13.4M26.2 9.6L22.4 13.4", w: 2.4, f: C.red, m: 2 },
  ],
  rocket: [
    { b: "M10.2 14.6L5.2 20.6V25.4L10.6 22Z", f: C.red },
    { b: "M21.8 14.6L26.8 20.6V25.4L21.4 22Z", f: C.red },
    { b: "M12.6 23Q16 32 19.4 23Z", f: C.orange, w: 1.8 },
    { a: "M14.2 23.4Q16 28.6 17.8 23.4Z", f: C.gold },
    { b: "M16 2.4C21 5.8 22.6 12 22.2 20.6H9.8C9.4 12 11 5.8 16 2.4Z", f: C.cloud },
    { a: "M16 3.9C18.4 5.7 19.8 7.6 20.5 9.4H11.5C12.2 7.6 13.6 5.7 16 3.9Z", f: C.red },
    { b: circ(16, 13, 3), f: C.sky, w: 1.8 },
    { b: rr(11.6, 20.4, 8.8, 3.2, 1.2), f: C.slate, w: 1.8 },
    { s: "M12.6 11.6Q12.6 15.6 13.2 18", w: 1.8 },
  ],
  planet: [
    ...ring(PLANET_BACK, C.gold),
    { b: circ(16, 16, 9.4), f: C.purple },
    { i: "M8.4 13.2Q16 10.6 23.6 13.2M9 19.4Q16 17.4 23.2 19", w: 2, f: C.purpleDeep, m: false },
    { s: "M10.4 11.6Q11.4 9 14 8.2", w: 1.8 },
    ...ring(PLANET_FRONT, C.gold),
  ],
  globe: [
    { b: circ(16, 16, 13), f: C.blue },
    { b: "M7.4 9.6C9.4 6.8 13.4 6.8 14.4 9.4C15.4 12 13 13 13.4 15.6C13.8 18.2 11 19 9.4 17.4C7.4 15.4 5.4 12.6 7.4 9.6Z", f: C.leaf, w: 1.6 },
    { b: "M18.4 6.8C21.4 5.8 25.4 8.4 26.4 11.8C27.4 14.8 25.4 16.4 23 15.4C21 14.6 20 16 18.4 15C16.4 13.6 16 7.8 18.4 6.8Z", f: C.leaf, w: 1.6 },
    { b: "M17.4 20.2C19.8 18.6 23.8 19.6 24.4 22.6C24.8 25.4 21.4 27.8 18.4 26.8C16 26 15.4 21.6 17.4 20.2Z", f: C.leaf, w: 1.6 },
    { s: "M5.4 19.4Q6 23 8.6 25.4", w: 1.9 },
  ],
  clock: [
    { b: circ(16, 16, 13.6), f: C.red },
    { b: circ(16, 16, 10.4), f: C.white, w: 1.8 },
    { i: "M16 7.6V9.4M24.4 16H22.6M16 24.4V22.6M7.6 16H9.4", w: 2 },
    { i: "M16 16L11.8 13.6M16 16L21.8 12.6", w: 2.4 },
    { d: circ(16, 16, 1.7) },
    { s: "M5.6 11.6Q7 7.6 10.6 5.6", w: 1.8 },
  ],
  calendar: [
    { b: rr(4, 6, 24, 23.4, 3), f: C.white },
    { b: "M4 13.6V9Q4 6 7 6H25Q28 6 28 9V13.6Z", f: C.red },
    { a: rr(7.2, 16.4, 3.4, 3.2, 0.8), f: "#dfe5f2" },
    { a: rr(12.2, 16.4, 3.4, 3.2, 0.8), f: "#dfe5f2" },
    { a: rr(17.2, 16.4, 3.4, 3.2, 0.8), f: "#dfe5f2" },
    { a: rr(22.2, 16.4, 3.4, 3.2, 0.8), f: "#dfe5f2" },
    { a: rr(7.2, 22, 3.4, 3.2, 0.8), f: "#dfe5f2" },
    { a: rr(12.2, 22, 3.4, 3.2, 0.8), f: C.gold, m: "solid" },
    { a: rr(17.2, 22, 3.4, 3.2, 0.8), f: "#dfe5f2" },
    { b: rr(8.6, 2.6, 3.2, 6.4, 1.6), f: C.steel, w: 1.8 },
    { b: rr(20.2, 2.6, 3.2, 6.4, 1.6), f: C.steel, w: 1.8 },
    { s: "M6.6 17V24", w: 1.6 },
  ],
  bell: [
    { b: circ(16, 26, 2.8), f: C.brown, w: 2 },
    { b: circ(16, 3.8, 2.1), f: C.gold, w: 1.8 },
    { b: "M16 4.6C10.4 4.6 8.2 9 8.2 13.8V18.8L4.8 23.6H27.2L23.8 18.8V13.8C23.8 9 21.6 4.6 16 4.6Z", f: C.gold },
    { a: "M7.4 21.2H24.6L25.6 22.6H6.4Z", f: C.goldDeep },
    { s: "M11.2 17Q11 11 13.6 8.4", w: 1.9 },
  ],
  heart: [
    {
      b: "M16 28C10 23.6 3.4 18.6 3.4 11.6C3.4 7.6 6.4 4.6 10 4.6C12.6 4.6 14.8 6 16 8.2C17.2 6 19.4 4.6 22 4.6C25.6 4.6 28.6 7.6 28.6 11.6C28.6 18.6 22 23.6 16 28Z",
      f: C.red,
    },
    { a: "M24.6 15.6C23 19.4 19.8 22.4 16 25.4C19.4 22.6 23 19.6 24.6 15.6Z", f: "#e04560" },
    { s: "M7.2 10.6Q7.8 8.2 10.2 7.8", w: 2 },
  ],
  home: [
    { b: rr(21, 4.6, 3.8, 7, 0.8), f: C.brown, w: 1.8 },
    { b: rr(6, 12.6, 20, 16.2, 1.6), f: C.cream },
    { b: soft([[16, 3], [29.4, 14.6], [2.6, 14.6]], 1.4), f: C.red },
    { b: rr(9.6, 18.4, 5.6, 10.4, 1.6), f: C.wood, w: 1.8 },
    { d: circ(13.6, 23.8, 0.8) },
    { b: rr(18.2, 17.6, 4.8, 4.8, 1), f: C.sky, w: 1.8 },
    { s: "M23.6 24V26.6", w: 1.8 },
  ],
  chat: [
    { b: "M8 4.8H24Q29 4.8 29 9.8V17.8Q29 22.8 24 22.8H14.2L8 28V22.8Q3 22.8 3 17.8V9.8Q3 4.8 8 4.8Z", f: C.cloud },
    { d: circ(10.4, 13.8, 1.9) },
    { d: circ(16, 13.8, 1.9) },
    { d: circ(21.6, 13.8, 1.9) },
    { s: "M6.2 10Q6.4 7.8 8.6 7.6", w: 1.8 },
  ],
  link: [
    ...ring(LINK_A, C.blue),
    ...ring(LINK_B, C.orange),
    ...ring(LINK_OVER, C.blue),
  ],
  footprints: [...foot(false), ...foot(true)],
  laptop: [
    { b: rr(6, 4.6, 20, 15.6, 2.2), f: C.slate },
    { a: rr(8.4, 7, 15.2, 10.8, 1), f: C.sky },
    { i: "M10.6 10H15.6", w: 1.5, f: C.greenDeep, m: false },
    { i: "M12.6 12.8H20", w: 1.5, f: C.purpleDeep, m: false },
    { i: "M10.6 15.4H15", w: 1.5, f: C.red, m: false },
    { b: "M3.4 21H28.6L30 25Q30 27.2 27.8 27.2H4.2Q2 27.2 2 25Z", f: C.steel },
    { a: rr(13, 21.8, 6, 1.6, 0.8), f: C.steelDeep },
    { s: "M10 8.6L11.6 8.6", w: 1.4 },
  ],
  abacus: [
    { b: rr(3, 3.6, 26, 24.8, 3), f: C.wood },
    { b: rr(6, 6.6, 20, 18.8, 1.2), f: C.cream, w: 1.8 },
    { i: "M6.4 10.8H25.6M6.4 16H25.6M6.4 21.2H25.6", w: 1.4 },
    { b: circ(9.2, 10.8, 2.1), f: C.red, w: 1.6 },
    { b: circ(13.4, 10.8, 2.1), f: C.red, w: 1.6 },
    { b: circ(22.8, 10.8, 2.1), f: C.red, w: 1.6 },
    { b: circ(9.2, 16, 2.1), f: C.blue, w: 1.6 },
    { b: circ(13.4, 16, 2.1), f: C.blue, w: 1.6 },
    { b: circ(17.6, 16, 2.1), f: C.blue, w: 1.6 },
    { b: circ(9.2, 21.2, 2.1), f: C.green, w: 1.6 },
    { b: circ(18.6, 21.2, 2.1), f: C.green, w: 1.6 },
    { b: circ(22.8, 21.2, 2.1), f: C.green, w: 1.6 },
    { s: "M5.2 9V14", w: 1.6 },
  ],
};
