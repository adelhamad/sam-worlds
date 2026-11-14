// DEV-only test bench for Chess Camp's board, pieces and widgets (route
// /tour/lab/chess). Feeds the widgets real planner questions plus hand-written
// extras, shows what each widget reports and whether the engine would accept it.
//   ?view=pieces|board|widgets|meet   one section only
//   ?kind=chess-mission  ?task=promote    filter the questions
//   ?solo=1&task=escape[&i=0][&teach=1]   one widget in a phone-shell mock
//   ?solo=1&meet=R                        one opening demo in the lesson shell
//   ?src=lab|plan                         only the hand-written / only the planner's questions
//   ?seed=7                               planner seed
import { useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import "../../../ui/tour/tour-base.css";
import "../lesson.css";
import { CHESS_INTROS } from "../../../content/chess/intros";
import { planChessLesson } from "../../../engine/chess/planner";
import { chessPayload, type ChessIntroKey, type ChessParams, type PieceType, type Side } from "../../../engine/chess/types";
import type { Question } from "../../../engine/generators/types";
import { TOUR } from "../../../strings/tour";
import type { MarkTone, SquareTint } from "../../../ui/chess/boardTypes";
import { ChessBoard } from "../../../ui/chess/ChessBoard";
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import { PogoSay } from "../../../ui/tour/Pogo";
import { ChessExercise, ChessTeach } from "../chess/ChessExercise";
import { ChessMeet } from "../chess/ChessMeet";
import { selfSubmitting } from "../exercises/contract";
import { LAB_EXTRAS } from "./chessLabFixtures";

const TYPES: PieceType[] = ["K", "Q", "R", "B", "N", "P"];
const SIDES: Side[] = ["w", "b"];
const INTROS = Object.keys(CHESS_INTROS) as ChessIntroKey[];
const PARAMS: ChessParams = {
  pieces: ["R", "B", "N"], review: ["Q", "K", "P"], size: 5,
  tasks: ["spot-moves", "spot-captures", "stars", "capture", "promote", "check", "escape", "mate", "count", "place"],
};

const css: Record<string, CSSProperties> = {
  bar: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 14 },
  chip: { minHeight: 40, minWidth: 40, padding: "4px 12px", fontSize: 14 },
  card: { background: "var(--t-bg)", border: "2px solid var(--t-line-deep)", borderRadius: 24, padding: 16, display: "flex", flexDirection: "column", gap: 14 },
  status: { fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 500, color: "var(--t-ink-dim)", wordBreak: "break-all", lineHeight: 1.5 },
  sheet: { background: "#3a2a10", border: "2px solid var(--t-almost)", borderRadius: 22, padding: 16, color: "#fff3df", display: "flex", flexDirection: "column", gap: 12 },
  sheetTitle: { color: "var(--t-almost)", fontSize: 22, fontWeight: 900 },
  solo: { height: "100dvh", minHeight: 0, overflow: "hidden", background: "var(--t-bg)", gap: 0, padding: 0, position: "relative" },
  soloHead: { height: 150, flex: "none", padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8, boxSizing: "border-box" },
  soloBody: { flex: 1, minHeight: 0, padding: "0 16px", display: "flex", flexDirection: "column", justifyContent: "center" },
  soloFoot: { height: 90, flex: "none", padding: "12px 16px", boxSizing: "border-box" },
  soloSheet: { position: "absolute", left: 0, right: 0, bottom: 0, borderRadius: "22px 22px 0 0", zIndex: 30 },
  tray: { display: "flex", padding: 6, borderRadius: 10 },
};

// ---------- pieces + board showcase ----------

function Pieces() {
  return (
    <section style={css.card} data-testid="lab-pieces">
      {[96, 56, 28].map((size) => (
        <div key={size} style={css.bar}>
          {["#eef1ff", "#8e9bef", "#0a1730"].map((bg) => SIDES.map((side) => (
            <div key={bg + side} style={{ ...css.tray, background: bg }}>
              {TYPES.map((type) => <ChessPiece key={type} type={type} side={side} size={size} />)}
            </div>
          )))}
        </div>
      ))}
    </section>
  );
}

