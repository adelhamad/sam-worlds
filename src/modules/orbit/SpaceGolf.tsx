import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { SpaceGolfScene, type GolfHole, type Magnet } from "../../pixi/SpaceGolfScene";
import { playPitch, sfx, unlockAudio } from "../../engine/feedback/audio";
import { vibrate } from "../../engine/sensors";
import { mulberry32, newSeed, type RNG } from "../../engine/rng";

const HOLES_PER_ROUND = 5;
const MAX_SPEED = 620;

/** Hole layouts grow: pure putt → one magnet → magnet slalom. */
function genHole(rng: RNG, holeIndex: number): GolfHole {
  const magnetCount = Math.min(3, Math.max(0, holeIndex - (rng() < 0.4 ? 1 : 0)));
  const magnets: Magnet[] = [];
  for (let tries = 0; magnets.length < magnetCount && tries < 60; tries++) {
    const cand: Magnet = {
      x: 0.3 + rng() * 0.36,
      y: 0.2 + rng() * 0.6,
      r: 16 + rng() * 14,
      m: 0,
    };
    cand.m = cand.r * cand.r * 14;
    if (magnets.every((m) => Math.hypot((m.x - cand.x) * 100, (m.y - cand.y) * 60) > 22)) {
      magnets.push(cand);
    }
  }
  let flag = { x: 0.85, y: 0.5 };
  for (let tries = 0; tries < 40; tries++) {
    flag = { x: 0.78 + rng() * 0.14, y: 0.15 + rng() * 0.7 };
    if (magnets.every((m) => Math.hypot((m.x - flag.x) * 100, (m.y - flag.y) * 60) > 16)) break;
  }
  return {
    magnets,
    flag,
    tee: { x: 0.08, y: 0.3 + rng() * 0.4 },
    par: 1 + magnetCount,
  };
}

function starsFor(strokes: number, par: number): number {
  if (strokes <= par) return 3;
  if (strokes === par + 1) return 2;
  return 1;
}

export function SpaceGolf() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SpaceGolfScene | null>(null);
  const rngRef = useRef<RNG>(mulberry32(newSeed()));
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [holeNum, setHoleNum] = useState(1);
  const [par, setPar] = useState(1);
  const [strokes, setStrokes] = useState(0);
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    let cancelled = false;
    void SpaceGolfScene.create(hostRef.current).then((scene) => {
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
    setTimeout(() => setNote(null), 1400);
  }

  function sinkMessage(s: number, p: number): string {
    if (s === 1) return "🤩 HOLE IN ONE!";
    if (s <= p) return "⭐⭐⭐ Under par!";
    if (s === p + 1) return "⭐⭐ So close!";
    return "⭐ In the hole!";
  }

  useEffect(() => {
    if (phase !== "play") return;
    const scene = sceneRef.current;
    if (!scene) return;
    scene.onBounce = (speed) => {
      playPitch(120 + Math.min(300, speed * 0.4), 0.12);
      vibrate(15);
    };
    scene.onSink = () => {
      sfx.earn();
      vibrate([40, 50, 80]);
      setStrokes((s) => {
        const gained = starsFor(s, par);
        flash(sinkMessage(s, par));
        setStars((st) => st + gained);
        setTimeout(() => {
          setHoleNum((h) => {
            const next = h + 1;
            if (next > HOLES_PER_ROUND) {
              setPhase("done");
              return h;
            }
            const hole = genHole(rngRef.current, next - 1);
            setPar(hole.par);
            setStrokes(0);
            scene.loadHole(hole);
            return next;
          });
        }, 1100);
        return s;
      });
    };
    return () => {
      scene.onBounce = undefined;
      scene.onSink = undefined;
    };
  }, [phase, par]);

  // Payout once per finished round.
  useEffect(() => {
    if (phase !== "done") return;
    sfx.stageComplete();
    earnDust(stars * 3, "space-golf");
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    unlockAudio();
    sfx.tap();
    setHoleNum(1);
    setStars(0);
    setStrokes(0);
    setPhase("play");
    const hole = genHole(rngRef.current, 0);
    setPar(hole.par);
    sceneRef.current?.loadHole(hole);
  }

  function dragVector(e: React.PointerEvent): { x: number; y: number } | null {
    if (!dragRef.current) return null;
    const k = 3.4; // slingshot: pull back, putt forward
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
          if (phase === "play" && sceneRef.current?.canStroke()) {
            dragRef.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onPointerMove={(e) => {
          const v = dragVector(e);
          if (v) sceneRef.current?.aim(v.x, v.y);
        }}
        onPointerUp={(e) => {
          const v = dragVector(e);
          dragRef.current = null;
          if (v && Math.hypot(v.x, v.y) > 40 && sceneRef.current?.stroke(v.x, v.y)) {
            sfx.tap();
            setStrokes((s) => s + 1);
          }
        }}
      />

      <header className="stage-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <span className="stage-title">⛳ Space Golf</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && (
        <div className="catch-hud">
          <span className="catch-target">⛳ {holeNum}/{HOLES_PER_ROUND}</span>
          <span className="catch-stat">Par {par} · 🏌️ {strokes}</span>
          <span className="catch-stat">⭐ {stars}</span>
          {note && <span className="catch-stat orbit-note">{note}</span>}
        </div>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>⛳ Space Golf</h2>
            <p className="catch-howto">Putt the ball into the glowing hole!</p>
            <p className="catch-howto dim">Drag back like a slingshot, then let go.</p>
            <p className="catch-howto dim">🧲 Magnet planets PULL the ball — watch the dotted path.</p>
            <p className="catch-howto dim">Fewer strokes than par = more stars!</p>
            <button className="btn btn-primary btn-big" onClick={start}>
              Tee off!
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>Round complete!</h2>
            <div className="payout">
              {stars} ⭐ of {HOLES_PER_ROUND * 3} → +{stars * 3} ✨
            </div>
            {stars >= HOLES_PER_ROUND * 3 - 1 && <div className="perfect-banner">🌟 Golf legend!</div>}
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
