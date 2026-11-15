// Small drawn glyphs for the Tick Tock widgets (no emoji anywhere).
import { HOUR_COLOR, MINUTE_COLOR } from "../../../ui/clock/clockGeo";

interface GlyphProps {
  size?: number;
  className?: string;
}

/** Rub out (backspace): a tag shape with a cross. */
export function EraseGlyph({ size = 30, className = "" }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <path d="M11 6h15a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H11L2.5 16Z" fill="currentColor" opacity={0.22} />
      <path d="M11 6h15a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H11L2.5 16Z" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M15 12l8 8M23 12l-8 8" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

export function PlusMinusGlyph({ plus, size = 26, className = "" }: GlyphProps & { plus: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path d={plus ? "M5 12h14M12 5v14" : "M5 12h14"} stroke="currentColor" strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}

/** A curved "later" arrow: a part turn clockwise. */
export function LaterGlyph({ size = 30, className = "" }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <path d="M6 20a10 10 0 1 1 17.5 5" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" />
      <path d="M17.5 25.6l6.6.2.6-6.7" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A straight arrow pointing right (before → after). */
export function ArrowGlyph({ size = 26, className = "" }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A tiny picture of one hand in its colour: short + thick (hour) or long + thin (minute). */
export function HandSwatch({ hand, size = 28, className = "" }: GlyphProps & { hand: "hour" | "minute" }) {
  const hour = hand === "hour";
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} className={className} aria-hidden="true">
      <circle cx={14} cy={14} r={13} fill="#fff8e8" />
      <rect x={hour ? 10.5 : 12.3} y={hour ? 7 : 2.5} width={hour ? 7 : 3.4} height={hour ? 10 : 14.5} rx={hour ? 3.5 : 1.7} fill={hour ? HOUR_COLOR : MINUTE_COLOR} />
      <circle cx={14} cy={15} r={2.6} fill="#ffd166" stroke={HOUR_COLOR} strokeWidth={1.2} />
    </svg>
  );
}
