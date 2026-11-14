// The gift inside the lesson: Pogo holds out a wrapped box, the child taps it,
// the lid pops and the Star Dust flies to the meter. The dust was already paid
// when the gift was triggered — this screen is only the unwrapping.
import { useEffect, useState } from "react";
import { unlockAudio } from "../../../engine/feedback/audio";
import { Confetti, Pogo } from "../../../ui/tour/Pogo";
import { TOUR } from "../../../strings/tour";
import { lessonSound } from "./lessonSound";
import { useCompact } from "./useCompact";

/** Once opened, the lesson moves on by itself after this long. */
const AUTO_CONTINUE_MS = 1700;

/** Stars that shoot up out of the open box (a fan over its top). */
const STARS = Array.from({ length: 9 }, (_, i) => {
  const angle = -Math.PI / 2 + (i - 4) * 0.36;
  const reach = i % 2 === 0 ? 1 : 0.7;
  return {
    x: (Math.cos(angle) * reach).toFixed(3),
    y: (Math.sin(angle) * reach).toFixed(3),
    delay: `${(i % 3) * 60}ms`,
    glyph: i % 3 === 0 ? "★" : "✦",
  };
});

function GiftBox() {
  return (
    <svg className="tl-gift-svg" viewBox="0 0 120 120" focusable="false" aria-hidden="true">
      <ellipse cx="60" cy="110" rx="44" ry="7" fill="#040a1a" opacity="0.45" />
      <g className="tl-gift-body">
        <rect x="19" y="54" width="82" height="54" rx="9" fill="#ff6fa5" />
        <path d="M19 96h82v3a9 9 0 0 1-9 9H28a9 9 0 0 1-9-9z" fill="#d94c86" />
        <rect x="52" y="54" width="16" height="54" fill="#ffd166" />
        <rect x="52" y="96" width="16" height="12" fill="#c9962b" />
        <rect x="27" y="66" width="9" height="20" rx="4.5" fill="#fff" opacity="0.28" />
        {/* the opening and the light inside — seen once the lid is off */}
        <rect x="19" y="54" width="82" height="9" rx="4.5" fill="#a82e63" />
        <ellipse className="tl-gift-shine" cx="60" cy="55" rx="36" ry="13" fill="#fff3c4" />
      </g>
      <g className="tl-gift-lid">
        <path d="M60 37c-6-15-25-16-27-6-2 9 13 10 27 6z" fill="#ffd166" stroke="#c9962b" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M60 37c6-15 25-16 27-6 2 9-13 10-27 6z" fill="#ffd166" stroke="#c9962b" strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="12" y="38" width="96" height="21" rx="8" fill="#ff8fbb" />
        <rect x="12" y="52" width="96" height="7" rx="3.5" fill="#e85d97" />
        <rect x="52" y="38" width="16" height="21" fill="#ffd166" />
        <circle cx="60" cy="37" r="6.5" fill="#ffd166" stroke="#c9962b" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

interface GiftBreakProps {
  id: number;
  /** Star Dust inside. */
  dust: number;
  /** The box was tapped: the meter collects the dust. */
  onOpen: () => void;
  onDone: (id: number) => void;
}

export function GiftBreak({ id, dust, onOpen, onDone }: GiftBreakProps) {
  const compact = useCompact();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => onDone(id), AUTO_CONTINUE_MS);
    return () => clearTimeout(timer);
  }, [open, id, onDone]);

  function openBox() {
    if (open) return;
    unlockAudio();
    lessonSound.giftOpen();
    setOpen(true);
    onOpen();
  }

  return (
    <>
      <main className={`tl-break tl-gift ${open ? "is-open" : ""}`}>
        <Confetti burstKey={open ? id : 0} count={44} />
        <h2 className="tl-gift-title">{TOUR.lesson.giftTitle}</h2>
        <div className="tl-gift-stage" style={{ "--tl-gift-size": `${compact ? 150 : 232}px` } as React.CSSProperties}>
          <span className="tl-gift-glow" aria-hidden="true" />
          <Pogo mood={open ? "cheer" : "wow"} size={compact ? 150 : 232} className="tl-gift-pogo" />
          <button className="tl-gift-box" disabled={open} aria-label={TOUR.lesson.giftOpen} onClick={openBox}>
            <GiftBox />
          </button>
          {open && (
            <span className="tl-gift-stars" aria-hidden="true">
              {STARS.map((star, i) => (
                <i key={i} style={{ "--tl-sx": star.x, "--tl-sy": star.y, animationDelay: star.delay } as React.CSSProperties}>
                  {star.glyph}
                </i>
              ))}
            </span>
          )}
        </div>
        <p className="tl-gift-note" role="status">
          {open
            ? <span className="tl-gift-prize">{TOUR.lesson.dustToken(dust)}</span>
            : <span className="tl-gift-hint">{TOUR.lesson.giftTap}</span>}
        </p>
      </main>
      <footer className="tl-footer">
        <button className={`tbtn tbtn-go tbtn-wide tl-gift-go ${open ? "is-shown" : ""}`} disabled={!open} onClick={() => onDone(id)}>
          {TOUR.lesson.continue}
        </button>
      </footer>
    </>
  );
}
