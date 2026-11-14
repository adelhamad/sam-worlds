import type { CSSProperties } from "react";
import { chessParams } from "../../../content/chess/units";
import type { Course } from "../../../content/courses";
import { tourParams } from "../../../content/tour/units";
import type { StageDef } from "../../../content/types";
import { CHESS } from "../../../strings/chess";
import { TOUR } from "../../../strings/tour";
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import { Flag } from "../../../ui/tour/Flag";
import type { LessonItem } from "./layout";

/** How many flags or pieces the teaser shows before it trails off. */
const TEASER_MAX = 5;

interface LessonPopoverProps {
  course: Course;
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

/** Geography: the flags this lesson is about. */
function FlagTeaser({ stage }: { stage: StageDef }) {
  const focus = tourParams(stage).focus;
  const teaser = focus.slice(0, TEASER_MAX);
  return (
    <div className="tp-sheet-flags">
      {teaser.map((code) => (
        <span key={code} className="tp-sheet-flag"><Flag code={code} size={34} /></span>
      ))}
      {focus.length > teaser.length && <span className="tp-sheet-more" aria-hidden="true">{TOUR.path.more}</span>}
    </div>
  );
}

/** Chess: the pieces this lesson is about, and how many puzzles wait inside. */
function PieceTeaser({ stage }: { stage: StageDef }) {
  const pieces = chessParams(stage).pieces.slice(0, TEASER_MAX);
  return (
    <div className="tp-sheet-flags">
      {pieces.map((piece) => (
        <span key={piece} className="tp-sheet-flag tp-sheet-piece" role="img" aria-label={CHESS.piece[piece]}>
          <ChessPiece type={piece} size={40} />
        </span>
      ))}
      <span className="tp-sheet-count"><span aria-hidden="true">🧩 </span>{CHESS.path.puzzles(stage.questions)}</span>
    </div>
  );
}

/** Bottom card for a tapped lesson: what's inside, and the big start button. */
export function LessonPopover({ course, item, inProgress, onStart, onClose }: LessonPopoverProps) {
  const { stage, unit, slot } = item;
  const done = item.state === "done";

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
          {!unit.piece && <span aria-hidden="true">{unit.icon} </span>}
          {TOUR.path.lessonOf(slot + 1, unit.lessons.length)}
        </span>
        <h2 className="tp-sheet-name">{stage.name}</h2>
        {course.id === "chess" ? <PieceTeaser stage={stage} /> : <FlagTeaser stage={stage} />}
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
