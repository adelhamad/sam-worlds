// Centers stage of the big-cube reduction. Progress metric: the TOTAL number
// of center stickers already on their face, per class — cross pieces first,
// then (5×5) plus pieces. Any move sequence that strictly raises the sum (and
// keeps the finished class + fixed centers intact) is accepted, no matter
// which face it helps; the sum is bounded, so the stage always terminates.
// Candidates come from a shallow generic search, then from enumerating the
// freeslice insertion template  [align] [pre-rotate] slice escape slice⁻¹
// (with a commutator-close variant) and a parallel double-slice variant.
// Color multiplicity (4 identical pieces per color/class) guarantees a
// sum-raising 3-cycle always exists, and those shapes are all template-reachable.
import { FACES, inverse, type Cube, type Face, type Move } from "../cube";
import type { RNG } from "../rng";
import { pick } from "../rng";
import { genGroups, sameSlice, type Scorers } from "./pieces";

const DFS_DEPTH = 2;
const MAX_KICKS = 150;
/** Stickers per class across all faces (4 per face, both 4×4 and 5×5). */
const CLASS_TOTAL = 24;

interface Ctx {
  cube: Cube;
  scorers: Scorers;
  gens: Move[][];
  /** 0 = cross phase, 6 = plus phase (offset into the 12-wide counts). */
  phase: number;
  base: number;
  path: Move[][];
}

function classSum(counts: Int32Array, off: number): number {
  let t = 0;
  for (let i = 0; i < 6; i++) t += counts[off + i];
  return t;
}

function goalMet(ctx: Ctx): boolean {
  const counts = ctx.scorers.centerCounts();
  if (classSum(counts, ctx.phase) <= ctx.base) return false;
  if (ctx.phase > 0 && classSum(counts, 0) !== CLASS_TOTAL) return false;
  // middle slices may appear inside brackets — fixed centers must come home
  return ctx.scorers.fixedOk();
}

const apply = (cube: Cube, unit: Move[]): void => {
  for (const mv of unit) cube.turn(mv);
};
const undo = (cube: Cube, unit: Move[]): void => {
  for (let i = unit.length - 1; i >= 0; i--) cube.turn(inverse(unit[i]));
};

/** Shallow generic search for the easy placements (single slice turn etc.). */
function dfs(ctx: Ctx, depth: number): boolean {
  for (const unit of ctx.gens) {
    const prev = ctx.path[ctx.path.length - 1];
    if (prev && sameSlice(prev[0], unit[0])) continue;
    apply(ctx.cube, unit);
    ctx.path.push(unit);
    if (goalMet(ctx)) return true;
    if (depth > 1 && dfs(ctx, depth - 1)) return true;
    ctx.path.pop();
    undo(ctx.cube, unit);
  }
  return false;
}

/** The three turn units (cw, ccw, half) of one face/layer. */
function unitsOf(face: Face, layer: number): Move[][] {
  const cw: Move = { face, prime: false, layer };
  return [[cw], [{ face, prime: true, layer }], [cw, cw]];
}

const MID_FACES: Face[] = ["U", "L", "F"];

/**
 * Slice units usable inside template brackets. On odd cubes this includes the
 * middle slices — midges are free to borrow during the centers stage, and the
 * goal's fixedOk() check rejects any candidate that fails to bring the fixed
 * centers home. Middle slices never leak into open-ended search or kicks.
 */
function bracketSlices(n: number): Move[][] {
  const out = FACES.flatMap((f) => unitsOf(f, 1));
  if (n % 2 === 1) for (const f of MID_FACES) out.push(...unitsOf(f, (n - 1) / 2));
  return out;
}

/** Escape units: the working face plus (odd cubes) the middle slices — the
 *  commutator-close variant restores what a middle escape displaces. */
function escapeUnits(face: Face, n: number): Move[][] {
  const out = unitsOf(face, 0);
  if (n % 2 === 1) for (const f of MID_FACES) out.push(...unitsOf(f, (n - 1) / 2));
  return out;
}

/**
 * Enumerate the freeslice insertion template for one working face. Slots, in
 * order: an optional outer unit anywhere (aligns the source piece), an
 * optional turn of the working face (clears the landing cell), a slice unit
 * (carries the piece in), an escape (parks it out of the slice track), the
 * slice back (restores everything else), and — the commutator variant that
 * the last pieces of a face need — optionally the escape undone too.
 */
function tryTemplate(ctx: Ctx, face: Face): boolean {
  const none: Move[][] = [[]];
  const pre1s = [...none, ...FACES.flatMap((f) => unitsOf(f, 0))];
  const pre2s = [...none, ...unitsOf(face, 0)];
  const slices = bracketSlices(ctx.cube.n);
  const escapes = escapeUnits(face, ctx.cube.n);
  for (const pre1 of pre1s) {
    apply(ctx.cube, pre1);
    for (const pre2 of pre2s) {
      apply(ctx.cube, pre2);
      for (const s of slices) {
        apply(ctx.cube, s);
        if (tryEscapes(ctx, [pre1, pre2, s], escapes)) return true;
        undo(ctx.cube, s);
      }
      undo(ctx.cube, pre2);
    }
    undo(ctx.cube, pre1);
  }
  return false;
}

