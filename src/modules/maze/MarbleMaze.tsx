import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../../state/store";
import { TiltMazeScene, type MazeSpec, type MazeTarget } from "../../pixi/TiltMazeScene";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { attachTilt, calibrateTilt, requestTiltPermission, vibrate } from "../../engine/sensors";
import { mulberry32, newSeed, pick, randInt, shuffle, type RNG } from "../../engine/rng";

const MAZES_PER_RUN = 3;
const TILT_RANGE = 22; // degrees of tilt for full speed

/** Recursive-backtracker maze: returns the wall segments that REMAIN. */
function genMazeWalls(cols: number, rows: number, rng: RNG): Array<[number, number, number, number]> {
  const open = new Set<string>(); // openings carved between cells
  const visited = new Set<string>();
  const stack: Array<[number, number]> = [[0, 0]];
  visited.add("0,0");
  while (stack.length) {
    const [c, r] = stack[stack.length - 1];
    const neighbors = (
      [
        [c + 1, r, `v${c + 1},${r}`],
        [c - 1, r, `v${c},${r}`],
        [c, r + 1, `h${c},${r + 1}`],
        [c, r - 1, `h${c},${r}`],
      ] as Array<[number, number, string]>
    ).filter(([nc, nr]) => nc >= 0 && nr >= 0 && nc < cols && nr < rows && !visited.has(`${nc},${nr}`));
    if (!neighbors.length) {
      stack.pop();
      continue;
    }
    const [nc, nr, wall] = pick(rng, neighbors);
    open.add(wall);
    visited.add(`${nc},${nr}`);
    stack.push([nc, nr]);
  }
  // extra openings so there are loops (more fun, less dead-end backtracking)
  for (let i = 0; i < Math.floor(cols * rows * 0.12); i++) {
    const c = randInt(rng, 1, cols - 1);
    const r = randInt(rng, 0, rows - 1);
    open.add(rng() < 0.5 ? `v${c},${r}` : `h${randInt(rng, 0, cols - 1)},${randInt(rng, 1, rows - 1)}`);
  }

  const walls: Array<[number, number, number, number]> = [
    [0, 0, cols, 0],
    [0, rows, cols, rows],
    [0, 0, 0, rows],
    [cols, 0, cols, rows],
  ];
  for (let c = 1; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (!open.has(`v${c},${r}`)) walls.push([c, r, c, r + 1]);
    }
  }
  for (let c = 0; c < cols; c++) {
    for (let r = 1; r < rows; r++) {
      if (!open.has(`h${c},${r}`)) walls.push([c, r, c + 1, r]);
    }
  }
  return walls;
}

/** Educational sequences: collect IN ORDER. */
function genSequence(rng: RNG, count: number): { labels: string[]; title: string } {
  const kind = pick(rng, ["by2", "by5", "by10", "abc", "odd"] as const);
  if (kind === "abc") {
    const start = randInt(rng, 0, 20);
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(start, start + count);
    return { labels: [...letters], title: "Alphabet order!" };
  }
  const steps: Record<string, number> = { by2: 2, by5: 5, by10: 10, odd: 2 };
  const step = steps[kind];
  const start = kind === "odd" ? randInt(rng, 0, 4) * 2 + 1 : step * randInt(rng, 1, 4);
  const labels = Array.from({ length: count }, (_, i) => String(start + i * step));
  return { labels, title: kind === "odd" ? "Odd numbers, small to big!" : `Count by ${step}s!` };
}

function genMaze(rng: RNG, tier: number): { spec: MazeSpec; labels: string[]; title: string } {
  const size = 4 + tier;
  const targetCount = 4 + Math.min(1, tier);
  const { labels, title } = genSequence(rng, targetCount);
  const cells: Array<[number, number]> = [];
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size; r++) {
      if (c !== 0 || r !== 0) cells.push([c, r]);
    }
  }
  const spots = shuffle(rng, cells);
  const targets: MazeTarget[] = labels.map((label, i) => ({ id: i, cell: spots[i], label }));
  const holes = spots.slice(targetCount, targetCount + 1 + tier);
  return {
    spec: { cols: size, rows: size, walls: genMazeWalls(size, size, rng), holes, targets, start: [0, 0] },
    labels,
    title,
  };
}

