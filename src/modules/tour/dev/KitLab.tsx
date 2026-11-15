// DEV-only test bench for the Course Kit widgets (route /tour/lab/kit).
// Renders questions the kit planner builds from fixture templates (plus
// hand-built worst cases), shows what each widget reports and whether it
// equals `question.answer`, every kind's teach card, and the intro slides.
//   ?kind=kit-order      only that kind (or "meet")     ?f=<fixture id>   one fixture
//   ?seed=7&d=0.7        planner seed / difficulty (0.7 = the biggest boards)   ?easier=1
//   ?solo=1              first match inside a phone-shell mock of the lesson
//   ?teach=1             (with solo) the teach card in the amber sheet
import { useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import "../../../ui/tour/tour-base.css";
import "../lesson.css";
import type { Question } from "../../../engine/generators/types";
import { planKitLesson } from "../../../engine/kit/planner";
import { kitPayload, type KitTemplate } from "../../../engine/kit/types";
import { TOUR } from "../../../strings/tour";
import { PogoSay } from "../../../ui/tour/Pogo";
import { selfSubmitting } from "../exercises/contract";
import { KitExercise, KitTeach } from "../kit/KitExercise";
import { KitMeet } from "../kit/KitMeet";
import { LAB_MANUAL, LAB_SLIDES, LAB_TEMPLATES } from "./kitLabFixtures";

interface Fixture {
  id: string;
  kind: string;
  question: Question | null;
  error?: string;
}

const KINDS = ["kit-pick", "kit-pairs", "kit-order", "kit-sort", "kit-build", "kit-number", "meet"];

const css: Record<string, CSSProperties> = {
  page: { background: "#060e1f", maxWidth: 640, margin: "0 auto", width: "100%" },
  bar: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 14 },
  chip: { minHeight: 40, minWidth: 40, padding: "4px 12px", fontSize: 14 },
  card: { background: "var(--t-bg)", border: "2px solid var(--t-line-deep)", borderRadius: 24, padding: 16, display: "flex", flexDirection: "column", gap: 14 },
  prompt: { background: "var(--t-surface)", border: "2px solid var(--t-line)", borderRadius: 18, padding: "10px 16px", fontSize: 20, fontWeight: 900 },
  status: { fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 500, color: "var(--t-ink-dim)", wordBreak: "break-all", lineHeight: 1.5 },
  sheet: { background: "#3a2a10", borderTop: "3px solid var(--t-almost)", borderRadius: 22, padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  sheetTitle: { color: "var(--t-almost)", fontSize: 22, fontWeight: 900 },
  meetBox: { height: 700, position: "relative", borderRadius: 24, border: "2px solid var(--t-line-deep)" },
  topFake: { height: 48, display: "flex", alignItems: "center" },
  bar14: { flex: 1, height: 22, borderRadius: 11, background: "var(--t-surface-2)" },
  soloSheet: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 30 },
};

function plan(template: KitTemplate, seed: number, difficulty: number, easier: boolean): Fixture {
  const kind = `kit-${template.kind}`;
  try {
    // count > 1: a whole-lesson plan (count 1 is the replacement path).
    const questions = planKitLesson({ templates: [template], review: [] }, 3, seed, { difficulty, easier });
    const question = questions.find((q) => kitPayload(q)?.template === template.id) ?? questions[0] ?? null;
    return { id: template.id, kind, question };
  } catch (error) {
    return { id: template.id, kind, question: null, error: String(error) };
  }
}

function useFixtures(seed: number, difficulty: number, easier: boolean): Fixture[] {
  return useMemo(() => [
    ...LAB_TEMPLATES.map((template) => plan(template, seed, difficulty, easier)),
    ...LAB_MANUAL.map((question) => ({ id: question.id, kind: kitPayload(question)?.tour ?? "?", question })),
  ], [seed, difficulty, easier]);
}

interface Bench {
  draft: string | null;
  submitted: string | null;
  disabled: boolean;
  nonce: number;
}