const SHOW_MARKS: Record<number, MarkTone> = { 1: "plain", 2: "good", 3: "missed", 4: "extra", 5: "no", 13: "plain", 19: "good", 25: "missed", 31: "extra" };
const SHOW_TINTS: Record<number, SquareTint> = { 6: "danger", 7: "fire", 8: "goal", 9: "hit", 10: "trail" };

/** Every overlay the board can draw, on one 6×6 board. */
function BoardShow() {
  const [tapped, setTapped] = useState<number | null>(null);
  return (
    <section style={css.card} data-testid="lab-board">
      <ChessBoard
        position={{ size: 6, pieces: [
          { type: "R", side: "w", sq: 30 }, { type: "N", side: "w", sq: 33 }, { type: "Q", side: "b", sq: 13 }, { type: "B", side: "b", sq: 19 },
          { type: "K", side: "b", sq: 6 }, { type: "P", side: "b", sq: 25 }, { type: "K", side: "w", sq: 35 }, { type: "N", side: "b", sq: 31 },
          { type: "P", side: "b", sq: 16 }, { type: "P", side: "w", sq: 28 },
        ] }}
        selected={30} focus={35} dots={[24, 18, 12, 32, 16]} marks={SHOW_MARKS} tints={SHOW_TINTS}
        stars={[14, 15]} targets={[16]} wobble={tapped === null ? null : { sq: 30, n: tapped }}
        arrows={[{ from: 33, to: 22, label: "1", bent: true }, { from: 22, to: 20, label: "2" }, { from: 28, to: 23 }]}
        bursts={[{ id: 1, sq: 26, kind: "puff", piece: { type: "P", side: "b" } }, { id: 2, sq: 27, kind: "sparkle" }, { id: 3, sq: 29, kind: "crown" }]}
        onSquare={setTapped}
      />
      <div style={css.status}>tapped: {tapped ?? "—"}</div>
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
      <div>submitted: {bench.submitted ?? "null"} ({verdict(question, bench.submitted)})</div>
      <div>answer: {question.answer}</div>
    </div>
  );
}

function TeachSheet({ question, submitted, style }: { question: Question; submitted?: string; style?: CSSProperties }) {
  return (
    <div style={{ ...css.sheet, ...style }} data-testid="lab-sheet">
      <div style={css.sheetTitle}>{TOUR.lesson.almost}</div>
      <div className="tl-teach"><ChessTeach question={question} submitted={submitted} /></div>
      {style && <button type="button" className="tbtn tbtn-almost tbtn-wide" style={{ minHeight: 60 }}>{TOUR.lesson.gotIt}</button>}
    </div>
  );
}

/** A plausible miss for the teach card before anything was submitted. */
function sampleMiss(question: Question): string | undefined {
  const payload = chessPayload(question);
  if (payload?.tour !== "chess-spot") return undefined;
  const right = question.answer.split(",").filter(Boolean).map(Number);
  const stray = [0, 1, 2, 3, 4, 5, 6].find((sq) => !right.includes(sq) && sq !== payload.focus);
  return [...right.slice(1), ...(stray === undefined ? [] : [stray])].join(",");
}

function missOf(question: Question, bench: Bench): string | undefined {
  return bench.submitted !== null && bench.submitted !== question.answer ? bench.submitted : sampleMiss(question);
}

