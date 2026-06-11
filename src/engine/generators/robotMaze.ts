// Robot Valley — a blocky miner-bot digs for diamonds (Minecraft-flavored).
// Sam programs it with blocks (forward / turn) and presses RUN; the widget
// simulates the run and submits the outcome.
import { randInt, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

export interface RobotParams {
  size: number; // grid side 4..6
  pathLen: number; // walk length 3..9
  turns: number; // max direction changes in the solution path
}

export interface MazePayload extends Record<string, unknown> {
  w: number;
  h: number;
  start: [number, number];
  dir: "N" | "E" | "S" | "W";
  goal: [number, number];
  rocks: Array<[number, number]>;
}

const DIRS: Array<[number, number]> = [
  [0, -1], // N
  [1, 0], // E
  [0, 1], // S
  [-1, 0], // W
];

let qid = 0;

export function generateRobotMaze(params: RobotParams, rng: RNG, ctx: GenContext): Question {
  const size = ctx.easier ? Math.max(4, params.size - 1) : params.size;
  const pathLen = ctx.easier ? Math.max(2, params.pathLen - 2) : params.pathLen;

  for (let tries = 0; tries < 80; tries++) {
    const maze = carvePath(size, pathLen, params.turns, rng);
    if (maze) {
      return {
        id: `rv${++qid}`,
        prompt: "Program the miner-bot to the 💎!",
        answer: "reached",
        choices: [],
        hint: "Count the squares before each turn.",
        inputMode: "commands",
        dedupeKey: `${maze.start}-${maze.goal}-${maze.dir}-${maze.rocks.length}`,
        payload: maze,
      };
    }
  }
  // tiny guaranteed fallback
  return {
    id: `rv${++qid}`,
    prompt: "Program the miner-bot to the 💎!",
    answer: "reached",
    choices: [],
    hint: "Just go forward!",
    inputMode: "commands",
    payload: { w: 4, h: 4, start: [0, 1], dir: "E", goal: [2, 1], rocks: [] } as MazePayload,
  };
}

function carvePath(size: number, pathLen: number, maxTurns: number, rng: RNG): MazePayload | null {
  const start: [number, number] = [randInt(rng, 0, size - 1), randInt(rng, 0, size - 1)];
  let dirIdx = randInt(rng, 0, 3);
  const startDir = dirIdx;
  const path = new Set<string>([start.join(",")]);
  let [x, y] = start;
  let turns = 0;

  for (let step = 0; step < pathLen; step++) {
    if (turns < maxTurns && rng() < 0.3 && step > 0) {
      dirIdx = (dirIdx + (rng() < 0.5 ? 1 : 3)) % 4;
      turns++;
    }
    const [dx, dy] = DIRS[dirIdx];
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= size || ny >= size || path.has(`${nx},${ny}`)) return null;
    x = nx;
    y = ny;
    path.add(`${x},${y}`);
  }
  if (x === start[0] && y === start[1]) return null;

  // scatter stone blocks off the path
  const rocks: Array<[number, number]> = [];
  for (let ry = 0; ry < size; ry++) {
    for (let rx = 0; rx < size; rx++) {
      if (!path.has(`${rx},${ry}`) && rng() < 0.35) rocks.push([rx, ry]);
    }
  }
  return {
    w: size,
    h: size,
    start,
    dir: (["N", "E", "S", "W"] as const)[startDir],
    goal: [x, y],
    rocks,
  };
}
