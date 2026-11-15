import { TOUR } from "../../../strings/tour";
import { Glyph, Icon } from "../../../ui/icons/Icon";
import { lessonTeaser } from "./courseFamilies";
import { hueStyle } from "./hue";
import type { LessonItem } from "./layout";

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

  return (
    <div className="tp-scrim" onClick={onClose}>
      <div
        className="tp-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={stage.name}
        style={hueStyle(unit.hue)}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="tp-close" aria-label={TOUR.path.close} onClick={onClose}><Icon name="close" size={18} mono /></button>
        <span className="tp-sheet-kicker">
          {!unit.piece && <><Glyph value={unit.icon} size="1.2em" />{" "}</>}
          {TOUR.path.lessonOf(slot + 1, unit.lessons.length)}
        </span>
        <h2 className="tp-sheet-name">{stage.name}</h2>
        {lessonTeaser({ stage, unit })}
        <p className={`tp-sheet-reward ${done ? "is-replay" : ""}`}>
          {done ? TOUR.path.replayHint : <>{TOUR.path.reward(stage.payout)} <Icon name="dust" size="1.1em" /></>}
        </p>
        <button type="button" className="tbtn tbtn-go tbtn-wide tp-sheet-go" onClick={onStart}>
          {startLabel(done, inProgress)}
        </button>
      </div>
    </div>
  );
}
