// Generic iterative-deepening depth-first search over sticker-color states.
// Ops are precomposed permutation tables, so a node expansion is one indexed
// copy of the state buffer. The heuristic must never overestimate by much —
// it is only used to prune, correctness comes from the goal predicate.
import { applyTable, type Op } from "./tables";

export interface SearchProblem {
  ops: Op[];
  goal: (s: Uint8Array) => boolean;
  /** Lower-ish bound on remaining ops; 0 must hold whenever goal can hold. */
  h: (s: Uint8Array) => number;
  maxDepth: number;
  nodeBudget: number;
}

/** Returns op indices reaching the goal, or null (depth/budget exhausted). */
export function idSearch(start: Uint8Array, prob: SearchProblem): number[] | null {
  const buffers: Uint8Array[] = [];
  for (let d = 0; d <= prob.maxDepth; d++) buffers.push(new Uint8Array(start.length));
  buffers[0].set(start);
  const path: number[] = [];
  let nodes = 0;

  function dfs(depth: number, bound: number, lastOp: number, runLen: number): boolean {
    const state = buffers[depth];
    if (prob.goal(state)) return true;
    if (depth >= bound || nodes >= prob.nodeBudget) return false;
    const est = prob.h(state);
    if (depth + est > bound) return false;
    for (let i = 0; i < prob.ops.length; i++) {
      const op = prob.ops[i];
      if (op.inv === lastOp && lastOp >= 0) continue; // never undo the last op
      if (i === lastOp && runLen >= 2) continue; // three repeats = inverse anyway
      nodes++;
      applyTable(state, op.from, buffers[depth + 1]);
      path.push(i);
      if (dfs(depth + 1, bound, i, i === lastOp ? runLen + 1 : 1)) return true;
      path.pop();
    }
    return false;
  }

  for (let bound = prob.h(start); bound <= prob.maxDepth; bound++) {
    if (dfs(0, bound, -1, 0)) return path;
    if (nodes >= prob.nodeBudget) return null;
  }
  return null;
}

export interface TrackedProblem {
  ops: Op[];
  /** to[op][slot] = where the sticker at `slot` lands after the op. */
  to: Int32Array[];
  target: number;
  /** dist[slot] = fewest ops carrying a sticker from slot onto target. */
  dist: Uint8Array;
  /** Constraints that must hold when the tracked sticker reaches the target. */
  okAtGoal: (s: Uint8Array) => boolean;
  maxDepth: number;
  nodeBudget: number;
}

/**
 * Iterative-deepening search that routes ONE tracked sticker to a target slot.
 * The exact per-sticker distance is the heuristic, which keeps the tree tiny;
 * constraint restoration is folded into the ops (commutator macros).
 */
export function trackedSearch(start: Uint8Array, startPos: number, prob: TrackedProblem): number[] | null {
  const buffers: Uint8Array[] = [];
  for (let d = 0; d <= prob.maxDepth; d++) buffers.push(new Uint8Array(start.length));
  buffers[0].set(start);
  const path: number[] = [];
  let nodes = 0;

  function dfs(depth: number, bound: number, pos: number, lastOp: number): boolean {
    if (pos === prob.target && prob.okAtGoal(buffers[depth])) return true;
    if (depth >= bound || nodes >= prob.nodeBudget) return false;
    if (depth + prob.dist[pos] > bound) return false;
    for (let i = 0; i < prob.ops.length; i++) {
      if (prob.ops[i].inv === lastOp && lastOp >= 0) continue;
      nodes++;
      applyTable(buffers[depth], prob.ops[i].from, buffers[depth + 1]);
      path.push(i);
      if (dfs(depth + 1, bound, prob.to[i][pos], i)) return true;
      path.pop();
    }
    return false;
  }

  for (let bound = prob.dist[startPos]; bound <= prob.maxDepth; bound++) {
    if (dfs(0, bound, startPos, -1)) return path;
    if (nodes >= prob.nodeBudget) return null;
  }
  return null;
}

/** Inverse mappings of the ops' from-tables (sticker → destination). */
export function buildToTables(ops: Op[]): Int32Array[] {
  return ops.map((op) => {
    const t = new Int32Array(op.from.length);
    for (let i = 0; i < op.from.length; i++) t[op.from[i]] = i;
    return t;
  });
}

/**
 * Per-slot distance table for a move set: dist[target][slot] = fewest ops that
 * carry a sticker from `slot` onto `target`, ignoring everything else. Used as
 * an admissible heuristic for single-piece placement.
 */
export function buildDistTable(slotCount: number, ops: Op[]): Uint8Array[] {
  // to[op][s] = where a sticker at slot s lands after the op
  const to: Int32Array[] = ops.map((op) => {
    const t = new Int32Array(slotCount);
    for (let i = 0; i < slotCount; i++) t[op.from[i]] = i;
    return t;
  });
  const tables: Uint8Array[] = [];
  for (let target = 0; target < slotCount; target++) {
    const dist = new Uint8Array(slotCount).fill(255);
    dist[target] = 0;
    // Bellman-Ford-style relaxation; slot counts are tiny (≤150) so this is cheap.
    let changed = true;
    while (changed) {
      changed = false;
      for (let s = 0; s < slotCount; s++) {
        for (const t of to) {
          const q = t[s];
          if (dist[q] !== 255 && dist[q] + 1 < dist[s]) {
            dist[s] = dist[q] + 1;
            changed = true;
          }
        }
      }
    }
    tables.push(dist);
  }
  return tables;
}
