// The sheet that slides up after every answer: green for a correct answer
// (and for "one more to be sure"), warm amber for a miss — with the solved
// view of the missed question and a short, visible look-first lock.
import { useEffect, useState } from "react";
import { REVEAL_COST } from "../../../state/store";
import { MISS_LOCK_MS } from "../../../engine/answers/answerEngine";
import { countryName } from "../../../engine/tour/countries";
import { Flag } from "../../../ui/tour/Flag";
import { TourTeach } from "../exercises/TourExercise";
import { TOUR } from "../../../strings/tour";
import type { LessonSheet } from "./useLessonFlow";

/** True once `ms` have passed since sheet `id` opened (at once when ms = 0). */
function useUnlocked(id: number, ms: number): boolean {
  const [unlockedId, setUnlockedId] = useState<number | null>(null);
  useEffect(() => {
    if (ms <= 0) return;
    const timer = setTimeout(() => setUnlockedId(id), ms);
    return () => clearTimeout(timer);
  }, [id, ms]);
  return ms <= 0 || unlockedId === id;
}

function StampToast({ codes }: { codes: string[] }) {
  return (
    <div className="tl-stamp-toast">
      <span aria-hidden="true">🛂</span>
      <span>{TOUR.lesson.newStamp}</span>
      {codes.map((code) => (
        <span key={code} className="tl-stamp-toast-flag">
          <Flag code={code} size={26} /> {countryName(code)}
        </span>
      ))}
    </div>
  );
}

function SheetBadge({ almost }: { almost: boolean }) {
  return (
    <span className="tl-sheet-badge" aria-hidden="true">
      {almost ? (
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M12 3a6.5 6.5 0 0 0-3.6 11.9c.5.4.8.9.8 1.5V17h5.6v-.6c0-.6.3-1.1.8-1.5A6.5 6.5 0 0 0 12 3z" fill="currentColor" />
          <path d="M9.6 20h4.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M5 12.5l4.6 4.6L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

interface FeedbackSheetProps {
  sheet: LessonSheet;
  onContinue: () => void;
  onSkip: () => void;
}

export function FeedbackSheet({ sheet, onContinue, onSkip }: FeedbackSheetProps) {
  const almost = sheet.kind === "almost";
  const unlocked = useUnlocked(sheet.id, almost ? MISS_LOCK_MS : 0);
  const label = almost ? TOUR.lesson.gotIt : TOUR.lesson.continue;

  return (
    <section className={`tl-sheet tl-sheet-${sheet.kind}`} role="status" aria-live="polite">
      {sheet.comboCount !== null && (
        <div className="tl-combo-banner">
          <span className="tl-combo-banner-flame" aria-hidden="true">🔥</span>
          {TOUR.lesson.comboBanner(sheet.comboCount)}
        </div>
      )}
      <div className="tl-sheet-inner">
        <div className="tl-sheet-head">
          <SheetBadge almost={almost} />
          <h2 className="tl-sheet-title">{sheet.title}</h2>
        </div>
        {sheet.stamps.length > 0 && <StampToast codes={sheet.stamps} />}
        {almost && (
          <div className="tl-sheet-body">
            <div className="tl-teach">
              <TourTeach question={sheet.question} submitted={sheet.submitted} />
            </div>
          </div>
        )}
        <div className="tl-sheet-actions">
          <button
            className={`tbtn tbtn-wide tl-main-btn ${almost ? "tbtn-almost" : "tbtn-yes"} ${almost && unlocked ? "is-ready" : ""}`}
            disabled={!unlocked}
            onClick={onContinue}
          >
            {!unlocked && <span className="tl-lock-fill" style={{ "--tl-lock-ms": `${MISS_LOCK_MS}ms` } as React.CSSProperties} />}
            <span className="tl-main-btn-label">{unlocked ? label : TOUR.lesson.lookFirst}</span>
          </button>
          {sheet.canSkip && (
            <button className="tl-skip" disabled={!unlocked} onClick={onSkip}>
              <span aria-hidden="true">🔑</span> {TOUR.lesson.skip(REVEAL_COST)}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
