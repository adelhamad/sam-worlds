// What a lesson card shows about the lesson inside, one teaser per lesson
// family (StageDef.generator). courseFamilies.ts picks one; KitTeaser is the
// default for any family it doesn't know.
import { chessParams } from "../../../content/chess/units";
import { codeParams } from "../../../content/code/units";
import type { CourseUnit } from "../../../content/courses";
import { kitParams } from "../../../content/kitCourse";
import { tourParams } from "../../../content/tour/units";
import type { StageDef } from "../../../content/types";
import { CHESS } from "../../../strings/chess";
import { TOUR } from "../../../strings/tour";
import type { IconName } from "../../../content/iconNames";
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import { Glyph, Icon } from "../../../ui/icons/Icon";
import { Flag } from "../../../ui/tour/Flag";
import "./teasers.css";

/** How many flags or pieces the teaser shows before it trails off. */
const TEASER_MAX = 5;
/** Kit lessons: at most this many "what you'll do" chips. */
const KIND_MAX = 3;

export interface TeaserProps {
  stage: StageDef;
  unit: CourseUnit;
}

/** Little pictures for the chips (decoration; the words come from the strings). */
const TASK_ICON: Record<string, IconName> = {
  run: "footprints", stars: "star", trace: "lens", debug: "bug", loop: "loop", "loop-trace": "loop",
};
const KIND_ICON: Record<string, IconName> = {
  pick: "target", pairs: "link", order: "arrow-right", sort: "shelf", build: "tools", number: "abacus",
};

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

/** Geography: the flags this lesson is about. */
export function FlagTeaser({ stage }: TeaserProps) {
  const focus = tourParams(stage).focus ?? [];
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
export function PieceTeaser({ stage }: TeaserProps) {
  const pieces = (chessParams(stage).pieces ?? []).slice(0, TEASER_MAX);
  return (
    <div className="tp-sheet-flags">
      {pieces.map((piece) => (
        <span key={piece} className="tp-sheet-flag tp-sheet-piece" role="img" aria-label={CHESS.piece[piece]}>
          <ChessPiece type={piece} size={40} />
        </span>
      ))}
      <span className="tp-sheet-count"><Icon name="puzzle" size="1.1em" /> {CHESS.path.puzzles(stage.questions)}</span>
    </div>
  );
}

function Chip({ icon, label }: { icon?: IconName; label: string }) {
  return (
    <span className="tp-sheet-chip">
      {icon && <Icon name={icon} size="1.15em" />}
      {label}
    </span>
  );
}

/** Code Lab: what the lesson practises (build, read, fix, loop…) and how many puzzles. */
export function CodeTeaser({ stage }: TeaserProps) {
  const tasks = unique(codeParams(stage).tasks ?? []).filter((task) => TOUR.path.codeTask[task]);
  return (
    <div className="tp-sheet-chips">
      {tasks.map((task) => <Chip key={task} icon={TASK_ICON[task]} label={TOUR.path.codeTask[task]} />)}
      <span className="tp-sheet-count"><Icon name="puzzle" size="1.1em" /> {TOUR.path.puzzles(stage.questions)}</span>
    </div>
  );
}

/** Kinds of question a kit lesson asks; nothing for lessons that aren't kit lessons. */
function kitKinds(stage: StageDef): string[] {
  if (stage.generator !== "kit") return [];
  const templates = kitParams(stage).templates ?? [];
  return unique(templates.map((template) => template.kind)).filter((kind) => TOUR.path.kitKind[kind]);
}

/** The default teaser: the unit's picture, what you'll do, and how many questions. */
export function KitTeaser({ stage, unit }: TeaserProps) {
  const kinds = kitKinds(stage).slice(0, KIND_MAX);
  return (
    <div className="tp-sheet-kit">
      <span className={`tp-sheet-art ${unit.piece ? "has-piece" : ""}`} aria-hidden="true">
        {unit.piece ? <ChessPiece type={unit.piece} size={46} /> : <Glyph value={unit.icon} size={46} />}
      </span>
      <div className="tp-sheet-chips">
        {kinds.map((kind) => <Chip key={kind} icon={KIND_ICON[kind]} label={TOUR.path.kitKind[kind]} />)}
        <span className="tp-sheet-count"><Icon name="chat" size="1.1em" /> {TOUR.path.questions(stage.questions)}</span>
      </div>
    </div>
  );
}
