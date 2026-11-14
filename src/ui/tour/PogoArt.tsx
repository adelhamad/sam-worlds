// Pogo's drawing — one inline SVG on a 240×240 canvas (feet on the ground at
// y≈227, centred on x=120). Every part that moves sits in a <Pivot>, so
// pogo.css can animate parts independently with plain transforms.
import { useId, type ReactNode } from "react";
import type { PogoMood } from "./Pogo";

type Eyes = "open" | "arc" | "shut";
type MouthKind = "smile" | "open" | "o" | "hmm" | "talk" | "snooze";
type AntennaKind = "curve" | "straight" | "curl" | "droop";

interface Pose {
  eyes: Eyes;
  mouth: MouthKind;
  antenna: AntennaKind;
  brows?: boolean;
  sparkles?: boolean;
  party?: boolean;
  zzz?: boolean;
}

const POSES: Record<PogoMood, Pose> = {
  idle: { eyes: "open", mouth: "smile", antenna: "curve" },
  happy: { eyes: "arc", mouth: "open", antenna: "curve", sparkles: true },
  cheer: { eyes: "arc", mouth: "open", antenna: "curve", sparkles: true, party: true },
  think: { eyes: "open", mouth: "hmm", antenna: "curl", brows: true },
  wave: { eyes: "open", mouth: "open", antenna: "curve" },
  talk: { eyes: "open", mouth: "talk", antenna: "curve" },
  wow: { eyes: "open", mouth: "o", antenna: "straight" },
  sleep: { eyes: "shut", mouth: "snooze", antenna: "droop", zzz: true },
};

/** Stalk path from the head (120,60) and where its bulb ends up. */
const ANTENNAS: Record<AntennaKind, { d: string; x: number; y: number }> = {
  curve: { d: "M120 60 C119 45 124 33 135 26", x: 139, y: 23 },
  straight: { d: "M120 60 L120 32", x: 120, y: 21 },
  curl: { d: "M120 60 L120 52 C120 41 138 41 138 28 C138 15 121 10 112 19", x: 108, y: 23 },
  droop: { d: "M120 60 C120 42 99 37 85 49", x: 81, y: 53 },
};

const INK = "#24104f";
const MOUTH = "#3d1463";
const TONGUE = "#ff7fa8";
const LIMB_LINE = "#5b3fd6";
const BODY_D = "M120 56 C162 56 188 92 192 140 C195 184 170 212 120 212 C70 212 45 184 48 140 C52 92 78 56 120 56 Z";
const OPEN_MOUTH_D = "M102 139 Q120 135 138 139 Q138 165 120 165 Q102 165 102 139 Z";
const STAR_D = "M0 -8 Q1.2 -1.2 8 0 Q1.2 1.2 0 8 Q-1.2 1.2 -8 0 Q-1.2 -1.2 0 -8 Z";
const EYE_Y = 110;

/** A stubby arm hanging from a shoulder at (x, 151): slim at the top, a round mitten at the end. */
function armPath(x: number): string {
  return `M${x - 8} 151 Q${x - 8} 142 ${x} 142 Q${x + 8} 142 ${x + 8} 151 L${x + 11.5} 178 A11.5 11.5 0 0 1 ${x - 11.5} 178 Z`;
}

/** A group whose local origin is (x, y): CSS rotate/scale on it pivots there,
    while children keep drawing in canvas coordinates. */
function Pivot({ x, y, className, children }: { x: number; y: number; className: string; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className}>
        <g transform={`translate(${-x} ${-y})`}>{children}</g>
      </g>
    </g>
  );
}

function OpenEye({ x, side, fill, lid }: { x: number; side: "l" | "r"; fill: string; lid: string }) {
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
      <Pivot x={x} y={EYE_Y - 24} className="pg-lid">
        <ellipse cx={x} cy={EYE_Y} rx={21} ry={24} fill={lid} />
        <path d={`M${x - 18} ${EYE_Y + 10} Q${x} ${EYE_Y + 30} ${x + 18} ${EYE_Y + 10}`} fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      </Pivot>
    </Pivot>
  );
}

