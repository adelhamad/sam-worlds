import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { GravityScene, type Body, type OrbitLevel } from "../../pixi/GravityScene";
import { playPitch, sfx, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed, type RNG } from "../../engine/rng";

const RESCUES_TO_WIN = 5;
const MAX_SPEED = 560;
const FUEL_PER_LEVEL = 3;

function vibrate(pattern: number | number[]): void {
  navigator.vibrate?.(pattern);
}

/** Level templates escalate: static → multi-planet → moons → drifting star → binary. */
function genLevel(rng: RNG, tier: number): OrbitLevel {
  const bodies: Body[] = [];
  const planet = (cx: number, cy: number, r: number): Body => ({ cx, cy, r, m: r * r * 11 });

  bodies.push(planet(0.4 + rng() * 0.15, 0.3 + rng() * 0.4, 20 + rng() * 14));
  if (tier >= 1) bodies.push(planet(0.6 + rng() * 0.12, rng() < 0.5 ? 0.2 : 0.72, 16 + rng() * 12));
  if (tier >= 2) {
    // a moon orbiting the first planet
    const p = bodies[0];
    bodies.push({ cx: p.cx, cy: p.cy, r: 9, m: 750, orbitRadius: 0.16 + rng() * 0.05, omega: 0.9 + rng() * 0.4, phase: rng() * 6.28 });
  }
  if (tier >= 4) {
    // binary pair sharing a center
    const cx = 0.52 + rng() * 0.08;
    const cy = 0.45 + rng() * 0.1;
    bodies.length = 0;
    for (const phase of [0, Math.PI]) {
      bodies.push({ cx, cy, r: 15, m: 2600, orbitRadius: 0.13, omega: 0.7, phase });
    }
  }

  const star: OrbitLevel["star"] = { cx: 0.82 + rng() * 0.1, cy: 0.2 + rng() * 0.6 };
  if (tier >= 3) {
    star.orbitRadius = 0.07;
    star.omega = 0.5;
    star.phase = rng() * 6.28;
  }
  return { bodies, star, start: { x: 0.07, y: 0.25 + rng() * 0.5 } };
}

