// Icon art — classic world planets: science, nature and places (Volcano, Atom, Dino, Pyramid…).
// Drawn to read at 40–56 px in the middle of a planet on the home page.
// 32×32 grid; see geom.ts for the part format.
import { C, circ, ell, rr, soft, sparkle, starPoints, type IconArt, type Part } from "./geom";
import { cloudPath, rays, thick } from "./art-things";

const r2 = (n: number) => Math.round(n * 100) / 100;

/** One electron orbit of the atom: an ellipse turned by `deg` about the centre. */
function orbit(deg: number): string {
  const [rx, ry] = [12.6, 4.6];
  const a = (deg * Math.PI) / 180;
  const [dx, dy] = [Math.cos(a) * rx, Math.sin(a) * rx];
  const p0 = `${r2(16 - dx)} ${r2(16 - dy)}`;
  const p1 = `${r2(16 + dx)} ${r2(16 + dy)}`;
  return `M${p0}A${rx} ${ry} ${deg} 1 0 ${p1}A${rx} ${ry} ${deg} 1 0 ${p0}Z`;
}

const ORBITS = [0, 60, 120].map(orbit);

/** The point at distance `s` along the telescope and `h` across it. */
function scope(s: number, h: number): [number, number] {
  const a = (-30 * Math.PI) / 180;
  const [ux, uy] = [Math.cos(a), Math.sin(a)];
  return [r2(7 + ux * s - uy * h), r2(19 + uy * s + ux * h)];
}

/** A slab of the telescope from `s0` to `s1`, half-width `h0` → `h1`. */
function slab(s0: number, s1: number, h0: number, h1: number, round: number): string {
  return soft([scope(s0, -h0), scope(s1, -h1), scope(s1, h1), scope(s0, h0)], round);
}

/** One toy alphabet block with a pale panel behind its letter. */
function block(x: number, y: number, fill: string, letter: string): Part[] {
  return [
    { b: rr(x, y, 12.4, 12, 2.2), f: fill },
    { a: rr(x + 1.8, y + 1.8, 8.8, 8.4, 1.6), f: C.white, o: 0.4 },
    { i: letter, w: 2.2 },
  ];
}

