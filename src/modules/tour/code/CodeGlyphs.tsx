// Tiny inline icons for Code Lab (no icon font, no emoji: they must look the
// same on every tablet). Colours come from code.css.
import type { Dir } from "../../../engine/code/types";

const TURN: Record<Dir, number> = { N: 0, E: 90, S: 180, W: 270 };

/** A chunky arrow pointing `dir` (up = N). */
export function ArrowGlyph({ dir, className = "" }: { dir: Dir; className?: string }) {
  return (
    <svg className={`cgl cgl-arrow ${className}`} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <g transform={`rotate(${TURN[dir]} 24 24)`}>
        <path className="cgl-arrow-shade" d="M24 7 41 25H31v16H17V25H7Z" transform="translate(0 2.5)" />
        <path className="cgl-arrow-body" d="M24 7 41 25H31v16H17V25H7Z" />
      </g>
    </svg>
  );
}

export function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`cgl cgl-star ${className}`} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path className="cgl-star-body" d="M24 5.5 29.4 17l12.5 1.6-9.2 8.7 2.4 12.4L24 33.6l-11.1 6.1 2.4-12.4-9.2-8.7L18.6 17Z" />
      <path className="cgl-star-shine" d="M17 21.5 Q 18.5 16.5 23 14" />
    </svg>
  );
}

/** The goal flag on its pole. */
export function FlagIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`cgl cgl-flag ${className}`} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <ellipse className="cgl-flag-base" cx="17" cy="42" rx="9" ry="3.2" />
      <rect className="cgl-flag-pole" x="14.5" y="7" width="5" height="35" rx="2.5" />
      <path className="cgl-flag-cloth" d="M19 8.5c6-2.6 10 2.6 21 0v17c-11 2.6-15-2.6-21 0Z" />
      <circle className="cgl-flag-knob" cx="17" cy="7" r="3.6" />
    </svg>
  );
}

/** "Here": a map pin (trace answer). */
export function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`cgl cgl-pin ${className}`} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path className="cgl-pin-body" d="M24 45s-13-14.2-13-24a13 13 0 0 1 26 0c0 9.8-13 24-13 24Z" />
      <circle className="cgl-pin-dot" cx="24" cy="21" r="5.2" />
    </svg>
  );
}

/** A changed arrow (debug). */
export function WrenchIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`cgl cgl-wrench ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M15.6 3.2a5 5 0 0 0-5.7 6.6l-6.4 6.4a2 2 0 0 0 2.8 2.8l6.4-6.4a5 5 0 0 0 6.6-5.7l-3 3-2.6-.5-.5-2.6Z" />
    </svg>
  );
}

/** The ✕ on a removable block. */
export function CrossIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`cgl cgl-cross ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 7 17 17M17 7 7 17" />
    </svg>
  );
}

/** The ▶ on RUN and the track's start cap. */
export function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`cgl cgl-play ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

/** A loop's "again" arrow. */
export function RepeatIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`cgl cgl-repeat ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M17 4.5 20 7.5 17 10.5M20 7.5H9a5 5 0 0 0-5 5M7 19.5 4 16.5 7 13.5M4 16.5h11a5 5 0 0 0 5-5" />
    </svg>
  );
}

/** "Done" on an open loop. */
export function TickIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`cgl cgl-tick ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  );
}
