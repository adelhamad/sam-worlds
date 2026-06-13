// Dev harness for the 4×4/5×5 reduction solver. Not part of the app build.
//   bun scripts/verify-bigcube.ts [iterations] [sizes…]
// 1. Cross-checks the solver's permutation tables against the Cube engine.
// 2. Round-trips random scrambles: scramble → solveBigCube → apply → solved?
import Cube3 from "cubejs";
import { solveBigCube } from "../src/engine/bigcube";
import { applyTable, isAllSolved, outerMoves, sliceMoves2, sliceMoves3, stateFromGrids, tableFor } from "../src/engine/bigcube/tables";
import { Cube, FACES, type Face, type Move } from "../src/engine/cube";
import { mulberry32, type RNG } from "../src/engine/rng";

const args = process.argv.slice(2);
const ITER = Number(args[0] ?? 20);
const SIZES = args.slice(1).map(Number).filter(Boolean);
const sizes = SIZES.length > 0 ? SIZES : [4, 5];

function gridsOf(cube: Cube): Record<Face, Face[][]> {
  const grids = {} as Record<Face, Face[][]>;
  for (const f of FACES) grids[f] = cube.faceGrid(f);
  return grids;
}

function movePool(n: number): Move[] {
  return [...outerMoves(), ...sliceMoves2(), ...(n % 2 === 1 ? sliceMoves3() : [])];
}

function randomScramble(n: number, count: number, rng: RNG): Move[] {
  const pool = movePool(n);
  return Array.from({ length: count }, () => pool[Math.floor(rng() * pool.length)]);
}

/**
 * On a real 5×5 the six middle centers form a rigid frame (the core), so a
 * player entering colors always holds the cube in the standard orientation.
 * Engine central slices break that frame — re-align it after scrambling, the
 * way a player would by rotating the physical cube.
 */
function alignMiddles(cube: Cube, n: number): void {
  if (n % 2 === 0) return;
  const c = (n - 1) / 2;
  const aligned = (q: Cube): boolean => FACES.every((f) => q.faceGrid(f)[c][c] === f);
  if (aligned(cube)) return;
  const pool = sliceMoves3();
  // BFS over central-slice turns only (frame space is tiny: 24 rotations).
  let frontier: { c: Cube; path: Move[] }[] = [{ c: cube.clone(), path: [] }];
  for (let depth = 0; depth < 4; depth++) {
    const next: typeof frontier = [];
    for (const node of frontier) {
      for (const mv of pool) {
        const q = node.c.clone();
        q.turn(mv);
        if (aligned(q)) {
          for (const m of [...node.path, mv]) cube.turn(m);
          return;
        }
        next.push({ c: q, path: [...node.path, mv] });
      }
    }
    frontier = next;
  }
  throw new Error("could not re-align middle centers");
}

// ---- 1. table consistency ----------------------------------------------------
for (const n of sizes) {
  const rng = mulberry32(12345 + n);
  const cube = new Cube(n);
  let state = stateFromGrids(n, gridsOf(cube));
  const scratch = new Uint8Array(state.length);
  for (const mv of randomScramble(n, 300, rng)) {
    cube.turn(mv);
    applyTable(state, tableFor(n, mv), scratch);
    state = scratch.slice();
    const fromCube = stateFromGrids(n, gridsOf(cube));
    for (let i = 0; i < state.length; i++) {
      if (state[i] !== fromCube[i]) {
        console.error(`TABLE MISMATCH n=${n} after ${JSON.stringify(mv)}`);
        process.exit(1);
      }
    }
  }
  console.log(`tables ok for n=${n}`);
}

// ---- 2. round-trip solves ------------------------------------------------------
console.log("initialising cubejs…");
Cube3.initSolver();

const solve3 = (facelets: string): string | null => {
  try {
    return Cube3.fromString(facelets).solve() as string;
  } catch {
    return null;
  }
};

for (const n of sizes) {
  let fails = 0;
  let totalMoves = 0;
  let maxMoves = 0;
  let totalMs = 0;
  let maxMs = 0;
  for (let it = 0; it < ITER; it++) {
    const rng = mulberry32(1000 * n + it);
    const cube = new Cube(n);
    for (const mv of randomScramble(n, 40, rng)) cube.turn(mv);
    alignMiddles(cube, n);
    const grids = gridsOf(cube);
    const t0 = performance.now();
    const res = solveBigCube(n, grids, 1000 * n + it, solve3);
    const ms = performance.now() - t0;
    totalMs += ms;
    maxMs = Math.max(maxMs, ms);
    if (!res.ok) {
      fails++;
      console.error(`  n=${n} it=${it}: solver gave up (${res.reason ?? "no reason"}) in ${ms.toFixed(0)}ms`);
      continue;
    }
    for (const mv of res.moves) cube.turn(mv);
    if (!cube.isSolved()) {
      fails++;
      console.error(`  n=${n} it=${it}: PLAN DID NOT SOLVE THE CUBE`);
      continue;
    }
    // double-check via the table state too
    const st = stateFromGrids(n, gridsOf(cube));
    if (!isAllSolved(n, st)) {
      fails++;
      console.error(`  n=${n} it=${it}: state mismatch after solve`);
      continue;
    }
    totalMoves += res.moves.length;
    maxMoves = Math.max(maxMoves, res.moves.length);
  }
  const okCount = ITER - fails;
  console.log(
    `n=${n}: ${okCount}/${ITER} solved · avg ${(totalMoves / Math.max(1, okCount)).toFixed(0)} moves (max ${maxMoves}) · avg ${(totalMs / ITER).toFixed(0)}ms (max ${maxMs.toFixed(0)}ms)`,
  );
  if (fails > 0) process.exitCode = 1;
}
