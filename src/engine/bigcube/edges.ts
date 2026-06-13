// Edge pairing for 4×4/5×5 via slice "sandwiches" [s, …inner…, s']. Such a
// sandwich restores every center iff the inner sequence's NET rotation of each
// face in the slice's band is zero (faces on the slice axis are free — their
// centers never enter the band). So inners are: turns of the two axis faces,
// optionally conjugated by one band-face turn ("hooks"). Outer moves alone
// permute whole edge slots, never pairing, and serve as setup moves.
import { FACE_AXIS, FACES, type Move } from "../cube";
import type { RNG } from "../rng";
import { applyOps } from "./centers";
import { applyTable, centerOrbitsOf, composeTables, edgesOf, makeOps, outerMoves, sliceMoves2, tableFor, type EdgeGeo, type Op } from "./tables";

interface PairCtx {
  outers: Op[];
  macros: Op[];
  all: Op[]; // outers then macros (op indices in results refer to this list)
  edges: EdgeGeo[];
  centerSlots: number[];
  maxProgress: number;
}

const ctxCache = new Map<number, PairCtx>();

function buildMacros(n: number): Op[] {
  const seqs: Move[][] = [];
  for (const s of sliceMoves2()) {
    const sInv: Move = { ...s, prime: !s.prime };
    const axis = FACE_AXIS[s.face].axis;
    const axisTurns: Move[][] = FACES.filter((f) => FACE_AXIS[f].axis === axis).flatMap((face) => [
      [{ face, prime: false }],
      [{ face, prime: true }],
      [
        { face, prime: false },
        { face, prime: false },
      ],
    ]);
    const bandMoves: Move[] = FACES.filter((f) => FACE_AXIS[f].axis !== axis).flatMap((face) => [
      { face, prime: false },
      { face, prime: true },
    ]);
    const inners: Move[][] = [...axisTurns];
    for (const g of bandMoves) {
      const gInv: Move = { ...g, prime: !g.prime };
      for (const f of axisTurns) inners.push([g, ...f, gInv]);
    }
    // Flip-insert family (e.g. the classic R U R' F R' F' R inside Uw…Uw'):
    // [g f g' h g' h' g] — net rotation of g and h is zero, f is on-axis.
    const quarters = axisTurns.filter((t) => t.length === 1).map((t) => t[0]);
    for (const g of bandMoves) {
      const gInv: Move = { ...g, prime: !g.prime };
      for (const h of bandMoves) {
        if (h.face === g.face) continue;
        const hInv: Move = { ...h, prime: !h.prime };
        for (const f of quarters) inners.push([g, f, gInv, h, gInv, hInv, g]);
      }
    }
    for (const inner of inners) seqs.push([s, ...inner, sInv]);
  }
  // Dedupe by net permutation — the families overlap heavily (2952 → ~hundreds),
  // and a smaller op set keeps every pairing step cheap.
  const seen = new Set<string>();
  const unique: Move[][] = [];
  for (const seq of seqs) {
    const key = composeTables(seq.map((m) => tableFor(n, m))).join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(seq);
  }
  return makeOps(n, unique);
}

function pairCtx(n: number): PairCtx {
  let ctx = ctxCache.get(n);
  if (ctx) return ctx;
  const outers = makeOps(n, outerMoves().map((m) => [m]));
  const macros = buildMacros(n);
  const orbits = centerOrbitsOf(n);
  const centerSlots = [...orbits.x.flat(), ...orbits.plus.flat(), ...orbits.mid];
  ctx = {
    outers,
    macros,
    all: [...outers, ...macros],
    edges: edgesOf(n),
    centerSlots,
    maxProgress: n === 4 ? 1200 : 12 * 102,
  };
  ctxCache.set(n, ctx);
  return ctx;
}

/** 100 per fully formed edge; on 5×5, +1 per wing correctly hugging its midge. */
function progressOf(ctx: PairCtx, s: Uint8Array): number {
  let score = 0;
  for (const e of ctx.edges) {
    const { a, b } = e;
    if (a.length === 2) {
      if (s[a[0]] === s[a[1]] && s[b[0]] === s[b[1]]) score += 100;
      continue;
    }
    const fullA = s[a[0]] === s[a[1]] && s[a[1]] === s[a[2]];
    const fullB = s[b[0]] === s[b[1]] && s[b[1]] === s[b[2]];
    if (fullA && fullB) {
      score += 102;
      continue;
    }
    for (const w of [0, 2]) if (s[a[w]] === s[a[1]] && s[b[w]] === s[b[1]]) score += 1;
  }
  return score;
}

function centersOK(ctx: PairCtx, n: number, s: Uint8Array): boolean {
  const nn = n * n;
  for (const slot of ctx.centerSlots) if (s[slot] !== Math.floor(slot / nn)) return false;
  return true;
}

/** Find outer-setup + one sandwich that strictly improves pairing progress. */
function pairStep(ctx: PairCtx, state: Uint8Array, base: number): number[] | null {
  const bufs = [state, new Uint8Array(state.length), new Uint8Array(state.length), new Uint8Array(state.length)];
  const macroBuf = new Uint8Array(state.length);
  const path: number[] = [];

  const tryMacros = (s: Uint8Array): number | null => {
    for (let mi = 0; mi < ctx.macros.length; mi++) {
      applyTable(s, ctx.macros[mi].from, macroBuf);
      if (progressOf(ctx, macroBuf) > base) return mi;
    }
    return null;
  };

  const dfs = (depth: number, maxDepth: number, last: number): number[] | null => {
    if (depth === maxDepth) {
      const mi = tryMacros(bufs[depth]);
      return mi === null ? null : [...path, ctx.outers.length + mi];
    }
    for (let i = 0; i < ctx.outers.length; i++) {
      if (ctx.outers[i].inv === last) continue;
      applyTable(bufs[depth], ctx.outers[i].from, bufs[depth + 1]);
      path.push(i);
      const r = dfs(depth + 1, maxDepth, i);
      if (r) return r;
      path.pop();
    }
    return null;
  };

  for (let maxDepth = 0; maxDepth <= 2; maxDepth++) {
    const r = dfs(0, maxDepth, -1);
    if (r) return r;
  }
  return null;
}

/** Pair every edge. Mutates state, appends moves; false = try a new attempt. */
export function pairEdges(n: number, state: Uint8Array, out: Move[], rng: RNG): boolean {
  const ctx = pairCtx(n);
  // When no macro improves progress, a single random macro often gets undone by
  // the very next step (it's the most-improving move back). So a "shake" fires
  // THREE random macros at once — far less reversible — and we only allow a few
  // before bailing to a fresh top-level attempt (whose reshuffle re-rolls the
  // whole configuration). Fast-fail + many cheap retries beats long thrashing.
  let shakes = 0;
  for (let guard = 0; guard < 120; guard++) {
    const base = progressOf(ctx, state);
    if (base >= ctx.maxProgress) return centersOK(ctx, n, state);
    const step = pairStep(ctx, state, base);
    if (step) {
      applyOps(state, ctx.all, step, out);
      shakes = 0;
      continue;
    }
    if (shakes >= 4) return false;
    shakes++;
    for (let k = 0; k < 3; k++) applyOps(state, ctx.macros, [Math.floor(rng() * ctx.macros.length)], out);
  }
  return false;
}
