import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGame } from "../../state/store";
import { completedInWorld, stageById, stageIndexInWorld, worldOfStage } from "../../content/worlds";
import { cliffhanger } from "../../engine/missions/missions";
import { MISS_LOCK_MS } from "../../engine/answers/answerEngine";
import type { Question } from "../../engine/generators/types";
import { GateRunScene } from "../../pixi/GateRunScene";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { duckMusic, unduckMusic } from "../../engine/feedback/music";
import { STR } from "../../strings/en";
import { persona } from "../../persona.config";
import { LockedScreen } from "../../ui/LockedScreen";
import { NumPad } from "../../ui/inputs/NumPad";
import { PianoKeys } from "../../ui/inputs/PianoKeys";
import { ToggleCircuit } from "../../ui/inputs/ToggleCircuit";
import { RobotMazeInput } from "../../ui/inputs/RobotMazeInput";
import { ClockSet } from "../../ui/inputs/ClockSet";
import { LetterPad } from "../../ui/inputs/LetterPad";
import { Launcher } from "../../ui/inputs/Launcher";
import { OrderCards } from "../../ui/inputs/OrderCards";
import { ChoiceButtons } from "../../ui/inputs/ChoiceButtons";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function pickPraise(): string {
  return STR.greatJob[Math.floor(Math.random() * STR.greatJob.length)];
}

function resultFanfare(result: { newBadge: unknown; perfect: boolean }): void {
  if (result.newBadge) sfx.badge();
  else if (result.perfect) sfx.perfect();
  else sfx.stageComplete();
}

function AnswerInput({ q, disabled, onSubmit }: { q: Question; disabled: boolean; onSubmit: (v: string) => void }) {
  const props = { question: q, disabled, onSubmit };
  switch (q.inputMode ?? "numpad") {
    case "piano":
      return <PianoKeys {...props} />;
    case "toggle":
      return <ToggleCircuit {...props} />;
    case "commands":
      return <RobotMazeInput {...props} />;
    case "clock":
      return <ClockSet {...props} />;
    case "letters":
      return <LetterPad {...props} />;
    case "launch":
      return <Launcher {...props} />;
    case "order":
      return <OrderCards {...props} />;
    case "choices":
      return <ChoiceButtons {...props} />;
    default:
      return <NumPad disabled={disabled} onSubmit={onSubmit} />;
  }
}

export function PlayStage() {
  const { stageId = "" } = useParams();
  const navigate = useNavigate();
  const stage = stageById(stageId);
  const world = worldOfStage(stageId);

  const session = useGame((s) => s.session);
  const startStage = useGame((s) => s.startStage);
  const answer = useGame((s) => s.answer);
  const advance = useGame((s) => s.advance);
  const clearSession = useGame((s) => s.clearSession);
  const progress = useGame((s) => s.progress);
  const starDust = useGame((s) => s.starDust);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GateRunScene | null>(null);
  const [busy, setBusy] = useState(false);
  const [praise, setPraise] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const liveSession = session && session.stageId === stageId && !session.result ? session : null;
  const result = session && session.stageId === stageId ? session.result : null;

  const worldEnabled = useGame((s) => Boolean(world && s.enabledWorlds[world.id]));

  useEffect(() => {
    if (!stage || !worldEnabled) return;
    const s = useGame.getState().session;
    if (!s || s.stageId !== stageId || s.result) startStage(stageId);
  }, [stage, stageId, startStage, worldEnabled]);

  // Ear-training must play in silence: pause background music in Melody stages.
  useEffect(() => {
    if (world?.id !== "melody") return;
    duckMusic();
    return () => unduckMusic();
  }, [world?.id]);

  const seed = liveSession?.seed;
  useEffect(() => {
    if (!stage || !worldEnabled || seed === undefined || !hostRef.current) return;
    let cancelled = false;
    const resumeIndex = useGame.getState().session?.index ?? 0;
    void GateRunScene.create(hostRef.current, stage.questions, reducedMotion()).then((scene) => {
      if (cancelled) {
        scene.destroy();
        return;
      }
      scene.setProgress(resumeIndex);
      sceneRef.current = scene;
    });
    return () => {
      cancelled = true;
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, [stage, seed]);

  useEffect(() => {
    if (!result) return;
    sceneRef.current?.celebrate();
    resultFanfare(result);
  }, [result]);

  if (!stage || !world) {
    return (
      <div className="screen">
        <p>Unknown stage.</p>
        <Link to="/hub" className="btn btn-primary">
          ← Base
        </Link>
      </div>
    );
  }
  if (!worldEnabled) return <LockedScreen />;

  const q = liveSession ? liveSession.questions[liveSession.index] : null;

  function submit(value: string) {
    if (busy || !liveSession) return;
    unlockAudio();
    const res = answer(value);
    if (res === "correct") {
      sfx.correct();
      setPraise(pickPraise());
      sceneRef.current?.openGate(liveSession.index);
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        setPraise(null);
        advance();
      }, 850);
    } else if (res === "again") {
      // proved one — a fresh question is already in place, one more to go
      sfx.correct();
      setPraise(STR.proveAgain);
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        setPraise(null);
      }, 750);
    } else if (res === "wrong") {
      sfx.wrong();
      sceneRef.current?.wrongShake();
      setBusy(true);
      setTimeout(() => setBusy(false), MISS_LOCK_MS);
    }
  }

  const idx = stageIndexInWorld(stageId);
  const nextStage = idx >= 0 ? world.stages[idx + 1] : undefined;
  const interactive = q && q.inputMode && q.inputMode !== "numpad";

  return (
    <div className="screen stage-play">
      <div className="pixi-host" ref={hostRef} />

      <header className="stage-header">
        <Link to={`/world/${world.id}`} className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Map
        </Link>
        <span className="stage-title">
          {world.icon} {stage.name}
        </span>
        <span className="stage-header-right">
          {stage.intro && (
            <button
              className="btn btn-icon help-btn"
              aria-label={STR.howToPlay}
              onClick={() => {
                sfx.tap();
                setHelpOpen((h) => !h);
              }}
            >
              ❓
            </button>
          )}
          <span className="dust-counter">✨ {starDust}</span>
        </span>
      </header>

      {helpOpen && stage.intro && (
        <div className="help-panel panel">
          <h3>✨ {STR.howToPlay}</h3>
          {stage.intro.map((line) => (
            <p key={line} className="intro-line">
              {line}
            </p>
          ))}
          <button className="btn btn-primary" onClick={() => setHelpOpen(false)}>
            Got it!
          </button>
        </div>
      )}

      {liveSession && q && (
        <QuestionCard session={liveSession} q={q} praise={praise} busy={busy} interactive={Boolean(interactive)} onSubmit={submit} />
      )}

      {result && (
        <Celebration
          result={result}
          tease={cliffhanger(world.id, completedInWorld(world, progress))}
          onBackToMap={() => {
            sfx.tap();
            clearSession();
            navigate(`/world/${world.id}`);
          }}
          onNext={
            nextStage
              ? () => {
                  sfx.tap();
                  startStage(nextStage.id);
                  navigate(`/play/${nextStage.id}`);
                }
              : () => {
                  sfx.tap();
                  startStage(stageId);
                }
          }
          nextLabel={nextStage ? `${STR.nextStage} →` : STR.playAgain}
        />
      )}
    </div>
  );
}

