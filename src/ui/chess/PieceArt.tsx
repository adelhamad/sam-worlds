// The drawings behind <ChessPiece>: original, chunky "wooden toy" pieces on a
// 100×100 canvas. The silhouettes are the standard ones (battlements, mitre
// with a slit, crown points, cross, horse head, ball head) so what a child
// learns here transfers to a real set. Colours come from pieces.css.
import type { PieceType } from "../../engine/chess/types";

interface Shape {
  /** The whole silhouette, foot included — one closed path. */
  body: string;
  /** Inner drawing lines (slit, collar, mane…), stroked in the outline colour. */
  lines?: string[];
  /** Glossy toy highlights, stroked in the shine colour. */
  shine?: string[];
  /** Solid dots in the outline colour (the knight's eye): [cx, cy, r]. */
  dots?: Array<[number, number, number]>;
  /** Filled + outlined balls on top of the body (crown tips): [cx, cy, r]. */
  balls?: Array<[number, number, number]>;
}

// Every piece stands on the same rounded foot, so a row of them lines up.
const FOOT_IN = "M 24 93 Q 17 93 17 86 Q 17 80 25 79";
const FOOT_OUT = "Q 83 80 83 86 Q 83 93 76 93 Z";
const WIDE_IN = "M 22 93 Q 15 93 15 86 Q 15 80 23 79";
const WIDE_OUT = "Q 85 80 85 86 Q 85 93 78 93 Z";
const FOOT_LINE = "M 29 80 L 71 80";

const SHAPES: Record<PieceType, Shape> = {
  P: {
    body: [
      "M 27 93 Q 20 93 20 86 Q 20 80 28 79",
      "C 36 75 40 69 41 63 L 37 63 Q 32 63 32 59 Q 32 55 37 55 L 40 55",
      "A 15.5 15.5 0 1 1 60 55",
      "L 63 55 Q 68 55 68 59 Q 68 63 63 63 L 59 63 C 60 69 64 75 72 79",
      "Q 80 80 80 86 Q 80 93 73 93 Z",
    ].join(" "),
    lines: ["M 33 80 L 67 80"],
    shine: ["M 41 39 Q 43 32 50 30"],
  },
  R: {
    body: [
      FOOT_IN, "L 30 79 C 33 68 34 57 33 46 L 27 46 Q 21 46 21 40",
      "L 21 22 Q 21 17 26 17 L 33 17 Q 37 17 37 21 L 37 26 L 43.5 26 L 43.5 21 Q 43.5 17 47.5 17",
      "L 52.5 17 Q 56.5 17 56.5 21 L 56.5 26 L 63 26 L 63 21 Q 63 17 67 17 L 74 17 Q 79 17 79 22",
      "L 79 40 Q 79 46 73 46 L 67 46 C 66 57 67 68 70 79 L 75 79", FOOT_OUT,
    ].join(" "),
    lines: [FOOT_LINE, "M 27 37 L 73 37"],
    shine: ["M 39 52 C 40 60 39 67 37 73"],
  },
  B: {
    body: [
      FOOT_IN, "C 35 76 40 69 42 63 L 37 63 Q 32 63 32 59 Q 32 55 37 55 L 39 55",
      "C 29 46 31 32 42 21 C 44 19 46 17.5 47 16.5",
      "A 6 6 0 1 1 53 16.5",
      "C 54 17.5 56 19 58 21 C 69 32 71 46 61 55",
      "L 63 55 Q 68 55 68 59 Q 68 63 63 63 L 58 63 C 60 69 65 76 75 79", FOOT_OUT,
    ].join(" "),
    lines: [FOOT_LINE, "M 59 28 L 50 41"],
    shine: ["M 38 45 C 37 39 39 33 43 28"],
  },
  N: {
    body: [
      FOOT_IN, "L 30 79 C 31 70 37 63 45 57",
      "C 40 60 33 62 27 60 Q 16 58 15 48 Q 14 42 20 37",
      "C 27 31 33 25 38 21 L 39 10 Q 40 5 45 8 L 55 17",
      "C 72 23 82 41 79 60 C 78 68 75 75 71 79 L 75 79", FOOT_OUT,
    ].join(" "),
    lines: [FOOT_LINE, "M 19 51 Q 24 53 29 50", "M 58 24 C 68 32 72 45 70 58", "M 45 57 C 49 52 50 46 47 41"],
    shine: ["M 26 38 C 31 34 35 30 39 27"],
    dots: [[38, 35, 3.6], [20.5, 44.5, 1.6]],
  },
  Q: {
    body: [
      WIDE_IN, "C 34 76 39 69 40 62 L 35 62 Q 30 62 30 58 Q 30 54 35 54 L 37 54",
      "L 21 25 L 32 37 L 36 18 L 44 35 L 50 14 L 56 35 L 64 18 L 68 37 L 79 25 L 63 54",
      "L 65 54 Q 70 54 70 58 Q 70 62 65 62 L 60 62 C 61 69 66 76 77 79", WIDE_OUT,
    ].join(" "),
    lines: ["M 27 80 L 73 80", "M 36 47 Q 50 51 64 47"],
    shine: ["M 37 74 C 41 71 43 68 44 65"],
    balls: [[21, 24, 5], [36, 17, 5], [50, 12.5, 5.5], [64, 17, 5], [79, 24, 5]],
  },
  K: {
    body: [
      WIDE_IN, "C 34 76 39 69 40 62 L 35 62 Q 30 62 30 58 Q 30 54 35 54 L 37 54",
      "C 30 47 24 40 25 33 Q 26 26 35 26 C 39 26 43 27 45.5 28",
      "L 45.5 19 L 41 19 Q 38 19 38 16 L 38 13 Q 38 10 41 10 L 45.5 10 L 45.5 7 Q 45.5 3.5 49 3.5",
      "L 51 3.5 Q 54.5 3.5 54.5 7 L 54.5 10 L 59 10 Q 62 10 62 13 L 62 16 Q 62 19 59 19 L 54.5 19 L 54.5 28",
      "C 57 27 61 26 65 26 Q 74 26 75 33 C 76 40 70 47 63 54",
      "L 65 54 Q 70 54 70 58 Q 70 62 65 62 L 60 62 C 61 69 66 76 77 79", WIDE_OUT,
    ].join(" "),
    lines: ["M 27 80 L 73 80", "M 31 44 Q 50 50 69 44", "M 50 29 L 50 45"],
    shine: ["M 31 37 Q 31 32 36 31"],
  },
};

/** The layers of one piece; `clip` is a document-unique id for its clip path. */
export function PieceArt({ type, clip }: { type: PieceType; clip: string }) {
  const shape = SHAPES[type];
  return (
    <>
      <defs>
        <clipPath id={clip}><path d={shape.body} /></clipPath>
      </defs>
      <ellipse className="pc-ground" cx="50" cy="93.5" rx="36" ry="5" />
      <g className="pc-rim">
        <path d={shape.body} />
        {shape.balls?.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />)}
      </g>
      <g clipPath={`url(#${clip})`}>
        <path className="pc-shade" d={shape.body} />
        <path className="pc-fill" d={shape.body} transform="translate(-7 -3)" />
        {shape.shine?.map((d) => <path key={d} className="pc-shine" d={d} />)}
      </g>
      <path className="pc-line" d={shape.body} />
      {shape.lines?.map((d) => <path key={d} className="pc-detail" d={d} />)}
      {shape.balls?.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} className="pc-ball" cx={cx} cy={cy} r={r} />)}
      {shape.dots?.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} className="pc-dot" cx={cx} cy={cy} r={r} />)}
    </>
  );
}
