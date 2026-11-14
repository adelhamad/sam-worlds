// DEV-only test bench for the exercise widgets (route /tour/lab/exercises).
// Renders real planner questions, shows what each widget reports and whether
// the engine would accept it, plus every kind's teach card.
//   ?kind=map         only that kind        ?all=1   every planned question
//   ?seed=7&d=0.3     planner seed / difficulty       ?easier=1
//   ?solo=1&kind=map  phone-shell mock (header + widget + CHECK, no scroll)
//   ?teach=1          (with solo) show the teach card in a bottom sheet
import { useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import "../../../ui/tour/tour-base.css";
import type { Question } from "../../../engine/generators/types";
import { planTourLesson } from "../../../engine/tour/planner";
import { tourPayload, type TourKind, type TourParams } from "../../../engine/tour/types";
import { TOUR } from "../../../strings/tour";
import { selfSubmitting } from "../exercises/contract";
import { TourExercise, TourTeach } from "../exercises/TourExercise";

const KINDS: TourKind[] = ["pick", "pairs", "build", "map", "sort", "paint"];
const PARAMS: TourParams = {
  focus: ["JPN", "FRA", "BRA", "EGY", "ITA", "DEU"],
  review: ["IND", "CHN", "GBR", "USA", "AUS", "MEX", "NGA", "KOR", "ESP", "ARG", "THA", "COL"],
  kinds: KINDS,
};

const css: Record<string, CSSProperties> = {
  bar: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 14 },
  chip: { minHeight: 40, minWidth: 40, padding: "4px 12px", fontSize: 14 },
  card: { background: "var(--t-bg)", border: "2px solid var(--t-line-deep)", borderRadius: 24, padding: 16, display: "flex", flexDirection: "column", gap: 14 },
  prompt: { background: "var(--t-surface)", border: "2px solid var(--t-line)", borderRadius: 18, padding: "10px 16px", fontSize: 20, fontWeight: 900 },
  status: { fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 500, color: "var(--t-ink-dim)", wordBreak: "break-all", lineHeight: 1.5 },
  sheet: { background: "#3d2a0c", border: "2px solid var(--t-almost)", borderRadius: 22, padding: 16, color: "#fff3df", display: "flex", flexDirection: "column", gap: 12 },
  sheetTitle: { color: "var(--t-almost)", fontSize: 20, fontWeight: 900 },
  solo: { height: "100vh", minHeight: 0, overflow: "hidden", background: "var(--t-bg)", gap: 0, padding: 0, position: "relative" },
  soloHead: { height: 150, flex: "none", padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10 },
  soloBody: { flex: 1, minHeight: 0, padding: "0 16px", display: "flex", flexDirection: "column", justifyContent: "center" },
  soloFoot: { height: 90, flex: "none", padding: "12px 16px" },
  soloSheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "45vh", borderRadius: "22px 22px 0 0", overflow: "auto" },
};

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

function Status({ question, bench }: { question: Question; bench: Bench }) {
  const verdict = (value: string | null) => {
    if (value === null) return "—";
    return value === question.answer ? "✓ equals answer" : "≠ answer";
  };
  return (
    <div style={css.status} data-testid={`lab-status-${tourPayload(question)?.tour}`}>
      <div>draft: {bench.draft ?? "null"} ({verdict(bench.draft)})</div>
      <div>submitted: {bench.submitted ?? "null"} ({verdict(bench.submitted)})</div>
      <div>answer: {question.answer}</div>
    </div>
  );
}

function TeachSheet({ question, submitted, style }: { question: Question; submitted?: string; style?: CSSProperties }) {
  return (
    <div style={{ ...css.sheet, ...style }} data-testid="lab-sheet">
      <div style={css.sheetTitle}>{TOUR.lesson.almost}</div>
      <TourTeach question={question} submitted={submitted} />
    </div>
  );
}

/** A plausible miss to feed the teach card before anything was submitted. */
function sampleMiss(question: Question): string | undefined {
  const payload = tourPayload(question);
  if (payload?.tour === "pairs") {
    const other = payload.right.find((code) => code !== payload.left[0]);
    return `miss:${payload.left[0]}>${other}`;
  }
  if (payload?.tour === "map") return payload.targets.find((code) => code !== payload.code);
  return undefined;
}

