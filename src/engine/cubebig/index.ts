// Real-state solver for hand-painted big cubes, by reduction:
//   1. validate the painted pieces (multisets + a 3×3-legality probe),
//   2. solve centers, pair edge groups (centers.ts / edges.ts),
//   3. sample the reduced cube down to 3×3 facelets and let the Kociemba
//      solver finish with outer turns only.
// Parity defects (odd wing permutation — it surfaces as a "stuck" last pair
// of edges or as a flip/swap the 3×3 solver silently normalizes away) are
// read off the mapped cube and fixed with two derived sequences before the
// final phase. Every candidate step is validated against the lattice model,
// so a wrong solution can never be returned.
//
// Production-ready for 4×4 (mass-verified by scripts/verify-cube.ts). The
// code is written n-generically, but 5×5 center solving doesn't converge yet
// — the UI only routes 4×4 here.
import { compress, Cube, FACES, type Face, type Move } from "../cube";
import { FACELET_ORDER, parseSolution } from "../cubesolve";
import { mulberry32, pick, type RNG } from "../rng";
import { mappedDefects } from "./defects";
import { solveCenters } from "./centers";
import { pairEdges } from "./edges";
import { checkPieces, genMoves, makeScorers, type Scorers } from "./pieces";

/** Synchronous 3×3 facelet solver (cubejs in the worker); null = no solution. */
export type Solve3 = (facelets: string) => string | null;

export type BigSolveResult = { ok: true; moves: Move[] } | { ok: false; reason?: string };

const PHASE3_TRIES = 12;
const REDUCE_TRIES = 30;

const sampleIdx = (n: number): number[] => (n === 4 ? [0, 1, 3] : [0, 2, 4]);

/** Project a (reduced) big cube onto 3×3 facelets: corners, one sticker per
 *  edge group, one center sticker per face. On a 5×5 this samples exactly the
 *  embedded 3×3 (corners + midges + fixed centers). */
export function mapTo3(cube: Cube): string {
  const idx = sampleIdx(cube.n);
  let s = "";
  for (const f of FACELET_ORDER) {
    const g = cube.faceGrid(f);
    for (const r of idx) for (const c of idx) s += g[r][c];
  }
  return s;
}

/**
 * Corner legality for even cubes: drop the painted corners onto a 3×3 whose
 * other pieces are solved. A twisted corner makes both variants unsolvable;
 * the U-turned variant absorbs the case where the corner permutation alone is
 * odd (legal on a 4×4, where wings carry no parity).
 */
function cornersLegal(cube: Cube, solve3: Solve3): boolean {
  if (cube.n % 2 === 1) return solve3(mapTo3(cube)) !== null; // real embedded 3×3
  const m = cube.n - 1;
  for (const variant of [0, 1]) {
    const base = new Cube(3);
    if (variant) base.turn({ face: "U", prime: false });
    let s = "";
    for (const f of FACELET_ORDER) {
      const bg = cube.faceGrid(f);
      const grid = base.faceGrid(f);
      grid[0][0] = bg[0][0];
      grid[0][2] = bg[0][m];
      grid[2][0] = bg[m][0];
      grid[2][2] = bg[m][m];
      for (const row of grid) s += row.join("");
    }
    if (solve3(s) !== null) return true;
  }
  return false;
}

/**
 * Centers + edge pairing. When pairing gets stuck (last-two-edges tangle,
 * which needs an odd number of slice quarter turns), kick ONE slice quarter —
 * flipping the wing parity — plus two outer turns so the pairing search can't
 * simply find the kick's inverse and restore the same tangle.
 */
function reduce(cube: Cube, scorers: Scorers, record: (mv: Move) => void, rng: RNG, kick: () => void): boolean {
  for (let i = 0; i < REDUCE_TRIES; i++) {
    if (!solveCenters(cube, scorers, record, rng)) return false;
    if (pairEdges(cube, scorers, record) === "paired") return true;
    kick();
  }
  return false;
}

