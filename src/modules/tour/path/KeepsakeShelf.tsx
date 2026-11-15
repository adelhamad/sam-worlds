import type { Course, CourseUnit } from "../../../content/courses";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import { useGame } from "../../../state/store";
import { TOUR } from "../../../strings/tour";
import { Icon } from "../../../ui/icons/Icon";
import { useToast } from "./hooks";
import { hueStyle } from "./hue";
import { Keepsake } from "./Keepsake";
import { defaultShelfText, type ShelfText } from "./shelfText";
import "./passport.css";
import "./shelf.css";

/** Keepsakes standing on one shelf. */
const PER_SHELF = 3;

interface SlotProps {
  unit: CourseUnit;
  owned: boolean;
  text: ShelfText;
  onSay: (text: string) => void;
}

/** One place on the shelf: the keepsake on its pedestal, or its shadow. */
function Slot({ unit, owned, text, onSay }: SlotProps) {
  const line = owned ? TOUR.path.souvenirOwned(unit.souvenir.name) : text.hidden;
  return (
    <button
      type="button"
      className={`cs-slot ${owned ? "is-owned" : ""}`}
      style={hueStyle(unit.hue)}
      aria-label={line}
      onClick={() => onSay(line)}
    >
      <span className="cs-figure"><Keepsake unit={unit} size={68} /></span>
      <span className="cs-pedestal" aria-hidden="true" />
      <span className="cs-name" aria-hidden="true">{owned ? unit.souvenir.name : text.mystery}</span>
    </button>
  );
}

export interface CollectionSheetProps {
  course: Course;
  onClose: () => void;
  /** Shelf lines (ignored by sheets that are not shelves, e.g. the passport). */
  text?: ShelfText;
}

/**
 * A course's keepsake shelf: one pedestal per unit, filled from that unit's
 * treasure chest. Chess Camp's golden chess set is this shelf with its own lines.
 */
export function KeepsakeShelf({ course, onClose, text = defaultShelfText(course) }: CollectionSheetProps) {
  const chests = useGame((s) => s.tourChests);
  const [toast, say] = useToast();
  const total = course.units.length;
  const owned = course.units.filter((unit) => chests.includes(unit.id)).length;
  const shelves: CourseUnit[][] = [];
  for (let start = 0; start < total; start += PER_SHELF) shelves.push(course.units.slice(start, start + PER_SHELF));

  function sayWithTap(line: string) {
    tourSfx.pop();
    say(line);
  }

  return (
    <div className="tp-scrim tp-scrim-centre" onClick={onClose}>
      <div className="pp-book cs-book" role="dialog" aria-modal="true" aria-label={text.title} onClick={(event) => event.stopPropagation()}>
        <header className="pp-cover">
          <button type="button" className="tp-close" aria-label={TOUR.path.close} onClick={onClose}><Icon name="close" size={18} mono /></button>
          <span className="pp-cover-kicker">{course.title}</span>
          <h2 className="pp-title">{text.title}</h2>
          <p className="pp-count">{text.count(owned, total)}</p>
          <div className="pp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={owned}>
            <span style={{ transform: `scaleX(${total > 0 ? owned / total : 0})` }} />
          </div>
          <p className="pp-how">{owned >= total ? text.full : text.how}</p>
        </header>

        <div className="pp-pages cs-case">
          {shelves.map((shelf) => (
            <div key={shelf[0].id} className="cs-shelf">
              {shelf.map((unit) => (
                <Slot key={unit.id} unit={unit} owned={chests.includes(unit.id)} text={text} onSay={sayWithTap} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {toast && <div key={toast.id} className="tp-toast pp-toast" role="status">{toast.text}</div>}
    </div>
  );
}
