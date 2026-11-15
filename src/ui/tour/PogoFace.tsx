// Pogo's face parts: eyes, brows and mouths for every mood. All coordinates are
// on the 240×240 canvas of PogoArt.tsx.
import type { ReactNode } from "react";
import {
  EYE_Y, GRIN_MOUTH_D, INK, LIMB_LINE, MOUTH, OPEN_MOUTH_D, STAR_D, TONGUE, type BrowKind, type Eyes, type MouthKind,
} from "./pogoPoses";

/** A group whose local origin is (x, y): CSS rotate/scale on it pivots there,
    while children keep drawing in canvas coordinates. */
export function Pivot({ x, y, className, children }: { x: number; y: number; className: string; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className}>
        <g transform={`translate(${-x} ${-y})`}>{children}</g>
      </g>
    </g>
  );
}

const EYE_XS = [92, 148] as const;
const SIDES = ["l", "r"] as const;

interface EyePaint {
  fill: string;
  lid: string;
  /** A watery shine pooled at the bottom of the eye (sad). */
  watery: boolean;
}

function OpenEye({ x, side, fill, lid, watery }: EyePaint & { x: number; side: "l" | "r" }) {
  const px = x + (side === "l" ? 2 : -2); // pupils lean inward a touch
  return (
    <Pivot x={x} y={EYE_Y} className={`pg-eye pg-eye-${side}`}>
      <ellipse cx={x} cy={EYE_Y} rx={20} ry={23} fill={fill} />
      <Pivot x={px} y={EYE_Y + 1} className="pg-pupil">
        <circle cx={px} cy={EYE_Y + 1} r={12.5} fill={INK} />
        <ellipse cx={px} cy={EYE_Y + 8} rx={7.5} ry={3.6} fill="#7a5cff" opacity={0.65} />
        <circle cx={px - 4.5} cy={EYE_Y - 4} r={4.8} fill="#fff" />
        <circle cx={px + 4.8} cy={EYE_Y + 5.5} r={2.1} fill="#fff" opacity={0.9} />
      </Pivot>
      {watery && <path className="pg-water" d={`M${x - 16} ${EYE_Y + 11} Q${x} ${EYE_Y + 4} ${x + 16} ${EYE_Y + 11} Q${x + 10} ${EYE_Y + 23} ${x} ${EYE_Y + 23} Q${x - 10} ${EYE_Y + 23} ${x - 16} ${EYE_Y + 11} Z`} fill="#bfe8ff" opacity={0.8} />}
      <Pivot x={x} y={EYE_Y - 24} className="pg-lid">
        <ellipse cx={x} cy={EYE_Y} rx={21} ry={24} fill={lid} />
        <path d={`M${x - 18} ${EYE_Y + 10} Q${x} ${EYE_Y + 30} ${x + 18} ${EYE_Y + 10}`} fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      </Pivot>
    </Pivot>
  );
}

/** A dizzy spiral, wound outward from the middle of the eye. */
function spiral(x: number): string {
  return `M${x} ${EYE_Y} a3 3 0 1 1 6 0 a6 6 0 1 1 -12 0 a9 9 0 1 1 18 0 a12.5 12.5 0 1 1 -25 0`;
}

function DizzyEye({ x, fill }: { x: number; fill: string }) {
  return (
    <g>
      <ellipse cx={x} cy={EYE_Y} rx={20} ry={23} fill={fill} />
      <Pivot x={x} y={EYE_Y} className="pg-spiral">
        <path d={spiral(x)} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      </Pivot>
    </g>
  );
}

function StarEye({ x, fill }: { x: number; fill: string }) {
  return (
    <g>
      <ellipse cx={x} cy={EYE_Y} rx={20} ry={23} fill={fill} />
      <circle cx={x} cy={EYE_Y + 1} r={14} fill={INK} />
      <g transform={`translate(${x} ${EYE_Y + 1}) scale(1.45)`}>
        <path className="pg-star-eye" d={STAR_D} fill="#ffd95e" />
      </g>
      <circle cx={x - 6} cy={EYE_Y - 7} r={3} fill="#fff" />
    </g>
  );
}