export function OrbitRescue() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GravityScene | null>(null);
  const rngRef = useRef<RNG>(mulberry32(newSeed()));
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [rescued, setRescued] = useState(0);
  const [fuel, setFuel] = useState(FUEL_PER_LEVEL);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    let cancelled = false;
    void GravityScene.create(hostRef.current).then((scene) => {
      if (cancelled) {
        scene.destroy();
        return;
      }
      sceneRef.current = scene;
    });
    return () => {
      cancelled = true;
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, []);

  function flash(text: string): void {
    setNote(text);
    setTimeout(() => setNote(null), 1300);
  }

  useEffect(() => {
    if (phase !== "play") return;
    const scene = sceneRef.current;
    if (!scene) return;
    scene.onClosePass = () => {
      playPitch(880, 0.25);
      vibrate(30);
      setScore((sc) => sc + 3);
      flash("🪐 Gravity assist! +3");
    };
    scene.onResult = (outcome) => {
      if (outcome === "rescued") {
        sfx.earn();
        vibrate([40, 60, 40]);
        setScore((sc) => sc + 10 + fuel * 2);
        flash(`⭐ Rescued! +${10 + fuel * 2}`);
        setRescued((r) => {
          const next = r + 1;
          if (next >= RESCUES_TO_WIN) {
            setPhase("done");
          } else {
            setFuel(FUEL_PER_LEVEL);
            scene.loadLevel(genLevel(rngRef.current, next));
          }
          return next;
        });
      } else {
        sfx.wrong();
        if (outcome === "crashed") vibrate(120);
        flash(outcome === "crashed" ? "💥 Crashed!" : "🌌 Lost in space…");
        scene.resetProbe();
      }
    };
    return () => {
      scene.onResult = undefined;
      scene.onClosePass = undefined;
    };
  }, [phase, fuel]);

  // Payout once per finished run.
  useEffect(() => {
    if (phase !== "done") return;
    sfx.stageComplete();
    earnDust(Math.min(60, Math.max(10, Math.round(score / 2))), "orbit-rescue");
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    unlockAudio();
    sfx.tap();
    setRescued(0);
    setScore(0);
    setShots(0);
    setFuel(FUEL_PER_LEVEL);
    setPhase("play");
    sceneRef.current?.loadLevel(genLevel(rngRef.current, 0));
  }

  function canvasPoint(e: React.PointerEvent): { x: number; y: number } {
    const rect = hostRef.current?.getBoundingClientRect();
    return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
  }

  function dragVector(e: React.PointerEvent): { x: number; y: number } | null {
    if (!dragRef.current) return null;
    const k = 3.2; // slingshot: pull back, launch forward
    let vx = (dragRef.current.x - e.clientX) * k;
    let vy = (dragRef.current.y - e.clientY) * k;
    const speed = Math.hypot(vx, vy);
    if (speed > MAX_SPEED) {
      vx = (vx / speed) * MAX_SPEED;
      vy = (vy / speed) * MAX_SPEED;
    }
    return { x: vx, y: vy };
  }

  function onPointerDown(e: React.PointerEvent): void {
    if (phase !== "play") return;
    const scene = sceneRef.current;
    if (scene?.isFlying()) {
      // mid-flight thruster burn toward the tap
      if (fuel > 0) {
        const p = canvasPoint(e);
        if (scene.boost(p.x, p.y)) {
          setFuel((f) => f - 1);
          playPitch(140, 0.25);
          vibrate(20);
        }
      } else {
        flash("⛽ Out of fuel!");
      }
      return;
    }
    dragRef.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e: React.PointerEvent): void {
    const v = dragVector(e);
    dragRef.current = null;
    if (v && Math.hypot(v.x, v.y) > 40 && sceneRef.current?.launch(v.x, v.y)) {
      sfx.tap();
      setShots((s) => s + 1);
    }
  }

  return (
    <div className="screen stage-play">
      <div
        className="pixi-host orbit-host"
        ref={hostRef}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => {
          const v = dragVector(e);
          if (v) sceneRef.current?.aim(v.x, v.y);
        }}
        onPointerUp={onPointerUp}
      />

      <header className="stage-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <span className="stage-title">🛰️ Orbit Rescue</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && (
        <div className="catch-hud">
          <span className="catch-target">⭐ {rescued}/{RESCUES_TO_WIN}</span>
          <span className="catch-stat">⛽ {"▮".repeat(fuel)}{"▯".repeat(FUEL_PER_LEVEL - fuel)}</span>
          <span className="catch-stat">🏅 {score}</span>
          {note && <span className="catch-stat orbit-note">{note}</span>}
        </div>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🛰️ Orbit Rescue</h2>
            <p className="catch-howto">Lost stars drift between the planets!</p>
            <p className="catch-howto dim">Drag back like a slingshot — watch the predicted path bend.</p>
            <p className="catch-howto dim">Tap mid-flight to fire thrusters (⛽ ×3).</p>
            <p className="catch-howto dim">Skim a planet for a gravity-assist bonus!</p>
            <button className="btn btn-primary btn-big" onClick={start}>
              Launch!
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>All stars rescued!</h2>
            <div className="payout">
              🏅 {score} points in {shots} shots → +{Math.min(60, Math.max(10, Math.round(score / 2)))} ✨
            </div>
            {shots <= RESCUES_TO_WIN + 2 && <div className="perfect-banner">🌟 Ace pilot!</div>}
            <div className="celebration-actions">
              <button className="btn btn-secondary" onClick={() => { sfx.tap(); navigate("/hub"); }}>
                ← Base
              </button>
              <button className="btn btn-primary" onClick={start}>
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
