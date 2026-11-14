// "Lesson complete!" — the full-screen celebration: confetti, Pogo cheering,
// three stat cards that count up, passport stamps, the tour day, and any
// trophy / treasure the store handed out. One button: back to the path.
import { useEffect, useState } from "react";
import { useGame, type SessionResult } from "../../../state/store";
import { STAMP_GOAL } from "../../../state/tour";
import { unitComplete, unitOfStage } from "../../../content/tour/units";
import { countryName } from "../../../engine/tour/countries";
import { Flag } from "../../../ui/tour/Flag";
import { Confetti, Pogo } from "../../../ui/tour/Pogo";
import { TOUR } from "../../../strings/tour";
import { useCompact } from "./useCompact";

const STAMP_ROW_MAX = 4;

/** Counts from 0 to `target` (eased); jumps straight there for reduced motion. */
function useCountUp(target: number, delay: number, ms = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now() + (reduced ? 0 : delay);
    let frame = 0;
    const tick = (now: number) => {
      const t = reduced ? 1 : Math.min(1, Math.max(0, (now - start) / ms));
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, delay, ms]);
  return value;
}

function StatCard({ tone, label, delay, children }: { tone: "dust" | "aim" | "stars"; label: string; delay: number; children: React.ReactNode }) {
  return (
    <div className={`tl-stat tl-stat-${tone}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="tl-stat-label">{label}</div>
      <div className="tl-stat-value">{children}</div>
    </div>
  );
}

function Stats({ result, total, misses }: { result: SessionResult; total: number; misses: number }) {
  const accuracy = total > 0 ? Math.round(((total - misses) / total) * 100) : 0;
  const dust = useCountUp(result.payout, 500);
  const percent = useCountUp(accuracy, 750);
  return (
    <div className="tl-stats">
      <StatCard tone="dust" label={TOUR.lesson.statDust} delay={300}>
        <span className="tl-stat-icon" aria-hidden="true">✨</span>+{dust}
      </StatCard>
      <StatCard tone="aim" label={TOUR.lesson.statFirstTry} delay={480}>
        <span className="tl-stat-icon" aria-hidden="true">🎯</span>{percent}%
      </StatCard>
      <StatCard tone="stars" label={TOUR.lesson.statStars} delay={660}>
        <span className="tl-stars" role="img" aria-label={`${result.stars} / 3`}>
          {[1, 2, 3].map((star) => (
            <span
              key={star} className={`tl-star ${star <= result.stars ? "is-lit" : ""}`}
              style={{ animationDelay: `${900 + star * 220}ms` }}
            >
              ★
            </span>
          ))}
        </span>
      </StatCard>
    </div>
  );
}

/** The focus countries closest to their stamp, when no stamp landed today. */
function nearestStamps(focus: string[], stamps: Record<string, number>): string[] {
  const open = focus.filter((code) => (stamps[code] ?? 0) < STAMP_GOAL);
  const pool = open.length > 0 ? open : focus;
  return [...pool].sort((a, b) => (stamps[b] ?? 0) - (stamps[a] ?? 0)).slice(0, STAMP_ROW_MAX);
}

function Passport({ newStamps, focus }: { newStamps: string[]; focus: string[] }) {
  const stamps = useGame((s) => s.tourStamps);
  if (newStamps.length > 0) {
    return (
      <section className={`tl-passport is-new ${newStamps.length > STAMP_ROW_MAX ? "is-many" : ""}`}>
        <h3 className="tl-passport-title">🛂 {TOUR.lesson.newStamps}</h3>
        <div className="tl-stamp-row">
          {newStamps.map((code, i) => (
            <div key={code} className="tl-stamp" style={{ animationDelay: `${1100 + i * 240}ms` }}>
              <Flag code={code} size={36} />
              <span className="tl-stamp-name">{countryName(code)}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }
  const row = nearestStamps(focus, stamps);
  if (row.length === 0) return null;
  return (
    <section className="tl-passport">
      <h3 className="tl-passport-title">🛂 {TOUR.lesson.stampProgress}</h3>
      <div className="tl-stamp-row">
        {row.map((code) => {
          const count = Math.min(STAMP_GOAL, stamps[code] ?? 0);
          return (
            <div key={code} className="tl-stamp-prog" aria-label={`${countryName(code)}: ${count} / ${STAMP_GOAL}`}>
              <Flag code={code} size={34} />
              <span className="tl-pips" aria-hidden="true">
                {Array.from({ length: STAMP_GOAL }, (_, i) => <i key={i} className={i < count ? "is-on" : ""} />)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="tl-passport-note">{TOUR.lesson.stampGoal(STAMP_GOAL)}</p>
    </section>
  );
}

function Extras({ result, dayNumber, chestWaiting }: { result: SessionResult; dayNumber: number | null; chestWaiting: boolean }) {
  if (dayNumber === null && !result.newBadge && !result.surprise && !chestWaiting) return null;
  return (
    <div className="tl-extras">
      {dayNumber !== null && (
        <div className="tl-chip tl-chip-day">
          <span className="tl-chip-icon" aria-hidden="true">☀️</span>
          <span><b>{TOUR.lesson.dayChip(dayNumber)}</b> {TOUR.lesson.dayNote}</span>
        </div>
      )}
      {result.newBadge && (
        <div className="tl-chip tl-chip-trophy">
          <span className="tl-chip-icon" aria-hidden="true">{result.newBadge.icon}</span>
          <span>{TOUR.lesson.trophy} <b>{result.newBadge.name}</b></span>
        </div>
      )}
      {chestWaiting && (
        <div className="tl-chip tl-chip-chest">
          <span className="tl-chip-icon" aria-hidden="true">🎁</span>
          <span>{TOUR.lesson.chestTease}</span>
        </div>
      )}
      {result.surprise && (
        <div className="tl-chip tl-chip-gift">
          <span className="tl-chip-icon" aria-hidden="true">{result.surprise.icon}</span>
          <span>{TOUR.lesson.surprise} <b>{result.surprise.name}</b></span>
        </div>
      )}
    </div>
  );
}

interface LessonCompleteProps {
  stageId: string;
  seed: number;
  result: SessionResult;
  /** Slots in the lesson and how many were not first-try. */
  total: number;
  misses: number;
  focus: string[];
  newStamps: string[];
  dayNumber: number | null;
  onContinue: () => void;
}

export function LessonComplete(props: LessonCompleteProps) {
  const { stageId, seed, result, total, misses, focus, newStamps, dayNumber, onContinue } = props;
  const compact = useCompact();
  const unit = unitOfStage(stageId);
  const chestWaiting = useGame((s) => Boolean(unit && unitComplete(unit, s.progress) && !s.tourChests.includes(unit.id)));

  return (
    <div className="tl-done">
      <Confetti burstKey={seed} />
      <div className="tl-done-scroll">
        <div className="tl-done-hero">
          <span className="tl-done-glow" aria-hidden="true" />
          <Pogo mood="cheer" size={compact ? 104 : 168} />
        </div>
        <h1 className="tl-done-title">{TOUR.lesson.complete}</h1>
        {result.noQuestions && <p className="tl-done-note">{TOUR.lesson.noQuestions}</p>}
        {result.perfect && !result.noQuestions && (
          <div className="tl-ribbon"><span aria-hidden="true">🌟</span> {TOUR.lesson.perfect}</div>
        )}
        {!result.noQuestions && (
          <>
            <Stats result={result} total={total} misses={misses} />
            {!result.firstTime && <p className="tl-done-note">{TOUR.lesson.replayNote}</p>}
            <Passport newStamps={newStamps} focus={focus} />
            <Extras result={result} dayNumber={dayNumber} chestWaiting={chestWaiting && result.firstTime} />
          </>
        )}
      </div>
      <footer className="tl-footer">
        <button className="tbtn tbtn-go tbtn-wide" onClick={onContinue}>{TOUR.lesson.continue}</button>
      </footer>
    </div>
  );
}
