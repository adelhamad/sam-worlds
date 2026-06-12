import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { mulberry32, newSeed } from "../../engine/rng";
import { Cube, FACE_AXIS, FACE_COLORS, FACES, scramble, solutionFor, type Face, type Move, type Vec } from "../../engine/cube";
import { checkColorCounts, cubeToFacelets, solve2x2 } from "../../engine/cubesolve";
import { Cube3Solver } from "../../engine/cube3solver";
import { CubeScene } from "../../three/CubeScene";

const FACE_LABEL: Record<Face, string> = { U: "TOP", D: "BOTTOM", F: "FRONT", B: "BACK", L: "LEFT", R: "RIGHT" };
const SIZES = [
  { n: 2, name: "2×2 Mini", moves: 8 },
  { n: 3, name: "3×3 Classic", moves: 12 },
  { n: 4, name: "4×4 Big", moves: 16 },
  { n: 5, name: "5×5 Huge", moves: 20 },
];
/** Sizes that get the real "paint your cube → solve" flow. */
const SOLVABLE = new Set([2, 3]);
/** Palette order: white, yellow, green, blue, orange, red. */
const PALETTE: Face[] = ["U", "D", "F", "B", "L", "R"];
const COLOR_LABEL: Record<Face, string> = { U: "White", D: "Yellow", F: "Green", B: "Blue", L: "Orange", R: "Red" };

/** Reference stickers locked before painting so the entered cube can't drift. */
function lockedStickers(n: number): { grid: Vec; face: Face; color: Face }[] {
  if (n === 2) {
    // Pin the back-bottom-left corner so orientation is fixed.
    return (["D", "L", "B"] as Face[]).map((face) => ({ grid: [0, 0, 0] as Vec, face, color: face }));
  }
  const c = (n - 1) / 2; // odd cubes have real centers; pin each to its color
  return FACES.map((face) => {
    const { axis, dir } = FACE_AXIS[face];
    const grid: Vec = [c, c, c];
    grid[axis] = dir > 0 ? n - 1 : 0;
    return { grid, face, color: face };
  });
}

type Phase = "pick" | "paint" | "setup" | "solve" | "solved";

/**
 * Cube Coach. For 2×2 and 3×3 the player paints the cube to match the real one
 * in their hand, then a true solver (cubejs / meet-in-the-middle) calls out
 * every turn. For 4×4 and 5×5 — which have no browser solver — it stays the
 * mix-it-then-undo coach, where the plan is the inverse of the scramble.
 */
