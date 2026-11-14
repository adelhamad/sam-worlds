import { useNavigate } from "react-router-dom";
import { TOUR_COUNTRIES, TOUR_WORLD, TOUR_WORLD_ID } from "../../content/tour/units";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { useGame } from "../../state/store";
import { stampedCount } from "../../state/tour";
import { TOUR } from "../../strings/tour";
import { Pogo } from "./Pogo";
import "./tour-base.css";
import "./tour-banner.css";

/** Hub invitation to the World Tour — the way Sam discovers the trial. */
export function TourBanner() {
  const navigate = useNavigate();
  const visible = useGame((s) => Boolean(s.enabledWorlds[TOUR_WORLD_ID]) && !s.hiddenWorlds[TOUR_WORLD_ID]);
  const lessonsDone = useGame((s) => TOUR_WORLD.stages.filter((stage) => s.progress[stage.id]?.completed).length);
  const stamps = useGame((s) => Math.min(TOUR_COUNTRIES.length, stampedCount(s.tourStamps)));
  const tourDays = useGame((s) => s.tourDays);

  if (!visible) return null;

  const total = TOUR_WORLD.stages.length;
  const go = () => {
    unlockAudio();
    sfx.tap();
    navigate("/tour");
  };

  return (
    // The whole card is a tap target; the button inside is the real control.
    <section className="tour tour-banner" onClick={go}>
      <span className="tb-stars" aria-hidden="true" />
      <div className="tb-pogo" aria-hidden="true">
        <span className="tb-glow" />
        <Pogo mood="wave" size={96} />
      </div>
      <div className="tb-text">
        <h2 className="tb-title">
          {TOUR.hub.banner}
          <span className="tb-new">{TOUR.hub.newTag}</span>
        </h2>
        <p className="tb-sub">{TOUR.hub.bannerSub}</p>
        <div className="tb-progress">
          <span className="tb-chip"><span aria-hidden="true">📍</span> {TOUR.hub.lessons(lessonsDone, total)}</span>
          <span className="tb-chip"><span aria-hidden="true">🛂</span> {TOUR.hub.stamps(stamps)}</span>
          {tourDays > 0 && <span className="tb-chip tb-chip-day"><span aria-hidden="true">🔥</span> {TOUR.hub.day(tourDays)}</span>}
        </div>
        <div className="tb-meter" aria-hidden="true">
          <span style={{ transform: `scaleX(${lessonsDone / total})` }} />
        </div>
      </div>
      <button type="button" className="tbtn tbtn-go tb-go">
        {TOUR.hub.go} <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
