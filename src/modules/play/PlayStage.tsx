import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGame, REVEAL_COST } from "../../state/store";
import { completedInWorld, stageById, stageIndexInWorld, worldOfStage } from "../../content/worlds";
import { cliffhanger } from "../../engine/missions/missions";
import { MISS_LOCK_MS } from "../../engine/answers/answerEngine";
import type { Question } from "../../engine/generators/types";
import { GateRunScene } from "../../pixi/GateRunScene";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { speak } from "../../engine/feedback/speech";
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
import { TraceCanvas } from "../../ui/inputs/TraceCanvas";
import { StagePet } from "../../ui/PetCompanion";
import { VideoToggle } from "../../ui/VideoToggle";
import { CircuitDiagram } from "../../ui/inputs/CircuitDiagram";
import type { Node as CircuitNode } from "../../engine/generators/logicCircuit";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const THINK_MS = 1200;

interface VerdictDeps {
  gateIndex: number;
  scene: GateRunScene | null;
  setBusy: (b: boolean) => void;
  setPraise: (p: string | null) => void;
  advance: () => void;
}

interface SubmitDeps extends VerdictDeps {
  busy: boolean;
  shownAt: number;
  answer: (v: string) => "correct" | "wrong" | "again" | null;
}

/** Full answer pipeline: guard, think-first gate, then verdict animation. */
function handleSubmit(value: string, d: SubmitDeps): void {
  if (d.busy) return;
  unlockAudio();
  // Ignore answers fired in the first ~1.2s so click-spam can't beat thinking.
  if (Date.now() - d.shownAt < THINK_MS) {
    d.setPraise(STR.thinkFirst);
    setTimeout(() => d.setPraise(null), 1100);
    return;
  }
  applyVerdict(d.answer(value), d);
}

