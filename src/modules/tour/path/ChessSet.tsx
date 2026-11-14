import type { CSSProperties } from "react";
import type { Course, CourseUnit } from "../../../content/courses";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import { useGame } from "../../../state/store";
import { CHESS } from "../../../strings/chess";
import { TOUR } from "../../../strings/tour";
import { useToast } from "./hooks";
import { Keepsake } from "./Keepsake";
import "./passport.css";
import "./chess-set.css";

/** Keepsakes standing on one shelf. */
const PER_SHELF = 3;

interface SlotProps {
  unit: CourseUnit;
  owned: boolean;
  onSay: (text: string) => void;
}

/** One place on the shelf: the keepsake on its pedestal, or its shadow. */
function Slot({ unit, owned, onSay }: SlotProps) {
  const line = owned ? TOUR.path.souvenirOwned(unit.souvenir.name) : CHESS.path.setHidden;
  return (
    <button
      type="button"
      className={`cs-slot ${owned ? "is-owned" : ""}`}
      style={{ "--hue": unit.hue } as CSSProperties}
      aria-label={line}
      onClick={() => onSay(line)}
    >
      <span className="cs-figure"><Keepsake unit={unit} size={68} /></span>
      <span className="cs-pedestal" aria-hidden="true" />
      <span className="cs-name" aria-hidden="true">{owned ? unit.souvenir.name : CHESS.path.setMystery}</span>
    </button>
  );
}

/** Sam's chess set: one keepsake per unit, found in that unit's treasure chest. */
export function ChessSet({ course, onClose }: { course: Course; onClose: () => void }) {
  const chests = useGame((s) => s.tourChests);
  const [toast, say] = useToast();
  const total = course.units.length;
  const owned = course.units.filter((unit) => chests.includes(unit.id)).length;
  const shelves: CourseUnit[][] = [];
  for (let start = 0; start < total; start += PER_SHELF) shelves.push(course.units.slice(start, start + PER_SHELF));

  function sayWithTap(text: string) {
    tourSfx.pop();
    say(text);
  }

  return (
    <div className="tp-scrim tp-scrim-centre" onClick={onClose}>
      <div className="pp-book cs-book" role="dialog" aria-modal="true" aria-label={CHESS.path.setTitle} onClick={(event) => event.stopPropagation()}>
        <header className="pp-cover">
          <button type="button" className="tp-close" aria-label={TOUR.path.close} onClick={onClose}>✕</button>
          <span className="pp-cover-kicker">{course.title}</span>
          <h2 className="pp-title">{CHESS.path.setTitle}</h2>
          <p className="pp-count">{CHESS.path.setCount(owned, total)}</p>
          <div className="pp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={owned}>
            <span style={{ transform: `scaleX(${owned / total})` }} />
          </div>
          <p className="pp-how">{owned >= total ? CHESS.path.setFull : CHESS.path.setHow}</p>
        </header>

        <div className="pp-pages cs-case">
          {shelves.map((shelf) => (
            <div key={shelf[0].id} className="cs-shelf">
              {shelf.map((unit) => (
                <Slot key={unit.id} unit={unit} owned={chests.includes(unit.id)} onSay={sayWithTap} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {toast && <div key={toast.id} className="tp-toast pp-toast" role="status">{toast.text}</div>}
    </div>
  );
}