function useBench(question: Question, locked: boolean) {
  const [bench, setBench] = useState<Bench>({ draft: null, submitted: null, disabled: false, nonce: 0 });
  const live = useMemo(() => ({ ...question, id: `${question.id}#${bench.nonce}` }), [question, bench.nonce]);
  return {
    bench,
    live,
    disabled: locked || bench.disabled,
    onDraft: (draft: string | null) => setBench((now) => ({ ...now, draft })),
    onSubmit: (submitted: string) => setBench((now) => ({ ...now, submitted })),
    check: () => setBench((now) => ({ ...now, submitted: now.draft })),
    fresh: () => setBench((now) => ({ draft: null, submitted: null, disabled: false, nonce: now.nonce + 1 })),
  };
}

function verdict(question: Question, value: string | null): string {
  if (value === null) return "—";
  return value === question.answer ? "equals answer" : "differs from answer";
}

/** A plausible miss to feed the teach card before anything was submitted. */
function sampleMiss(question: Question): string | undefined {
  const payload = kitPayload(question);
  if (payload?.tour === "kit-pairs") {
    const other = payload.right.find((item) => item.id !== payload.left[0]?.id);
    return other ? `miss:${payload.left[0].id}>${other.id}` : undefined;
  }
  if (payload?.tour === "kit-pick") return payload.options.find((item) => item.id !== question.answer)?.id;
  return undefined;
}

function missOf(question: Question, bench: Bench): string | undefined {
  return bench.submitted !== null && bench.submitted !== question.answer ? bench.submitted : sampleMiss(question);
}

function TeachSheet({ question, submitted, style }: { question: Question; submitted?: string; style?: CSSProperties }) {
  return (
    <div style={{ ...css.sheet, ...style }} data-testid="lab-sheet">
      <div style={css.sheetTitle}>{TOUR.lesson.almost}</div>
      <div className="tl-teach">
        <KitTeach question={question} submitted={submitted} />
      </div>
    </div>
  );
}

function LabCard({ fixture, question, locked }: { fixture: Fixture; question: Question; locked: boolean }) {
  const { bench, live, disabled, onDraft, onSubmit, check, fresh } = useBench(question, locked);
  return (
    <section style={css.card} data-testid={`lab-card-${fixture.id}`}>
      <div style={css.bar}>
        <strong style={{ color: "var(--t-gold)" }}>{fixture.kind}</strong>
        <span style={{ ...css.status, flex: 1 }}>{fixture.id}</span>
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={fresh}>reset</button>
      </div>
      <div style={css.prompt}>{question.prompt}</div>
      <KitExercise question={live} disabled={disabled} onDraft={onDraft} onSubmit={onSubmit} />
      {!selfSubmitting(question) && (
        <button type="button" className="tbtn tbtn-go tbtn-wide" disabled={bench.draft === null || disabled} onClick={check}>
          {TOUR.lesson.check}
        </button>
      )}
      <div style={css.status} data-testid={`lab-status-${fixture.id}`}>
        <div>draft: {bench.draft ?? "null"} ({verdict(question, bench.draft)})</div>
        <div>submitted: {bench.submitted ?? "null"} ({verdict(question, bench.submitted)})</div>
        <div>answer: {question.answer}</div>
      </div>
      <TeachSheet question={question} submitted={missOf(question, bench)} />
    </section>
  );
}

