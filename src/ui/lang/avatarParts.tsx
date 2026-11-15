// The parts every chat avatar is drawn from — 100×100 canvas, flat fills, one
// dark outline (#16123a), round and chunky like Pogo and the course emblems.
// A face sits in a round badge; the shoulders are clipped by the badge edge.
import type { ReactNode } from "react";
import type { AvatarTone } from "./avatarMap";

export const LINE = "#16123a";
export const SHINE = "rgba(255,255,255,0.7)";
const CHEEK = "#ff8fa8";

/** Head centre: every face part is placed around it. */
export const HX = 50;
export const HY = 52;

/** The round badge, its clip, and the shoulders (in `tone.top`). */
export function Badge({ id, tone, children, body }: { id: string; tone: AvatarTone; children: ReactNode; body?: ReactNode }) {
  return (
    <>
      <defs>
        <clipPath id={id}><circle cx="50" cy="50" r="46" /></clipPath>
      </defs>
      <circle cx="50" cy="50" r="46" fill={tone.bg} />
      <g clipPath={`url(#${id})`}>
        {body ?? <Shoulders fill={tone.top} />}
        {children}
      </g>
      <circle cx="50" cy="50" r="46" fill="none" stroke={LINE} strokeWidth="4.5" />
    </>
  );
}

export function Shoulders({ fill, collar }: { fill: string; collar?: string }) {
  return (
    <>
      <path d="M 12 104 Q 12 78 50 76 Q 88 78 88 104 Z" fill={fill} stroke={LINE} strokeWidth="4" />
      {collar && <path d="M 40 77 L 50 86 L 60 77" fill="none" stroke={collar} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
    </>
  );
}

/** Ears + head (+ a neck under it). `rx`/`ry` let a baby be rounder. */
export function Head({ skin, rx = 21, ry = 22, ears = true }: { skin: string; rx?: number; ry?: number; ears?: boolean }) {
  return (
    <>
      <rect x={HX - 7} y={HY + 14} width="14" height="14" rx="4" fill={skin} stroke={LINE} strokeWidth="3.5" />
      {ears && <circle cx={HX - rx - 1} cy={HY + 2} r="5.5" fill={skin} stroke={LINE} strokeWidth="3.5" />}
      {ears && <circle cx={HX + rx + 1} cy={HY + 2} r="5.5" fill={skin} stroke={LINE} strokeWidth="3.5" />}
      <ellipse cx={HX} cy={HY} rx={rx} ry={ry} fill={skin} stroke={LINE} strokeWidth="4" />
    </>
  );
}

/** Two friendly dot eyes with a shine. */
export function Eyes({ y = HY + 1, gap = 8.5, r = 3.6 }: { y?: number; gap?: number; r?: number }) {
  return (
    <>
      {[-1, 1].map((side) => (
        <g key={side}>
          <circle cx={HX + side * gap} cy={y} r={r} fill={LINE} />
          <circle cx={HX + side * gap + r * 0.35} cy={y - r * 0.4} r={r * 0.36} fill="#fff" />
        </g>
      ))}
    </>
  );
}

/** Soft pink cheeks. */
export function Cheeks({ y = HY + 8, gap = 14 }: { y?: number; gap?: number }) {
  return (
    <>
      <ellipse cx={HX - gap} cy={y} rx="4.2" ry="2.8" fill={CHEEK} opacity="0.75" />
      <ellipse cx={HX + gap} cy={y} rx="4.2" ry="2.8" fill={CHEEK} opacity="0.75" />
    </>
  );
}

/** A smile; `open` draws a happy open mouth. */
export function Smile({ y = HY + 9, w = 6.5, open = false }: { y?: number; w?: number; open?: boolean }) {
  if (open) {
    return <path d={`M ${HX - w} ${y} Q ${HX} ${y + w * 1.4} ${HX + w} ${y} Z`} fill="#8a2f45" stroke={LINE} strokeWidth="2.6" strokeLinejoin="round" />;
  }
  return <path d={`M ${HX - w} ${y} Q ${HX} ${y + w} ${HX + w} ${y}`} fill="none" stroke={LINE} strokeWidth="3" strokeLinecap="round" />;
}

/** Brows, lifted a little: a kind, interested look. */
export function Brows({ y = HY - 6, color = LINE }: { y?: number; color?: string }) {
  return (
    <path
      d={`M ${HX - 12} ${y + 1} Q ${HX - 8.5} ${y - 2} ${HX - 5} ${y + 0.5} M ${HX + 5} ${y + 0.5} Q ${HX + 8.5} ${y - 2} ${HX + 12} ${y + 1}`}
      fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round"
    />
  );
}

/** Round glasses over the eyes. */
export function Glasses({ y = HY + 1, frame = LINE }: { y?: number; frame?: string }) {
  return (
    <g fill="rgba(255,255,255,0.22)" stroke={frame} strokeWidth="2.6">
      <circle cx={HX - 8.5} cy={y} r="6.6" />
      <circle cx={HX + 8.5} cy={y} r="6.6" />
      <path d={`M ${HX - 2} ${y - 1} Q ${HX} ${y - 3} ${HX + 2} ${y - 1}`} fill="none" />
    </g>
  );
}

/** A moustache under the nose. */
export function Moustache({ color, y = HY + 7 }: { color: string; y?: number }) {
  return (
    <path
      d={`M ${HX - 10} ${y + 2} Q ${HX - 6} ${y - 3} ${HX} ${y} Q ${HX + 6} ${y - 3} ${HX + 10} ${y + 2} Q ${HX + 5} ${y + 4} ${HX} ${y + 2} Q ${HX - 5} ${y + 4} ${HX - 10} ${y + 2} Z`}
      fill={color} stroke={LINE} strokeWidth="2.4" strokeLinejoin="round"
    />
  );
}

/** A small round nose. */
export function Nose({ skin }: { skin: string }) {
  return <ellipse cx={HX} cy={HY + 4.5} rx="2.6" ry="2" fill={skin} stroke={LINE} strokeWidth="2" opacity="0.9" />;
}

/** A plain, kind face: brows, eyes, cheeks, smile. */
export function Face({ open = false, brows = true }: { open?: boolean; brows?: boolean }) {
  return (
    <>
      {brows && <Brows />}
      <Eyes />
      <Cheeks />
      <Smile open={open} />
    </>
  );
}

/** A shine stroke on hair or a hat. */
export function Shine({ d }: { d: string }) {
  return <path d={d} fill="none" stroke={SHINE} strokeWidth="3" strokeLinecap="round" />;
}
