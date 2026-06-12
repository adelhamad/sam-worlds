import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed, shuffle } from "../../engine/rng";
import { attachMotion, attachSpin, attachTilt, requestTiltPermission, vibrate } from "../../engine/sensors";

const POINTS_EACH = 10;
const GRAVITY = 9.81;

interface Challenge {
  kind: "jump" | "shake" | "freeze" | "spin" | "rock";
  emoji: string;
  title: string;
  target: number; // jumps / shakes / rocks / degrees / milliseconds
}

const CHALLENGES: Challenge[] = [
  { kind: "jump", emoji: "🦘", title: "JUMP {n} times — hold on tight!", target: 6 },
  { kind: "shake", emoji: "🪇", title: "SHAKE it like a maraca — {n} shakes!", target: 12 },
  { kind: "freeze", emoji: "🗿", title: "FREEZE! Be a statue for {n} seconds!", target: 5000 },
  { kind: "spin", emoji: "🌀", title: "SPIN slowly all the way around!", target: 330 },
  { kind: "rock", emoji: "🚣", title: "ROCK the boat — tilt left & right {n} times!", target: 6 },
];

function titleOf(c: Challenge): string {
  const n = c.kind === "freeze" ? Math.round(c.target / 1000) : c.target;
  return c.title.replace("{n}", String(n));
}

/** Jump Jam: real exercise scored by the device sensors. */
export function JumpJam() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);

  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [order, setOrder] = useState<Challenge[]>(CHALLENGES);
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0); // same unit as target
  const [score, setScore] = useState(0);
  const [sensed, setSensed] = useState(false);

  const challenge = order[idx];

  function completeChallenge() {
    sfx.correct();
    vibrate([60, 40, 60]);
    setScore((s) => s + POINTS_EACH);
    advance();
  }

  function advance() {
    setProgress(0);
    if (idx + 1 >= order.length) setPhase("done");
    else setIdx(idx + 1);
  }

  // Per-challenge sensor wiring. Each detector reports progress and is torn
  // down when the challenge changes.
  useEffect(() => {
    if (phase !== "play" || !challenge) return;
    let count = 0;
    let lastAt = 0;
    let side: "l" | "r" | null = null;
    let lastLoud = performance.now();
    let timer: ReturnType<typeof setInterval> | null = null;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      completeChallenge();
    };
    const bump = (refractoryMs: number, threshold: number) => (mag: number) => {
      setSensed(true);
      const now = performance.now();
      if (Math.abs(mag - GRAVITY) > threshold && now - lastAt > refractoryMs) {
        lastAt = now;
        count += 1;
        sfx.tap();
        setProgress(count);
        if (count >= challenge.target) finish();
      }
    };
    let detach: () => void = () => {};
    switch (challenge.kind) {
      case "jump":
        detach = attachMotion(bump(450, 7));
        break;
      case "shake":
        detach = attachMotion(bump(140, 5));
        break;
      case "freeze":
        detach = attachMotion((mag) => {
          setSensed(true);
          if (Math.abs(mag - GRAVITY) > 1.6) lastLoud = performance.now();
        });
        timer = setInterval(() => {
          const held = performance.now() - lastLoud;
          setProgress(Math.min(challenge.target, held));
          if (held >= challenge.target) finish();
        }, 100);
        break;
      case "spin":
        detach = attachSpin((deg) => {
          setSensed(true);
          setProgress(Math.min(challenge.target, deg));
          if (deg >= challenge.target) finish();
        });
        break;
      case "rock":
        detach = attachTilt((tx) => {
          setSensed(true);
          let s: "l" | "r" | null = null;
          if (tx > 16) s = "r";
          else if (tx < -16) s = "l";
          if (s && s !== side) {
            if (side !== null) {
              count += 1;
              sfx.tap();
              setProgress(count);
              if (count >= challenge.target) finish();
            }
            side = s;
          }
        });
        break;
    }
    return () => {
      detach();
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx]);

  // Pay out when the workout ends.
  useEffect(() => {
    if (phase !== "done") return;
    const payout = Math.ceil(score / 2);
    if (payout > 0) earnDust(payout, "jump-jam");
    sfx.stageComplete();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    unlockAudio();
    sfx.tap();
    await requestTiltPermission(); // iOS: must come from a tap
    setOrder(shuffle(mulberry32(newSeed()), CHALLENGES));
    setIdx(0);
    setScore(0);
    setProgress(0);
    setSensed(false);
    setPhase("play");
  }

  const pct = challenge ? Math.round((progress / challenge.target) * 100) : 0;
  let counter = `${progress} / ${challenge?.target ?? 0}`;
  if (challenge?.kind === "freeze") counter = `${Math.max(0, Math.ceil((challenge.target - progress) / 1000))}`;
  else if (challenge?.kind === "spin") counter = `${Math.round(progress)}°`;

  return (
    <div className="screen stage-play jam-screen">
      <header className="stage-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <span className="stage-title">🤸 Jump Jam</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && challenge && (
        <div className="jam-stage">
          <div className="rush-hud">
            <span className="catch-stat">⭐ {score}</span>
            <span className="catch-stat dim">
              {idx + 1} / {order.length}
            </span>
          </div>
          <div className="jam-emoji">{challenge.emoji}</div>
          <div className="jam-title">{titleOf(challenge)}</div>
          <div className="jam-counter">{counter}</div>
          <div className="jam-bar">
            <div className="jam-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          {!sensed && <p className="dim jam-note">📱 This game needs the tablet — hold it and MOVE!</p>}
          <button className="btn btn-secondary jam-skip" onClick={() => { sfx.tap(); advance(); }}>
            Skip this one →
          </button>
        </div>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🤸 Jump Jam</h2>
            <p className="catch-howto">A REAL workout — the tablet can feel you move!</p>
            <p className="catch-howto dim">Jump, shake, freeze, spin and rock to score points.</p>
            <p className="catch-howto">⚠️ Hold the tablet TIGHT with both hands!</p>
            <button className="btn btn-primary btn-big" onClick={() => void start()}>
              Let's move!
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>💪 Great workout!</h2>
            <div className="payout">
              ⭐ {score} → +{Math.ceil(score / 2)} ✨
            </div>
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
              <button className="btn btn-primary" onClick={() => void start()}>
                One more round!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
