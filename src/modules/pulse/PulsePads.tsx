import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { playPitch, sfx, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed, randInt, type RNG } from "../../engine/rng";
import { PulseScene } from "../../three/PulseScene";

const MAX_PAYOUT = 45;
const PAD_FREQ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C D E G A C — pentatonic
const STEP_MS = 620;

type Phase = "intro" | "watch" | "input" | "done";

/** Pulse Pads — a glowing 3D "play it back" memory game. The sequence grows by
 * one each round; how long a chain can you echo? (Ear + pattern memory.) */
export function PulsePads() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);
  const best = useGame((s) => s.pulseBest);
  const reportScore = useGame((s) => s.reportPulseScore);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PulseScene | null>(null);
  const seqRef = useRef<number[]>([]);
  const inputRef = useRef(0);
  const rngRef = useRef<RNG>(mulberry32(1));
  const phaseRef = useRef<Phase>("intro");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [phase, setPhaseState] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [startBest, setStartBest] = useState(0);

  function setPhase(p: Phase) {
    phaseRef.current = p;
    setPhaseState(p);
  }

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function hit(index: number) {
    sceneRef.current?.pulse(index);
    playPitch(PAD_FREQ[index], 0.42);
  }

  function playback() {
    setPhase("watch");
    clearTimers();
    seqRef.current.forEach((idx, i) => {
      timers.current.push(setTimeout(() => hit(idx), 400 + i * STEP_MS));
    });
    timers.current.push(
      setTimeout(() => {
        inputRef.current = 0;
        setPhase("input");
      }, 400 + seqRef.current.length * STEP_MS),
    );
  }

  function addStep() {
    seqRef.current = [...seqRef.current, randInt(rngRef.current, 0, PAD_FREQ.length - 1)];
    setRound(seqRef.current.length);
    playback();
  }

  function win() {
    sfx.perfect();
    setPhase("watch");
    timers.current.push(setTimeout(addStep, 850));
  }

  function lose() {
    sfx.wrong();
    clearTimers();
    setPhase("done");
  }

  function onTap(index: number) {
    if (phaseRef.current !== "input") return;
    hit(index);
    const seq = seqRef.current;
    if (index !== seq[inputRef.current]) {
      lose();
      return;
    }
    inputRef.current += 1;
    if (inputRef.current >= seq.length) win();
  }

  function start() {
    unlockAudio();
    sfx.tap();
    clearTimers();
    seqRef.current = [];
    inputRef.current = 0;
    rngRef.current = mulberry32(newSeed());
    setStartBest(best);
    setRound(0);
    addStep();
  }

  // Mount the 3D scene once (StrictMode-safe), after handlers are declared.
  useEffect(() => {
    if (!hostRef.current) return;
    const scene = PulseScene.create(hostRef.current);
    sceneRef.current = scene;
    scene.onTap = onTap;
    scene.start();
    return () => {
      clearTimers();
      sceneRef.current = null;
      scene.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // score = completed rounds; on a miss the current round didn't finish.
  const score = phase === "done" ? Math.max(0, round - 1) : round;

  useEffect(() => {
    if (phase !== "done") return;
    const payout = Math.min(score * 4, MAX_PAYOUT);
    if (payout > 0) earnDust(payout, "pulse");
    reportScore(score);
    sfx.stageComplete();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const watching = phase === "watch";

  return (
    <div className="screen stage-play surf-screen">
      <div
        className="pixi-host"
        ref={hostRef}
        onPointerDown={(e) => {
          if (phase === "input") sceneRef.current?.tapAt(e.clientX, e.clientY);
        }}
      />

      <header className="stage-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <span className="stage-title">🟣 Pulse Pads</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {(phase === "watch" || phase === "input") && (
        <div className="surf-hud">
          <span className="surf-zone">{watching ? "👀 Watch…" : "🎶 Your turn!"}</span>
          <div className="rush-hud">
            <span className="catch-stat">🔗 {round}</span>
            <span className="catch-stat dim">🏆 {Math.max(best, round - 1)}</span>
          </div>
        </div>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🟣 Pulse Pads</h2>
            <p className="catch-howto">Watch the glowing pads — then play them back!</p>
            <p className="catch-howto dim">Each round adds one more pad. How long a chain can you echo?</p>
            {best > 0 && <p className="catch-howto">🏆 Best chain: {best}</p>}
            <button className="btn btn-primary btn-big" onClick={start}>
              Start!
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>{score > startBest && score > 0 ? "🏆 NEW BEST CHAIN!" : "Good ear!"}</h2>
            <div className="payout">🔗 {score} → +{Math.min(score * 4, MAX_PAYOUT)} ✨</div>
            <p className="catch-howto dim">🏆 Best: {Math.max(best, score)}</p>
            <div className="celebration-actions">
              <button className="btn btn-secondary" onClick={() => { sfx.tap(); navigate("/hub"); }}>
                ← Base
              </button>
              <button className="btn btn-primary" onClick={start}>
                Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
