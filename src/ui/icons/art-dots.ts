// Icon art — paint blobs for the colour words and dot cards for the numbers
// one to ten. The dots are drawn shapes, never digits.
import { C, circ, rr, type IconArt, type Part } from "./geom";

const BLOB =
  "M16 3.4C20 3.4 21.6 6 24.6 7C28.2 8.2 29.8 11.8 28.8 15.6C28 18.4 29.2 20.2 27.4 23.6C25.6 27 21.6 27.6 18.4 27.4C16.2 29.2 14 30 12 28.4C8 28.8 4.6 25.6 4.4 21.6C2.4 19 2.8 15.2 5 12.8C5.2 8.6 8.6 6 12 6C13 4.4 14.4 3.4 16 3.4Z";

function blob(fill: string, deep: string): IconArt {
  return [
    { b: BLOB, f: fill },
    { a: "M26.4 13.6C27.6 17.4 26.6 21.6 24 24.4C21.8 26.4 19 27 16.6 26.4C21.4 24.4 25.4 19.6 26.4 13.6Z", f: deep, o: 0.5 },
    { s: "M8.6 13.4Q9.6 9.6 13 8.2", w: 2 },
  ];
}

/** Pip positions on a 3×3 card (columns 9.6 / 16 / 22.4, rows likewise). */
const COL = [8.8, 16, 23.2];
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
  7: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [2, 2]],
  8: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
  9: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
};
const TEN: [number, number][] = [11.2, 20.8].flatMap((y) => [7, 11.5, 16, 20.5, 25].map((x): [number, number] => [x, y]));
const PIP_COLOURS = [C.blue, C.red, C.green, C.orange, C.purple];

function pipRadius(n: number): number {
  if (n === 1) return 4;
  if (n === 10) return 2.1;
  return n > 6 ? 2.4 : 3;
}

function card(n: number): IconArt {
  const fill = PIP_COLOURS[(n - 1) % PIP_COLOURS.length];
  const radius = pipRadius(n);
  const spots: [number, number][] = n === 10 ? TEN : PIPS[n].map(([c, r]) => [COL[c], COL[r]]);
  const pips: Part[] = spots.map(([x, y]) => ({ b: circ(x, y, radius), f: fill, w: 1.4, m: "solid" }));
  return [
    { b: rr(3.4, 3.4, 25.2, 25.2, 5), f: C.cream },
    ...pips,
  ];
}

export const DOT_ART: Record<string, IconArt> = {
  "blob-red": blob(C.red, "#d63a55"),
  "blob-blue": blob(C.blue, C.blueDeep),
  "blob-green": blob(C.leaf, C.greenDeep),
  "blob-yellow": blob("#ffe14d", C.goldDeep),
  "blob-white": blob(C.white, C.steelDeep),
  "blob-black": blob("#3a3558", "#16123a"),
  ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`dots-${i + 1}`, card(i + 1)])),
};
