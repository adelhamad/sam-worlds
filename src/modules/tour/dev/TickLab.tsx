// DEV-only test bench for Tick Tock's clock and widgets (route /tour/lab/tick).
// Feeds the widgets real planner questions plus hand-written extras, shows what
// each widget reports and whether the engine would accept it.
//   ?view=clock|widgets|teach|meet          one section only
//   ?kind=tick-read  ?task=later-set        filter the questions
//   ?solo=1&kind=tick-set[&i=0][&teach=1]   one widget in a phone-shell mock
//   ?solo=1&meet=half                       one opening demo in the lesson shell
//   ?src=lab|plan                           only the hand-written / only the planner's questions
//   ?seed=7                                 planner seed
import { useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import "../../../ui/tour/tour-base.css";
import "../lesson.css";
import { TICK_INTROS } from "../../../content/tick/intros";
import { timeKey } from "../../../engine/tick/clock";
import { planTickLesson } from "../../../engine/tick/planner";
import { tickPayload, type ClockTime, type TickIntroKey, type TickParams, type TickStep } from "../../../engine/tick/types";
import type { Question } from "../../../engine/generators/types";
import { TOUR } from "../../../strings/tour";
import { ClockFace } from "../../../ui/clock/ClockFace";
import { PogoSay } from "../../../ui/tour/Pogo";
import { HandClock } from "../tick/HandClock";
import { TickExercise, TickTeach } from "../tick/TickExercise";
import { TickMeet } from "../tick/TickMeet";
import { LAB_EXTRAS } from "./tickLabFixtures";

const INTROS = Object.keys(TICK_INTROS) as TickIntroKey[];
const PARAMS: TickParams = { tasks: ["read", "set", "later-read", "later-set"], step: 5, jumps: [30, 60] };
const STEPS: TickStep[] = [60, 30, 15, 5, 1];

const css: Record<string, CSSProperties> = {
  bar: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 14 },
  chip: { minHeight: 40, minWidth: 40, padding: "4px 12px", fontSize: 14 },
  card: { background: "var(--t-bg)", border: "2px solid var(--t-line-deep)", borderRadius: 24, padding: 16, display: "flex", flexDirection: "column", gap: 14 },
  status: { fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 500, color: "var(--t-ink-dim)", wordBreak: "break-all", lineHeight: 1.5 },
  sheet: { background: "#3a2a10", border: "2px solid var(--t-almost)", borderRadius: 22, padding: 16, color: "#fff3df", display: "flex", flexDirection: "column", gap: 12 },
  sheetTitle: { color: "var(--t-almost)", fontSize: 22, fontWeight: 900 },
  solo: { height: "100dvh", minHeight: 0, overflow: "hidden", background: "var(--t-bg)", gap: 0, padding: 0, position: "relative" },
  soloHead: { height: 150, flex: "none", padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8, boxSizing: "border-box" },
  soloBody: { flex: 1, minHeight: 0, padding: "10px 16px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto" },
  soloFoot: { flex: "none", padding: "0 16px 16px", boxSizing: "border-box" },
  soloSheet: { position: "absolute", left: 0, right: 0, bottom: 0, borderRadius: "22px 22px 0 0", zIndex: 30, maxHeight: "50dvh", boxSizing: "border-box" },
  row: { display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" },
  label: { fontSize: 12, color: "var(--t-ink-dim)", textAlign: "center" },
};

const t = (hour: number, minute: number): ClockTime => ({ hour, minute });

// ---------- clock showcase ----------

function Sized({ time, size, numbers }: { time: ClockTime; size?: number; numbers?: "all" | "quarters" | "none" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
      <ClockFace time={time} size={size} numbers={numbers} />
      <span style={css.label}>{size ?? "fluid"} · {numbers ?? "all"} · {timeKey(time)}</span>
    </div>
  );
}

function ClockShow() {
  const [step, setStep] = useState<TickStep>(5);
  const [total, setTotal] = useState(3 * 60 + 40);
  const [log, setLog] = useState("");
  return (
    <section style={css.card} data-testid="lab-clock">
      <div style={css.row}>
        {[56, 72, 96, 140].map((size) => <Sized key={size} time={t(4, 45)} size={size} />)}
      </div>
      <div style={css.row}>
        <Sized time={t(10, 10)} size={140} numbers="quarters" />
        <Sized time={t(7, 30)} size={140} numbers="none" />
        <Sized time={t(12, 0)} size={64} numbers="none" />
        <div style={{ width: 80 }}><Sized time={t(2, 15)} /></div>
        <div style={{ width: 180 }}><Sized time={t(8, 50)} /></div>
      </div>
      <div style={css.row}>
        <ClockFace time={t(4, 30)} size={200} overlay={{ wedge: { from: 0, to: 30 } }} />
        <ClockFace time={t(2, 45)} size={200} overlay={{ wedge: { from: 45, to: 60 }, hourMark: 2 }} />
        <ClockFace time={t(7, 35)} size={200} overlay={{ ring: true, ringLit: 35 }} />
        <ClockFace time={t(9, 13)} size={200} overlay={{ ring: true, ticks: { from: 11, to: 13 } }} pulse="minute" />
        <ClockFace time={t(5, 0)} size={200} overlay={{ hourMark: 5 }} pulse="hour" />
      </div>
      <ClockFace time={t(10, 8)} size={320} />
      <div style={css.bar}>
        {STEPS.map((s) => (
          <button key={s} type="button" className={`tbtn ${s === step ? "tbtn-go" : "tbtn-ghost"}`} style={css.chip} onClick={() => setStep(s)}>step {s}</button>
        ))}
      </div>
      <div className="tk" style={{ "--tk-clock": "320px" } as CSSProperties}>
        <HandClock total={total} step={step} digital onTotal={(next, how) => { setTotal(next); setLog(`${how} → ${next}`); }} testId="lab-hand" />
      </div>
      <div style={css.status} data-testid="lab-hand-status">total: {total} · {log}</div>
    </section>
  );
}

// ---------- widgets ----------

interface Bench {
  draft: string | null;
  submitted: string | null;
  nonce: number;
}

function useBench(question: Question) {
  const [bench, setBench] = useState<Bench>({ draft: null, submitted: null, nonce: 0 });
  const live = useMemo(() => ({ ...question, id: `${question.id}#${bench.nonce}` }), [question, bench.nonce]);
  return {
    bench,
    live,
    onDraft: (draft: string | null) => setBench((now) => ({ ...now, draft })),
    onSubmit: (submitted: string) => setBench((now) => ({ ...now, submitted })),
    check: () => setBench((now) => ({ ...now, submitted: now.draft })),
    fresh: () => setBench((now) => ({ draft: null, submitted: null, nonce: now.nonce + 1 })),
  };
}

function verdict(question: Question, value: string | null): string {
  if (value === null) return "-";
  return value === question.answer ? "EQUALS answer" : "differs";
}

function Status({ question, bench }: { question: Question; bench: Bench }) {
  return (
    <div style={css.status} data-testid="lab-status">
      <div data-testid="lab-draft">draft: {bench.draft ?? "null"} ({verdict(question, bench.draft)})</div>
      <div data-testid="lab-submitted">submitted: {bench.submitted ?? "null"} ({verdict(question, bench.submitted)})</div>
      <div>answer: {question.answer}</div>
    </div>
  );
}

/** A plausible miss for the teach card before anything was submitted. */
function missOf(question: Question, bench: Bench): string | undefined {
  if (bench.submitted !== null && bench.submitted !== question.answer) return bench.submitted;
  const payload = tickPayload(question);
  if (!payload) return undefined;
  return timeKey(payload.tour === "tick-read" ? payload.shown : payload.start);
}

function TeachSheet({ question, submitted, style }: { question: Question; submitted?: string; style?: CSSProperties }) {
  return (
    <div style={{ ...css.sheet, ...style }} data-testid="lab-sheet">
      <div style={css.sheetTitle}>{TOUR.lesson.almost}</div>
      <div className="tl-teach"><TickTeach question={question} submitted={submitted} /></div>
      {style && <button type="button" className="tbtn tbtn-almost tbtn-wide" style={{ minHeight: 60 }}>{TOUR.lesson.gotIt}</button>}
    </div>
  );
}

function LabCard({ question, locked, teachOnly }: { question: Question; locked: boolean; teachOnly: boolean }) {
  const { bench, live, onDraft, onSubmit, check, fresh } = useBench(question);
  const payload = tickPayload(question);
  return (
    <section style={css.card} data-testid={`lab-card-${question.id}`}>
      <div style={css.bar}>
        <strong style={{ color: "var(--t-gold)" }}>{payload?.tour} · {payload?.task} · step {payload?.step}</strong>
        <span style={{ ...css.status, flex: 1 }}>{question.dedupeKey}</span>
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={fresh} data-testid="lab-reset">reset</button>
      </div>
      {!teachOnly && (
        <>
          <PogoSay text={question.prompt} size={72} />
          <TickExercise question={live} disabled={locked || bench.submitted !== null} onDraft={onDraft} onSubmit={onSubmit} />
          <button type="button" className="tbtn tbtn-go tbtn-wide" disabled={bench.draft === null || locked} onClick={check} data-testid="lab-check">
            {TOUR.lesson.check}
          </button>
          <Status question={question} bench={bench} />
        </>
      )}
      <TeachSheet question={question} submitted={missOf(question, bench)} />
    </section>
  );
}

/** The widget inside a mock of the lesson shell on a phone: 150px header, CHECK footer. */
function SoloShell({ question, teach }: { question: Question; teach: boolean }) {
  const { bench, live, onDraft, onSubmit, check } = useBench(question);
  return (
    <div className="screen tour" style={css.solo}>
      <div style={css.soloHead}>
        <div style={{ height: 14, borderRadius: 7, background: "var(--t-surface-2)" }} />
        <PogoSay text={question.prompt} size={84} />
      </div>
      <div style={css.soloBody} data-testid="lab-solo-body">
        <TickExercise question={live} disabled={teach || bench.submitted !== null} onDraft={onDraft} onSubmit={onSubmit} />
      </div>
      <div style={css.soloFoot}>
        <button type="button" className="tbtn tbtn-go tbtn-wide" style={{ minHeight: 60 }} disabled={bench.draft === null || bench.submitted !== null} onClick={check} data-testid="lab-check">
          {TOUR.lesson.check}
        </button>
      </div>
      <div style={{ position: "absolute", top: 2, left: 6, ...css.status, fontSize: 9 }} data-testid="lab-solo-status">
        {bench.draft ?? "null"} | {bench.submitted ?? "null"} | {String((bench.submitted ?? bench.draft) === question.answer)}
      </div>
      {teach && <TeachSheet question={question} submitted={missOf(question, bench)} style={css.soloSheet} />}
    </div>
  );
}

/** One opening demo inside a mock of the lesson screen (top bar + the demo). */
function SoloMeet({ intro }: { intro: TickIntroKey }) {
  const [started, setStarted] = useState(0);
  return (
    <div className="screen tour tour-lesson">
      <div className="tl-top">
        <span className="tl-quit" aria-hidden="true" />
        <div className="tl-bar"><div className="tl-bar-fill" style={{ width: "4%" }} /></div>
      </div>
      <TickMeet intro={intro} onStart={() => setStarted(started + 1)} />
      <div style={{ position: "absolute", top: 2, left: 6, ...css.status, fontSize: 9 }} data-testid="lab-meet-started">{started}</div>
    </div>
  );
}

export default function TickLab() {
  const [search, setSearch] = useSearchParams();
  const [locked, setLocked] = useState(false);
  const seed = Number(search.get("seed") ?? 7);
  const view = search.get("view");
  const kind = search.get("kind");
  const task = search.get("task");
  const meet = search.get("meet") as TickIntroKey | null;
  const src = search.get("src");

  const questions = useMemo(() => [
    ...(src === "lab" ? [] : planTickLesson(PARAMS, 8, seed, { difficulty: 0.4, easier: false })),
    ...(src === "plan" ? [] : LAB_EXTRAS),
  ], [seed, src]);
  const shown = questions.filter((question) => {
    const payload = tickPayload(question);
    return payload !== null && (!kind || payload.tour === kind) && (!task || payload.task === task);
  });

  if (search.get("solo") === "1") {
    if (meet && TICK_INTROS[meet]) return <SoloMeet key={meet} intro={meet} />;
    const question = shown[Number(search.get("i") ?? 0)] ?? shown[0];
    if (!question) return <div className="screen tour">No such question for seed {seed}.</div>;
    return <SoloShell key={question.id} question={question} teach={search.get("teach") === "1"} />;
  }

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(search);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setSearch(next, { replace: true });
  };
  const on = (name: string) => !view || view === name;

  return (
    <div className="screen tour" style={{ background: "#060e1f", maxWidth: 720, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>Tick lab</h1>
      <div style={css.bar}>
        {[null, "clock", "widgets", "teach", "meet"].map((name) => (
          <button key={name ?? "all"} type="button" className={`tbtn ${view === name ? "tbtn-go" : "tbtn-ghost"}`} style={css.chip} onClick={() => set("view", name)}>
            {name ?? "everything"}
          </button>
        ))}
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={() => set("seed", String(seed + 1))}>seed {seed} +</button>
        <label><input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} data-testid="lab-disabled" /> disabled</label>
      </div>
      {on("clock") && <ClockShow />}
      {(on("widgets") || view === "teach") && shown.map((question) => (
        <LabCard key={question.id} question={question} locked={locked} teachOnly={view === "teach"} />
      ))}
      {on("meet") && INTROS.filter((key) => !meet || key === meet).map((key) => (
        <section key={key} className="tour-lesson" style={{ ...css.card, minHeight: 700, height: "auto", position: "relative" }} data-testid={`lab-meet-${key}`}>
          <TickMeet intro={key} onStart={() => undefined} />
        </section>
      ))}
    </div>
  );
}
