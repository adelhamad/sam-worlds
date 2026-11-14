import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { mulberry32 } from "../../engine/rng";

const COLORS = ["#8b6cff", "#ffd166", "#ffb454", "#7bdc4a", "#ff86b3", "#f2f6ff", "#b7a3ff"];
const LIFETIME_MS = 2700;

type PieceStyle = CSSProperties & Record<`--${string}`, string>;

function seedOf(key: number | string): number {
  let h = 2166136261;
  for (const ch of String(key)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Layout of one burst — derived from the key only, so a burst is stable across re-renders. */
function pieceStyles(key: number | string, count: number): PieceStyle[] {
  const rng = mulberry32(seedOf(key));
  return Array.from({ length: count }, (_, i) => {
    const angle = (rng() - 0.5) * 2.7; // fan around straight up
    const power = 130 + rng() * 230;
    const shape = i % 3; // strip, square, dot
    const w = shape === 0 ? 7 : 10;
    return {
      "--cf-x": `${Math.round(Math.sin(angle) * power * 1.15)}px`,
      "--cf-up": `${-Math.round(Math.cos(angle) * power + 30)}px`,
      "--cf-fall": `${Math.round(420 + rng() * 380)}px`,
      "--cf-spin": `${Math.round((rng() - 0.5) * 1400)}deg`,
      "--cf-flip": `${Math.round(360 + rng() * 900)}deg`,
      "--cf-delay": `${Math.round(rng() * 110)}ms`,
      "--cf-dur": `${Math.round(1500 + rng() * 800)}ms`,
      width: w + Math.round(rng() * 3),
      height: shape === 0 ? 15 : w + Math.round(rng() * 3),
      borderRadius: shape === 2 ? "50%" : 2,
      color: COLORS[i % COLORS.length],
    };
  });
}

export interface ConfettiProps {
  /** A burst fires when this is set to a new truthy value (0 / "" = nothing yet). */
  burstKey: number | string;
  /** Number of pieces (default 40). */
  count?: number;
}

/** One-shot confetti burst; re-fires whenever `burstKey` changes. Purely cosmetic.
    Covers its nearest positioned parent and removes its pieces when they have fallen. */
export function Confetti({ burstKey, count = 40 }: ConfettiProps) {
  const [doneKey, setDoneKey] = useState<number | string | null>(null);
  useEffect(() => {
    if (!burstKey) return undefined;
    const t = setTimeout(() => setDoneKey(burstKey), LIFETIME_MS);
    return () => clearTimeout(t);
  }, [burstKey]);

  const live = Boolean(burstKey) && doneKey !== burstKey;
  const pieces = useMemo(() => (live ? pieceStyles(burstKey, count) : []), [live, burstKey, count]);

  return (
    <div className="tour-confetti" data-burst={burstKey} aria-hidden="true">
      {live && (
        <div key={burstKey} className="tour-confetti-burst">
          {pieces.map((style, i) => (
            <span key={i} className="cf-x" style={style}>
              <span className="cf-y" />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
