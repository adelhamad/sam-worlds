// The back of a memory card: Pogo peeking out — his face, the glowing antenna
// bulb — on a starry field. Phrase cards are violet with a speech bubble,
// meaning cards are rose with a little picture frame, so the child can look
// for one of each before turning anything over.
import type { MemoryCard } from "../../../engine/lang/types";

const STARS: Array<[number, number, number]> = [
  [16, 20, 1], [84, 16, 0.8], [12, 98, 0.7], [88, 104, 1], [22, 60, 0.55], [80, 62, 0.6], [50, 12, 0.5],
];
const STAR = "M0 -6 Q0.9 -0.9 6 0 Q0.9 0.9 0 6 Q-0.9 0.9 -6 0 Q-0.9 -0.9 0 -6 Z";

function Badge({ side }: { side: MemoryCard["side"] }) {
  if (side === "phrase") {
    return (
      <g transform="translate(50 100)">
        <path d="M-14 -9 h28 a5 5 0 0 1 5 5 v10 a5 5 0 0 1 -5 5 h-16 l-7 6 v-6 h-5 a5 5 0 0 1 -5 -5 v-10 a5 5 0 0 1 5 -5 z" fill="#fff" opacity="0.92" />
        <circle cx="-7" cy="1" r="2" fill="#5b3fd6" /><circle cx="0" cy="1" r="2" fill="#5b3fd6" /><circle cx="7" cy="1" r="2" fill="#5b3fd6" />
      </g>
    );
  }
  return (
    <g transform="translate(50 100)">
      <rect x="-15" y="-10" width="30" height="21" rx="4" fill="#fff" opacity="0.92" />
      <circle cx="7" cy="-3" r="3" fill="#ffd166" />
      <path d="M-11 8 l7 -9 l6 6 l3 -3 l6 6 z" fill="#c2407f" />
    </g>
  );
}

export function MemoryBack({ side }: { side: MemoryCard["side"] }) {
  return (
    <svg className="lxm-back-art" viewBox="0 0 100 124" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      {STARS.map(([x, y, s], i) => (
        <path key={i} d={STAR} transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity={0.35 + s * 0.3} />
      ))}
      {/* antenna and its glowing bulb */}
      <path d="M50 40 C49 30 53 22 60 18" fill="none" stroke="#24104f" strokeWidth="3" strokeLinecap="round" />
      <circle cx="61" cy="16" r="9" fill="#ffd166" opacity="0.35" />
      <circle cx="61" cy="16" r="5.5" fill="#ffd166" />
      <circle cx="59.5" cy="14.5" r="1.8" fill="#fff8de" />
      {/* ear fins */}
      <path d="M27 48 L18 34 L34 42 Z" fill="#8b6cff" stroke="#24104f" strokeWidth="2" strokeLinejoin="round" />
      <path d="M73 48 L82 34 L66 42 Z" fill="#8b6cff" stroke="#24104f" strokeWidth="2" strokeLinejoin="round" />
      {/* face */}
      <ellipse cx="50" cy="60" rx="25" ry="22" fill="#8b6cff" stroke="#24104f" strokeWidth="2.5" />
      <ellipse cx="50" cy="66" rx="15" ry="11" fill="#b9a6ff" opacity="0.55" />
      <ellipse cx="41" cy="56" rx="6" ry="7" fill="#fff" />
      <ellipse cx="59" cy="56" rx="6" ry="7" fill="#fff" />
      <circle cx="42" cy="57.5" r="3.4" fill="#24104f" />
      <circle cx="60" cy="57.5" r="3.4" fill="#24104f" />
      <circle cx="43.2" cy="56" r="1.1" fill="#fff" />
      <circle cx="61.2" cy="56" r="1.1" fill="#fff" />
      <path d="M43 68 Q50 74 57 68" fill="none" stroke="#3d1463" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="34" cy="66" rx="3.5" ry="2" fill="#ff7fa8" opacity="0.7" />
      <ellipse cx="66" cy="66" rx="3.5" ry="2" fill="#ff7fa8" opacity="0.7" />
      <Badge side={side} />
    </svg>
  );
}

/** A burst of drawn stars for a found pair (pure CSS motion). */
export function Sparkle() {
  return (
    <span className="lxm-sparkle" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="-8 -8 16 16" style={{ "--k": i } as React.CSSProperties}>
          <path d={STAR} fill={i % 2 ? "#fff3c4" : "#ffd166"} />
        </svg>
      ))}
    </span>
  );
}
