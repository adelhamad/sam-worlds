import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { newSeed } from "../../engine/rng";
import { Cube, FACE_AXIS, FACE_COLORS, FACES, type Face, type Move, type Vec } from "../../engine/cube";
import { checkColorCounts, cubeToFacelets, solve2x2 } from "../../engine/cubesolve";
import { Cube3Solver } from "../../engine/cube3solver";
import { BigCubeSolver } from "../../engine/bigcube/client";
import { CubeScene, type PaintState } from "../../three/CubeScene";

const EMPTY_COUNTS: Record<Face, number> = { U: 0, D: 0, L: 0, R: 0, F: 0, B: 0 };

const FACE_LABEL: Record<Face, string> = { U: "TOP", D: "BOTTOM", F: "FRONT", B: "BACK", L: "LEFT", R: "RIGHT" };
const SIZES = [
  { n: 2, name: "2×2 Mini" },
  { n: 3, name: "3×3 Classic" },
  { n: 4, name: "4×4 Big" },
  { n: 5, name: "5×5 Huge" },
];
/** Palette order: white, yellow, green, blue, orange, red. */
const PALETTE: Face[] = ["U", "D", "F", "B", "L", "R"];
const COLOR_LABEL: Record<Face, string> = { U: "White", D: "Yellow", F: "Green", B: "Blue", L: "Orange", R: "Red" };

/** Reference stickers locked before painting so the entered cube can't drift. */
function lockedStickers(n: number): { grid: Vec; face: Face; color: Face }[] {
  if (n % 2 === 0) {
    // Even cubes have no fixed centers — pin the back-bottom-left corner so the
    // cube's orientation (which color faces where) can't drift while painting.
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

/** A coach instruction for one move — names the face and how many layers turn. */
function moveLabel(mv: Move): { face: Face; text: string; turn: string } {
  const depth = mv.depth ?? 1;
  const layers = depth > 1 ? ` (${depth} layers)` : "";
  return { face: mv.face, text: `${FACE_LABEL[mv.face]}${layers}`, turn: mv.prime ? "↺" : "↻" };
}

type Phase = "pick" | "paint" | "solve" | "solved";

/**
 * Cube Coach. For every size (2×2 … 5×5) the player paints the cube to match
 * the real one in their hand, then a true solver calls out every turn:
 *   • 2×2 — meet-in-the-middle search.
 *   • 3×3 — Kociemba two-phase (cubejs, in a worker).
 *   • 4×4 / 5×5 — reduction (centers + edge pairing) finished by cubejs, also
 *     in a worker. Bigger cubes need wide (multi-layer) turns, which the coach
 *     labels and the 3D view animates.
 */
export function CubeCoach() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CubeScene | null>(null);
  const engineRef = useRef<Cube>(new Cube(3));
  const solverRef = useRef<Cube3Solver | null>(null);
  const bigSolverRef = useRef<BigCubeSolver | null>(null);

  const [size, setSize] = useState(3);
  const [payout, setPayout] = useState(0);
  const [phase, setPhase] = useState<Phase>("pick");
  const [, setHistory] = useState<Move[]>([]);
  const [plan, setPlan] = useState<Move[]>([]);
  const [solves, setSolves] = useState(0);
  // Paint-flow state
  const [selColor, setSelColor] = useState<Face>("U");
  const [paint, setPaint] = useState<PaintState>({ remaining: 0, counts: EMPTY_COUNTS, cap: 0 });
  const remaining = paint.remaining;
  const [thinking, setThinking] = useState(false);
  const [paintError, setPaintError] = useState<string | null>(null);

  const next: Move | undefined = plan[0];

  // Mount the 3D scene + solver workers once (StrictMode-safe).
  useEffect(() => {
    if (!hostRef.current) return;
    const scene = CubeScene.create(hostRef.current);
    scene.setSize(3);
    sceneRef.current = scene;
    solverRef.current = new Cube3Solver();
    bigSolverRef.current = new BigCubeSolver();
    return () => {
      sceneRef.current = null;
      scene.destroy();
      solverRef.current?.destroy();
      solverRef.current = null;
      bigSolverRef.current?.destroy();
      bigSolverRef.current = null;
    };
  }, []);

  function pickSize(s: (typeof SIZES)[number]) {
    unlockAudio();
    sfx.tap();
    setSize(s.n);
    setHistory([]);
    setPlan([]);
    setPaintError(null);
    startPainting(s.n);
  }

  /** Enter paint mode: blank cube + locked references; warm the right solver. */
  function startPainting(n: number) {
    setSelColor("U");
    setPhase("paint");
    sceneRef.current?.setPaintColor("U");
    sceneRef.current?.enterPaint(n, lockedStickers(n), setPaint);
    if (n === 3) solverRef.current?.warmUp();
    if (n >= 4) bigSolverRef.current?.warmUp();
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
    } else if (size === 3) {
      setThinking(true);
      const res = await solverRef.current!.solve(cubeToFacelets(engine));
      setThinking(false);
      if (!res.ok) {
        setPaintError("Hmm — that can't happen on a real cube. Check the colors!");
        sfx.wrong();
        return;
      }
      moves = res.moves;
    } else {
      setThinking(true);
      const res = await bigSolverRef.current!.solve(size, grids, newSeed());
      setThinking(false);
      if (!res.ok) {
        setPaintError(res.reason ?? "Hmm — that can't happen on a real cube. Check the colors!");
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
            {remaining > 0 ? <>Tap to paint · tap again to undo · {remaining} to go</> : <>All set — tap SOLVE! 🧭</>}
          </span>
        )}
        {phase === "solve" && next && (
          <span className="cube-instruction">
            Turn <b style={{ color: FACE_COLORS[next.face] }}>{moveLabel(next).text}</b> {moveLabel(next).turn} ·{" "}
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
            {PALETTE.map((face) => {
              const left = Math.max(0, paint.cap - (paint.counts[face] ?? 0));
              return (
                <button
                  key={face}
                  className={`cube-swatch${selColor === face ? " is-sel" : ""}${left === 0 ? " is-full" : ""}`}
                  style={{ background: FACE_COLORS[face] }}
                  aria-label={`${COLOR_LABEL[face]} — ${left} left`}
                  onClick={() => pickColor(face)}
                >
                  <span className="cube-swatch-count">{left}</span>
                </button>
              );
            })}
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
              Paint your cube to match the one in your hand, then I show you every turn to solve it. Bigger cubes use wide
              turns — I&apos;ll tell you how many layers to grab.
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
