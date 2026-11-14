import { useState, type CSSProperties } from "react";
import { TOUR } from "../../../strings/tour";
import type { LessonItem } from "./layout";

/** Mix-Up (geography lesson 4): two crossing arrows. */
function MixIcon() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h6c9 0 9 16 18 16h5" />
      <path d="M5 28h6c3 0 5-2 6.5-4.5M22.5 16.5C24 14 26 12 29 12h5" />
      <path d="M30 7l5 5-5 5M30 23l5 5-5 5" />
    </svg>
  );
}

/** Champion (the last lesson of a unit): a crown. */
function CrownIcon() {
  return (
    <svg viewBox="0 0 40 40" width="42" height="42" aria-hidden="true" fill="currentColor">
      <path d="M5 13.5l8 6.5 7-11 7 11 8-6.5-3 16.5H8z" />
      <rect x="8" y="32" width="24" height="4" rx="2" />
    </svg>
  );
}

function NodeIcon({ item }: { item: LessonItem }) {
  if (item.icon === "mix") return <MixIcon />;
  if (item.icon === "crown") return <CrownIcon />;
  return <span className="tp-node-num">{item.slot + 1}</span>;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="tp-stars" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((star) => (
        <span key={star} className={star <= count ? "is-on" : ""}>★</span>
      ))}
    </span>
  );
}

interface LessonNodeProps {
  item: LessonItem;
  amp: number;
  /** Scroll target on arrival. */
  focus: boolean;
  onOpen: (item: LessonItem) => void;
  onLocked: () => void;
}

/** One lesson on the trail: done (stars, replayable), current (pulsing) or locked. */
export function LessonNode({ item, amp, focus, onOpen, onLocked }: LessonNodeProps) {
  const [nudge, setNudge] = useState(0);
  const { state, stage } = item;
  const locked = state === "locked";
  const style = {
    left: `calc(50% + ${(item.x * amp).toFixed(1)}px)`,
    top: item.y,
    "--hue": item.unit.hue,
  } as CSSProperties;

  return (
    <div className={`tp-anchor tp-lesson is-${state}`} style={style} data-focus={focus || undefined}>
      {state === "current" && (
        <>
          <span className="tp-ring" aria-hidden="true" />
          <span className="tp-tag" aria-hidden="true">{TOUR.path.startTag}</span>
        </>
      )}
      <button
        key={nudge}
        type="button"
        className={`tp-node ${nudge > 0 ? "is-nudged" : ""}`}
        aria-label={stage.name}
        aria-disabled={locked || undefined}
        onClick={() => {
          if (locked) {
            setNudge((value) => value + 1);
            onLocked();
          } else {
            onOpen(item);
          }
        }}
      >
        <NodeIcon item={item} />
        {locked && <span className="tp-lock" aria-hidden="true">🔒</span>}
      </button>
      {state === "done" && <Stars count={item.stars} />}
    </div>
  );
}
