import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed, shuffle, type RNG } from "../../engine/rng";
import { generateArithmetic, type ArithmeticParams } from "../../engine/generators/arithmetic";

const MAX_PAYOUT = 40;
const SHIELDS = 3;
const COMBO_AT = 5; // streak length that doubles points

/** Question difficulty climbs with the score — the educational ramp. */
function bandParams(level: number): ArithmeticParams {
  if (level === 0) return { op: "add", max: 10 };
  if (level === 1) return { op: "mix", max: 15 };
  if (level === 2) return { op: "mix", max: 20, missingOperand: true };
  if (level === 3) return { op: "mul", tables: [2, 3, 5] };
  if (level === 4) return { op: "mix", max: 20, tables: [2, 3, 4, 5] };
  if (level === 5) return { op: "mul", tables: [4, 6, 7] };
  return { op: "mix", max: 30, tables: [3, 4, 6, 7, 8], missingOperand: true };
}

interface Gate {
  prompt: string;
  answer: string;
  lanes: string[]; // 3 labels, one per lane
}

const levelOf = (score: number) => Math.min(6, Math.floor(score / 8));

function makeGate(rng: RNG, score: number): Gate {
  const q = generateArithmetic(bandParams(levelOf(score)), rng, { difficulty: Math.min(1, score / 50), easier: false });
  const wrongs = [...new Set(q.choices.filter((c) => c !== q.answer))].slice(0, 2);
  while (wrongs.length < 2) wrongs.push(String(Number(q.answer) + wrongs.length + 1));
  return { prompt: q.prompt, answer: q.answer, lanes: shuffle(rng, [q.answer, ...wrongs]) };
}

/**
 * Gate travel time GROWS with the difficulty band, so a harder question always
 * gives more thinking time than an easier one — never less. (It used to shrink
 * as the score climbed, which rushed the hardest questions the most.)
 */
const gateMs = (score: number) => 2800 + levelOf(score) * 350;

export function NumberRush() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);
  const best = useGame((s) => s.rushBest);
  const reportRushScore = useGame((s) => s.reportRushScore);

  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(SHIELDS);
  const [streak, setStreak] = useState(0);
  const [gate, setGate] = useState<Gate | null>(null);
  const [lane, setLane] = useState(1);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [startBest, setStartBest] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const rngRef = useRef<RNG>(mulberry32(1));
  const run = useRef({ lane: 1, score: 0, shields: SHIELDS, streak: 0, gate: null as Gate | null, startedAt: 0, duration: 3600 });

  function spawn(score: number) {
    const g = makeGate(rngRef.current, score);
    run.current.gate = g;
    run.current.startedAt = 0;
    run.current.duration = gateMs(score);
    setGate(g);
  }

  function steer(to: number) {
    run.current.lane = Math.max(0, Math.min(2, to));
    setLane(run.current.lane);
  }

  function ping(kind: "good" | "bad") {
    setFlash(kind);
    setTimeout(() => setFlash(null), 350);
  }

  function resolve() {
    const r = run.current;
    if (!r.gate) return;
    const hitCorrect = r.gate.lanes[r.lane] === r.gate.answer;
    if (hitCorrect) {
      sfx.correct();
      r.streak += 1;
      r.score += r.streak >= COMBO_AT ? 2 : 1;
      ping("good");
    } else {
      sfx.wrong();
      r.streak = 0;
      r.shields -= 1;
      ping("bad");
    }
    setScore(r.score);
    setStreak(r.streak);
    setShields(r.shields);
    if (r.shields <= 0) {
      setPhase("done");
      return;
    }
    // Rule 1: a miss never replays the same question — always a fresh gate.
    spawn(r.score);
  }

  // The run loop: one gate row slides toward the runner; resolve on arrival.
  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    const tick = (t: number) => {
      const r = run.current;
      if (r.gate) {
        if (!r.startedAt) r.startedAt = t;
        const p = Math.min(1, (t - r.startedAt) / r.duration);
        if (rowRef.current && trackRef.current) {
          const travel = trackRef.current.clientHeight * 0.72;
          rowRef.current.style.transform = `translateY(${p * travel}px)`;
        }
        if (p >= 1) resolve();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Keyboard lanes for desktop testing.
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") steer(run.current.lane - 1);
      if (e.key === "ArrowRight") steer(run.current.lane + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // Run over: pay out and record the best.
  useEffect(() => {
    if (phase !== "done") return;
    const payout = Math.min(run.current.score, MAX_PAYOUT);
    if (payout > 0) earnDust(payout, "number-rush");
    reportRushScore(run.current.score);
    sfx.stageComplete();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    unlockAudio();
    sfx.tap();
    rngRef.current = mulberry32(newSeed());
    run.current = { lane: 1, score: 0, shields: SHIELDS, streak: 0, gate: null, startedAt: 0, duration: gateMs(0) };
    setScore(0);
    setShields(SHIELDS);
    setStreak(0);
    setLane(1);
    setStartBest(best);
    spawn(0);
    setPhase("play");
  }

  const speedSec = Math.max(0.35, gateMs(score) / 3000);
  const trackClass = flash ? `rush-track rush-${flash}` : "rush-track";

  return (
    <div className="screen stage-play rush-screen">
      <header className="stage-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <span className="stage-title">🏃 Number Rush</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && gate && (
        <>
          <div className="rush-hud">
            <span className="catch-stat">{"🛡️".repeat(shields)}</span>
            <span className="catch-stat">⭐ {score}</span>
            {streak >= COMBO_AT && <span className="catch-stat rush-combo">🔥 ×2</span>}
            <span className="catch-stat dim">🏆 {Math.max(best, score)}</span>
          </div>
          <div
            ref={trackRef}
            className={trackClass}
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              steer(Math.floor(((e.clientX - rect.left) / rect.width) * 3));
            }}
          >
            <div className="rush-road" style={{ animationDuration: `${speedSec}s` }} />
            <div className="rush-question">{gate.prompt}</div>
            <div className="rush-row" ref={rowRef}>
              {gate.lanes.map((label, i) => (
                <span key={`${gate.prompt}-${i}`} className="rush-gate">
                  {label}
                </span>
              ))}
            </div>
            <span className="rush-runner" style={{ left: `${lane * 33.33 + 16.67}%` }}>
              🤖
            </span>
          </div>
        </>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🏃 Number Rush</h2>
            <p className="catch-howto">An endless number run!</p>
            <p className="catch-howto dim">Gates rush toward you — tap a lane to steer the robot through the RIGHT answer.</p>
            <p className="catch-howto dim">It gets faster and trickier the longer you survive. 3 shields. 🛡️</p>
            {best > 0 && <p className="catch-howto">🏆 Best run: {best}</p>}
            <button className="btn btn-primary btn-big" onClick={start}>
              Run!
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>{score > startBest && score > 0 ? "🏆 NEW BEST RUN!" : "What a run!"}</h2>
            <div className="payout">
              ⭐ {score} → +{Math.min(score, MAX_PAYOUT)} ✨
            </div>
            <p className="catch-howto dim">🏆 Best: {Math.max(best, score)}</p>
            <div className="celebration-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  sfx.tap();
                  navigate("/hub");
                }}
              >
                ← Base
              </button>
              <button className="btn btn-primary" onClick={start}>
                Run Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
