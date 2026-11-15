// Icon art — shapes and arrows.
// 32×32 grid; see geom.ts for the part format.
import { C, circ, rr, soft, type IconArt } from "./geom";

type Pt = readonly [number, number];

/** The right-pointing arrow; the other three are exact rotations of it. */
const ARROW: Pt[] = [[4, 12.4], [16.4, 12.4], [16.4, 5.6], [28.6, 16], [16.4, 26.4], [16.4, 19.6], [4, 19.6]];
const ARROW_SHINE: Pt[] = [[7, 15], [13, 15]];

/** Quarter turns clockwise around the centre of the grid. */
function turn([x, y]: Pt, quarters: number): Pt {
  let p: Pt = [x, y];
  for (let k = 0; k < quarters; k++) p = [32 - p[1], p[0]];
  return p;
}

function arrow(quarters: number): IconArt {
  const [a, b] = ARROW_SHINE.map((p) => turn(p, quarters));
  return [
    { b: soft(ARROW.map((p) => turn(p, quarters)), 1.6), f: C.sky },
    { s: `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, w: 2 },
  ];
}

export const SHAPE_ART: Record<string, IconArt> = {
  circle: [
    { b: circ(16, 16, 12.6), f: C.blue },
    { s: "M8.4 13.4Q9.4 9 13.4 7.6", w: 2 },
  ],
  square: [
    { b: rr(4, 4, 24, 24, 4.6), f: C.green },
    { s: "M8.4 13.4V9.6Q8.4 8.4 9.6 8.4H13.4", w: 2 },
  ],
  triangle: [
    { b: soft([[16, 3.4], [29.4, 27.6], [2.6, 27.6]], 3), f: C.orange },
    { s: "M13 11.6L10.4 16.4", w: 2 },
  ],
  diamond: [
    { b: soft([[16, 2.4], [28.4, 16], [16, 29.6], [3.6, 16]], 2.4), f: C.purple },
    { s: "M8.8 15L12.8 10.4", w: 2 },
  ],
  "arrow-right": arrow(0),
  "arrow-down": arrow(1),
  "arrow-left": arrow(2),
  "arrow-up": arrow(3),
};
