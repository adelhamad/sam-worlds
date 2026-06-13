// Orchestration for the 4×4/5×5 "reduction" solve: validate the entered
// colors, solve centers, pair edges, then read the cube as a 3×3 and let the
// caller's Kociemba solver finish it. Wing parity makes some attempts land on
// a 3×3 state that isn't solvable — those retry with a fresh seeded scramble
// prefix (which re-rolls parity through the center stage). A returned plan is
// always re-applied and checked solved, so a bad plan can never reach Sam.
import { cancelMoves, FACES, type Face, type Move } from "../cube";
import { parseSolution } from "../cubesolve";
import { mulberry32 } from "../rng";
import { applyOps, solveCenters } from "./centers";
import { pairEdges } from "./edges";
import {
  cornersOf,
  edgesOf,
  isAllSolved,
  makeOps,
  outerMoves,
  slotIndex,
  sliceMoves2,
  sliceMoves3,
  stateFromGrids,
  type Op,
} from "./tables";
import { validateBig } from "./validate";

export type Solve3 = (facelets: string) => string | null;

export type BigSolveResult = { ok: true; moves: Move[] } | { ok: false; reason?: string };

const FACELET_ORDER: Face[] = ["U", "R", "F", "D", "L", "B"]; // cubejs order

/** Read the reduced cube as a 3×3 facelet string (call only when fully paired). */
function reducedFacelets(n: number, state: Uint8Array): string {
  const s3 = new Uint8Array(54);
  for (let f = 0; f < 6; f++) s3[slotIndex(3, f, 1, 1)] = f;
  const bigC = cornersOf(n);
  const smallC = cornersOf(3);
  for (let k = 0; k < 8; k++) {
    for (let i = 0; i < 3; i++) s3[smallC[k].slots[i]] = state[bigC[k].slots[i]];
  }
  const bigE = edgesOf(n);
  const smallE = edgesOf(3);
  for (let k = 0; k < 12; k++) {
    s3[smallE[k].a[0]] = state[bigE[k].a[0]];
    s3[smallE[k].b[0]] = state[bigE[k].b[0]];
  }
  let str = "";
  for (const face of FACELET_ORDER) {
    const f = FACES.indexOf(face);
    for (let i = 0; i < 9; i++) str += FACES[s3[f * 9 + i]];
  }
  return str;
}

/** Slice turns aren't kid-turnable; emit them as wide turn + outer/wide undo. */
function toCoachable(mv: Move): Move[] {
  if (!mv.slice) return [mv];
  const d = mv.depth ?? 1;
  if (d <= 2) {
    return [
      { face: mv.face, prime: mv.prime, depth: 2 },
      { face: mv.face, prime: !mv.prime },
    ];
  }
  return [
    { face: mv.face, prime: mv.prime, depth: 3 },
    { face: mv.face, prime: !mv.prime, depth: 2 },
  ];
}

const opCache = new Map<string, Op[]>();

function allMoveOps(n: number): Op[] {
  const key = `all:${n}`;
  let ops = opCache.get(key);
  if (!ops) {
    const moves = [...outerMoves(), ...sliceMoves2(), ...(n % 2 === 1 ? sliceMoves3() : [])];
    ops = makeOps(n, moves.map((m) => [m]));
    opCache.set(key, ops);
  }
  return ops;
}

function outerOps(n: number): Op[] {
  const key = `outer:${n}`;
  let ops = opCache.get(key);
  if (!ops) {
    ops = makeOps(n, outerMoves().map((m) => [m]));
    opCache.set(key, ops);
  }
  return ops;
}

/** Apply the 3×3 stage solution (outer turns only) to the big state. */
function applyThree(n: number, state: Uint8Array, sol: Move[], out: Move[]): void {
  const ops = outerOps(n);
  for (const mv of sol) {
    const idx = ops.findIndex((o) => o.seq[0].face === mv.face && o.seq[0].prime === mv.prime);
    applyOps(state, ops, [idx], out);
  }
}

export function solveBigCube(n: number, grids: Record<Face, Face[][]>, seed: number, solve3: Solve3): BigSolveResult {
  const state0 = stateFromGrids(n, grids);
  const check = validateBig(n, state0);
  if (!check.ok) return { ok: false, reason: check.reason };
  if (isAllSolved(n, state0)) return { ok: true, moves: [] };

  const rng = mulberry32(seed);
  const shuffleOps = allMoveOps(n);
  for (let attempt = 0; attempt < 25; attempt++) {
    const state = state0.slice();
    const moves: Move[] = [];
    if (attempt > 0) {
      const count = 1 + Math.floor(rng() * 3);
      for (let i = 0; i < count; i++) applyOps(state, shuffleOps, [Math.floor(rng() * shuffleOps.length)], moves);
    }
    if (!solveCenters(n, state, moves)) continue;
    if (!pairEdges(n, state, moves, rng)) continue;
    const sol = solve3(reducedFacelets(n, state));
    if (sol === null) continue;
    applyThree(n, state, parseSolution(sol), moves);
    if (!isAllSolved(n, state)) continue; // never hand out an unverified plan
    return { ok: true, moves: cancelMoves(moves.flatMap(toCoachable)) };
  }
  return { ok: false };
}
