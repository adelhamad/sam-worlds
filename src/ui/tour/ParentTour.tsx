import { useState } from "react";
import { TOUR_COUNTRIES, TOUR_UNITS, TOUR_WORLD } from "../../content/tour/units";
import { useGame } from "../../state/store";
import { STAMP_GOAL } from "../../state/tour";
import { TOUR } from "../../strings/tour";

type Pending = "passport" | "chests" | null;

/** World Tour controls (CLAUDE.md rule 2: persisted state needs view/edit/reset). */
export function TourControls() {
  const progress = useGame((s) => s.progress);
  const tourStamps = useGame((s) => s.tourStamps);
  const tourChests = useGame((s) => s.tourChests);
  const tourDays = useGame((s) => s.tourDays);
  const setTourDays = useGame((s) => s.setTourDays);
  const resetTourPassport = useGame((s) => s.resetTourPassport);
  const resetTourChests = useGame((s) => s.resetTourChests);
  const [daysInput, setDaysInput] = useState(String(tourDays));
  const [pending, setPending] = useState<Pending>(null);

  const lessons = TOUR_WORLD.stages.filter((stage) => progress[stage.id]?.completed).length;
  const stamps = TOUR_COUNTRIES.filter((code) => (tourStamps[code] ?? 0) >= STAMP_GOAL).length;
  const started = TOUR_COUNTRIES.filter((code) => (tourStamps[code] ?? 0) > 0).length - stamps;
  const chests = TOUR_UNITS.filter((unit) => tourChests.includes(unit.id)).length;

  return (
    <section className="panel parent-block">
      <h2>{TOUR.parent.heading}</h2>
      <p className="dim">
        {TOUR.parent.summary(lessons, TOUR_WORLD.stages.length, stamps, TOUR_COUNTRIES.length, chests, TOUR_UNITS.length, tourDays)}
        {started > 0 && ` · ${started} more countries on their way to a stamp`}
      </p>
      <p className="dim">
        Lesson progress is set under “World progress” (World Tour, 0–{TOUR_WORLD.stages.length}); lock or hide the
        tour in the world access controls like any other world. A stamp needs {STAMP_GOAL} first-try answers.
        Tour days only ever grow — it is a count of days played, not a streak.
      </p>
      <div className="parent-row">
        <span className="parent-world-name">Set tour days</span>
        <input
          className="parent-input parent-input-sm"
          type="number"
          min={0}
          value={daysInput}
          onChange={(e) => setDaysInput(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setTourDays(Number(daysInput) || 0)}>
          Set
        </button>
      </div>
      {pending === "passport" ? (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { resetTourPassport(); setPending(null); }}>
            Yes, clear all stamps
          </button>
        </div>
      ) : (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending("passport")}>Reset passport stamps…</button>
        </div>
      )}
      {pending === "chests" ? (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { resetTourChests(); setPending(null); }}>
            Yes, close all chests
          </button>
        </div>
      ) : (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setPending("chests")}>Reset treasure chests…</button>
        </div>
      )}
      <p className="dim">
        Resetting chests closes them again, so he can re-open each finished unit’s chest and collect its Star Dust
        once more. Star Dust already earned is kept.
      </p>
    </section>
  );
}
