// Top of the lesson: quit, the fat progress bar, the combo flame and the live
// Star Dust meter — plus the small "Take a break?" sheet the quit button opens.
import { Pogo } from "../../../ui/tour/Pogo";
import { TOUR } from "../../../strings/tour";
import { Icon } from "../../../ui/icons/Icon";
import { DustMeter } from "./DustMeter";

interface TopBarProps {
  /** Slots finished so far. */
  done: number;
  total: number;
  /** First-try correct answers in a row; the flame shows from 2. */
  combo: number;
  /** Star Dust on the meter chip, and how many tokens have landed in it. */
  dust: number;
  dustBumps: number;
  /** Pogo is cheering: the bar pulses with him. */
  cheering: boolean;
  onQuit: () => void;
}

export function LessonTopBar({ done, total, combo, dust, dustBumps, cheering, onQuit }: TopBarProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <header className="tl-top">
      <button className="tl-quit" aria-label={TOUR.lesson.quit} onClick={onQuit}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
        </svg>
      </button>
      <div
        className={`tl-bar ${cheering ? "is-cheering" : ""}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
      >
        <div className="tl-bar-fill" style={{ width: `${Math.max(7, percent)}%` }}>
          <span className="tl-bar-shine" />
          {done > 0 && <span key={done} className="tl-bar-bump" />}
        </div>
      </div>
      {combo >= 2 && (
        <div key={combo} className="tl-combo" aria-label={TOUR.lesson.comboChip(combo)}>
          <Icon name="flame" size="1.1em" className="tl-combo-flame" />
          {combo}
        </div>
      )}
      <DustMeter value={dust} bumps={dustBumps} />
    </header>
  );
}

export function QuitSheet({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  return (
    <>
      <button className="tl-scrim" aria-label={TOUR.lesson.keepGoing} onClick={onStay} />
      <section className="tl-sheet tl-sheet-quit" role="dialog" aria-modal="true" aria-label={TOUR.lesson.quitTitle}>
        <div className="tl-sheet-inner">
          <div className="tl-quit-head">
            <Pogo mood="wave" size={76} />
            <div>
              <h2 className="tl-sheet-title">{TOUR.lesson.quitTitle}</h2>
              <p className="tl-sheet-note">{TOUR.lesson.quitNote}</p>
            </div>
          </div>
          <div className="tl-sheet-actions">
            <button className="tbtn tbtn-go tbtn-wide" onClick={onStay}>{TOUR.lesson.keepGoing}</button>
            <button className="tbtn tbtn-ghost tbtn-wide" onClick={onLeave}>{TOUR.lesson.leave}</button>
          </div>
        </div>
      </section>
    </>
  );
}
