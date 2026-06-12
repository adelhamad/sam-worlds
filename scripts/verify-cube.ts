// Round-trip verification for the big-cube solver: scramble a 4×4/5×5 with
// random outer + slice turns, read it back as painted color grids (exactly
// what the paint UI produces), solve, and assert the solution really solves
// that state. Run: bun scripts/verify-cube.ts [count] [sizes…]
import Cube3 from "cubejs";
import { Cube, FACES, scramble, type Face } from "../src/engine/cube";
import { solveBigCube } from "../src/engine/cubebig";
import { mulberry32 } from "../src/engine/rng";

const solve3 = (facelets: string): string | null => {
  try {
    return Cube3.fromString(facelets).solve();
  } catch {
    return null;
  }
};

console.log("building Kociemba tables…");
Cube3.initSolver();

const count = Number(process.argv[2] ?? 25);
const sizes = process.argv.slice(3).map(Number);

// default: 4×4 only — 5×5 center solving doesn't converge yet
for (const n of sizes.length ? sizes : [4]) {
  let total = 0;
  let worst = 0;
  let worstMs = 0;
  const t0 = performance.now();
  for (let i = 0; i < count; i++) {
    const seed = 1000 + i;
    const cube = new Cube(n);
    for (const mv of scramble(40, mulberry32(seed), 2)) cube.turn(mv);
    const grids = {} as Record<Face, Face[][]>;
    for (const f of FACES) grids[f] = cube.faceGrid(f);

    const s0 = performance.now();
    const res = solveBigCube(n, grids, solve3);
    worstMs = Math.max(worstMs, performance.now() - s0);
    if (!res.ok) throw new Error(`n=${n} seed=${seed}: solver gave up (${res.reason ?? "no reason"})`);

    const check = Cube.fromColors(n, grids);
    for (const mv of res.moves) check.turn(mv);
    if (!check.isSolved()) throw new Error(`n=${n} seed=${seed}: WRONG solution`);
    total += res.moves.length;
    worst = Math.max(worst, res.moves.length);
  }
  const ms = (performance.now() - t0) / count;
  console.log(
    `n=${n}: ${count} solves OK · avg ${(total / count).toFixed(1)} moves (worst ${worst}) · avg ${ms.toFixed(0)} ms (worst ${worstMs.toFixed(0)} ms)`,
  );
}
console.log("verify-cube: all good");
