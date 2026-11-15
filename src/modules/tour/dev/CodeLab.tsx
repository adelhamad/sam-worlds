// DEV-only test bench for Code Lab's grid, blocks and widgets (route
// /tour/lab/code). Feeds the widgets real planner questions plus hand-written
// extras, shows what each widget reports and whether the engine would accept it.
//   ?view=grid|blocks|widgets|meet          one section only
//   ?kind=code-run  ?task=loop              filter the questions
//   ?solo=1&task=debug[&i=0][&teach=1]      one widget in a phone-shell mock
//   ?solo=1&meet=loop                       one opening demo in the lesson shell
//   ?src=lab|plan                           only the hand-written / only the planner's questions
//   ?seed=7                                 planner seed
import { useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import "../../../ui/tour/tour-base.css";
import "../lesson.css";
import { CODE_INTROS } from "../../../content/code/intros";
import { stepFrom } from "../../../engine/code/judge";
import { planCodeLesson } from "../../../engine/code/planner";
import { codePayload, type CodeIntroKey, type CodeParams, type Dir } from "../../../engine/code/types";
import type { Question } from "../../../engine/generators/types";
import { TOUR } from "../../../strings/tour";
import { PogoSay } from "../../../ui/tour/Pogo";
import { BlockPalette, DirPicker } from "../code/BlockPalette";
import { CodeExercise, CodeTeach } from "../code/CodeExercise";
import { CodeGridView } from "../code/CodeGridView";
import { CodeMeet } from "../code/CodeMeet";
import { ProgramTrack } from "../code/ProgramTrack";
import type { PogoPose } from "../code/useRun";
import { selfSubmitting } from "../exercises/contract";
import { LAB_EXTRAS } from "./codeLabFixtures";

const INTROS = Object.keys(CODE_INTROS) as CodeIntroKey[];
const PARAMS: CodeParams = { tasks: ["run", "stars", "trace", "debug", "loop", "loop-trace"], size: 5 };
const REST: PogoPose = { at: 0, dir: null, hop: 0, bonk: false, mood: "idle" };

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
  soloSheet: { position: "absolute", left: 0, right: 0, bottom: 0, borderRadius: "22px 22px 0 0", zIndex: 30 },
  row: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, alignItems: "start" },
};

// ---------- grid + blocks showcase ----------

const ROCKY = { size: 6, start: 30, goal: 5, walls: [24, 25, 18, 13, 8, 2, 16, 22, 34, 11], stars: [3, 26] };

/** Every overlay the grid can draw, plus a hop-around toy (tap arrows). */
function GridShow() {
  const [pose, setPose] = useState<PogoPose>({ ...REST, at: ROCKY.start });
  const move = (dir: Dir) => {
    const next = stepFrom(ROCKY, pose.at, dir);
    setPose({ at: next ?? pose.at, dir, hop: pose.hop + 1, bonk: next === null, mood: next === ROCKY.goal ? "happy" : "idle" });
  };
  const small = { size: 4, start: 12, goal: 3, walls: [5, 10], stars: [8] };
  return (
    <section style={css.card} data-testid="lab-grid">
      <CodeGridView grid={ROCKY} pogo={pose} won={pose.at === ROCKY.goal} stars={ROCKY.stars.filter((sq) => sq !== pose.at)} />
      <BlockPalette loops={[]} onArrow={move} onLoop={() => undefined} />
      <div style={css.status}>at: {pose.at} · hop {pose.hop} · bonk {String(pose.bonk)}</div>
      <div style={css.row}>
        <CodeGridView grid={small} pogo={{ ...REST, at: 12 }} path={[12, 8, 4]} bumpAt={{ sq: 4, dir: "E" }} ghost={{ ...REST, at: 4 }} />
        <CodeGridView grid={{ ...small, goal: -1 }} pogo={{ ...REST, at: 12 }} trail={[12, 13, 14, 15, 11, 7]} pin={7} ring={6} />
        <CodeGridView grid={{ ...small, goal: -1 }} pogo={{ ...REST, at: 12 }} pin={9} ghost={{ ...REST, at: 9 }} onSquare={() => undefined} />
        <CodeGridView grid={small} pogo={{ ...REST, at: 3, mood: "happy", hop: 1 }} won stars={[]} />
      </div>
    </section>
  );
}