export function MarbleMaze() {
  const navigate = useNavigate();
  const earnDust = useGame((s) => s.earnDust);
  const starDust = useGame((s) => s.starDust);

  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<TiltMazeScene | null>(null);
  const rngRef = useRef<RNG>(mulberry32(newSeed()));
  const labelsRef = useRef<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [mazeNum, setMazeNum] = useState(1);
  const [nextIdx, setNextIdx] = useState(0);
  const [collected, setCollected] = useState(0);
  const [title, setTitle] = useState("");
  const [falls, setFalls] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    let cancelled = false;
    void TiltMazeScene.create(hostRef.current).then((scene) => {
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

  function loadMaze(tier: number): void {
    const { spec, labels: seq, title: t } = genMaze(rngRef.current, tier);
    labelsRef.current = seq;
    setLabels(seq);
    setTitle(t);
    setNextIdx(0);
    sceneRef.current?.loadMaze(spec);
  }

  useEffect(() => {
    if (phase !== "play") return;
    const scene = sceneRef.current;
    if (!scene) return;
    scene.onHole = () => {
      sfx.wrong();
      vibrate(90);
      setFalls((f) => f + 1);
      setNote("🕳️ Whoops!");
      setTimeout(() => setNote(null), 1000);
    };
    scene.onTarget = (id) => {
      setNextIdx((idx) => {
        if (id === idx) {
          sfx.correct();
          vibrate(30);
          scene.collect(id);
          setCollected((c) => c + 1);
          const next = idx + 1;
          if (next >= labelsRef.current.length) {
            sfx.stageComplete();
            setTimeout(() => {
              setMazeNum((m) => {
                if (m >= MAZES_PER_RUN) {
                  setPhase("done");
                  return m;
                }
                loadMaze(m);
                return m + 1;
              });
            }, 900);
          }
          return next;
        }
        sfx.wrong();
        scene.rejectFlash(id);
        return idx;
      });
    };
    return () => {
      scene.onHole = undefined;
      scene.onTarget = undefined;
    };
  }, [phase]);

  // tilt steering (orientation with motion fallback) + touch fallback
  useEffect(() => {
    if (phase !== "play") return;
    const detachTilt = attachTilt((tx, ty) => {
      sceneRef.current?.setTilt(tx / TILT_RANGE, ty / TILT_RANGE);
    });
    let dragging = false;
    const onPointer = (e: PointerEvent) => {
      if (e.type === "pointerdown") dragging = true;
      if (e.type === "pointerup") {
        dragging = false;
        sceneRef.current?.setTilt(0, 0);
        return;
      }
      if (!dragging) return;
      const k = Math.min(window.innerWidth, window.innerHeight) / 3;
      sceneRef.current?.setTilt((e.clientX - window.innerWidth / 2) / k, (e.clientY - window.innerHeight / 2) / k);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerup", onPointer);
    return () => {
      detachTilt();
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerup", onPointer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    sfx.stageComplete();
    earnDust(collected * 2 + (falls === 0 ? 10 : 5), "marble-maze");
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    unlockAudio();
    sfx.tap();
    await requestTiltPermission();
    calibrateTilt(); // however he's holding it right now = neutral
    setMazeNum(1);
    setCollected(0);
    setFalls(0);
    setPhase("play");
    loadMaze(0);
  }

  const nextLabel = labels[nextIdx];

  return (
    <div className="screen stage-play">
      <div className="pixi-host orbit-host" ref={hostRef} />

      <header className="stage-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <span className="stage-title">🌀 Marble Maze</span>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      {phase === "play" && (
        <div className="catch-hud">
          <span className="catch-stat">🌀 {mazeNum}/{MAZES_PER_RUN}</span>
          {nextLabel && <span className="catch-target">Find: {nextLabel}</span>}
          <span className="catch-stat">{title}</span>
          {note && <span className="catch-stat orbit-note">{note}</span>}
        </div>
      )}

      {phase === "intro" && (
        <div className="overlay">
          <div className="panel celebration-card">
            <h2>🌀 Marble Maze</h2>
            <p className="catch-howto">Hold the tablet comfy — then tap Roll!</p>
            <p className="catch-howto dim">Tilt gently to roll the marble.</p>
            <p className="catch-howto dim">Collect the numbers IN ORDER.</p>
            <p className="catch-howto dim">Dodge the dark holes! 🕳️</p>
            <button className="btn btn-primary btn-big" onClick={() => void start()}>
              Roll!
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="overlay celebration">
          <div className="panel celebration-card">
            <h2>Maze master!</h2>
            <div className="payout">
              {collected} collected → +{collected * 2 + (falls === 0 ? 10 : 5)} ✨
            </div>
            {falls === 0 && <div className="perfect-banner">🌟 Never fell in a hole!</div>}
            <div className="celebration-actions">
              <button className="btn btn-secondary" onClick={() => { sfx.tap(); navigate("/hub"); }}>
                ← Base
              </button>
              <button className="btn btn-primary" onClick={() => void start()}>
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
