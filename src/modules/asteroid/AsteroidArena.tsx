import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed, pick, randInt, shuffle, type RNG } from "../../engine/rng";
import { AsteroidScene } from "../../three/AsteroidScene";

const MAX_PAYOUT = 45;
const SHIELDS = 3;

interface Rule {
  label: string;
  test: (n: number) => boolean;
}
const RULES: Rule[] = [
  { label: "Blast EVEN numbers", test: (n) => n % 2 === 0 },
  { label: "Blast ODD numbers", test: (n) => n % 2 === 1 },
  { label: "Blast multiples of 3", test: (n) => n % 3 === 0 },
  { label: "Blast multiples of 4", test: (n) => n % 4 === 0 },
  { label: "Blast multiples of 5", test: (n) => n % 5 === 0 },
  { label: "Blast numbers OVER 20", test: (n) => n > 20 },
  { label: "Blast numbers UNDER 10", test: (n) => n < 10 },
  { label: "Blast factors of 24", test: (n) => 24 % n === 0 },
  { label: "Blast prime numbers", test: (n) => isPrime(n) },
];

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

interface Live {
  value: number;
  target: boolean;
}
interface RunState {
  rng: RNG;
  rule: Rule;
  live: Map<number, Live>;
  targetsLeft: number;
  score: number;
  shields: number;
}

const blasterSpeed = (score: number) => Math.min(19, 9 + score * 0.22);

/** Build a wave: 2–4 targets + fillers, all distinct numbers 1–30. */
function buildWave(rng: RNG, rule: Rule): Array<{ value: number; target: boolean }> {
  const targets: number[] = [];
  const fillers: number[] = [];
  const used = new Set<number>();
  let guard = 0;
  while ((targets.length < 3 || fillers.length < 3) && guard++ < 400) {
    const n = randInt(rng, 1, 30);
    if (used.has(n)) continue;
    if (rule.test(n) && targets.length < 3) {
      used.add(n);
      targets.push(n);
    } else if (!rule.test(n) && fillers.length < 3) {
      used.add(n);
      fillers.push(n);
    }
  }
  return shuffle(rng, [
    ...targets.map((value) => ({ value, target: true })),
    ...fillers.map((value) => ({ value, target: false })),
  ]);
}

/** Asteroid Arena — a 3D space math blaster. Blast only the numbers that fit
 * the rule; wrong shots cost a shield. */
export function AsteroidArena() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);
  const best = useGame((s) => s.blasterBest);
  const reportScore = useGame((s) => s.reportBlasterScore);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<AsteroidScene | null>(null);
  const runRef = useRef<RunState | null>(null);

  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [hud, setHud] = useState({ rule: "", score: 0, shields: SHIELDS });
  const [startBest, setStartBest] = useState(0);

  useEffect(() => {
    if (!hostRef.current) return;
    const scene = AsteroidScene.create(hostRef.current);
    sceneRef.current = scene;
    return () => {
      sceneRef.current = null;
      scene.destroy();
    };
  }, []);

  function sync(r: RunState) {
    setHud({ rule: r.rule.label, score: r.score, shields: r.shields });
  }

  function nextWave(r: RunState) {
    r.rule = pick(r.rng, RULES);
    const wave = buildWave(r.rng, r.rule);
    r.live = new Map();
    r.targetsLeft = wave.filter((w) => w.target).length;
    const scene = sceneRef.current;
    if (!scene) return;
    scene.speed = blasterSpeed(r.score);
    for (const w of wave) {
      const id = scene.spawn(String(w.value));
      r.live.set(id, { value: w.value, target: w.target });
    }
    sync(r);
  }

  function endRun(r: RunState) {
    sceneRef.current?.stop();
    sync(r);
    setPhase("done");
  }

  function onTap(id: number) {
    const r = runRef.current;
    const scene = sceneRef.current;
    if (!r || !scene) return;
    const hit = r.live.get(id);
    if (!hit) return;
    // Update run state BEFORE blast() — it fires onExit synchronously, which
    // reads shields/targets to decide game-over or the next wave.
    if (hit.target) {
      sfx.correct();
      r.score += 1;
      scene.blast(id, 0xffd84d);
    } else {
      sfx.wrong();
      r.shields -= 1;
      scene.shakeNow();
      scene.blast(id, 0xff5a5a);
    }
    sync(r);
  }

  function onExit(id: number, blasted: boolean) {
    const r = runRef.current;
    if (!r) return;
    const hit = r.live.get(id);
    if (!hit) return;
    r.live.delete(id);
    if (hit.target && blasted) r.targetsLeft -= 1;
    if (r.shields <= 0) {
      endRun(r);
      return;
    }
    if (r.live.size === 0) nextWave(r);
  }

  function start() {
    unlockAudio();
    sfx.tap();
    const scene = sceneRef.current;
    if (!scene) return;
    scene.clearRocks();
    const r: RunState = {
      rng: mulberry32(newSeed()),
      rule: RULES[0],
      live: new Map(),
      targetsLeft: 0,
      score: 0,
      shields: SHIELDS,
    };
    runRef.current = r;
    setStartBest(best);
    scene.onTap = onTap;
    scene.onExit = onExit;
    scene.start();
    setPhase("play");
    nextWave(r);
  }

  useEffect(() => {
    if (phase !== "done") return;
    const r = runRef.current;
    if (!r) return;
    const payout = Math.min(r.score, MAX_PAYOUT);
    if (payout > 0) earnDust(payout, "asteroid");
    reportScore(r.score);
    sfx.stageComplete();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen stage-play surf-screen">
      <div
        className="pixi-host"
        ref={hostRef}
        onPointerDown={(e) => {
          if (phase === "play") sceneRef.current?.tapAt(e.clientX, e.clientY);
        }}
      />

      <header className="stage-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <span className="stage-title">🚀 Asteroid Arena</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && (
        <div className="surf-hud">
          <span key={hud.rule} className="surf-zone">{hud.rule}</span>
          <div className="rush-hud">
            <span className="catch-stat">{"🛡️".repeat(hud.shields)}</span>
            <span className="catch-stat">💥 {hud.score}</span>
            <span className="catch-stat dim">🏆 {Math.max(best, hud.score)}</span>
          </div>
        </div>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🚀 Asteroid Arena</h2>
            <p className="catch-howto">Blast the RIGHT numbers out of space!</p>
            <p className="catch-howto dim">Read the rule on top. Tap only the asteroids that fit it. Wrong shots cost a shield.</p>
            <p className="catch-howto dim">3 shields. It speeds up as you score!</p>
            {best > 0 && <p className="catch-howto">🏆 Best run: {best}</p>}
            <button className="btn btn-primary btn-big" onClick={start}>
              Launch!
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>{hud.score > startBest && hud.score > 0 ? "🏆 NEW BEST RUN!" : "Mission Over"}</h2>
            <div className="payout">💥 {hud.score} → +{Math.min(hud.score, MAX_PAYOUT)} ✨</div>
            <p className="catch-howto dim">🏆 Best: {Math.max(best, hud.score)}</p>
            <div className="celebration-actions">
              <button className="btn btn-secondary" onClick={() => { sfx.tap(); navigate("/hub"); }}>
                ← Base
              </button>
              <button className="btn btn-primary" onClick={start}>
                Fly Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