export const WORLD_NATURE_ART: Record<string, IconArt> = {
  volcano: [
    { b: "M9.6 9.4C7.6 9.4 7 6.6 9 5.8C9.2 3.4 12.2 2.6 13.6 4.4C15 3 17.8 3.8 17.6 6C19.6 6.2 19.6 9.4 17.6 9.4Z", f: C.steel, w: 1.6 },
    { b: soft([[11.6, 11.6], [20.4, 11.6], [30.4, 28.8], [1.6, 28.8]], 1.6), f: C.brown },
    { a: soft([[18, 12.4], [20, 12.4], [28.8, 27.8], [21.4, 27.8]], 0.8), f: C.woodDeep, o: 0.6 },
    {
      b: "M11.4 11.6H20.6L21.8 14.6Q21 16.4 20 15.2L19.4 19.4Q18.4 21 17.4 19.4L16.6 16Q15.6 17.6 14.6 16.2L14 21.8Q13 23.2 12.2 21.6L12.2 15.4Q11 16 10.4 14.4Z",
      f: C.orange, w: 1.8,
    },
    { a: "M12.6 12.4H19.4L19.8 13.6Q16 15 12.2 13.6Z", f: C.gold },
    { b: circ(23.8, 7, 1.8), f: C.orange, w: 1.5 },
    { s: "M6.4 25.4L9.4 20.4", w: 1.8 },
  ],
  magnet: [
    { b: "M5.6 24.6V12.4A10.4 10.4 0 0 1 26.4 12.4V24.6H20V12.4A4 4 0 0 0 12 12.4V24.6Z", f: C.red },
    { a: rr(23, 9.6, 2, 9, 1), f: "#d63a55", o: 0.7 },
    { b: rr(5.6, 19.6, 6.4, 5.8, 1.2), f: C.steel },
    { b: rr(20, 19.6, 6.4, 5.8, 1.2), f: C.steel },
    { i: "M6.6 28.6L5.4 30.8M8.8 28.8V31.2M11 28.6L12.2 30.8M21 28.6L19.8 30.8M23.2 28.8V31.2M25.4 28.6L26.6 30.8", w: 1.6, m: 1.4 },
    { s: "M8.4 16.4V12.4Q8.4 8.4 11.6 6.4", w: 1.9 },
  ],
  flask: [
    { b: "M13 6.6V9.8A10.4 10.4 0 1 0 19 9.8V6.6Z", f: C.ice },
    { a: "M7.66 17H24.34A8.8 8.8 0 1 1 7.66 17Z", f: C.green, m: "solid" },
    { i: "M7.8 17H24.2", w: 1.4, f: C.greenDeep, m: false },
    { d: circ(12.4, 22, 1.5), f: C.white },
    { d: circ(18.8, 24.4, 2), f: C.white },
    { d: circ(19.6, 19.8, 1), f: C.white },
    { d: circ(15.6, 12.6, 1.1), f: C.green },
    { b: rr(11.6, 4.4, 8.8, 2.8, 1.2), f: C.ice, w: 1.8 },
    { b: rr(13.2, 1, 5.6, 4.4, 1.4), f: C.wood, w: 1.8 },
    { s: "M8.6 14.6Q9.4 12.4 11.4 11.2", w: 1.8 },
  ],
  atom: [
    ...ORBITS.map((d): Part => ({ i: d, w: 5.6, m: false })),
    ...ORBITS.map((d): Part => ({ i: d, w: 2.4, f: C.blue, m: 2 })),
    { b: circ(16, 16, 4.6), f: C.red },
    { b: circ(3.4, 16, 2.1), f: C.gold, w: 1.6, m: "solid" },
    { b: circ(22.3, 5.09, 2.1), f: C.gold, w: 1.6, m: "solid" },
    { b: circ(22.3, 26.91, 2.1), f: C.gold, w: 1.6, m: "solid" },
    { s: "M13.6 15.2Q14 13.4 15.6 12.8", w: 1.5 },
  ],
  dino: [
    { b: rr(22.2, 19.6, 3.8, 8.8, 1.8), f: C.greenDeep, w: 1.8 },
    { b: rr(11.4, 20.2, 3.8, 8.8, 1.8), f: C.greenDeep, w: 1.8 },
    { b: rr(19, 20.4, 4.4, 9, 1.8), f: C.green, w: 1.8 },
    { b: rr(8, 20.4, 4.4, 9, 1.8), f: C.green, w: 1.8 },
    {
      b: "M2.2 21.4C6 21.2 8 17.6 11 16.2C14.4 14.6 17.6 15 19.6 15.8C20.4 12 20.4 7.6 22.2 4.8C23.6 2.6 28.4 2.6 29.2 5.6C29.8 7.8 27.8 9 25.8 9.2C25 12.6 25.4 16.6 25.6 19.6C25.8 23.6 21.6 25.6 16 25.6C10.6 25.6 7.4 23.6 2.2 21.4Z",
      f: C.green,
    },
    { a: circ(14.8, 20.2, 1.6), f: C.greenDeep, o: 0.7 },
    { a: circ(19.2, 19.4, 1.2), f: C.greenDeep, o: 0.7 },
    { a: circ(10.6, 21.2, 1.1), f: C.greenDeep, o: 0.7 },
    { d: circ(25.6, 5.4, 1.2) },
    { i: "M26.8 7.6Q27.9 7.9 28.8 7", w: 1.3 },
    { s: "M8.8 18.6Q10.8 16.8 13.6 16.4", w: 1.7 },
  ],
  weather: [
    ...thick(rays(20.8, 10.6, 8.8, 11.4, 8), C.orange, 2.6, 2.2),
    { b: circ(20.8, 10.6, 6.8), f: C.gold },
    { a: "M25.6 9A5.4 5.4 0 0 1 20 16.2A6.2 6.2 0 0 0 25.6 9Z", f: C.goldDeep, o: 0.8 },
    { b: cloudPath(-0.6, 5), f: C.white },
    { a: "M7 28.6Q16 30.6 25 28.4Q27.6 27 28.4 24.4Q27 28.4 22 28.6Z", f: C.steel, o: 0.7 },
    { s: "M9.6 19.6Q10.6 17 13.4 16.4", w: 1.8 },
  ],
  gem: [
    { b: soft([[10, 5.4], [22, 5.4], [28.6, 12], [16, 28.8], [3.4, 12]], 1.2), f: C.purple },
    { a: soft([[10.2, 5.8], [21.8, 5.8], [24, 11.8], [8, 11.8]], 0.4), f: C.white, o: 0.35 },
    { a: soft([[16, 12.2], [28.2, 12.2], [16, 28.2]], 0.6), f: C.purpleDeep, o: 0.55 },
    { i: "M4 12H28M10 5.8L8 12L16 28M22 5.8L24 12L16 28M16 5.8L12.6 12M16 5.8L19.4 12", w: 1.4, m: 1.2 },
    { b: sparkle(26.4, 4.2, 2.6, 3.2), f: C.white, w: 1.4 },
    { s: "M6.6 13.6L10.4 18.4", w: 1.8 },
  ],
  turtle: [
    { b: rr(22.8, 17.4, 4.2, 5.4, 1.8), f: C.leaf, w: 1.8 },
    { b: ell(27.2, 16.6, 3.8, 3.4), f: C.leaf },
    { d: circ(28.4, 15.8, 1.1) },
    { i: "M28.2 18.4Q29.4 18.6 30.2 17.6", w: 1.2 },
    { b: soft([[3.6, 21.6], [0.6, 23.6], [4.2, 23.4]], 0.6), f: C.leaf, w: 1.6 },
    { b: rr(6, 21.4, 4.6, 6.8, 2), f: C.leaf, w: 1.8 },
    { b: rr(19.4, 21.4, 4.6, 6.8, 2), f: C.leaf, w: 1.8 },
    { b: "M4 22C4 14 9 9.4 15 9.4C21 9.4 26 14 26 22Z", f: C.greenDeep },
    { a: soft([[12.4, 12.4], [17.6, 12.4], [19.4, 15.8], [17.6, 19.2], [12.4, 19.2], [10.6, 15.8]], 0.8), f: C.green },
    { a: soft([[5.4, 19.4], [8.6, 19.4], [9.4, 15.8], [8.2, 13.6]], 0.8), f: C.green },
    { a: soft([[21.8, 13], [23.6, 15.4], [24.6, 19.4], [21, 19.4], [21.2, 15.8]], 0.8), f: C.green },
    { b: rr(2.6, 20.4, 25.8, 3.8, 1.9), f: C.gold, w: 1.8 },
    { s: "M6.6 17Q7.4 13.4 10.4 11.4", w: 1.8 },
  ],
  island: [
    { b: rr(1.6, 23.2, 28.8, 6.6, 3.3), f: C.blue },
    { i: "M3.8 27.6Q5.8 26.4 7.8 27.6M23.2 27.8Q25.2 26.6 27.2 27.8", w: 1.4, f: C.white, m: false },
    { b: "M5 25.6Q9 18.8 16 18.8Q23 18.8 27 25.6Z", f: C.sand },
    ...thick("M14.6 23Q15 15 19.4 8.6", C.wood, 2.8, 2.4),
    { b: "M19.4 8.4C15.6 5.4 10 6.4 7.4 10.6C11.4 9.2 15.4 9.4 19.4 8.4Z", f: C.leaf, w: 1.8 },
    { b: "M19.4 8.4C17.6 4 13 2.2 9.8 3.6C13.6 4.6 16.6 6.2 19.4 8.4Z", f: C.leaf, w: 1.8 },
    { b: "M19.4 8.4C21.4 4.2 26 2.8 28.6 4.6C25 5.4 22 6.8 19.4 8.4Z", f: C.leaf, w: 1.8 },
    { b: "M19.4 8.4C23.4 6.6 28.4 8.4 29.6 12.6C26.4 10.4 23 9.6 19.4 8.4Z", f: C.leaf, w: 1.8 },
    { b: circ(18.2, 10.4, 1.5), f: C.brown, w: 1.3 },
    { s: "M8.4 23.4Q10 21.2 12.4 20.6", w: 1.6 },
  ],
  pyramid: [
    { b: circ(26.4, 6.2, 3), f: C.gold, w: 1.6 },
    { b: soft([[8, 12], [15.4, 27.2], [0.8, 27.2]], 1.2), f: C.sand },
    { a: soft([[8.2, 14.4], [14, 26.2], [9.4, 26.2]], 0.6), f: C.goldDeep, o: 0.55 },
    { b: soft([[18, 5], [31, 27.4], [5, 27.4]], 1.4), f: C.sand },
    { a: soft([[18.2, 7.6], [29.4, 26.4], [19.6, 26.4]], 0.8), f: C.goldDeep, o: 0.55 },
    { i: "M12.4 17.4H23.6M9.6 22.4H26.4", w: 1.2, f: C.goldDeep, m: false },
    { b: rr(1.2, 26.6, 29.6, 3.2, 1.6), f: C.goldDeep, w: 1.8 },
    { s: "M11.6 19.4L15.2 13.2", w: 1.8 },
  ],
  telescope: [
    ...thick("M15.2 16L8.4 29.6M15.2 16L22 29.6M15.2 16V29.6", C.brown, 2.2, 2),
    { b: slab(-3, 0.6, 1.7, 1.7, 0.6), f: C.slate, w: 1.8 },
    { b: slab(0, 19, 2.6, 3.6, 1.2), f: C.blue },
    { b: slab(16.4, 19.6, 4.2, 4.2, 0.8), f: C.gold, w: 1.8 },
    { b: circ(15.4, 15.8, 2.1), f: C.slate, w: 1.6 },
    { b: soft(starPoints(27.4, 4.2, 3.6, 1.6), 0.4), f: C.gold, w: 1.4 },
    { s: "M8.4 16.8L13.8 13.6", w: 1.7 },
  ],
  paw: [
    {
      b: "M16 14.8C20.8 14.8 25.4 19.6 25.4 24.2C25.4 27.8 22.4 29.2 19.8 28.4C18.2 27.9 17.1 27.5 16 27.5C14.9 27.5 13.8 27.9 12.2 28.4C9.6 29.2 6.6 27.8 6.6 24.2C6.6 19.6 11.2 14.8 16 14.8Z",
      f: C.woodLight,
    },
    { b: ell(5.8, 13.6, 2.9, 3.5), f: C.woodLight, w: 2 },
    { b: ell(11.6, 7.4, 3.1, 3.9), f: C.woodLight, w: 2 },
    { b: ell(20.4, 7.4, 3.1, 3.9), f: C.woodLight, w: 2 },
    { b: ell(26.2, 13.6, 2.9, 3.5), f: C.woodLight, w: 2 },
    { a: ell(16, 23.4, 4.6, 3.1), f: C.pink, o: 0.9 },
    { a: ell(11.6, 8, 1.6, 2), f: C.pink, o: 0.9 },
    { a: ell(20.4, 8, 1.6, 2), f: C.pink, o: 0.9 },
    { s: "M9.8 22.4Q10.6 19.4 13.2 18.2", w: 1.8 },
  ],
  hourglass: [
    { b: rr(5.6, 5.6, 2.4, 20.8, 1.2), f: C.woodDeep, w: 1.6 },
    { b: rr(24, 5.6, 2.4, 20.8, 1.2), f: C.woodDeep, w: 1.6 },
    { b: "M8.6 6.2H23.4C23.4 11.6 18.4 13.6 18.4 16C18.4 18.4 23.4 20.4 23.4 25.8H8.6C8.6 20.4 13.6 18.4 13.6 16C13.6 13.6 8.6 11.6 8.6 6.2Z", f: C.ice },
    { a: "M11 10.4H21C20.4 12.4 17.2 13.6 16.8 15.4H15.2C14.8 13.6 11.6 12.4 11 10.4Z", f: C.gold, m: "solid" },
    { i: "M16 15.6V21.6", w: 1.2, f: C.goldDeep, m: 1 },
    { a: "M10 25.6Q10.8 20.6 16 20.2Q21.2 20.6 22 25.6Z", f: C.gold, m: "solid" },
    { b: rr(4.6, 2.4, 22.8, 4.2, 1.8), f: C.wood },
    { b: rr(4.6, 25.4, 22.8, 4.2, 1.8), f: C.wood },
    { s: "M10.8 8.6Q11.4 10.6 13 11.8", w: 1.7 },
  ],
  pin: [
    { b: ell(16, 27.4, 9.6, 2.9), f: C.green, w: 1.8 },
    { a: ell(16, 27.4, 4.2, 1.2), f: C.greenDeep, o: 0.6 },
    { b: "M16 28C13.4 23.4 6.6 18.8 6.6 12A9.4 9.4 0 0 1 25.4 12C25.4 18.8 18.6 23.4 16 28Z", f: C.red },
    { a: "M23 14.6C22 18.8 19 21.8 16.8 25.2C19.6 21.4 23 18.4 23 14.6Z", f: "#d63a55", o: 0.8 },
    { b: circ(16, 12, 3.8), f: C.white, w: 1.8 },
    { s: "M9.8 10.4Q10.6 6.6 13.8 5.2", w: 1.9 },
  ],
  mosque: [
    { b: rr(2, 27.2, 28, 2.8, 1.4), f: C.sand, w: 1.8 },
    { b: rr(24, 9.4, 4.4, 18.6, 1.4), f: C.cream, w: 1.8 },
    { b: soft([[23.4, 9.8], [26.2, 3.6], [29, 9.8]], 0.6), f: C.green, w: 1.6 },
    { b: rr(23.2, 13.2, 6, 2, 0.8), f: C.gold, w: 1.4 },
    { i: "M13.5 5.4V3.4", w: 1.6 },
    { b: "M14.8 0.4A2.2 2.2 0 1 0 15.6 3.8A1.7 1.7 0 0 1 14.8 0.4Z", f: C.gold, w: 1.2 },
    { b: rr(3.6, 15.4, 19.8, 12.6, 1.4), f: C.cream },
    { b: "M5.8 16.2C5.8 9.6 9.6 6.6 13.5 5.2C17.4 6.6 21.2 9.6 21.2 16.2Z", f: C.green },
    { a: "M17.4 7.6C19.8 9.6 20.6 12.6 20.6 15.6H16.6C17.4 12.6 17.6 10 17.4 7.6Z", f: C.greenDeep, o: 0.5 },
    { b: "M10.6 28V23.6Q10.6 20.2 13.5 19.4Q16.4 20.2 16.4 23.6V28Z", f: C.woodDeep, w: 1.8 },
    { d: rr(5.8, 19.6, 2, 3.6, 1) },
    { d: rr(19.2, 19.6, 2, 3.6, 1) },
    { s: "M8.4 13.4Q8.8 10.2 11.4 8.2", w: 1.8 },
  ],
  letters: [
    ...block(3, 17.6, C.red, "M6.4 26.4L9.2 20.2L12 26.4M7.4 24.4H11"),
    ...block(16.6, 17.6, C.blue, "M20.2 20.4V26.6H22.8Q24.8 26.6 24.8 25Q24.8 23.4 22.6 23.4H20.2M20.2 20.4H22.4Q24.2 20.4 24.2 21.9Q24.2 23.4 22.6 23.4"),
    ...block(9.8, 4.6, C.green, "M18.6 8.2Q17.8 7.4 16.2 7.4Q13.2 7.4 13.2 10.4Q13.2 13.4 16.2 13.4Q17.8 13.4 18.6 12.6"),
    { s: "M4.8 20.4V23", w: 1.6 },
  ],
};