function tryEscapes(ctx: Ctx, prefix: Move[][], escapes: Move[][]): boolean {
  const sUnit = prefix[prefix.length - 1];
  const sBack = sUnit.map(inverse).reverse();
  for (const esc of escapes) {
    apply(ctx.cube, esc);
    undo(ctx.cube, sUnit); // slice back
    if (goalMet(ctx)) {
      ctx.path = [...prefix, esc, sBack];
      return true;
    }
    const escBack = esc.map(inverse).reverse();
    apply(ctx.cube, escBack); // commutator close:  s e s′ e′
    if (goalMet(ctx)) {
      ctx.path = [...prefix, esc, sBack, escBack];
      return true;
    }
    undo(ctx.cube, escBack);
    apply(ctx.cube, sUnit);
    undo(ctx.cube, esc);
  }
  return false;
}

/** Opposite face on the same axis (parallel slices live behind both). */
const OPPOSITE: Record<Face, Face> = { U: "D", D: "U", L: "R", R: "L", F: "B", B: "F" };

/**
 * Second template tier (constrained plus pieces reach only one slice each):
 * open TWO parallel slices, escape, close both —
 * [pre1] [pre2] s1 s2 e s1⁻¹ s2⁻¹. Parallel slices commute, so the closes
 * restore everything the escape didn't deliberately keep.
 */
function tryDoubleTemplate(ctx: Ctx, face: Face): boolean {
  const none: Move[][] = [[]];
  const pre1s = [...none, ...FACES.flatMap((f) => unitsOf(f, 0))];
  const pre2s = [...none, ...unitsOf(face, 0)];
  const escapes = escapeUnits(face, ctx.cube.n);
  // one face per axis — parallel slices commute, mirrored pairs repeat. On
  // odd cubes the middle slice joins as a partner (closed bracket: safe).
  const slicePairs: [Move[][], Move[][]][] = [];
  for (const f1 of MID_FACES) {
    const near = unitsOf(f1, 1);
    const far = unitsOf(OPPOSITE[f1], 1);
    slicePairs.push([near, far]);
    if (ctx.cube.n % 2 === 1) {
      const mid = unitsOf(f1, (ctx.cube.n - 1) / 2);
      slicePairs.push([near, mid], [mid, far]);
    }
  }
  for (const pre1 of pre1s) {
    apply(ctx.cube, pre1);
    for (const pre2 of pre2s) {
      apply(ctx.cube, pre2);
      if (tryPairs(ctx, [pre1, pre2], slicePairs, escapes)) return true;
      undo(ctx.cube, pre2);
    }
    undo(ctx.cube, pre1);
  }
  return false;
}

function tryPairs(ctx: Ctx, pres: Move[][], slicePairs: [Move[][], Move[][]][], escapes: Move[][]): boolean {
  for (const [s1units, s2units] of slicePairs) {
    for (const s1 of s1units) {
      apply(ctx.cube, s1);
      for (const s2 of s2units) {
        apply(ctx.cube, s2);
        for (const esc of escapes) {
          apply(ctx.cube, esc);
          undo(ctx.cube, s1);
          undo(ctx.cube, s2);
          if (goalMet(ctx)) {
            ctx.path = [...pres, s1, s2, esc, s1.map(inverse).reverse(), s2.map(inverse).reverse()];
            return true;
          }
          apply(ctx.cube, s2);
          apply(ctx.cube, s1);
          undo(ctx.cube, esc);
        }
        undo(ctx.cube, s2);
      }
      undo(ctx.cube, s1);
    }
  }
  return false;
}

function findInsertion(ctx: Ctx): boolean {
  for (let depth = 1; depth <= DFS_DEPTH; depth++) {
    ctx.path = [];
    if (dfs(ctx, depth)) return true;
  }
  for (const face of FACES) if (tryTemplate(ctx, face)) return true;
  for (const face of FACES) if (tryDoubleTemplate(ctx, face)) return true;
  return false;
}

/**
 * Solve all centers. `record` is told about every move already applied to the
 * cube. Returns false only if the (piece-validated) state somehow resists —
 * callers treat that as "not a real cube".
 */
export function solveCenters(cube: Cube, scorers: Scorers, record: (mv: Move) => void, rng: RNG): boolean {
  const gens = genGroups(cube.n);
  const phases = cube.n % 2 === 1 ? [0, 6] : [0];
  const budget = { kicks: 0 };
  for (const phase of phases) {
    if (!solvePhase({ cube, scorers, gens, phase, base: 0, path: [] }, record, rng, budget)) return false;
  }
  return scorers.centersSolved();
}

/** Run one class phase to completion (kick-capped via the shared budget). */
function solvePhase(ctx: Ctx, record: (mv: Move) => void, rng: RNG, budget: { kicks: number }): boolean {
  const phase = ctx.phase;
  for (;;) {
    const counts = ctx.scorers.centerCounts();
    const crossSum = classSum(counts, 0);
    if (classSum(counts, phase) === CLASS_TOTAL && crossSum === CLASS_TOTAL) return true;
    // a kick may have dented the finished cross phase — repair cross first
    ctx.phase = crossSum < CLASS_TOTAL ? 0 : phase;
    ctx.base = classSum(counts, ctx.phase);
    ctx.path = [];
    if (findInsertion(ctx)) {
      for (const unit of ctx.path) for (const mv of unit) record(mv);
      continue;
    }
    // Stuck: nudge with a random allowed move and search again.
    if (++budget.kicks > MAX_KICKS) return false;
    const kick = pick(rng, ctx.gens)[0];
    ctx.cube.turn(kick);
    record(kick);
  }
}