function LabCard({ question, locked }: { question: Question; locked: boolean }) {
  const { bench, live, onDraft, onSubmit, check, fresh } = useBench(question);
  const payload = chessPayload(question);
  return (
    <section style={css.card} data-testid={`lab-card-${payload?.task}`}>
      <div style={css.bar}>
        <strong style={{ color: "var(--t-gold)" }}>{payload?.tour} · {payload?.task} · {payload?.piece}</strong>
        <span style={{ ...css.status, flex: 1 }}>{question.dedupeKey}</span>
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={fresh}>reset</button>
      </div>
      <PogoSay text={question.prompt} size={72} />
      <ChessExercise question={live} disabled={locked} onDraft={onDraft} onSubmit={onSubmit} />
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

/** The widget inside a mock of the lesson shell on a phone: 150px header, 90px footer. */
function SoloShell({ question, teach }: { question: Question; teach: boolean }) {
  const { bench, live, onDraft, onSubmit, check } = useBench(question);
  return (
    <div className="screen tour" style={css.solo}>
      <div style={css.soloHead}>
        <div style={{ height: 14, borderRadius: 7, background: "var(--t-surface-2)" }} />
        <PogoSay text={question.prompt} size={84} />
      </div>
      <div style={css.soloBody} data-testid="lab-solo-body">
        <ChessExercise question={live} disabled={teach || bench.submitted !== null} onDraft={onDraft} onSubmit={onSubmit} />
      </div>
      <div style={css.soloFoot}>
        {!selfSubmitting(question) && (
          <button type="button" className="tbtn tbtn-go tbtn-wide" disabled={bench.draft === null || bench.submitted !== null} onClick={check} data-testid="lab-check">
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
function SoloMeet({ intro }: { intro: ChessIntroKey }) {
  const [started, setStarted] = useState(0);
  return (
    <div className="screen tour tour-lesson">
      <div className="tl-top">
        <span className="tl-quit" aria-hidden="true">✕</span>
        <div className="tl-bar"><div className="tl-bar-fill" style={{ width: "4%" }} /></div>
      </div>
      <ChessMeet intro={intro} onStart={() => setStarted(started + 1)} />
      <div style={{ position: "absolute", top: 2, left: 6, ...css.status, fontSize: 9 }} data-testid="lab-meet-started">{started}</div>
    </div>
  );
}

export default function ChessLab() {
  const [search, setSearch] = useSearchParams();
  const [locked, setLocked] = useState(false);
  const seed = Number(search.get("seed") ?? 7);
  const view = search.get("view");
  const kind = search.get("kind");
  const task = search.get("task");
  const meet = search.get("meet") as ChessIntroKey | null;

  const src = search.get("src");
  const questions = useMemo(() => [
    ...(src === "lab" ? [] : planChessLesson(PARAMS, 12, seed, { difficulty: 0.4, easier: false })),
    ...(src === "plan" ? [] : LAB_EXTRAS),
  ], [seed, src]);
  const shown = questions.filter((question) => {
    const payload = chessPayload(question);
    return payload !== null && (!kind || payload.tour === kind) && (!task || payload.task === task);
  });

  if (search.get("solo") === "1") {
    if (meet && CHESS_INTROS[meet]) return <SoloMeet key={meet} intro={meet} />;
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
      <h1 style={{ margin: 0, fontSize: 22 }}>Chess lab</h1>
      <div style={css.bar}>
        {[null, "pieces", "board", "widgets", "meet"].map((name) => (
          <button key={name ?? "all"} type="button" className={`tbtn ${view === name ? "tbtn-go" : "tbtn-ghost"}`} style={css.chip} onClick={() => set("view", name)}>
            {name ?? "everything"}
          </button>
        ))}
        <button type="button" className="tbtn tbtn-ghost" style={css.chip} onClick={() => set("seed", String(seed + 1))}>seed {seed} +</button>
        <label><input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} data-testid="lab-disabled" /> disabled</label>
      </div>
      {on("pieces") && <Pieces />}
      {on("board") && <BoardShow />}
      {on("widgets") && shown.map((question) => <LabCard key={question.id} question={question} locked={locked} />)}
      {on("meet") && INTROS.filter((key) => !meet || key === meet).map((key) => (
        <section key={key} style={{ ...css.card, minHeight: 560 }} data-testid={`lab-meet-${key}`}>
          <ChessMeet intro={key} onStart={() => undefined} />
        </section>
      ))}
    </div>
  );
}
