// "Lesson complete!" — the full-screen celebration. Pogo makes an entrance
// first (FinishEntrance.tsx: nothing of the puzzle is left on screen), then
// the results arrive with the fanfare: confetti, Pogo cheering,
// three stat cards that count up, the bonuses collected on the way, passport
// stamps (geography) or the unit's road to its chest (other courses), the tour
// day, and any trophy / treasure the store handed out. One button: back to the path.
import { useCallback, useEffect, useRef, useState } from "react";
import { useGame, type SessionResult } from "../../../state/store";
import { STAMP_GOAL } from "../../../state/tour";
import { courseUnitOfStage, unitComplete, type Course, type CourseUnit } from "../../../content/courses";
import type { StageDef } from "../../../content/types";
import { perfectBonus } from "../../../engine/answers/lessonRewards";
import { countryName } from "../../../engine/tour/countries";
import { Flag } from "../../../ui/tour/Flag";
import { Glyph, Icon } from "../../../ui/icons/Icon";
import { Confetti, Pogo } from "../../../ui/tour/Pogo";
import { TOUR } from "../../../strings/tour";
import { FinishEntrance } from "./FinishEntrance";
import { entranceAct, entranceOff } from "./finishActs";
import { lessonSound } from "./lessonSound";
import { LangMission } from "../lang/LangMission";
import { QuestRow } from "./QuestRow";
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
        <Icon name="dust" size="0.9em" className="tl-stat-icon" />+{dust}
      </StatCard>
      <StatCard tone="aim" label={TOUR.lesson.statFirstTry} delay={480}>
        <Icon name="target" size="0.9em" className="tl-stat-icon" />{percent}%
      </StatCard>
      <StatCard tone="stars" label={TOUR.lesson.statStars} delay={660}>
        <span className="tl-stars" role="img" aria-label={`${result.stars} / 3`}>
          {[1, 2, 3].map((star) => (
            <span
              key={star} className={`tl-star ${star <= result.stars ? "is-lit" : ""}`}
              style={{ animationDelay: `${900 + star * 220}ms` }}
            >
              <Icon name="star" size="1em" mono={star > result.stars} />
            </span>
          ))}
        </span>
      </StatCard>
    </div>
  );
}

/** What came on top of the meter: the Perfect Run bonus (part of the Star Dust
    stat) and the gift opened on the way (paid when it appeared). */
function Bonuses({ perfect, gift }: { perfect: number; gift: number }) {
  if (perfect <= 0 && gift <= 0) return null;
  return (
    <div className="tl-bonus">
      {perfect > 0 && (
        <span className="tl-bonus-line"><Icon name="star" size="1.1em" /> {TOUR.lesson.perfectBonus(perfect)} <Icon name="dust" size="1em" /></span>
      )}
      {gift > 0 && (
        <span className="tl-bonus-line is-gift"><Icon name="gift" size="1.1em" /> {TOUR.lesson.giftLine(gift)} <Icon name="dust" size="1em" /></span>
      )}
    </div>
  );
}

