// Pogo's head alone, tiny — the rider at the leading edge of the lesson's
// progress bar. Same palette as PogoArt.tsx; eyes look forward (to the right).
import { useId } from "react";
import { INK, LIMB_LINE } from "./pogoPoses";

export function PogoHead({ size = 34 }: { size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg className="pogo-head" viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`ph${uid}`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#b7a3ff" />
          <stop offset="0.5" stopColor="#8b6cff" />
          <stop offset="1" stopColor="#5c40d8" />
        </radialGradient>
      </defs>
      <path d="M20 13 C20 8 22 5 26 3.5" fill="none" stroke={LIMB_LINE} strokeWidth={2.2} strokeLinecap="round" />
      <circle className="pogo-head-glow" cx={27} cy={3.4} r={5.5} fill="#ffc24d" opacity={0.45} />
      <circle cx={27} cy={3.4} r={3.2} fill="#ffc84a" />
      <path d="M8 21 Q1 19 1.5 12 Q7 14 10 17 Z M32 21 Q39 19 38.5 12 Q33 14 30 17 Z" fill="#6e52e6" />
      <ellipse cx={20} cy={24} rx={14} ry={13} fill={`url(#ph${uid})`} />
      <ellipse cx={15.5} cy={22} rx={4} ry={4.6} fill="#fff" />
      <ellipse cx={25.5} cy={22} rx={4} ry={4.6} fill="#fff" />
      <circle className="pogo-head-pupil" cx={16.8} cy={22.6} r={2.5} fill={INK} />
      <circle className="pogo-head-pupil" cx={26.8} cy={22.6} r={2.5} fill={INK} />
      <path d="M16.5 29.5 Q20.5 32.5 24.5 29.5" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}