/** Animate + sequence the response to an answer verdict. */
function applyVerdict(res: "correct" | "wrong" | "again" | null, d: VerdictDeps): void {
  if (res === "wrong") {
    sfx.wrong();
    d.scene?.wrongShake();
    d.setBusy(true);
    setTimeout(() => d.setBusy(false), MISS_LOCK_MS);
    return;
  }
  if (res !== "correct" && res !== "again") return;
  // correct (advance) or "again" (proved one, one more to go — fresh Q ready)
  sfx.correct();
  const advancing = res === "correct";
  if (advancing) d.scene?.openGate(d.gateIndex);
  d.setPraise(advancing ? pickPraise() : STR.proveAgain);
  d.setBusy(true);
  setTimeout(() => {
    d.setBusy(false);
    d.setPraise(null);
    if (advancing) d.advance();
  }, advancing ? 850 : 750);
}

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
    case "canvas":
      return <TraceCanvas {...props} />;
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
  const revealAnswer = useGame((s) => s.revealAnswer);
  const advance = useGame((s) => s.advance);
  const clearSession = useGame((s) => s.clearSession);
  const progress = useGame((s) => s.progress);
  const starDust = useGame((s) => s.starDust);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GateRunScene | null>(null);
  const shownAtRef = useRef(0);
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

  // Reset the think-first timer whenever a new question is shown.
  const shownQid = liveSession ? liveSession.questions[liveSession.index]?.id : undefined;
  useEffect(() => {
    shownAtRef.current = Date.now();
  }, [shownQid]);

  const seed = liveSession?.seed;
  useEffect(() => {
    if (!stage || !worldEnabled || seed === undefined || !hostRef.current) return;
    let cancelled = false;
    const liveQuestions = useGame.getState().session?.questions.length ?? stage.questions;
    const resumeIndex = useGame.getState().session?.index ?? 0;
    void GateRunScene.create(hostRef.current, liveQuestions, reducedMotion()).then((scene) => {
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
  }, [stage, seed, worldEnabled]);

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
    if (!liveSession) return;
    handleSubmit(value, {
      busy,
      shownAt: shownAtRef.current,
      answer,
      gateIndex: liveSession.index,
      scene: sceneRef.current,
      setBusy,
      setPraise,
      advance,
    });
  }

  function doReveal() {
    if (busy) return;
    unlockAudio();
    const res = revealAnswer();
    if (res === "poor") {
      setPraise(`Need ${REVEAL_COST} ✨`);
      setTimeout(() => setPraise(null), 1300);
      return;
    }
    if (res === "revealed") {
      sfx.tap();
      sceneRef.current?.openGate(liveSession?.index ?? 0);
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        advance();
      }, 2000);
    }
  }

  const idx = stageIndexInWorld(stageId);
  const nextStage = idx >= 0 ? world.stages[idx + 1] : undefined;
  const interactive = q && q.inputMode && q.inputMode !== "numpad";

  return (
    <div className="screen stage-play">
      <div className="pixi-host" ref={hostRef} />

      <StageHeader
        worldId={world.id}
        title={`${world.icon} ${stage.name}`}
        starDust={starDust}
        intro={stage.intro}
        helpOpen={helpOpen}
        setHelpOpen={setHelpOpen}
      />

      {liveSession && q && (
        <QuestionCard
          session={liveSession}
          q={q}
          praise={praise}
          busy={busy}
          interactive={Boolean(interactive)}
          onSubmit={submit}
          onReveal={doReveal}
          canAffordReveal={starDust >= REVEAL_COST}
        />
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

interface StageHeaderProps {
  worldId: string;
  title: string;
  starDust: number;
  intro?: string[];
  helpOpen: boolean;
  setHelpOpen: (fn: (h: boolean) => boolean) => void;
}

function StageHeader({ worldId, title, starDust, intro, helpOpen, setHelpOpen }: StageHeaderProps) {
  return (
    <>
      <header className="stage-header">
        <Link to={`/world/${worldId}`} className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Map
        </Link>
        <span className="stage-title">{title}</span>
        <span className="stage-header-right">
          <VideoToggle />
          {intro && (
            <button className="btn btn-icon help-btn" aria-label={STR.howToPlay} onClick={() => { sfx.tap(); setHelpOpen((h) => !h); }}>
              ❓
            </button>
          )}
          <span className="dust-counter">✨ {starDust}</span>
        </span>
      </header>
      {helpOpen && intro && (
        <div className="help-panel panel">
          <h3>✨ {STR.howToPlay}</h3>
          {intro.map((line) => (
            <p key={line} className="intro-line">
              {line}
            </p>
          ))}
          <button className="btn btn-primary" onClick={() => setHelpOpen(() => false)}>
            Got it!
          </button>
        </div>
      )}
    </>
  );
}

interface QuestionCardProps {
  session: { index: number; questions: unknown[]; correctCount: number; companionLine: string | null; workedExample: string | null; lastAnswer: string | null; showHint: boolean; revealed?: boolean };
  q: Question;
  praise: string | null;
  busy: boolean;
  interactive: boolean;
  onSubmit: (v: string) => void;
  onReveal: () => void;
  canAffordReveal: boolean;
}

function QuestionCard({ session, q, praise, busy, interactive, onSubmit, onReveal, canAffordReveal }: QuestionCardProps) {
  const missLocked = busy && session.lastAnswer === "wrong";
  return (
    <div className={`question-card panel ${interactive ? "q-wide" : ""}`}>
      <div className="q-progress">
        {STR.question(session.index + 1, session.questions.length)}
        <StagePet correctCount={session.correctCount} />
      </div>
      {session.companionLine && <div className="q-companion">🤖 {session.companionLine}</div>}
      {session.workedExample && (
        <div className="q-worked">
          {STR.lookExample} <b>{session.workedExample}</b>
        </div>
      )}
      {typeof q.payload?.bigSymbol === "string" && <div className="big-symbol">{q.payload.bigSymbol}</div>}
      {q.payload?.tree && q.inputMode !== "toggle" ? (
        <CircuitDiagram tree={q.payload.tree as CircuitNode} lamp="unknown" />
      ) : null}
      {Array.isArray(q.payload?.listRows) && (
        <div className="q-list">
          {(q.payload.listRows as string[]).map((row) => (
            <div key={row}>{row}</div>
          ))}
        </div>
      )}
      {Array.isArray(q.payload?.gridRows) && (
        <div className="block-grid">
          {(q.payload.gridRows as string[]).map((row, i) => (
            <div key={i}>{row}</div>
          ))}
        </div>
      )}
      <div className={`q-prompt ${interactive ? "q-prompt-sm" : ""} ${praise ? "q-correct" : ""}`}>
        {q.prompt}
        <button className="speak-btn" aria-label="read aloud" onClick={() => speak(q.prompt)}>🔊</button>
      </div>
      {praise && <div className="q-praise">{praise}</div>}
      {!praise && missLocked && <div className="q-retry">{STR.almostLook}</div>}
      {session.revealed && <div className="q-reveal">{STR.revealAnswer} <b>{q.answer}</b></div>}
      {session.showHint && <div className="q-hint">💡 {q.hint}</div>}
      <AnswerInput key={q.id} q={q} disabled={busy} onSubmit={onSubmit} />
      {!session.revealed && (
        <button className="reveal-btn" disabled={busy} onClick={onReveal}>
          🔑 {STR.revealBtn(REVEAL_COST)}{!canAffordReveal && <span className="reveal-poor"> — need {REVEAL_COST} ✨</span>}
        </button>
      )}
    </div>
  );
}

interface CelebrationProps {
  result: {
    stars: number;
    payout: number;
    firstTime: boolean;
    perfect: boolean;
    newBadge: { icon: string; name: string } | null;
    surprise: { icon: string; name: string; rarity: string } | null;
  };
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
        {result.surprise && (
          <div className={`badge-banner rarity-${result.surprise.rarity}`}>
            <span className="badge-icon">{result.surprise.icon}</span>
            <span>
              Surprise treasure! <b>{result.surprise.name}</b> added to your Vault 🗝️
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
