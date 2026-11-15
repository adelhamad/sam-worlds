// The things Pogo wears and the props a mood adds around the body: ear fins,
// the scout scarf, the antenna bulb, sparkles, sleepy z's, a tear, dizzy stars
// and jet-boot flames. All coordinates are on the 240×240 canvas of PogoArt.tsx.
import { Pivot } from "./PogoFace";
import { STAR_D } from "./pogoPoses";

/** Gradient / clip ids of one Pogo instance, as `url(#…)` strings. */
export interface PogoPaint {
  body: string;
  limb: string;
  bulb: string;
  glow: string;
  scarf: string;
  flame: string;
  bodyClip: string;
}

/** Two little fins behind the head — they perk, droop and flutter with the mood. */
export function Ears({ paint }: { paint: PogoPaint }) {
  return (
    <g>
      <Pivot x={62} y={99} className="pg-ear pg-ear-l">
        <path d="M61 108 Q33 101 29 72 Q54 75 70 91 Z" fill={paint.limb} />
        <path d="M58 100 Q42 96 37 80 Q52 83 62 93 Z" fill="#ff9ec4" opacity={0.55} />
      </Pivot>
      <Pivot x={178} y={99} className="pg-ear pg-ear-r">
        <path d="M179 108 Q207 101 211 72 Q186 75 170 91 Z" fill={paint.limb} />
        <path d="M182 100 Q198 96 203 80 Q188 83 178 93 Z" fill="#ff9ec4" opacity={0.55} />
      </Pivot>
    </g>
  );
}

/** The scout scarf: a band hugging the body and a knot with two loose tails. */
export function Scarf({ paint }: { paint: PogoPaint }) {
  return (
    <g className="pg-scarf">
      <g clipPath={paint.bodyClip}>
        <path d="M44 159 Q120 187 196 159 L196 173 Q120 203 44 173 Z" fill={paint.scarf} />
        <path d="M44 168 Q120 197 196 168" fill="none" stroke="#fff3c4" strokeWidth={2.6} opacity={0.75} />
      </g>
      <Pivot x={166} y={181} className="pg-scarf-tail">
        <path d="M163 180 Q168 198 160 214 L172 209 Q178 194 173 180 Z" fill="#f0871c" />
        <path d="M167 180 Q182 194 184 211 L193 200 Q189 186 175 177 Z" fill={paint.scarf} />
      </Pivot>
      <ellipse cx={167} cy={180} rx={8.5} ry={7.5} fill="#ffb53d" />
      <ellipse cx={165} cy={178} rx={3.4} ry={2.4} fill="#fff3c4" opacity={0.7} />
    </g>
  );
}

export function Bulb({ x, y, sparkles, paint }: { x: number; y: number; sparkles: boolean; paint: PogoPaint }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className="pg-glow" r={25} fill={paint.glow} />
      <g className="pg-bulb">
        <circle r={11.5} fill={paint.bulb} />
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
export function PartyStars() {
  return (
    <g fill="#ffe7a0">
      <g transform="translate(24 84) scale(1.3)"><path className="pg-spark pg-spark-2" d={STAR_D} /></g>
      <g transform="translate(218 112) scale(1.1)"><path className="pg-spark pg-spark-3" d={STAR_D} /></g>
      <g transform="translate(30 168) scale(0.8)"><path className="pg-spark pg-spark-1" d={STAR_D} /></g>
      <g transform="translate(206 44) scale(0.85)"><path className="pg-spark pg-spark-1" d={STAR_D} /></g>
    </g>
  );
}

export function Zzz() {
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

/** One tear that wells up under the left eye and rolls down the cheek. */
export function Tear() {
  return (
    <g transform="translate(76 133)">
      <g className="pg-tear">
        <path d="M0 -9 C5 -2 6.5 1.5 6.5 4.5 A6.5 6.5 0 0 1 -6.5 4.5 C-6.5 1.5 -5 -2 0 -9 Z" fill="#8fd6ff" />
        <ellipse cx={-2.2} cy={3} rx={1.7} ry={2.6} fill="#fff" opacity={0.85} />
      </g>
    </g>
  );
}

/** Three stars circling the head on a flat ring (dizzy): each one swings
    left-right and, a quarter turn out of step, front-back. */
export function OrbitStars() {
  return (
    <g transform="translate(120 46)" fill="#ffe27a">
      {[1, 2, 3].map((n) => (
        <g key={n} className={`pg-orbit-x pg-orbit-${n}`}>
          <g className={`pg-orbit-y pg-orbit-${n}`}>
            <path d={STAR_D} transform="scale(1.35)" />
          </g>
        </g>
      ))}
    </g>
  );
}

/** Jet-boot flames under both feet. */
export function Flames({ paint }: { paint: PogoPaint }) {
  return (
    <g>
      {[93, 147].map((x) => (
        <g key={x} transform={`translate(${x} 224)`}>
          <g className="pg-flame">
            <path d="M-13 0 Q-15 20 0 44 Q15 20 13 0 Z" fill={paint.flame} />
            <path d="M-6 0 Q-7 12 0 24 Q7 12 6 0 Z" fill="#fff6c9" />
          </g>
        </g>
      ))}
    </g>
  );
}