/** The unit's lessons as pips on the road to its chest — this one just filled. */
function UnitRoad({ unit, stageId, fresh }: { unit: CourseUnit; stageId: string; fresh: boolean }) {
  const progress = useGame((s) => s.progress);
  const index = unit.lessons.findIndex((lesson) => lesson.id === stageId);
  const label = TOUR.lesson.lessonOf(index + 1, unit.lessons.length);
  return (
    <section className="tl-passport tl-unit" style={{ "--tl-unit-hue": unit.hue } as React.CSSProperties}>
      <h3 className="tl-passport-title"><Glyph value={unit.icon} size={26} className="tl-unit-icon" /> {unit.name}</h3>
      <div className="tl-unit-road" role="img" aria-label={label}>
        {unit.lessons.map((lesson, i) => {
          const on = Boolean(progress[lesson.id]?.completed);
          const here = i === index;
          return (
            <i key={lesson.id} className={`tl-unit-pip ${on ? "is-on" : ""} ${here ? "is-here" : ""} ${here && fresh ? "is-fresh" : ""}`}>
              {on ? <Icon name="check" size="0.9em" mono /> : i + 1}
            </i>
          );
        })}
        <span className={`tl-unit-chest ${unitComplete(unit, progress) ? "is-ready" : ""}`}><Icon name="chest" size="1em" /></span>
      </div>
      <p className="tl-passport-note">{label}</p>
    </section>
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
        <h3 className="tl-passport-title"><Icon name="passport" size="1.2em" /> {TOUR.lesson.newStamps}</h3>
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
      <h3 className="tl-passport-title"><Icon name="passport" size="1.2em" /> {TOUR.lesson.stampProgress}</h3>
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

interface ExtrasProps {
  result: SessionResult;
  dayNumber: number | null;
  /** "Day 3 on tour!" for geography, "Day 3 with Pogo!" elsewhere. */
  dayNote: string;
  chestWaiting: boolean;
}

function Extras({ result, dayNumber, dayNote, chestWaiting }: ExtrasProps) {
  if (dayNumber === null && !result.newBadge && !result.surprise && !chestWaiting) return null;
  return (
    <div className="tl-extras">
      {dayNumber !== null && (
        <div className="tl-chip tl-chip-day">
          <Icon name="flame" size="1em" className="tl-chip-icon" />
          <span><b>{TOUR.lesson.dayChip(dayNumber)}</b> {dayNote}</span>
        </div>
      )}
      {result.newBadge && (
        <div className="tl-chip tl-chip-trophy">
          <Glyph value={result.newBadge.icon} size={28} className="tl-chip-icon" />
          <span>{TOUR.lesson.trophy} <b>{result.newBadge.name}</b></span>
        </div>
      )}
      {chestWaiting && (
        <div className="tl-chip tl-chip-chest">
          <Icon name="chest" size="1em" className="tl-chip-icon" />
          <span>{TOUR.lesson.chestTease}</span>
        </div>
      )}
      {result.surprise && (
        <div className="tl-chip tl-chip-gift">
          <Glyph value={result.surprise.icon} size={28} className="tl-chip-icon" />
          <span>{TOUR.lesson.surprise} <b>{result.surprise.name}</b></span>
        </div>
      )}
    </div>
  );
}

interface LessonCompleteProps {
  course: Course;
  stage: StageDef;
  seed: number;
  result: SessionResult;
  /** Slots in the lesson and how many were not first-try. */
  total: number;
  misses: number;
  /** Geography: the lesson's focus countries (passport section). Null elsewhere. */
  focus: string[] | null;
  newStamps: string[];
  dayNumber: number | null;
  /** Star Dust from the gift opened in this sitting (0 = none). */
  giftDust: number;
  onContinue: () => void;
}

/** False while Pogo's entrance plays; the fanfare sounds as the results arrive. */
function useEntrance(result: SessionResult): [boolean, () => void] {
  const [entered, setEntered] = useState(() => result.noQuestions || entranceOff());
  const played = useRef(false);
  useEffect(() => {
    if (!entered || played.current || result.noQuestions) return;
    played.current = true;
    lessonSound.done(result);
  }, [entered, result]);
  const enter = useCallback(() => setEntered(true), []);
  return [entered, enter];
}

export function LessonComplete(props: LessonCompleteProps) {
  const { course, stage, seed, result, total, misses, focus, newStamps, dayNumber, giftDust, onContinue } = props;
  const compact = useCompact();
  const unit = courseUnitOfStage(stage.id);
  const chestWaiting = useGame((s) => Boolean(unit && unitComplete(unit, s.progress) && !s.tourChests.includes(unit.id)));
  const bonus = perfectBonus(result.payout, result.perfect, stage.payout, total, result.firstTime);
  const [entered, enter] = useEntrance(result);

  if (!entered) {
    return (
      <div className="tl-done">
        <FinishEntrance act={entranceAct(seed)} onDone={enter} />
      </div>
    );
  }
  return (
    <div className="tl-done" data-testid="lesson-complete">
      <Confetti burstKey={seed} />
      <div className="tl-done-scroll">
        <div className="tl-done-hero">
          <span className="tl-done-glow" aria-hidden="true" />
          <span className="tl-done-pogo"><Pogo mood={result.perfect ? "starry" : "cheer"} size={compact ? 104 : 168} /></span>
        </div>
        <h1 className="tl-done-title">{TOUR.lesson.complete}</h1>
        {result.noQuestions && <p className="tl-done-note">{TOUR.lesson.noQuestions}</p>}
        {result.perfect && !result.noQuestions && (
          <div className="tl-ribbon"><Icon name="star" size="1.1em" /> {TOUR.lesson.perfect}</div>
        )}
        {!result.noQuestions && (
          <>
            <Stats result={result} total={total} misses={misses} />
            <QuestRow stageId={stage.id} seed={seed} />
            <LangMission stage={stage} />
            <Bonuses perfect={bonus} gift={giftDust} />
            {!result.firstTime && <p className="tl-done-note">{TOUR.lesson.replayNote}</p>}
            {focus && <Passport newStamps={newStamps} focus={focus} />}
            {!focus && unit && <UnitRoad unit={unit} stageId={stage.id} fresh={result.firstTime} />}
            <Extras
              result={result} dayNumber={dayNumber} chestWaiting={chestWaiting && result.firstTime}
              dayNote={course.id === "tour" ? TOUR.lesson.dayNote : TOUR.lesson.dayNoteGuide}
            />
          </>
        )}
      </div>
      <footer className="tl-footer">
        <button className="tbtn tbtn-go tbtn-wide" onClick={onContinue}>{TOUR.lesson.continue}</button>
      </footer>
    </div>
  );
}
