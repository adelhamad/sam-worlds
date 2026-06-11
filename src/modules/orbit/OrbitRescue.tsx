import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { GravityScene, type OrbitLevel } from "../../pixi/GravityScene";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed, type RNG } from "../../engine/rng";

const RESCUES_TO_WIN = 5;
const MAX_SPEED = 560;

function genLevel(rng: RNG, difficulty: number): OrbitLevel {
  const planetCount = 1 + Math.min(2, Math.floor(difficulty / 2) + (rng() < 0.5 ? 1 : 0));
  const planets: OrbitLevel["planets"] = [];
  for (let tries = 0; planets.length < planetCount && tries < 60; tries++) {
    const cand = {
      x: 0.28 + rng() * 0.38,
      y: 0.18 + rng() * 0.64,
      r: 16 + rng() * 18,
      m: 0,
    };
    cand.m = cand.r * cand.r * (9 + difficulty * 2);
    const clear = planets.every((p) => Math.hypot((p.x - cand.x) * 100, (p.y - cand.y) * 60) > 24);
    if (clear) planets.push(cand);
  }
  let star = { x: 0.84, y: 0.5 };
  for (let tries = 0; tries < 40; tries++) {
    star = { x: 0.76 + rng() * 0.16, y: 0.15 + rng() * 0.7 };
    if (planets.every((p) => Math.hypot((p.x - star.x) * 100, (p.y - star.y) * 60) > 18)) break;
  }
  return { planets, star, start: { x: 0.08, y: 0.25 + rng() * 0.5 } };
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

  useEffect(() => {
    if (phase !== "play") return;
    const scene = sceneRef.current;
    if (!scene) return;
    scene.onResult = (outcome) => {
      if (outcome === "rescued") {
        sfx.earn();
        setNote("⭐ Rescued!");
        setRescued((r) => {
          const next = r + 1;
          if (next >= RESCUES_TO_WIN) {
            setPhase("done");
          } else {
            scene.loadLevel(genLevel(rngRef.current, next));
          }
          return next;
        });
      } else {
        sfx.wrong();
        setNote(outcome === "crashed" ? "💥 Too close to the planet!" : "🌌 Lost in space…");
        scene.resetProbe();
      }
      setTimeout(() => setNote(null), 1200);
    };
    return () => {
      scene.onResult = undefined;
    };
  }, [phase]);

  // Payout once per finished run.
  useEffect(() => {
    if (phase !== "done") return;
    sfx.stageComplete();
    const bonus = shots <= RESCUES_TO_WIN + 3 ? 10 : 0;
    earnDust(RESCUES_TO_WIN * 5 + bonus, "orbit-rescue");
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    unlockAudio();
    sfx.tap();
    setRescued(0);
    setShots(0);
    setPhase("play");
    sceneRef.current?.loadLevel(genLevel(rngRef.current, 0));
  }

  function dragVector(e: React.PointerEvent): { x: number; y: number } | null {
    if (!dragRef.current) return null;
    // slingshot: pull back, launch forward
    const k = 3.2;
    let vx = (dragRef.current.x - e.clientX) * k;
    let vy = (dragRef.current.y - e.clientY) * k;
    const speed = Math.hypot(vx, vy);
    if (speed > MAX_SPEED) {
      vx = (vx / speed) * MAX_SPEED;
      vy = (vy / speed) * MAX_SPEED;
    }
    return { x: vx, y: vy };
  }

  return (
    <div className="screen stage-play">
      <div
        className="pixi-host orbit-host"
        ref={hostRef}
        onPointerDown={(e) => {
          if (phase !== "play") return;
          dragRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          const v = dragVector(e);
          if (v) sceneRef.current?.aim(v.x, v.y);
        }}
        onPointerUp={(e) => {
          const v = dragVector(e);
          dragRef.current = null;
          if (v && Math.hypot(v.x, v.y) > 40 && sceneRef.current?.launch(v.x, v.y)) {
            sfx.tap();
            setShots((s) => s + 1);
          }
        }}
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
          <span className="catch-stat">🚀 {shots}</span>
          {note && <span className="catch-stat orbit-note">{note}</span>}
        </div>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🛰️ Orbit Rescue</h2>
            <p className="catch-howto">A star is lost in deep space!</p>
            <p className="catch-howto dim">Drag back like a slingshot, then release.</p>
            <p className="catch-howto dim">Gravity bends your path — use the planets!</p>
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
              {RESCUES_TO_WIN} ⭐ in {shots} shots → +{RESCUES_TO_WIN * 5 + (shots <= RESCUES_TO_WIN + 3 ? 10 : 0)} ✨
            </div>
            {shots <= RESCUES_TO_WIN + 3 && <div className="perfect-banner">🌟 Sharpshooter bonus!</div>}
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