const LINE_EYES: Record<"arc" | "shut" | "squeeze", { d: [string, string]; width: number }> = {
  arc: { d: ["M75 117 Q92 93 109 117", "M131 117 Q148 93 165 117"], width: 6.5 },
  shut: { d: ["M76 109 Q92 124 108 109", "M132 109 Q148 124 164 109"], width: 5.5 },
  squeeze: { d: ["M77 97 L105 110 L77 123", "M163 97 L135 110 L163 123"], width: 6.5 },
};

export function EyeSet({ kind, ...paint }: EyePaint & { kind: Eyes }) {
  if (kind === "open") {
    return (
      <g className="pg-eyes">
        {EYE_XS.map((x, i) => <OpenEye key={x} x={x} side={SIDES[i]} {...paint} />)}
      </g>
    );
  }
  if (kind === "dizzy" || kind === "star") {
    const Eye = kind === "dizzy" ? DizzyEye : StarEye;
    return (
      <g className="pg-eyes">
        {EYE_XS.map((x) => <Eye key={x} x={x} fill={paint.fill} />)}
      </g>
    );
  }
  const line = LINE_EYES[kind];
  return (
    <g className="pg-eyes" fill="none" stroke={INK} strokeWidth={line.width} strokeLinecap="round" strokeLinejoin="round">
      <path d={line.d[0]} />
      <path d={line.d[1]} />
    </g>
  );
}

const BROWS: Record<BrowKind, [string, string]> = {
  soft: ["M81 81 Q92 76 103 80", "M137 80 Q148 76 159 81"],
  ask: ["M79 84 Q92 80 105 83", "M133 76 Q150 64 166 75"],
  sad: ["M77 87 Q90 80 105 73", "M163 87 Q150 80 135 73"],
  high: ["M79 74 Q92 66 105 73", "M135 73 Q148 66 161 74"],
  bold: ["M77 73 Q92 76 106 85", "M163 73 Q148 76 134 85"],
};

export function Brows({ kind }: { kind: BrowKind }) {
  const [left, right] = BROWS[kind];
  return (
    <g className="pg-brows" fill="none" stroke={LIMB_LINE} strokeWidth={5} strokeLinecap="round">
      <path d={left} />
      <path d={right} />
    </g>
  );
}

/** An open mouth with a tongue and one round tooth. */
function Laugh({ d, clip, wide }: { d: string; clip: string; wide: boolean }) {
  return (
    <g>
      <path d={d} fill={MOUTH} />
      <g clipPath={clip}>
        <ellipse cx={120} cy={wide ? 167 : 164} rx={wide ? 15 : 12} ry={wide ? 9 : 8} fill={TONGUE} />
        <rect x={wide ? 111 : 113} y={130} width={wide ? 18 : 14} height={wide ? 15 : 14} rx={4} fill="#fff" />
      </g>
    </g>
  );
}

export function MouthShape({ kind, clip, grinClip }: { kind: MouthKind; clip: string; grinClip: string }) {
  switch (kind) {
    case "open":
      return <Laugh d={OPEN_MOUTH_D} clip={clip} wide={false} />;
    case "grin":
      return <Laugh d={GRIN_MOUTH_D} clip={grinClip} wide />;
    case "o":
      return <ellipse cx={120} cy={149} rx={9} ry={11} fill={MOUTH} />;
    case "oof":
      return <ellipse cx={120} cy={149} rx={17} ry={7.5} fill={MOUTH} />;
    case "hmm":
      return <path d="M108 146 Q119 153 131 141" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
    case "frown":
      return <path d="M107 153 Q120 141 133 153" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
    case "wavy":
      return <path d="M103 148 q4.25 -7 8.5 0 t8.5 0 t8.5 0 t8.5 0" fill="none" stroke={INK} strokeWidth={4.6} strokeLinecap="round" strokeLinejoin="round" />;
    case "talk":
      return (
        <g>
          <ellipse cx={120} cy={147} rx={12} ry={10} fill={MOUTH} />
          <ellipse cx={120} cy={152.5} rx={7} ry={3.8} fill={TONGUE} />
        </g>
      );
    case "snooze":
      return <ellipse cx={120} cy={147} rx={5.5} ry={5} fill={MOUTH} />;
    default:
      return <path d="M107 141 Q120 156 133 141" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
  }
}
