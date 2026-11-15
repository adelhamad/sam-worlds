// Original chunky "toy" drawings for the course emblems (100×100 canvas, flat
// fills, one dark outline, white shine strokes — the same style as Pogo and the
// chess pieces). Kept simple enough to read at 32 px.
import { ChessPiece } from "../chess/ChessPiece";

const LINE = "#16123a";
const SHINE = "rgba(255,255,255,0.75)";

/** World Tour — a friendly globe with a little flag on top. */
export function GlobeArt() {
  return (
    <svg viewBox="0 0 100 100" className="ce-svg" aria-hidden="true" focusable="false">
      <ellipse cx="50" cy="93" rx="27" ry="5" fill="rgba(6,10,38,0.25)" />
      {/* flag */}
      <path d="M 62 22 L 62 5" stroke={LINE} strokeWidth="4" strokeLinecap="round" />
      <path d="M 63 5 L 82 9.5 L 63 15 Z" fill="#ff5d73" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      {/* ocean */}
      <circle cx="50" cy="55" r="35" fill="#3f9bff" stroke={LINE} strokeWidth="5" />
      {/* continents */}
      <path d="M 27 38 C 33 30 44 30 47 36 C 50 42 44 45 45 51 C 46 57 38 60 33 56 C 28 52 22 46 27 38 Z" fill="#6fdc6a" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M 57 30 C 64 27 74 32 78 40 C 82 48 77 52 71 50 C 66 48 64 52 60 50 C 55 47 52 34 57 30 Z" fill="#6fdc6a" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M 52 64 C 58 60 68 62 70 69 C 72 76 63 83 56 80 C 50 77 47 68 52 64 Z" fill="#6fdc6a" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      {/* friendly face */}
      <circle cx="41" cy="66" r="3.4" fill={LINE} />
      <circle cx="42.2" cy="64.8" r="1.1" fill="#fff" />
      <path d="M 33 72 Q 38 77 44 73" fill="none" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="66" r="3" fill="#ff9db0" opacity="0.8" />
      {/* shine */}
      <path d="M 26 47 C 27 38 33 30 41 26" fill="none" stroke={SHINE} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Chess Camp — the knight standing on a little board tile. */
export function ChessArt() {
  return (
    <span className="ce-chess">
      <svg viewBox="0 0 100 100" className="ce-svg" aria-hidden="true" focusable="false">
        <ellipse cx="50" cy="94" rx="36" ry="5" fill="rgba(6,10,38,0.25)" />
        <g transform="translate(0 4)">
          <path d="M 8 66 L 50 46 L 92 66 L 50 86 Z" fill="#7a4a24" stroke={LINE} strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M 29 56 L 50 46 L 71 56 L 50 66 Z" fill="#f6dfb2" />
          <path d="M 29 76 L 50 66 L 71 76 L 50 86 Z" fill="#f6dfb2" />
          <path d="M 8 66 L 50 86 L 92 66 L 92 73 L 50 93 L 8 73 Z" fill="#4e2c12" stroke={LINE} strokeWidth="4.5" strokeLinejoin="round" />
        </g>
      </svg>
      <ChessPiece type="N" className="ce-knight" fit />
    </span>
  );
}

/** Code Lab — arrow blocks snapping together. */
export function BlocksArt() {
  const block = (y: number, x: number, fill: string) =>
    `M ${x} ${y} L ${x + 12} ${y} Q ${x + 14} ${y + 5} ${x + 20} ${y + 5} Q ${x + 26} ${y + 5} ${x + 28} ${y} L ${x + 52} ${y} Q ${x + 58} ${y} ${x + 58} ${y + 6} L ${x + 58} ${y + 20} Q ${x + 58} ${y + 26} ${x + 52} ${y + 26} L ${x + 28} ${y + 26} Q ${x + 26} ${y + 31} ${x + 20} ${y + 31} Q ${x + 14} ${y + 31} ${x + 12} ${y + 26} L ${x} ${y + 26} Q ${x - 6} ${y + 26} ${x - 6} ${y + 20} L ${x - 6} ${y + 6} Q ${x - 6} ${y} ${x} ${y} Z|${fill}`;
  const blocks = [block(8, 22, "#5fd68b"), block(36, 32, "#ffb454"), block(64, 18, "#a48bff")];
  return (
    <svg viewBox="0 0 100 100" className="ce-svg" aria-hidden="true" focusable="false">
      <ellipse cx="50" cy="96" rx="30" ry="4" fill="rgba(6,10,38,0.25)" />
      {blocks.slice().reverse().map((spec) => {
        const [d, fill] = spec.split("|");
        return <path key={fill} d={d} fill={fill} stroke={LINE} strokeWidth="4.5" strokeLinejoin="round" />;
      })}
      {/* arrows: forward, turn, forward */}
      <path d="M 34 21 L 58 21 M 51 14 L 58 21 L 51 28" fill="none" stroke={LINE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 46 56 L 46 49 Q 46 45 50 45 L 68 45 M 62 39 L 68 45 L 62 51" fill="none" stroke={LINE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 30 77 L 54 77 M 47 70 L 54 77 L 47 84" fill="none" stroke={LINE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 20 13 L 30 13" stroke={SHINE} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/** AI Makers — a friendly robot head with a spark and a wrench. */
export function RobotArt() {
  return (
    <svg viewBox="0 0 100 100" className="ce-svg" aria-hidden="true" focusable="false">
      <ellipse cx="48" cy="94" rx="30" ry="5" fill="rgba(6,10,38,0.25)" />
      {/* antenna + spark */}
      <path d="M 46 30 L 46 17" stroke={LINE} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 46 2 L 50 10 L 58 13 L 50 16 L 46 24 L 42 16 L 34 13 L 42 10 Z" fill="#ffd166" stroke={LINE} strokeWidth="3.5" strokeLinejoin="round" />
      {/* ears */}
      <rect x="10" y="48" width="10" height="20" rx="4" fill="#9fb6d6" stroke={LINE} strokeWidth="4" />
      <rect x="72" y="48" width="10" height="20" rx="4" fill="#9fb6d6" stroke={LINE} strokeWidth="4" />
      {/* head */}
      <rect x="17" y="29" width="58" height="52" rx="16" fill="#dfe9f7" stroke={LINE} strokeWidth="5" />
      <rect x="25" y="39" width="42" height="27" rx="11" fill="#22305e" />
      {/* eyes + smile */}
      <circle cx="37" cy="51" r="6" fill="#7fe0e8" />
      <circle cx="55" cy="51" r="6" fill="#7fe0e8" />
      <circle cx="38.5" cy="49.5" r="2" fill="#fff" />
      <circle cx="56.5" cy="49.5" r="2" fill="#fff" />
      <path d="M 40 60 Q 46 64 52 60" fill="none" stroke="#7fe0e8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="29" cy="72" r="3" fill="#ff9db0" />
      <path d="M 25 35 Q 34 32 44 33" fill="none" stroke={SHINE} strokeWidth="3.5" strokeLinecap="round" />
      {/* wrench */}
      <g transform="rotate(-40 76 80)">
        <rect x="72" y="70" width="9" height="26" rx="4" fill="#ffb454" stroke={LINE} strokeWidth="4" />
        <path d="M 66 62 Q 66 54 76.5 54 Q 87 54 87 62 L 87 70 Q 82 74 81 68 L 81 62 L 72 62 L 72 68 Q 71 74 66 70 Z" fill="#c9d5e6" stroke={LINE} strokeWidth="4" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

const BUBBLE = "M 14 20 Q 14 10 24 10 L 76 10 Q 86 10 86 20 L 86 58 Q 86 68 76 68 L 46 68 L 28 84 L 31 68 L 24 68 Q 14 68 14 58 Z";

/** Yalla Arabic — a warm speech bubble holding the letter ع. */
export function ArabicArt() {
  return (
    <svg viewBox="0 0 100 100" className="ce-svg" aria-hidden="true" focusable="false">
      <ellipse cx="50" cy="93" rx="27" ry="5" fill="rgba(6,10,38,0.25)" />
      <path d={BUBBLE} fill="#ff9f6e" stroke={LINE} strokeWidth="5" strokeLinejoin="round" />
      <path d="M 22 22 Q 22 17 28 17 L 50 17" fill="none" stroke={SHINE} strokeWidth="4" strokeLinecap="round" />
      <text
        x="50" y="47" textAnchor="middle" fontSize="38" fontWeight="800" fill="#fff" stroke={LINE} strokeWidth="2.5"
        paintOrder="stroke" style={{ fontFamily: '"Noto Sans Arabic Variable", "Geeza Pro", sans-serif' }}
      >
        ع
      </text>
    </svg>
  );
}

/** Bonjour French — a speech bubble in blue, white and red. */
export function FrenchArt() {
  return (
    <svg viewBox="0 0 100 100" className="ce-svg" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="ce-fr-bubble"><path d={BUBBLE} /></clipPath>
      </defs>
      <ellipse cx="50" cy="93" rx="27" ry="5" fill="rgba(6,10,38,0.25)" />
      <g clipPath="url(#ce-fr-bubble)">
        <rect x="10" y="6" width="28" height="82" fill="#3f6bff" />
        <rect x="38" y="6" width="24" height="82" fill="#f6f8ff" />
        <rect x="62" y="6" width="28" height="82" fill="#ff5d73" />
      </g>
      <path d={BUBBLE} fill="none" stroke={LINE} strokeWidth="5" strokeLinejoin="round" />
      <path d="M 22 22 Q 22 17 28 17 L 34 17" fill="none" stroke={SHINE} strokeWidth="4" strokeLinecap="round" />
      <circle cx="41" cy="36" r="3.6" fill={LINE} />
      <circle cx="59" cy="36" r="3.6" fill={LINE} />
      <path d="M 40 47 Q 50 57 60 47" fill="none" stroke={LINE} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
