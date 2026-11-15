// DEV-only test bench for the language courses (route /tour/lab/lang): plans
// one lesson and renders every question with its widget, what the widget
// reports, whether that equals `question.answer`, and the teach card.
//   ?course=arabic|french   ?lesson=3 (1-based)   ?seed=7   ?d=0.5   ?meet=1 (the opening slides)
import { useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import "../../../ui/tour/tour-base.css";
import "../lesson.css";
import { langParams } from "../../../content/langCourse";
import { LANG_COURSES } from "../../../content/langCourses";
import type { Question } from "../../../engine/generators/types";
import { planLangLesson } from "../../../engine/lang/planner";
import { langPayload } from "../../../engine/lang/types";
import { selfSubmitting } from "../exercises/contract";
import { LangExercise, LangTeach } from "../lang/LangExercise";
import { LangMeet } from "../lang/LangMeet";

const css: Record<string, CSSProperties> = {
  page: { background: "#060e1f", maxWidth: 640, margin: "0 auto", width: "100%", gap: 18 },
  bar: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 14 },
  chip: { minHeight: 40, minWidth: 40, padding: "4px 12px", fontSize: 14 },
  card: { background: "var(--t-bg)", border: "2px solid var(--t-line-deep)", borderRadius: 24, padding: 16, display: "flex", flexDirection: "column", gap: 14 },
  prompt: { background: "var(--t-surface)", border: "2px solid var(--t-line)", borderRadius: 18, padding: "10px 16px", fontSize: 20, fontWeight: 900 },
  status: { fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 500, color: "var(--t-ink-dim)", wordBreak: "break-all", lineHeight: 1.5 },
  sheet: { background: "#3a2a10", borderTop: "3px solid var(--t-almost)", borderRadius: 22, padding: 16 },
  meet: { height: 640, position: "relative", display: "flex", flexDirection: "column", borderRadius: 24, border: "2px solid var(--t-line-deep)", padding: 12 },
};

function Bench({ question }: { question: Question }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [teach, setTeach] = useState(false);
  const payload = langPayload(question);
  const value = sent ?? draft;
  let verdict = "…";
  if (value !== null) verdict = value === question.answer ? "RIGHT" : "miss";
  return (
    <section style={css.card} data-kind={payload?.tour} data-task={payload?.task}>
      <div style={css.prompt}>{question.prompt}</div>
      <LangExercise question={question} disabled={sent !== null} onDraft={setDraft} onSubmit={setSent} />
      <div style={css.bar}>
        {!selfSubmitting(question) && <button className="tbtn tbtn-go" style={css.chip} disabled={draft === null} onClick={() => setSent(draft)}>check</button>}
        <button className="tbtn" style={css.chip} onClick={() => setTeach((on) => !on)}>teach card</button>
      </div>
      <div style={css.status}>
        {payload?.task} · {payload?.tour} · target {payload?.target}<br />
        answer: {question.answer}<br />
        reported: {value ?? "(nothing yet)"} → {verdict}
      </div>
      {teach && <div style={css.sheet}><LangTeach question={question} /></div>}
    </section>
  );
}

export default function LangLab() {
  const [query, setQuery] = useSearchParams();
  const course = LANG_COURSES.find((item) => item.id === query.get("course")) ?? LANG_COURSES[0];
  const stages = course.world.stages;
  const index = Math.min(stages.length, Math.max(1, Number(query.get("lesson") ?? 1))) - 1;
  const seed = Number(query.get("seed") ?? 1);
  const difficulty = Number(query.get("d") ?? 0.5);
  const stage = stages[index];
  const questions = useMemo(
    () => planLangLesson(langParams(stage), stage.questions, seed, { difficulty, easier: false }),
    [stage, seed, difficulty],
  );
  const go = (patch: Record<string, string>) => setQuery({ ...Object.fromEntries(query), ...patch });

  return (
    <div className="screen tour" style={css.page}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Lang Lab — {course.title}</h1>
      <div style={css.bar}>
        {LANG_COURSES.map((item) => (
          <button key={item.id} className={`tbtn ${item === course ? "tbtn-go" : ""}`} style={css.chip} onClick={() => go({ course: item.id, lesson: "1" })}>{item.id}</button>
        ))}
        <button className="tbtn" style={css.chip} onClick={() => go({ lesson: String(Math.max(1, index)) })}>prev</button>
        <span>{stage.id} · {stage.name} ({index + 1}/{stages.length})</span>
        <button className="tbtn" style={css.chip} onClick={() => go({ lesson: String(index + 2) })}>next</button>
        <button className="tbtn" style={css.chip} onClick={() => go({ seed: String(seed + 1) })}>seed {seed}</button>
        <button className="tbtn" style={css.chip} onClick={() => go({ meet: query.get("meet") ? "" : "1" })}>slides</button>
      </div>
      {query.get("meet") && (
        <div className="tour-lesson" style={css.meet}><LangMeet key={stage.id} params={langParams(stage)} onStart={() => go({ meet: "" })} /></div>
      )}
      {questions.map((question) => <Bench key={question.id} question={question} />)}
    </div>
  );
}