export function CubeCoach() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CubeScene | null>(null);
  const engineRef = useRef<Cube>(new Cube(3));
  const solverRef = useRef<Cube3Solver | null>(null);

  const [size, setSize] = useState(3);
  const [payout, setPayout] = useState(0);
  const [phase, setPhase] = useState<Phase>("pick");
  const [history, setHistory] = useState<Move[]>([]);
  const [plan, setPlan] = useState<Move[]>([]);
  const [mixing, setMixing] = useState(false);
  const [solves, setSolves] = useState(0);
  // Paint-flow state
  const [selColor, setSelColor] = useState<Face>("U");
  const [remaining, setRemaining] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [paintError, setPaintError] = useState<string | null>(null);

  const next: Move | undefined = plan[0];

  // Mount the 3D scene + 3×3 solver worker once (StrictMode-safe).
  useEffect(() => {
    if (!hostRef.current) return;
    const scene = CubeScene.create(hostRef.current);
    scene.setSize(3);
    sceneRef.current = scene;
    solverRef.current = new Cube3Solver();
    return () => {
      sceneRef.current = null;
      scene.destroy();
      solverRef.current?.destroy();
      solverRef.current = null;
    };
  }, []);

  function pickSize(s: (typeof SIZES)[number]) {
    unlockAudio();
    sfx.tap();
    setSize(s.n);
    setHistory([]);
    setPlan([]);
    setPaintError(null);
    if (SOLVABLE.has(s.n)) {
      startPainting(s.n);
    } else {
      engineRef.current = new Cube(s.n);
      sceneRef.current?.setSize(s.n);
      setPhase("setup");
      mix(s.moves);
    }
  }

  /** Enter paint mode: blank cube + locked references; warm the 3×3 solver. */
  function startPainting(n: number) {
    setSelColor("U");
    setPhase("paint");
    sceneRef.current?.setPaintColor("U");
    sceneRef.current?.enterPaint(n, lockedStickers(n), setRemaining);
    if (n === 3) solverRef.current?.warmUp();
  }

  function pickColor(face: Face) {
    sfx.tap();
    setSelColor(face);
    setPaintError(null);
    sceneRef.current?.setPaintColor(face);
  }

  /** Validate the entered colors and hand them to the right solver. */
  async function runSolve() {
    const scene = sceneRef.current;
    if (!scene) return;
    sfx.tap();
    const grids = scene.getPaintedColors(size);
    const check = checkColorCounts(size, grids);
    if (!check.ok) {
      setPaintError(check.reason ?? "Check the colors.");
      sfx.wrong();
      return;
    }
    const engine = Cube.fromColors(size, grids);
    if (engine.isSolved()) {
      startSolvePlan(engine, []);
      return;
    }
    let moves: Move[];
    if (size === 2) {
      moves = solve2x2(engine);
    } else {
      setThinking(true);
      const res = await solverRef.current!.solve(cubeToFacelets(engine));
      setThinking(false);
      if (!res.ok) {
        setPaintError("Hmm — that can't happen on a real cube. Check the colors!");
        sfx.wrong();
        return;
      }
      moves = res.moves;
    }
    if (moves.length === 0 && !engine.isSolved()) {
      setPaintError("Hmm — that can't happen on a real cube. Check the colors!");
      sfx.wrong();
      return;
    }
    startSolvePlan(engine, moves);
  }

  /** Lock in the solution and switch to the step-by-step coach. */
  function startSolvePlan(engine: Cube, moves: Move[]) {
    engineRef.current = engine;
    sceneRef.current?.exitPaint();
    setPlan(moves);
    setPayout(Math.max(4, Math.min(24, moves.length)));
    if (moves.length === 0) {
      earnDust(4, "cube-coach");
      setSolves((c) => c + 1);
      sfx.stageComplete();
      setPhase("solved");
    } else {
      setPhase("solve");
    }
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

  /** Auto-mix: a quick animated scramble (4×4 / 5×5 coach path). */
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

  /** START SOLVING for the coach path: the plan is the inverse of the mix. */
  function startCoaching() {
    sfx.tap();
    const p = solutionFor(history);
    setPlan(p);
    setPayout(Math.max(4, Math.min(24, p.length)));
    setPhase("solve");
  }

  /** The big DO IT button: perform the next coached move and watch it animate. */
  function doNext() {
    if (!next) return;
    const ok = doTurn(next, false, () => {
      sfx.correct();
      if (engineRef.current.isSolved()) {
        earnDust(payout, "cube-coach");
        setSolves((c) => c + 1);
        sfx.stageComplete();
        setPhase("solved");
      }
    });
    if (ok) {
      sfx.tap();
      setPlan((p) => p.slice(1));
    }
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
        {phase === "paint" && (
          <span className="cube-instruction">
            {remaining > 0 ? <>Pick a color, tap the cube to match yours · {remaining} to go</> : <>All set — tap SOLVE! 🧭</>}
          </span>
        )}
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
      {phase !== "pick" && <p className="dim cube-orbit-note">🔄 Drag to look around</p>}

      {phase === "paint" && (
        <>
          <div className="cube-palette">
            {PALETTE.map((face) => (
              <button
                key={face}
                className={`cube-swatch${selColor === face ? " is-sel" : ""}`}
                style={{ background: FACE_COLORS[face] }}
                aria-label={COLOR_LABEL[face]}
                onClick={() => pickColor(face)}
              />
            ))}
          </div>
          {paintError && <p className="cube-paint-error">{paintError}</p>}
          <div className="celebration-actions">
            <button className="btn btn-secondary" onClick={() => startPainting(size)}>
              ↺ Start over
            </button>
            <button className="btn btn-primary" disabled={remaining > 0 || thinking} onClick={runSolve}>
              {thinking ? "🧠 Thinking…" : "🧭 SOLVE!"}
            </button>
          </div>
        </>
      )}

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
            <button className="btn btn-primary" disabled={stepsLeft === 0} onClick={startCoaching}>
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
            <p className="catch-howto">Solve a real cube!</p>
            <p className="catch-howto dim">
              2×2 &amp; 3×3: paint your cube to match the one in your hand, then I show you every turn to solve it. 4×4 &amp; 5×5: I
              mix one up and coach you back.
            </p>
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
