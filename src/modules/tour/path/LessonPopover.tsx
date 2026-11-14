import type { CSSProperties } from "react";
import { tourParams } from "../../../content/tour/units";
import { TOUR } from "../../../strings/tour";
import { Flag } from "../../../ui/tour/Flag";
import { LESSONS_PER_UNIT, type LessonItem } from "./layout";

/** How many focus flags the teaser shows before it trails off with "…". */
const TEASER_FLAGS = 5;

interface LessonPopoverProps {
  item: LessonItem;
  /** A saved, unfinished run of this very lesson exists. */
  inProgress: boolean;
  onStart: () => void;
  onClose: () => void;
}

function startLabel(done: boolean, inProgress: boolean): string {
  if (inProgress) return TOUR.path.continue;
  return done ? TOUR.path.playAgain : TOUR.path.start;
}

/** Bottom card for a tapped lesson: what's inside, and the big start button. */
export function LessonPopover({ item, inProgress, onStart, onClose }: LessonPopoverProps) {
  const { stage, unit, slot } = item;
  const done = item.state === "done";
  const focus = tourParams(stage).focus;
  const teaser = focus.slice(0, TEASER_FLAGS);

  return (
    <div className="tp-scrim" onClick={onClose}>
      <div
        className="tp-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={stage.name}
        style={{ "--hue": unit.hue } as CSSProperties}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="tp-close" aria-label={TOUR.path.close} onClick={onClose}>✕</button>
        <span className="tp-sheet-kicker">
          <span aria-hidden="true">{unit.icon} </span>
          {TOUR.path.lessonOf(slot + 1, LESSONS_PER_UNIT)}
        </span>
        <h2 className="tp-sheet-name">{stage.name}</h2>
        <div className="tp-sheet-flags">
          {teaser.map((code) => (
            <span key={code} className="tp-sheet-flag"><Flag code={code} size={34} /></span>
          ))}
          {focus.length > teaser.length && <span className="tp-sheet-more" aria-hidden="true">{TOUR.path.more}</span>}
        </div>
        <p className={`tp-sheet-reward ${done ? "is-replay" : ""}`}>
          {done ? TOUR.path.replayHint : TOUR.path.reward(stage.payout)}
        </p>
        <button type="button" className="tbtn tbtn-go tbtn-wide tp-sheet-go" onClick={onStart}>
          {startLabel(done, inProgress)}
        </button>
      </div>
    </div>
  );
}