interface QuestionCardProps {
  session: { index: number; questions: unknown[]; companionLine: string | null; workedExample: string | null; lastAnswer: string | null; showHint: boolean };
  q: Question;
  praise: string | null;
  busy: boolean;
  interactive: boolean;
  onSubmit: (v: string) => void;
}

function QuestionCard({ session, q, praise, busy, interactive, onSubmit }: QuestionCardProps) {
  const missLocked = busy && session.lastAnswer === "wrong";
  return (
    <div className={`question-card panel ${interactive ? "q-wide" : ""}`}>
      <div className="q-progress">{STR.question(session.index + 1, session.questions.length)}</div>
      {session.companionLine && <div className="q-companion">🤖 {session.companionLine}</div>}
      {session.workedExample && (
        <div className="q-worked">
          {STR.lookExample} <b>{session.workedExample}</b>
        </div>
      )}
      {typeof q.payload?.bigSymbol === "string" && <div className="big-symbol">{q.payload.bigSymbol}</div>}
      {Array.isArray(q.payload?.gridRows) && (
        <div className="block-grid">
          {(q.payload.gridRows as string[]).map((row, i) => (
            <div key={i}>{row}</div>
          ))}
        </div>
      )}
      <div className={`q-prompt ${interactive ? "q-prompt-sm" : ""} ${praise ? "q-correct" : ""}`}>{q.prompt}</div>
      {praise && <div className="q-praise">{praise}</div>}
      {!praise && missLocked && <div className="q-retry">{STR.almostLook}</div>}
      {session.showHint && <div className="q-hint">💡 {q.hint}</div>}
      <AnswerInput key={q.id} q={q} disabled={busy} onSubmit={onSubmit} />
    </div>
  );
}

interface CelebrationProps {
  result: { stars: number; payout: number; firstTime: boolean; perfect: boolean; newBadge: { icon: string; name: string } | null };
  tease: string;
  onBackToMap: () => void;
  onNext: () => void;
  nextLabel: string;
}

function Celebration({ result, tease, onBackToMap, onNext, nextLabel }: CelebrationProps) {
  return (
    <div className="overlay celebration">
      <div className="panel celebration-card">
        <h2>{STR.stageComplete}</h2>
        <div className="stars-row">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`big-star ${s <= result.stars ? "lit" : ""}`} style={{ animationDelay: `${s * 250}ms` }}>
              ⭐
            </span>
          ))}
        </div>
        {result.perfect && <div className="perfect-banner">🌟 {STR.perfectRun}</div>}
        <div className="payout">
          +{result.payout} ✨ {!result.firstTime && <small>({STR.replayNote})</small>}
        </div>
        {result.newBadge && (
          <div className="badge-banner">
            <span className="badge-icon">{result.newBadge.icon}</span>
            <span>
              {STR.badgeEarned} <b>{result.newBadge.name}</b> — {persona.name},{" "}
              {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
          </div>
        )}
        <p className="mission-tease">“{tease}”</p>
        <div className="celebration-actions">
          <button className="btn btn-secondary" onClick={onBackToMap}>
            {STR.backToMap}
          </button>
          <button className="btn btn-primary" onClick={onNext}>
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
