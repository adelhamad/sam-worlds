// Tiny inline icons shared by the board and the chess widgets (no icon font,
// no emoji: they must look the same on every tablet).
interface GlyphProps {
  className?: string;
  size?: number;
}

function box(size: number | undefined) {
  return size === undefined ? undefined : { width: size, height: size };
}

/** The collectable star. */
export function StarGlyph({ className = "", size }: GlyphProps) {
  return (
    <svg className={`cg cg-star ${className}`} viewBox="0 0 48 48" style={box(size)} aria-hidden="true" focusable="false">
      <path
        className="cg-star-body"
        d="M24 5.5 29.4 17l12.5 1.6-9.2 8.7 2.4 12.4L24 33.6l-11.1 6.1 2.4-12.4-9.2-8.7L18.6 17Z"
      />
      <path className="cg-star-shine" d="M17 21.5 Q 18.5 16.5 23 14" />
    </svg>
  );
}

export function TickGlyph({ className = "", size }: GlyphProps) {
  return (
    <svg className={`cg cg-stroke ${className}`} viewBox="0 0 24 24" style={box(size)} aria-hidden="true" focusable="false">
      <path d="M5.5 12.5 10 17 18.5 7.5" />
    </svg>
  );
}

export function CrossGlyph({ className = "", size }: GlyphProps) {
  return (
    <svg className={`cg cg-stroke ${className}`} viewBox="0 0 24 24" style={box(size)} aria-hidden="true" focusable="false">
      <path d="M7 7 17 17 M17 7 7 17" />
    </svg>
  );
}

/** Backspace for the number pad. */
export function EraseGlyph({ className = "", size }: GlyphProps) {
  return (
    <svg className={`cg cg-stroke ${className}`} viewBox="0 0 24 24" style={box(size)} aria-hidden="true" focusable="false">
      <path d="M9 5.5h10a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9L3 12Z M11.5 9.5l5 5 M16.5 9.5l-5 5" />
    </svg>
  );
}

/** A target ring with a centre dot — "capture this". */
export function AimGlyph({ className = "", size }: GlyphProps) {
  return (
    <svg className={`cg cg-stroke ${className}`} viewBox="0 0 24 24" style={box(size)} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 2v4 M12 18v4 M2 12h4 M18 12h4" />
    </svg>
  );
}

/** A little shield — "keep the king safe". */
export function ShieldGlyph({ className = "", size }: GlyphProps) {
  return (
    <svg className={`cg cg-stroke ${className}`} viewBox="0 0 24 24" style={box(size)} aria-hidden="true" focusable="false">
      <path d="M12 3 19.5 6v5.5c0 4.5-3 7.6-7.5 9.5C7.5 19.1 4.5 16 4.5 11.5V6Z" />
    </svg>
  );
}