function gridSeed(grids: Record<Face, Face[][]>): number {
  let h = 2166136261;
  for (const f of FACES) {
    for (const row of grids[f]) for (const c of row) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  }
  return h >>> 0;
}

/**
 * Solve a painted 4×4/5×5. Deterministic for a given painting (seeded RNG),
 * and self-verifying: the returned move list provably solves the entered
 * state, or `{ ok: false }` comes back.
 */
export function solveBigCube(n: number, grids: Record<Face, Face[][]>, solve3: Solve3): BigSolveResult {
  const cube = Cube.fromColors(n, grids);
  const pieces = checkPieces(cube);
  if (!pieces.ok) return { ok: false, reason: pieces.reason };
  if (!cornersLegal(cube, solve3)) return { ok: false };
  const rng = mulberry32(gridSeed(grids));
  const scorers = makeScorers(cube);
  const moves: Move[] = [];
  const record = (mv: Move) => moves.push(mv);
  const outers = genMoves(n).filter((g) => (g.layer ?? 0) === 0);
  /**
   * Parity kick:  (d F2)×4 d  has FIVE slice quarter turns (odd — it flips
   * the wing permutation parity that causes both the last-two-edges tangle
   * and the flip the 3×3 solver silently normalizes away) yet leaves every
   * center cell on its own face, so the centers stage cannot "repair" it
   * back. Random outer turns around it keep retries from cycling.
   */
  const kick = (): void => {
    const seq: Move[] = [pick(rng, outers)];
    for (let i = 0; i < 5; i++) {
      seq.push({ face: "D", prime: false, layer: 1 });
      if (i < 4) seq.push({ face: "F", prime: false }, { face: "F", prime: false });
    }
    seq.push(pick(rng, outers));
    for (const mv of seq) {
      cube.turn(mv);
      record(mv);
    }
  };

  /**
   * PLL-parity kick (4×4 only):  r2 U2 r2 U2u2 r2 u2  keeps the cube fully
   * reduced (centers + pairs intact) while flipping the dedge-vs-corner
   * permutation parity — the other flavor the 3×3 solver normalizes away.
   * Odd cubes can't have this defect (midges pin the permutation parity).
   */
  const pllKick = (): void => {
    const seq: Move[] = [pick(rng, outers)];
    const r2: Move[] = [
      { face: "R", prime: false, layer: 1 },
      { face: "R", prime: false, layer: 1 },
    ];
    const U2: Move[] = [
      { face: "U", prime: false },
      { face: "U", prime: false },
    ];
    const u2: Move[] = [
      { face: "U", prime: false, layer: 1 },
      { face: "U", prime: false, layer: 1 },
    ];
    seq.push(...r2, ...U2, ...r2, ...U2, ...u2, ...r2, ...u2, pick(rng, outers));
    for (const mv of seq) {
      cube.turn(mv);
      record(mv);
    }
  };

  for (let attempt = 0; attempt < PHASE3_TRIES; attempt++) {
    if (!reduce(cube, scorers, record, rng, kick)) return { ok: false };
    // read both parity defects straight off the mapped cube and fix them
    // up-front: a flip needs the (re-reducing) EO kick, a permutation defect
    // the reduction-preserving PLL kick
    const d = mappedDefects(mapTo3(cube));
    if (d.eoOdd) {
      kick();
      continue;
    }
    if (d.permOdd && n === 4) pllKick();
    const sol = solve3(mapTo3(cube));
    if (sol !== null) {
      // commit only if the 3×3 phase genuinely finishes the big cube
      const finish = parseSolution(sol);
      const check = cube.clone();
      for (const mv of finish) check.turn(mv);
      if (check.isSolved()) {
        for (const mv of finish) {
          cube.turn(mv);
          record(mv);
        }
        return { ok: true, moves: compress(moves) };
      }
    }
    // shouldn't happen — reshuffle and retry
    kick();
  }
  return { ok: false };
}
