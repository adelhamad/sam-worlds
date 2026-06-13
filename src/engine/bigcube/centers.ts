// Center solving for 4×4/5×5: place center stickers one at a time with a small
// IDA* that tracks one concrete sticker (exact per-sticker distance heuristic).
//
//   • 4×4 — one pass over the "X" centers, op set = single turns + slice/face
//     commutators-and-conjugates, so even last-face inserts are 2–3 ops deep.
//   • 5×5 — first the "X" centers with inner slices (same as 4×4), then the
//     "+" (T-)centers. Every "+" macro is a commutator that permutes ONLY
//     T-centers (a pair of T-center 3-cycles) — middles, X-centers, edges and
//     corners are all left untouched — so the T-centers become a self-contained
//     24-sticker permutation puzzle, placed one sticker at a time exactly like
//     the X-centers.
import { FACE_AXIS, type Move } from "../cube";
import { buildDistTable, buildToTables, trackedSearch } from "./search";
import {
  applyTable,
  centerOrbitsOf,
  composeTables,
  makeOps,
  outerMoves,
  sliceMoves2,
  sliceMoves3,
  tableFor,
  type Op,
} from "./tables";

// U, D, F, R, then B and L: the LAST two faces must be adjacent — a slice
// conjugate [s,f,s'] confines its center damage to face f and its predecessor
// in the slice's band, which must both still be free.
const FACE_ORDER = [0, 1, 4, 3, 5, 2];

interface StageData {
  ops: Op[];
  to: Int32Array[];
  dist: Uint8Array[];
}

const stageCache = new Map<string, StageData>();

/** 4×4 / 5×5 "X"-center op set: atomic turns + slice commutators/conjugates. */
function xCenterOps(n: number): Op[] {
  const slices = sliceMoves2();
  const outs = outerMoves();
  const seqs: Move[][] = [...outs.map((m) => [m]), ...slices.map((m) => [m])];
  for (const s of slices) {
    const sInv: Move = { ...s, prime: !s.prime };
    for (const f of outs) {
      if (FACE_AXIS[f.face].axis === FACE_AXIS[s.face].axis) continue;
      const fInv: Move = { ...f, prime: !f.prime };
      seqs.push([s, f, sInv, fInv]); // commutator — moves few pieces, restores the rest
      seqs.push([f, s, fInv, sInv]); // …and its mirror image
      seqs.push([s, f, sInv]); // conjugate — cheap insert
    }
  }
  return makeOps(n, seqs);
}

/** Support size of `from` if it touches ONLY `wanted` slots; else null. */
function pureSupport(from: Int32Array, wanted: Set<number>): number | null {
  let size = 0;
  for (let i = 0; i < from.length; i++) {
    if (from[i] === i) continue;
    if (!wanted.has(i)) return null;
    size++;
  }
  return size || null;
}

const inv = (m: Move): Move => ({ ...m, prime: !m.prime });

/**
 * Library of PURE T-center 3-cycle macros (support exactly 3, nothing else on
 * the cube disturbed) drawn from the commutator family [slice, g·f·g']. Pure
 * 3-cycles let the per-piece placer set the very last sticker of a face without
 * ever touching the three already beside it. Deduped by permutation.
 */
function plusMacroSeqs(n: number, plus: Set<number>, cap: number): Move[][] {
  const outs = outerMoves();
  const slices = [...sliceMoves2(), ...sliceMoves3()];
  const seqs: Move[][] = [];
  const seen = new Set<string>();
  const consider = (seq: Move[]): void => {
    if (seqs.length >= cap) return;
    const from = composeTables(seq.map((m) => tableFor(n, m)));
    if (pureSupport(from, plus) !== 3) return;
    const key = from.join(",");
    if (seen.has(key)) return;
    seen.add(key);
    seqs.push(seq);
  };
  for (const sl of slices) {
    const slInv = inv(sl);
    for (const g of outs) {
      for (const f of slices) {
        if (f.face === g.face) continue;
        const inner = [g, f, inv(g)];
        const innerInv = [g, inv(f), inv(g)];
        consider([sl, ...inner, slInv, ...innerInv]);
      }
    }
  }
  return seqs;
}

function plusCenterOps(n: number, plusSlots: number[]): Op[] {
  const seqs = plusMacroSeqs(n, new Set(plusSlots), 300);
  return makeOps(n, seqs);
}

function stageData(n: number, kind: "x" | "plus", plusSlots: number[]): StageData {
  const key = `${n}:${kind}`;
  let s = stageCache.get(key);
  if (!s) {
    const ops = kind === "x" ? xCenterOps(n) : plusCenterOps(n, plusSlots);
    s = { ops, to: buildToTables(ops), dist: buildDistTable(6 * n * n, ops) };
    stageCache.set(key, s);
  }
  return s;
}

/** Apply a found op path to the state and record the expanded moves. */
export function applyOps(state: Uint8Array, ops: Op[], path: number[], out: Move[]): void {
  const tmp = new Uint8Array(state.length);
  for (const i of path) {
    applyTable(state, ops[i].from, tmp);
    state.set(tmp);
    out.push(...ops[i].seq);
  }
}

function placePiece(
  n: number,
  state: Uint8Array,
  data: StageData,
  prefix: Set<number>,
  candidates: number[],
  target: number,
  color: number,
  out: Move[],
  debug?: (msg: string) => void,
): boolean {
  const nn = n * n;
  const prefixOk = (s: Uint8Array): boolean => {
    for (const ps of prefix) if (s[ps] !== Math.floor(ps / nn)) return false;
    return true;
  };
  if (state[target] === color && prefixOk(state)) return true;
  const dt = data.dist[target];
  const starts = candidates
    .filter((s) => state[s] === color && !prefix.has(s) && dt[s] < 255)
    .sort((a, b) => dt[a] - dt[b])
    .slice(0, 6);
  for (const startPos of starts) {
    const path = trackedSearch(state, startPos, {
      ops: data.ops,
      to: data.to,
      target,
      dist: dt,
      okAtGoal: prefixOk,
      maxDepth: 8,
      nodeBudget: 4_000_000,
    });
    if (path) {
      applyOps(state, data.ops, path, out);
      return true;
    }
    debug?.(`  no path from ${startPos} (dist ${dt[startPos]})`);
  }
  debug?.(`  stuck: ${candidates.filter((s) => state[s] === color && !prefix.has(s)).join(",")}`);
  return false;
}

/** Solve all centers to the fixed color scheme. Mutates state, appends moves. */
export function solveCenters(n: number, state: Uint8Array, out: Move[], debug?: (msg: string) => void): boolean {
  const orbits = centerOrbitsOf(n);
  const plusSlots = orbits.plus.flat();
  const stages: { kind: "x" | "plus"; slots: number[][]; keep: number[] }[] = [{ kind: "x", slots: orbits.x, keep: [] }];
  if (n % 2 === 1) stages.push({ kind: "plus", slots: orbits.plus, keep: orbits.x.flat() });
  for (const st of stages) {
    const data = stageData(n, st.kind, plusSlots);
    // Preserve middles (always) and, in the "+" pass, the already-solved X-centers.
    const prefix = new Set<number>([...orbits.mid, ...st.keep]);
    const candidates = st.slots.flat();
    for (const f of FACE_ORDER) {
      for (const slot of st.slots[f]) {
        if (!placePiece(n, state, data, prefix, candidates, slot, f, out, debug)) {
          debug?.(`stuck on ${st.kind} center face=${f} slot=${slot} after ${prefix.size} placed`);
          return false;
        }
        prefix.add(slot);
      }
    }
  }
  return true;
}