function BlocksShow() {
  const [picked, setPicked] = useState<Dir | null>("E");
  return (
    <section style={css.card} data-testid="lab-blocks">
      <ProgramTrack program={["N", "E", { times: 3, body: ["E", "N"] }, "S", "W"]} mode="build" max={7} open={2} onArrow={() => undefined} onLoop={() => undefined} onRemoveLoop={() => undefined} onCloseLoop={() => undefined} />
      <ProgramTrack program={["N", { times: 2, body: ["E", "S", "W"] }, "S"]} mode="edit" active={{ i: 1, j: 1, iter: 1 }} marks={{ 0: "edit", "1-2": "edit" }} picked="1-1" onArrow={() => undefined} />
      <ProgramTrack program={["E", { times: 3, body: ["N", "E"] }]} mode="read" active={{ i: 1, j: 0, iter: 2 }} />
      <ProgramTrack program={["E", { times: 3, body: ["N", "E"] }, "S"]} mode="mini" marks={{ "1-1": "fixed" }} />
      <ProgramTrack program={[]} mode="build" max={6} />
      <BlockPalette loops={[2, 3, 4]} onArrow={() => undefined} onLoop={() => undefined} />
      <DirPicker value={picked} onPick={setPicked} />
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
  if (value === null) return "—";
  return value === question.answer ? "✓ equals answer" : "≠ answer";
}

function Status({ question, bench }: { question: Question; bench: Bench }) {
  return (
    <div style={css.status} data-testid="lab-status">
      <div>draft: {bench.draft ?? "null"} ({verdict(question, bench.draft)})</div>
      <div data-testid="lab-submitted">submitted: {bench.submitted ?? "null"} ({verdict(question, bench.submitted)})</div>
      <div>answer: {question.answer}</div>
    </div>
  );
}

function TeachSheet({ question, submitted, style }: { question: Question; submitted?: string; style?: CSSProperties }) {
  return (
    <div style={{ ...css.sheet, ...style }} data-testid="lab-sheet">
      <div style={css.sheetTitle}>{TOUR.lesson.almost}</div>
      <div className="tl-teach"><CodeTeach question={question} submitted={submitted} /></div>
      {style && <button type="button" className="tbtn tbtn-almost tbtn-wide" style={{ minHeight: 60 }}>{TOUR.lesson.gotIt}</button>}
    </div>
  );
}

/** A plausible miss for a trace teach card before anything was submitted. */
function missOf(question: Question, bench: Bench): string | undefined {
  if (bench.submitted !== null && bench.submitted !== question.answer) return bench.submitted;
  const payload = codePayload(question);
  return payload?.tour === "code-trace" ? String(payload.grid.start) : undefined;
}

function LabCard({ question, locked }: { question: Question; locked: boolean }) {
  const { bench, live, onDraft, onSubmit, check, fresh } = useBench(question);
  const payload = codePayload(question);
  return (
    <section style={css.card} data-testid={`lab-card-${question.id}`}>
      <div style={css.bar}>
        <strong style={{ color: "var(--t-gold)" }}>{payload?.tour} · {payload?.task} · {payload?.grid.size}×{payload?.grid.size}</strong>
        <span style={{ ...css.status, flex: 1 }}>{question.dedupeKey}</span>
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={fresh} data-testid="lab-reset">reset</button>
      </div>
      <PogoSay text={question.prompt} size={72} />
      <CodeExercise question={live} disabled={locked || bench.submitted !== null} onDraft={onDraft} onSubmit={onSubmit} />
      {!selfSubmitting(question) && (
        <button type="button" className="tbtn tbtn-go tbtn-wide" disabled={bench.draft === null || locked} onClick={check} data-testid="lab-check">
          {TOUR.lesson.check}
        </button>
      )}
      <Status question={question} bench={bench} />
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
        <CodeExercise question={live} disabled={teach || bench.submitted !== null} onDraft={onDraft} onSubmit={onSubmit} />
      </div>
      <div style={css.soloFoot}>
        {!selfSubmitting(question) && (
          <button type="button" className="tbtn tbtn-go tbtn-wide" style={{ minHeight: 60 }} disabled={bench.draft === null || bench.submitted !== null} onClick={check} data-testid="lab-check">
            {TOUR.lesson.check}
          </button>
        )}
      </div>
      <div style={{ position: "absolute", top: 2, left: 6, ...css.status, fontSize: 9 }} data-testid="lab-solo-status">
        {bench.draft ?? "null"} | {bench.submitted ?? "null"} | {String((bench.submitted ?? bench.draft) === question.answer)}
      </div>
      {teach && <TeachSheet question={question} submitted={missOf(question, bench)} style={css.soloSheet} />}
    </div>
  );
}

/** One opening demo inside a mock of the lesson screen (top bar + the demo). */
function SoloMeet({ intro }: { intro: CodeIntroKey }) {
  const [started, setStarted] = useState(0);
  return (
    <div className="screen tour tour-lesson">
      <div className="tl-top">
        <span className="tl-quit" aria-hidden="true">✕</span>
        <div className="tl-bar"><div className="tl-bar-fill" style={{ width: "4%" }} /></div>
      </div>
      <CodeMeet intro={intro} onStart={() => setStarted(started + 1)} />
      <div style={{ position: "absolute", top: 2, left: 6, ...css.status, fontSize: 9 }} data-testid="lab-meet-started">{started}</div>
    </div>
  );
}

export default function CodeLab() {
  const [search, setSearch] = useSearchParams();
  const [locked, setLocked] = useState(false);
  const seed = Number(search.get("seed") ?? 7);
  const view = search.get("view");
  const kind = search.get("kind");
  const task = search.get("task");
  const meet = search.get("meet") as CodeIntroKey | null;

  const src = search.get("src");
  const questions = useMemo(() => [
    ...(src === "lab" ? [] : planCodeLesson(PARAMS, 8, seed, { difficulty: 0.4, easier: false })),
    ...(src === "plan" ? [] : LAB_EXTRAS),
  ], [seed, src]);
  const shown = questions.filter((question) => {
    const payload = codePayload(question);
    return payload !== null && (!kind || payload.tour === kind) && (!task || payload.task === task);
  });

  if (search.get("solo") === "1") {
    if (meet && CODE_INTROS[meet]) return <SoloMeet key={meet} intro={meet} />;
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
    <div className="screen tour" style={{ background: "#060e1f", maxWidth: 620, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>Code lab</h1>
      <div style={css.bar}>
        {[null, "grid", "blocks", "widgets", "meet"].map((name) => (
          <button key={name ?? "all"} type="button" className={`tbtn ${view === name ? "tbtn-go" : "tbtn-ghost"}`} style={css.chip} onClick={() => set("view", name)}>
            {name ?? "everything"}
          </button>
        ))}
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={() => set("seed", String(seed + 1))}>seed {seed} +</button>
        <label><input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} data-testid="lab-disabled" /> disabled</label>
      </div>
      {on("grid") && <GridShow />}
      {on("blocks") && <BlocksShow />}
      {on("widgets") && shown.map((question) => <LabCard key={question.id} question={question} locked={locked} />)}
      {on("meet") && INTROS.filter((key) => !meet || key === meet).map((key) => (
        <section key={key} className="tour-lesson" style={{ ...css.card, minHeight: 640, height: "auto", position: "relative" }} data-testid={`lab-meet-${key}`}>
          <CodeMeet intro={key} onStart={() => undefined} />
        </section>
      ))}
    </div>
  );
}