function EyeSet({ kind, fill, lid }: { kind: Eyes; fill: string; lid: string }) {
  if (kind === "open") {
    return (
      <g className="pg-eyes">
        <OpenEye x={92} side="l" fill={fill} lid={lid} />
        <OpenEye x={148} side="r" fill={fill} lid={lid} />
      </g>
    );
  }
  const d = kind === "arc" ? ["M75 117 Q92 93 109 117", "M131 117 Q148 93 165 117"] : ["M76 109 Q92 124 108 109", "M132 109 Q148 124 164 109"];
  return (
    <g className="pg-eyes" fill="none" stroke={INK} strokeWidth={kind === "arc" ? 6.5 : 5.5} strokeLinecap="round">
      <path d={d[0]} />
      <path d={d[1]} />
    </g>
  );
}

function MouthShape({ kind, clip }: { kind: MouthKind; clip: string }) {
  switch (kind) {
    case "open":
      return (
        <g>
          <path d={OPEN_MOUTH_D} fill={MOUTH} />
          <g clipPath={clip}>
            <ellipse cx={120} cy={164} rx={12} ry={8} fill={TONGUE} />
          </g>
        </g>
      );
    case "o":
      return <ellipse cx={120} cy={149} rx={9} ry={11} fill={MOUTH} />;
    case "hmm":
      return <path d="M108 146 Q119 153 131 141" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
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

function Bulb({ x, y, sparkles, ids }: { x: number; y: number; sparkles: boolean; ids: { bulb: string; glow: string } }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className="pg-glow" r={25} fill={ids.glow} />
      <g className="pg-bulb">
        <circle r={11.5} fill={ids.bulb} />
        <ellipse cx={-3.6} cy={-4.2} rx={3.4} ry={2.5} fill="#fff" opacity={0.9} transform="rotate(-30 -3.6 -4.2)" />
        <circle className="pg-bulb-dim" r={11.5} fill="#3a2a86" />
      </g>
      {sparkles && (
        <g fill="#ffe7a0">
          <g transform="translate(-23 -5) scale(0.95)"><path className="pg-spark pg-spark-1" d={STAR_D} /></g>
          <g transform="translate(21 -14) scale(1.2)"><path className="pg-spark pg-spark-2" d={STAR_D} /></g>
          <g transform="translate(19 17) scale(0.75)"><path className="pg-spark pg-spark-3" d={STAR_D} /></g>
        </g>
      )}
    </g>
  );
}

/** Extra twinkles around the body for the big celebration. */
function PartyStars() {
  return (
    <g fill="#ffe7a0">
      <g transform="translate(24 84) scale(1.3)"><path className="pg-spark pg-spark-2" d={STAR_D} /></g>
      <g transform="translate(218 112) scale(1.1)"><path className="pg-spark pg-spark-3" d={STAR_D} /></g>
      <g transform="translate(30 168) scale(0.8)"><path className="pg-spark pg-spark-1" d={STAR_D} /></g>
      <g transform="translate(206 44) scale(0.85)"><path className="pg-spark pg-spark-1" d={STAR_D} /></g>
    </g>
  );
}

function Zzz() {
  return (
    <g fill="#cfe0ff" fontFamily="inherit" fontWeight={900} fontSize={30}>
      {[1, 2, 3].map((n) => (
        <g key={n} transform="translate(170 72)">
          <text className={`pg-z pg-z-${n}`} x={0} y={0}>z</text>
        </g>
      ))}
    </g>
  );
}

export function PogoArt({ mood }: { mood: PogoMood }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = (name: string) => `pg${uid}${name}`;
  const url = (name: string) => `url(#${ref(name)})`;
  const pose = POSES[mood];
  const antenna = ANTENNAS[pose.antenna];

  return (
    <svg className="pogo-svg" viewBox="0 0 240 240" focusable="false">
      <defs>
        <radialGradient id={ref("body")} gradientUnits="userSpaceOnUse" cx="100" cy="93" r="136">
          <stop offset="0" stopColor="#b7a3ff" />
          <stop offset="0.42" stopColor="#8b6cff" />
          <stop offset="1" stopColor="#5c40d8" />
        </radialGradient>
        <linearGradient id={ref("belly")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3dbff" />
          <stop offset="1" stopColor="#b6a4ff" />
        </linearGradient>
        <linearGradient id={ref("limb")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a6dfb" />
          <stop offset="1" stopColor="#5a3ed4" />
        </linearGradient>
        <linearGradient id={ref("eye")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dcd6ff" />
        </linearGradient>
        <radialGradient id={ref("bulb")} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#fff6cf" />
          <stop offset="0.5" stopColor="#ffc84a" />
          <stop offset="1" stopColor="#ff951c" />
        </radialGradient>
        <radialGradient id={ref("glow")}>
          <stop offset="0.3" stopColor="#ffc24d" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffc24d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ref("shade")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f1c8a" stopOpacity="0" />
          <stop offset="1" stopColor="#2f1c8a" stopOpacity="0.38" />
        </linearGradient>
        <clipPath id={ref("bodyclip")}><path d={BODY_D} /></clipPath>
        <clipPath id={ref("mouthclip")}><path d={OPEN_MOUTH_D} /></clipPath>
      </defs>

      <Pivot x={120} y={229} className="pg-shadow">
        <ellipse cx={120} cy={229} rx={62} ry={8} fill="#01040f" />
      </Pivot>

      <g className="pg-all">
        <Pivot x={120} y={227} className="pg-squash">
          <g className="pg-feet" fill={url("limb")}>
            <ellipse cx={93} cy={216.5} rx={23} ry={11} />
            <ellipse cx={147} cy={216.5} rx={23} ry={11} />
          </g>

          <Pivot x={120} y={192} className="pg-tilt">
            <Pivot x={120} y={60} className="pg-antenna">
              <path className="pg-stalk" d={antenna.d} fill="none" stroke={LIMB_LINE} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
              <Bulb x={antenna.x} y={antenna.y} sparkles={Boolean(pose.sparkles)} ids={{ bulb: url("bulb"), glow: url("glow") }} />
            </Pivot>

            <path className="pg-body" d={BODY_D} fill={url("body")} />
            <g clipPath={url("bodyclip")}>
              <ellipse className="pg-belly" cx={120} cy={200} rx={47} ry={36} fill={url("belly")} />
              <rect x={40} y={170} width={160} height={44} fill={url("shade")} />
            </g>
            <g className="pg-spots" fill="#5b3fd6" opacity={0.42}>
              <ellipse cx={161} cy={82} rx={7.5} ry={5.5} transform="rotate(38 161 82)" />
              <ellipse cx={174} cy={101} rx={4.6} ry={3.6} transform="rotate(55 174 101)" />
              <circle cx={147} cy={70} r={3.4} />
            </g>
            <ellipse cx={84} cy={80} rx={17} ry={8.5} fill="#fff" opacity={0.26} transform="rotate(-38 84 80)" />

            <g className="pg-face">
              <g className="pg-cheeks" fill="#ff86b3">
                <ellipse cx={68} cy={139} rx={10.5} ry={6.5} />
                <ellipse cx={172} cy={139} rx={10.5} ry={6.5} />
              </g>
              {pose.brows && (
                <g className="pg-brows" fill="none" stroke={LIMB_LINE} strokeWidth={5} strokeLinecap="round">
                  <path d="M79 84 Q92 80 105 83" />
                  <path d="M133 76 Q150 64 166 75" />
                </g>
              )}
              <EyeSet kind={pose.eyes} fill={url("eye")} lid={url("body")} />
              <Pivot x={120} y={147} className="pg-mouth">
                <MouthShape kind={pose.mouth} clip={url("mouthclip")} />
              </Pivot>
            </g>

            <Pivot x={55} y={151} className="pg-arm pg-arm-l">
              <path d={armPath(55)} fill={url("limb")} />
            </Pivot>
            <Pivot x={185} y={151} className="pg-arm pg-arm-r">
              <path d={armPath(185)} fill={url("limb")} />
            </Pivot>
          </Pivot>
        </Pivot>
        {pose.zzz && <Zzz />}
      </g>
      {pose.party && <PartyStars />}
    </svg>
  );
}
