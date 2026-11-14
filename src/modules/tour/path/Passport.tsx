import type { CSSProperties } from "react";
import { TOUR_COUNTRIES, TOUR_UNITS, type TourUnit } from "../../../content/tour/units";
import { countryName } from "../../../engine/tour/countries";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import { useGame } from "../../../state/store";
import { STAMP_GOAL, stampedCount } from "../../../state/tour";
import { TOUR } from "../../../strings/tour";
import { Flag } from "../../../ui/tour/Flag";
import { useToast } from "./hooks";
import { stampTilt } from "./layout";
import "./passport.css";

const DOTS = Array.from({ length: STAMP_GOAL }, (_, index) => index);

interface CountryTileProps {
  code: string;
  count: number;
  onSay: (text: string) => void;
  /** Said with the stamp thunk — for a country already stamped. */
  onStamp: (text: string) => void;
}

/** One country: an inked stamp, a faint flag on its way, or a mystery tile. */
function CountryTile({ code, count, onSay, onStamp }: CountryTileProps) {
  const name = countryName(code);
  if (count >= STAMP_GOAL) {
    return (
      <button type="button" className="pp-tile is-stamped" aria-label={TOUR.path.stamped(name)} onClick={() => onStamp(TOUR.path.stamped(name))}>
        <span className="pp-stamp" style={{ "--tilt": `${stampTilt(code)}deg` } as CSSProperties}>
          <Flag code={code} size={30} />
        </span>
      </button>
    );
  }
  if (count > 0) {
    const line = TOUR.path.stampProgress(name, count, STAMP_GOAL);
    return (
      <button type="button" className="pp-tile is-started" aria-label={line} onClick={() => onSay(line)}>
        <Flag code={code} size={28} className="pp-faint" />
        <span className="pp-dots" aria-hidden="true">
          {DOTS.map((dot) => <i key={dot} className={dot < count ? "is-on" : ""} />)}
        </span>
      </button>
    );
  }
  return (
    <button type="button" className="pp-tile is-unknown" aria-label={TOUR.path.notMet} onClick={() => onSay(TOUR.path.notMet)}>
      <span aria-hidden="true">?</span>
    </button>
  );
}

interface UnitPageProps {
  unit: TourUnit;
  stamps: Record<string, number>;
  onSay: (text: string) => void;
  onStamp: (text: string) => void;
}

function UnitPage({ unit, stamps, onSay, onStamp }: UnitPageProps) {
  const got = unit.countries.filter((code) => (stamps[code] ?? 0) >= STAMP_GOAL).length;
  return (
    <section className="pp-unit" style={{ "--hue": unit.hue } as CSSProperties}>
      <header className="pp-unit-head">
        <span className="pp-unit-icon" aria-hidden="true">{unit.icon}</span>
        <h3>{unit.name}</h3>
        <span className="pp-unit-count">{got}/{unit.countries.length}</span>
      </header>
      <div className="pp-grid">
        {unit.countries.map((code) => (
          <CountryTile key={code} code={code} count={stamps[code] ?? 0} onSay={onSay} onStamp={onStamp} />
        ))}
      </div>
    </section>
  );
}

/** Sam's passport: every country of the tour, its stamps, and the unit keepsakes. */
export function Passport({ onClose }: { onClose: () => void }) {
  const stamps = useGame((s) => s.tourStamps);
  const chests = useGame((s) => s.tourChests);
  const [toast, say] = useToast();
  const total = TOUR_COUNTRIES.length;
  const stamped = Math.min(total, stampedCount(stamps));

  function sayWithTap(text: string) {
    tourSfx.pop();
    say(text);
  }
  function sayStamped(text: string) {
    tourSfx.stamp();
    say(text);
  }

  return (
    <div className="tp-scrim tp-scrim-centre" onClick={onClose}>
      <div className="pp-book" role="dialog" aria-modal="true" aria-label={TOUR.path.passportTitle} onClick={(event) => event.stopPropagation()}>
        <header className="pp-cover">
          <button type="button" className="tp-close" aria-label={TOUR.path.close} onClick={onClose}>✕</button>
          <span className="pp-cover-kicker"><span aria-hidden="true">🛂 </span>{TOUR.path.passport}</span>
          <h2 className="pp-title">{TOUR.path.passportTitle}</h2>
          <p className="pp-count">{TOUR.path.stamps(stamped, total)}</p>
          <div className="pp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={stamped}>
            <span style={{ transform: `scaleX(${stamped / total})` }} />
          </div>
          <p className="pp-how">{TOUR.path.stampHow(STAMP_GOAL)}</p>
        </header>

        <div className="pp-pages">
          <section className="pp-souvenirs">
            <h3>{TOUR.path.souvenirs}</h3>
            <div className="pp-souvenir-row">
              {TOUR_UNITS.map((unit) => {
                const owned = chests.includes(unit.id);
                const line = owned ? TOUR.path.souvenirOwned(unit.souvenir.name) : TOUR.path.souvenirHidden;
                return (
                  <button
                    key={unit.id}
                    type="button"
                    className={`pp-souvenir ${owned ? "is-owned" : ""}`}
                    style={{ "--hue": unit.hue } as CSSProperties}
                    aria-label={line}
                    onClick={() => sayWithTap(line)}
                  >
                    <span aria-hidden="true">{unit.souvenir.icon}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {TOUR_UNITS.map((unit) => (
            <UnitPage key={unit.id} unit={unit} stamps={stamps} onSay={sayWithTap} onStamp={sayStamped} />
          ))}
        </div>

      </div>
      {toast && <div key={toast.id} className="tp-toast pp-toast" role="status">{toast.text}</div>}
    </div>
  );
}