/** The lesson shell on a phone: top bar, Pogo + prompt, the widget, CHECK. */
function SoloShell({ question, locked, teach }: { question: Question; locked: boolean; teach: boolean }) {
  const { bench, live, disabled, onDraft, onSubmit, check } = useBench(question, locked);
  return (
    <div className="screen tour tour-lesson">
      <div className="tl-top" style={css.topFake}><div style={css.bar14} /></div>
      <div className="tl-ask">
        <PogoSay size={84} text={question.prompt} mood="idle" />
      </div>
      <main className={`tl-exercise ${teach ? "is-dimmed" : ""}`} data-testid="lab-solo-body">
        <KitExercise question={live} disabled={disabled || teach} onDraft={onDraft} onSubmit={onSubmit} />
      </main>
      <footer className="tl-footer">
        {!selfSubmitting(question) && (
          <button type="button" className="tbtn tbtn-go tbtn-wide tl-check" disabled={bench.draft === null || disabled} onClick={check} data-testid="lab-check">
            {TOUR.lesson.check}
          </button>
        )}
      </footer>
      <div style={{ position: "absolute", top: 2, left: 6, ...css.status, fontSize: 9 }} data-testid="lab-solo-status">
        {bench.draft ?? "null"} | {bench.submitted ?? "null"} | {String((bench.submitted ?? bench.draft) === question.answer)} | ans {question.answer}
      </div>
      {teach && (
        <section className="tl-sheet tl-sheet-almost" style={css.soloSheet} data-testid="lab-sheet">
          <div className="tl-sheet-inner">
            <h2 className="tl-sheet-title">{TOUR.lesson.almost}</h2>
            <div className="tl-sheet-body">
              <div className="tl-teach"><KitTeach question={question} submitted={missOf(question, bench)} /></div>
            </div>
            <div className="tl-sheet-actions">
              <button type="button" className="tbtn tbtn-wide tbtn-almost">{TOUR.lesson.gotIt}</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function MeetBench({ solo }: { solo: boolean }) {
  const [runs, setRuns] = useState(0);
  const [started, setStarted] = useState(0);
  const body = (
    <>
      <div className="tl-top" style={css.topFake}><div style={css.bar14} /></div>
      {started > runs ? (
        <div className="tl-meet" data-testid="lab-meet-done">
          <p style={{ textAlign: "center" }}>onStart called</p>
          <button type="button" className="tbtn tbtn-ghost" onClick={() => setRuns(started)}>again</button>
        </div>
      ) : (
        <KitMeet key={runs} slides={LAB_SLIDES} onStart={() => setStarted(runs + 1)} />
      )}
    </>
  );
  if (solo) return <div className="screen tour tour-lesson">{body}</div>;
  return (
    <section style={css.card}>
      <strong style={{ color: "var(--t-gold)" }}>meet</strong>
      <div className="tour tour-lesson" style={css.meetBox}>{body}</div>
    </section>
  );
}

export default function KitLab() {
  const [search, setSearch] = useSearchParams();
  const [locked, setLocked] = useState(false);
  const seed = Number(search.get("seed") ?? 7);
  const only = search.get("kind");
  const pick = search.get("f");
  const solo = search.get("solo") === "1";
  const difficulty = Number(search.get("d") ?? 0.7);
  const easier = search.get("easier") === "1";
  const fixtures = useFixtures(seed, difficulty, easier);
  const shown = fixtures.filter((fixture) => (!only || fixture.kind === only) && (!pick || fixture.id === pick));

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(search);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setSearch(next, { replace: true });
  };

  if (solo) {
    if (only === "meet") return <MeetBench solo />;
    const fixture = shown.find((f) => f.question);
    if (!fixture?.question) return <div className="screen tour">No fixture for {only ?? pick}.</div>;
    return <SoloShell key={`${fixture.id}-${seed}`} question={fixture.question} locked={locked} teach={search.get("teach") === "1"} />;
  }

  return (
    <div className="screen tour" style={css.page}>
      <h1 style={{ margin: 0, fontSize: 22 }}>Kit lab</h1>
      <div style={css.bar}>
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={() => set("seed", String(seed - 1))}>−</button>
        <span data-testid="lab-seed">seed {seed}</span>
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={() => set("seed", String(seed + 1))}>+</button>
        <label>
          difficulty {difficulty.toFixed(1)}{" "}
          <input type="range" min="0" max="1" step="0.1" value={difficulty} onChange={(event) => set("d", event.target.value)} />
        </label>
        <label><input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} data-testid="lab-disabled" /> disabled</label>
      </div>
      <div style={css.bar}>
        {[null, ...KINDS].map((kind) => (
          <button
            key={kind ?? "every"}
            type="button"
            className={`tbtn ${only === kind ? "tbtn-go" : "tbtn-ghost"}`}
            style={css.chip}
            onClick={() => set("kind", kind)}
          >
            {kind ?? "every kind"}
          </button>
        ))}
      </div>
      {shown.map((fixture) => (fixture.question
        ? <LabCard key={`${fixture.id}-${seed}`} fixture={fixture} question={fixture.question} locked={locked} />
        : <p key={fixture.id} style={css.status}>{fixture.id}: planner gave nothing {fixture.error ?? ""}</p>))}
      {(!only || only === "meet") && !pick && <MeetBench solo={false} />}
    </div>
  );
}
