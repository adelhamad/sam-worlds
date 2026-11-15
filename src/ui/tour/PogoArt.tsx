// Pogo's drawing — one inline SVG on a 240×240 canvas (feet on the ground at
// y≈227, centred on x=120). Every part that moves sits in a <Pivot>, so
// pogo.css can animate parts independently with plain transforms. Face parts
// live in PogoFace.tsx, clothes and mood props in PogoProps.tsx, the moods
// themselves (as data) in pogoPoses.ts.
import { useId } from "react";
import { Brows, EyeSet, MouthShape, Pivot } from "./PogoFace";
import { Bulb, Ears, Flames, OrbitStars, PartyStars, Scarf, Tear, Zzz, type PogoPaint } from "./PogoProps";
import { ANTENNAS, BODY_D, GRIN_MOUTH_D, LIMB_LINE, OPEN_MOUTH_D, POSES, type PogoMood } from "./pogoPoses";

const TOE = "#4a30bd";

/** A stubby arm hanging from a shoulder at (x, 151): slim at the top, a round
    mitten with a thumb at the end (the thumb points at the body). */
function Arm({ x, side, fill }: { x: number; side: "l" | "r"; fill: string }) {
  const thumb = side === "l" ? x + 10.5 : x - 10.5;
  return (
    <Pivot x={x} y={151} className={`pg-arm pg-arm-${side}`}>
      <circle cx={thumb} cy={173} r={5.4} fill={fill} />
      <path d={`M${x - 8} 151 Q${x - 8} 142 ${x} 142 Q${x + 8} 142 ${x + 8} 151 L${x + 11.5} 178 A11.5 11.5 0 0 1 ${x - 11.5} 178 Z`} fill={fill} />
    </Pivot>
  );
}

function Feet({ fill }: { fill: string }) {
  return (
    <g className="pg-feet">
      {[93, 147].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={216.5} rx={23} ry={11} fill={fill} />
          <path d={`M${x - 8} 219.5 v6 M${x + 3} 220.5 v6`} fill="none" stroke={TOE} strokeWidth={2.6} strokeLinecap="round" opacity={0.55} />
        </g>
      ))}
    </g>
  );
}

function Defs({ id }: { id: (name: string) => string }) {
  return (
    <defs>
      <radialGradient id={id("body")} gradientUnits="userSpaceOnUse" cx="100" cy="93" r="136">
        <stop offset="0" stopColor="#b7a3ff" />
        <stop offset="0.42" stopColor="#8b6cff" />
        <stop offset="1" stopColor="#5c40d8" />
      </radialGradient>
      <linearGradient id={id("belly")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e3dbff" />
        <stop offset="1" stopColor="#b6a4ff" />
      </linearGradient>
      <linearGradient id={id("limb")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8a6dfb" />
        <stop offset="1" stopColor="#5a3ed4" />
      </linearGradient>
      <linearGradient id={id("eye")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.45" stopColor="#ffffff" />
        <stop offset="1" stopColor="#dcd6ff" />
      </linearGradient>
      <radialGradient id={id("bulb")} cx="0.38" cy="0.32" r="0.75">
        <stop offset="0" stopColor="#fff6cf" />
        <stop offset="0.5" stopColor="#ffc84a" />
        <stop offset="1" stopColor="#ff951c" />
      </radialGradient>
      <radialGradient id={id("glow")}>
        <stop offset="0.3" stopColor="#ffc24d" stopOpacity="0.75" />
        <stop offset="1" stopColor="#ffc24d" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={id("shade")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2f1c8a" stopOpacity="0" />
        <stop offset="1" stopColor="#2f1c8a" stopOpacity="0.38" />
      </linearGradient>
      <linearGradient id={id("scarf")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffc24d" />
        <stop offset="1" stopColor="#ff9a2e" />
      </linearGradient>
      <linearGradient id={id("flame")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffd35a" />
        <stop offset="0.6" stopColor="#ff8a2a" />
        <stop offset="1" stopColor="#ff5a3c" stopOpacity="0.2" />
      </linearGradient>
      <clipPath id={id("bodyclip")}><path d={BODY_D} /></clipPath>
      <clipPath id={id("mouthclip")}><path d={OPEN_MOUTH_D} /></clipPath>
      <clipPath id={id("grinclip")}><path d={GRIN_MOUTH_D} /></clipPath>
    </defs>
  );
}

export function PogoArt({ mood }: { mood: PogoMood }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (name: string) => `pg${uid}${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const pose = POSES[mood];
  const antenna = ANTENNAS[pose.antenna];
  const paint: PogoPaint = {
    body: url("body"), limb: url("limb"), bulb: url("bulb"), glow: url("glow"),
    scarf: url("scarf"), flame: url("flame"), bodyClip: url("bodyclip"),
  };

  return (
    <svg className="pogo-svg" viewBox="0 0 240 240" focusable="false">
      <Defs id={id} />

      <Pivot x={120} y={229} className="pg-shadow">
        <ellipse cx={120} cy={229} rx={62} ry={8} fill="#01040f" />
      </Pivot>

      <g className="pg-all">
        {pose.flames && <Flames paint={paint} />}
        <Pivot x={120} y={227} className="pg-squash">
          <Feet fill={paint.limb} />

          <Pivot x={120} y={192} className="pg-tilt">
            <Pivot x={120} y={60} className="pg-antenna">
              <path className="pg-stalk" d={antenna.d} fill="none" stroke={LIMB_LINE} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
              <Bulb x={antenna.x} y={antenna.y} sparkles={Boolean(pose.sparkles)} paint={paint} />
            </Pivot>
            <Ears paint={paint} />

            <path className="pg-body" d={BODY_D} fill={paint.body} />
            <g clipPath={paint.bodyClip}>
              <ellipse className="pg-belly" cx={120} cy={200} rx={47} ry={36} fill={url("belly")} />
              <rect x={40} y={170} width={160} height={44} fill={url("shade")} />
            </g>
            <g className="pg-spots" fill="#5b3fd6" opacity={0.42}>
              <ellipse cx={161} cy={82} rx={7.5} ry={5.5} transform="rotate(38 161 82)" />
              <ellipse cx={174} cy={101} rx={4.6} ry={3.6} transform="rotate(55 174 101)" />
              <circle cx={147} cy={70} r={3.4} />
            </g>
            <ellipse cx={84} cy={80} rx={17} ry={8.5} fill="#fff" opacity={0.26} transform="rotate(-38 84 80)" />
            <Scarf paint={paint} />

            <g className="pg-face">
              <g className="pg-cheeks" fill="#ff86b3">
                <ellipse cx={68} cy={139} rx={10.5} ry={6.5} />
                <ellipse cx={172} cy={139} rx={10.5} ry={6.5} />
              </g>
              {pose.brows && <Brows kind={pose.brows} />}
              <EyeSet kind={pose.eyes} fill={url("eye")} lid={paint.body} watery={Boolean(pose.tear)} />
              {pose.tear && <Tear />}
              <Pivot x={120} y={147} className="pg-mouth">
                <MouthShape kind={pose.mouth} clip={url("mouthclip")} grinClip={url("grinclip")} />
              </Pivot>
            </g>

            <Arm x={55} side="l" fill={paint.limb} />
            <Arm x={185} side="r" fill={paint.limb} />
            {pose.orbit && <OrbitStars />}
          </Pivot>
        </Pivot>
        {pose.zzz && <Zzz />}
      </g>
      {pose.party && <PartyStars />}
    </svg>
  );
}
