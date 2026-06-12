import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed } from "../../engine/rng";
import { Cube, FACE_COLORS, FACES, scramble, solutionFor, type Face, type Move } from "../../engine/cube";
import { CubeScene } from "../../three/CubeScene";

const FACE_LABEL: Record<Face, string> = { U: "TOP", D: "BOTTOM", F: "FRONT", B: "BACK", L: "LEFT", R: "RIGHT" };
const SIZES = [
  { n: 2, name: "2×2 Mini", moves: 8 },
  { n: 3, name: "3×3 Classic", moves: 12 },
  { n: 4, name: "4×4 Big", moves: 16 },
];

/**
 * Cube Coach: a real 3D cube. Sam twists it however he likes (or hits Mix),
 * presses START SOLVING, and the coach calls out each turn while the cube
 * animates it. The plan is the inverse of everything done so far, so going
 * off-script never fails — it just adds a step.
 */
export function CubeCoach() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CubeScene | null>(null);
  const engineRef = useRef<Cube>(new Cube(3));

  const [payout, setPayout] = useState(0);
  const [phase, setPhase] = useState<"pick" | "setup" | "solve" | "solved">("pick");
  const [history, setHistory] = useState<Move[]>([]);
  const [mixing, setMixing] = useState(false);
  const [solves, setSolves] = useState(0);

  const plan = solutionFor(history);
  const next: Move | undefined = plan[0];

  // Mount the 3D scene once (StrictMode-safe).
  useEffect(() => {
    if (!hostRef.current) return;
    const scene = CubeScene.create(hostRef.current);
    scene.setSize(3);
    sceneRef.current = scene;
    return () => {
      sceneRef.current = null;
      scene.destroy();
    };
  }, []);

  function pickSize(s: (typeof SIZES)[number]) {
    unlockAudio();
    sfx.tap();
    engineRef.current = new Cube(s.n);
    sceneRef.current?.setSize(s.n);
    setHistory([]);
    setPhase("setup");
    mix(s.moves);
  }

  /** One animated turn applied to BOTH the 3D view and the logic engine. */
  function doTurn(mv: Move, fast = false, done?: () => void): boolean {
    const scene = sceneRef.current;
    if (!scene || scene.busy) return false;
    const started = scene.turn(mv, { fast, done });
    if (!started) return false;
    engineRef.current.turn(mv);
    setHistory((h) => [...h, mv]);
    return true;
  }

  /** Auto-mix: a quick animated scramble. */
  function mix(count: number) {
    const moves = scramble(count, mulberry32(newSeed()));
    setMixing(true);
    let i = 0;
    const step = () => {
      if (!sceneRef.current) return; // left the screen mid-mix
      if (i >= moves.length) {
        setMixing(false);
        return;
      }
      const mv = moves[i++];
      sfx.tap();
      doTurn(mv, true, step);
    };
    step();
  }

  function startSolving() {
    sfx.tap();
    setPayout(Math.max(4, Math.min(24, solutionFor(history).length)));
    setPhase("solve");
  }

  /** The big DO IT button: perform the coached move and watch it animate. */
  function doNext() {
    if (!next) return;
    const ok = doTurn(next, false, () => {
      sfx.correct();
      // history state hasn't flushed inside this callback — recompute from engine
      if (engineRef.current.isSolved()) {
        earnDust(payout, "cube-coach");
        setSolves((c) => c + 1);
        sfx.stageComplete();
        setPhase("solved");
      }
    });
    if (ok) sfx.tap();
  }

  const stepsLeft = plan.length;

  return (
    <div className="screen stage-play cube-screen">
      <header className="stage-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <span className="stage-title">🧊 Cube Coach</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      <div className="cube-coachbar">
        {phase === "setup" && !mixing && <span className="cube-instruction">Twist it, mix it — then hit SOLVE!</span>}
        {phase === "setup" && mixing && <span className="cube-instruction">🎲 Mixing it up…</span>}
        {phase === "solve" && next && (
          <span className="cube-instruction">
            Turn <b style={{ color: FACE_COLORS[next.face] }}>{FACE_LABEL[next.face]}</b> {next.prime ? "↺" : "↻"} ·{" "}
            {stepsLeft} step{stepsLeft > 1 ? "s" : ""} left
          </span>
        )}
        {phase === "solved" && <span className="cube-instruction cube-done">🎉 SOLVED!</span>}
      </div>

      <div className="cube3d-host" ref={hostRef} />
      {phase !== "pick" && <p className="dim cube-orbit-note">🔄 Drag the cube to look around</p>}

      {phase === "setup" && !mixing && (
        <>
          <div className="cube-controls">
            {FACES.map((face) => (
              <div key={face} className="cube-ctl">
                <span className="cube-ctl-label" style={{ background: FACE_COLORS[face] }}>
                  {FACE_LABEL[face]}
                </span>
                {[true, false].map((prime) => (
                  <button
                    key={String(prime)}
                    className="btn btn-secondary cube-btn"
                    onClick={() => {
                      if (doTurn({ face, prime })) sfx.tap();
                    }}
                  >
                    {prime ? "↺" : "↻"}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="celebration-actions">
            <button className="btn btn-secondary" onClick={() => mix(SIZES.find((s) => s.n === engineRef.current.n)?.moves ?? 12)}>
              🎲 Mix more
            </button>
            <button className="btn btn-primary" disabled={stepsLeft === 0} onClick={startSolving}>
              🧭 START SOLVING
            </button>
          </div>
        </>
      )}

      {phase === "solve" && (
        <div className="celebration-actions">
          <button className="btn btn-primary btn-big cube-doit" onClick={doNext}>
            ▶ DO IT
          </button>
        </div>
      )}

      {phase === "pick" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🧊 Cube Coach</h2>
            <p className="catch-howto">A real 3D cube!</p>
            <p className="catch-howto dim">Mix it up however you like — then the coach shows you every turn back to solved, live in 3D.</p>
            <div className="celebration-actions cube-sizes">
              {SIZES.map((s) => (
                <button key={s.n} className="btn btn-primary" onClick={() => pickSize(s)}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "solved" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>🎉 Cube solved!</h2>
            <div className="payout">+{payout} ✨</div>
            {solves > 1 && <p className="catch-howto dim">{solves} cubes solved this visit!</p>}
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
              <button className="btn btn-primary" onClick={() => setPhase("pick")}>
                New cube!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
