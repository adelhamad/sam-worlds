// Numbered solution arrows drawn over the board, 100 SVG units per square. A bent arrow shows the knight's L: two, then one.
import { colOf, rowOf } from "../../engine/chess/rules";
import type { BoardArrow } from "./boardTypes";

type Pt = [number, number];

const U = 100; // SVG units per square
const START_GAP = 30; // leave the piece's square visible
const TIP_GAP = 14;
const HEAD = 30;
const HEAD_HALF = 20;

function centre(sq: number, size: number): Pt {
  return [(colOf(sq, size) + 0.5) * U, (rowOf(sq, size) + 0.5) * U];
}

function toward(a: Pt, b: Pt, dist: number): Pt {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [a[0] + ((b[0] - a[0]) / len) * dist, a[1] + ((b[1] - a[1]) / len) * dist];
}

/** The corner of a knight's L: along the long side first. */
function corner(from: Pt, to: Pt): Pt {
  return Math.abs(to[1] - from[1]) > Math.abs(to[0] - from[0]) ? [from[0], to[1]] : [to[0], from[1]];
}

function fmt(points: Pt[]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

function Arrow({ arrow, size }: { arrow: BoardArrow; size: number }) {
  const a = centre(arrow.from, size);
  const b = centre(arrow.to, size);
  const mid: Pt[] = arrow.bent ? [corner(a, b)] : [];
  const before = mid[0] ?? a; // the point the last segment leaves from
  const tip = toward(b, before, TIP_GAP);
  const neck = toward(tip, before, HEAD);
  const dx = (tip[0] - neck[0]) / HEAD;
  const dy = (tip[1] - neck[1]) / HEAD;
  const head: Pt[] = [tip, [neck[0] - dy * HEAD_HALF, neck[1] + dx * HEAD_HALF], [neck[0] + dy * HEAD_HALF, neck[1] - dx * HEAD_HALF]];
  const line = fmt([toward(a, mid[0] ?? b, START_GAP), ...mid, neck]);
  const badge: Pt = mid[0] ?? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return (
    <g className="cb-arrow">
      <polyline className="cb-arrow-edge" points={line} />
      <polygon className="cb-arrow-edge" points={fmt(head)} />
      <polyline className="cb-arrow-line" points={line} />
      <polygon className="cb-arrow-head" points={fmt(head)} />
      {arrow.label && (
        <>
          <circle className="cb-arrow-badge" cx={badge[0]} cy={badge[1]} r={19} />
          <text className="cb-arrow-num" x={badge[0]} y={badge[1]} dy="9">{arrow.label}</text>
        </>
      )}
    </g>
  );
}

export function BoardArrows({ arrows, size }: { arrows: BoardArrow[]; size: number }) {
  return (
    <svg className="cb-arrows" viewBox={`0 0 ${size * U} ${size * U}`} aria-hidden="true" focusable="false">
      {arrows.map((arrow) => <Arrow key={`${arrow.from}-${arrow.to}-${arrow.label ?? ""}`} arrow={arrow} size={size} />)}
    </svg>
  );
}