function LabCard({ question, locked }: { question: Question; locked: boolean }) {
  const { bench, live, disabled, onDraft, onSubmit, check, fresh } = useBench(question, locked);
  const kind = tourPayload(question)?.tour;
  const missed = bench.submitted !== null && bench.submitted !== question.answer ? bench.submitted : sampleMiss(question);
  return (
    <section style={css.card} data-testid={`lab-card-${kind}`}>
      <div style={css.bar}>
        <strong style={{ color: "var(--t-gold)" }}>{kind}</strong>
        <span style={{ ...css.status, flex: 1 }}>{question.dedupeKey}</span>
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={fresh}>reset</button>
      </div>
      <div style={css.prompt}>{question.prompt}</div>
      <TourExercise question={live} disabled={disabled} onDraft={onDraft} onSubmit={onSubmit} />
      {!selfSubmitting(question) && (
        <button type="button" className="tbtn tbtn-go tbtn-wide" disabled={bench.draft === null || disabled} onClick={check} data-testid={`lab-check-${kind}`}>
          {TOUR.lesson.check}
        </button>
      )}
      <Status question={question} bench={bench} />
      <TeachSheet question={question} submitted={missed} />
    </section>
  );
}

/** The widget inside a mock of the lesson shell on a phone: 150px header, 90px footer. */
function SoloShell({ question, locked, teach }: { question: Question; locked: boolean; teach: boolean }) {
  const { bench, live, disabled, onDraft, onSubmit, check } = useBench(question, locked);
  const missed = bench.submitted !== null && bench.submitted !== question.answer ? bench.submitted : sampleMiss(question);
  return (
    <div className="screen tour" style={css.solo}>
      <div style={css.soloHead}>
        <div style={{ height: 14, borderRadius: 7, background: "var(--t-surface-2)" }} />
        <div style={css.prompt}>{question.prompt}</div>
      </div>
      <div style={css.soloBody} data-testid="lab-solo-body">
        <TourExercise question={live} disabled={disabled || teach} onDraft={onDraft} onSubmit={onSubmit} />
      </div>
      <div style={css.soloFoot}>
        <button type="button" className="tbtn tbtn-go tbtn-wide" disabled={bench.draft === null || disabled} onClick={check} data-testid="lab-check">
          {TOUR.lesson.check}
        </button>
      </div>
      <div style={{ position: "absolute", top: 2, left: 6, ...css.status, fontSize: 9 }} data-testid="lab-solo-status">
        {bench.draft ?? "null"} | {bench.submitted ?? "null"} | {String((bench.submitted ?? bench.draft) === question.answer)}
      </div>
      {teach && <TeachSheet question={question} submitted={missed} style={css.soloSheet} />}
    </div>
  );
}

export default function ExerciseLab() {
  const [search, setSearch] = useSearchParams();
  const [locked, setLocked] = useState(false);
  const seed = Number(search.get("seed") ?? 7);
  const difficulty = Number(search.get("d") ?? 0.3);
  const easier = search.get("easier") === "1";
  const only = search.get("kind");
  const all = search.get("all") === "1";

  const questions = useMemo(
    () => planTourLesson(PARAMS, 12, seed, { difficulty, easier }),
    [seed, difficulty, easier],
  );
  const shown = questions.filter((question, index) => {
    const kind = tourPayload(question)?.tour;
    if (only && kind !== only) return false;
    return all || questions.findIndex((other) => tourPayload(other)?.tour === kind) === index;
  });

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(search);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setSearch(next, { replace: true });
  };

  if (search.get("solo") === "1") {
    const question = shown[Number(search.get("i") ?? 0)] ?? shown[0];
    if (!question) return <div className="screen tour">No {only} question for seed {seed}.</div>;
    return <SoloShell key={question.id} question={question} locked={locked} teach={search.get("teach") === "1"} />;
  }

  return (
    <div className="screen tour" style={{ background: "#060e1f", maxWidth: 620, margin: "0 auto", width: "100%" }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>Exercise lab</h1>
      <div style={css.bar}>
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={() => set("seed", String(seed - 1))}>−</button>
        <span data-testid="lab-seed">seed {seed}</span>
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={() => set("seed", String(seed + 1))} data-testid="lab-seed-next">+</button>
        <label>
          difficulty {difficulty.toFixed(1)}{" "}
          <input type="range" min="0" max="1" step="0.1" value={difficulty} onChange={(event) => set("d", event.target.value)} />
        </label>
        <label><input type="checkbox" checked={easier} onChange={(event) => set("easier", event.target.checked ? "1" : null)} /> easier</label>
        <label><input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} data-testid="lab-disabled" /> disabled</label>
        <label><input type="checkbox" checked={all} onChange={(event) => set("all", event.target.checked ? "1" : null)} /> all 12</label>
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
      {shown.length === 0 && <p>No {only} question in this lesson — try another seed.</p>}
      {shown.map((question) => <LabCard key={question.id} question={question} locked={locked} />)}
    </div>
  );
}
