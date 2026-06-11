import { useEffect, useRef, useState } from "react";
import type { MazePayload } from "../../engine/generators/robotMaze";
import type { Question } from "../../engine/generators/types";
import { sfx } from "../../engine/feedback/audio";

type Cmd = "F" | "L" | "R";
const DIR_VEC: Record<string, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const DIR_ORDER = ["N", "E", "S", "W"];
const DIR_ARROW: Record<string, string> = { N: "▲", E: "▶", S: "▼", W: "◀" };
const CMD_ICON: Record<Cmd, string> = { F: "⬆️", L: "↩️", R: "↪️" };

interface Props {
  question: Question;
  disabled: boolean;
  onSubmit: (value: string) => void;
}

export function RobotMazeInput({ question, disabled, onSubmit }: Props) {
  const maze = question.payload as unknown as MazePayload;
  const [program, setProgram] = useState<Cmd[]>([]);
  const [bot, setBot] = useState({ x: maze.start[0], y: maze.start[1], dir: maze.dir as string });
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  function run() {
    if (!program.length) return;
    setRunning(true);
    const rocks = new Set(maze.rocks.map(([x, y]) => `${x},${y}`));
    let { x, y } = { x: maze.start[0], y: maze.start[1] };
    let dir = maze.dir as string;
    setBot({ x, y, dir });
    let step = 0;
    timer.current = setInterval(() => {
      if (step >= program.length) {
        clearInterval(timer.current!);
        setRunning(false);
        onSubmit(x === maze.goal[0] && y === maze.goal[1] ? "reached" : "lost");
        return;
      }
      const cmd = program[step++];
      if (cmd === "F") {
        const [dx, dy] = DIR_VEC[dir];
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= maze.w || ny >= maze.h || rocks.has(`${nx},${ny}`)) {
          clearInterval(timer.current!);
          setRunning(false);
          onSubmit("crashed");
          return;
        }
        x = nx;
        y = ny;
      } else {
        const i = DIR_ORDER.indexOf(dir);
        dir = DIR_ORDER[(i + (cmd === "R" ? 1 : 3)) % 4];
      }
      setBot({ x, y, dir });
    }, 300);
  }

  const cell = 100 / maze.w;
  const rocks = new Set(maze.rocks.map(([x, y]) => `${x},${y}`));

  return (
    <div className="robot-input">
      <div className="maze" style={{ aspectRatio: `${maze.w} / ${maze.h}` }}>
        {Array.from({ length: maze.h }).map((_, y) =>
          Array.from({ length: maze.w }).map((_, x) => {
            const key = `${x},${y}`;
            const isGoal = x === maze.goal[0] && y === maze.goal[1];
            const isBot = x === bot.x && y === bot.y;
            let content: React.ReactNode = "";
            if (isBot) content = <span className="bot">{DIR_ARROW[bot.dir]}</span>;
            else if (isGoal) content = "💎";
            else if (rocks.has(key)) content = "🪨";
            return (
              <div
                key={key}
                className={`maze-cell ${rocks.has(key) ? "rock" : ""}`}
                style={{ left: `${x * cell}%`, top: `${(y * 100) / maze.h}%`, width: `${cell}%`, height: `${100 / maze.h}%` }}
              >
                {content}
              </div>
            );
          }),
        )}
      </div>
      <div className="program-row">
        {program.length ? program.map((c, i) => <span key={i}>{CMD_ICON[c]}</span>) : <span className="dim">program…</span>}
      </div>
      <div className="input-actions">
        {(["F", "L", "R"] as Cmd[]).map((c) => (
          <button
            key={c}
            className="btn btn-secondary"
            disabled={disabled || running || program.length >= 16}
            onClick={() => {
              sfx.tap();
              setProgram((p) => [...p, c]);
            }}
          >
            {CMD_ICON[c]}
          </button>
        ))}
        <button className="btn btn-secondary" disabled={disabled || running || !program.length} onClick={() => setProgram((p) => p.slice(0, -1))}>
          ⌫
        </button>
        <button className="btn btn-primary" disabled={disabled || running || !program.length} onClick={run}>
          ▶ RUN
        </button>
      </div>
    </div>
  );
}
