// Edge-pairing stage of the big-cube reduction — deterministic chain pairing.
// Outer turns are "free" (they never disturb solved centers and move edge
// groups as whole units), so each wing is merged by: park the anchor group at
// the front-right slot, stage the wing at front-left (single-cubie BFS over
// outer turns — exact and instant), then  slice → escape → slice back , every
// candidate validated on a clone before it is applied. When only a
// parity-style tangle remains (it needs an odd number of slice quarter
// turns), the orchestrator applies a slice kick and re-reduces.
import { FACE_AXIS, inverse, moveLayer, type Cube, type Face, type Move, type Vec } from "../cube";
import { edgeScoreMax, genGroups, nvFace, sameSlice, type Scorers } from "./pieces";

export type PairOutcome = "paired" | "stuck";

const MAX_WINGS = 60;

interface Wing {
  /** Cubie position and its two stickers as (face → color) at this instant. */
  p: Vec;
  colors: Partial<Record<Face, Face>>;
}

/** All edge cubies right now (n−2 per slot, midges included). */
function edgeCubies(cube: Cube): Wing[] {
  const m = cube.n - 1;
  const byKey = new Map<string, Wing>();
  for (const s of cube.getStickers()) {
    let boundary = 0;
    for (const v of s.p) if (v === 0 || v === m) boundary++;
    if (boundary !== 2) continue;
    const key = s.p.join(",");
    let w = byKey.get(key);
    if (!w) {
      w = { p: [...s.p] as Vec, colors: {} };
      byKey.set(key, w);
    }
    w.colors[nvFace(s.nv)] = s.color;
  }
  return [...byKey.values()];
}

const pairKey = (w: Wing): string => Object.values(w.colors).sort().join("");
function slotKey(p: Vec, m: number): string {
  let out = "";
  for (let axis = 0; axis < 3; axis++) {
    if (p[axis] === 0) out += `${axis}-`;
    else if (p[axis] === m) out += `${axis}+`;
  }
  return out;
}

/** Same plane-axis pairs the engine's turn() uses — order fixes direction. */
const PLANE: Record<number, [number, number]> = { 0: [1, 2], 1: [2, 0], 2: [0, 1] };

/** Apply one move to a tracked sticker (pure math — no cube needed).
 *  Exported for the verification script only. */
export function moveSticker(p: Vec, nv: Vec, mv: Move, n: number): [Vec, Vec] {
  const { axis } = FACE_AXIS[mv.face];
  if (p[axis] !== moveLayer(mv, n)) return [p, nv];
  const m = n - 1;
  const cw = FACE_AXIS[mv.face].dir > 0 ? !mv.prime : mv.prime;
  const [a, b] = PLANE[axis];
  const np: Vec = [...p];
  const nn: Vec = [...nv];
  if (cw) {
    np[a] = p[b];
    np[b] = m - p[a];
    nn[a] = nv[b];
    nn[b] = -nv[a];
  } else {
    np[a] = m - p[b];
    np[b] = p[a];
    nn[a] = -nv[b];
    nn[b] = nv[a];
  }
  return [np, nn];
}

/** BFS one sticker to any goal (exact p+nv) over the given outer moves. */
function bfsSticker(n: number, p0: Vec, nv0: Vec, goals: { p: Vec; nv: Vec }[], faces: Face[], maxDepth: number): Move[] | null {
  const key = (p: Vec, nv: Vec): string => `${p.join(",")}|${nv.join(",")}`;
  const goalSet = new Set(goals.map((g) => key(g.p, g.nv)));
  if (goalSet.has(key(p0, nv0))) return [];
  const gens: Move[] = faces.flatMap((face) => [
    { face, prime: false },
    { face, prime: true },
  ]);
  const seen = new Map<string, Move[]>([[key(p0, nv0), []]]);
  let frontier: { p: Vec; nv: Vec; path: Move[] }[] = [{ p: p0, nv: nv0, path: [] }];
  for (let d = 0; d < maxDepth; d++) {
    const next: typeof frontier = [];
    for (const st of frontier) {
      for (const mv of gens) {
        const [p, nv] = moveSticker(st.p, st.nv, mv, n);
        const k = key(p, nv);
        if (seen.has(k)) continue;
        const path = [...st.path, mv];
        if (goalSet.has(k)) return path;
        seen.set(k, path);
        next.push({ p, nv, path });
      }
    }
    frontier = next;
  }
  return null;
}

/** The y-slice through wing height h, as a move (never the midge layer). */
function ySlice(h: number, n: number, prime: boolean): Move {
  return h <= (n - 2) / 2 ? { face: "D", prime, layer: h } : { face: "U", prime, layer: n - 1 - h };
}

/**
 * Escapes that park the freshly-merged pair off the slice ring WITHOUT a net
 * rotation of any ring face (a net rotation would scramble the displaced
 * center rows before the slice closes):  A e A⁻¹  with A on F/R lifting the
 * pair to the U/D layer and e carrying it away there.
 */
const ESCAPES: Move[][] = (() => {
  const lifts: Move[][] = (["F", "R"] as Face[]).flatMap((face) => [
    [{ face, prime: false }],
    [{ face, prime: true }],
    [
      { face, prime: false },
      { face, prime: false },
    ],
  ]);
  const aways: Move[][] = (["U", "D"] as Face[]).flatMap((face) => [
    [{ face, prime: false }],
    [{ face, prime: true }],
    [
      { face, prime: false },
      { face, prime: false },
    ],
  ]);
  const out: Move[][] = [];
  for (const a of lifts) {
    const back = a.map(inverse).reverse();
    for (const e of aways) out.push([...a, ...e, ...back]);
  }
  return out;
})();

interface Ctx {
  cube: Cube;
  scorers: Scorers;
  record: (mv: Move) => void;
  n: number;
  m: number;
}

const play = (ctx: Ctx, moves: Move[]): void => {
  for (const mv of moves) {
    ctx.cube.turn(mv);
    ctx.record(mv);
  }
};

/** Validate a candidate on a clone: pairing strictly improves, centers hold. */
function gains(ctx: Ctx, moves: Move[], base: number): boolean {
  const probe = ctx.cube.clone();
  for (const mv of moves) probe.turn(mv);
  // cheap local scorer: reuse the bound scorers via a temporary swap is not
  // possible — measure on the probe with a fresh pass
  return probeScore(probe) > base && probeCenters(probe);
}

function probeCenters(cube: Cube): boolean {
  const m = cube.n - 1;
  for (const s of cube.getStickers()) {
    let boundary = 0;
    for (const v of s.p) if (v === 0 || v === m) boundary++;
    if (boundary === 1 && s.color !== nvFace(s.nv)) return false;
  }
  return true;
}

/** Sticker signature of a wing: (face, color) pairs ordered by face. */
const sigOf = (w: Wing): string =>
  Object.entries(w.colors)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([f, c]) => `${f}${c}`)
    .join("");

/** Same metric as Scorers.edgeScore, computed on any cube. */
function probeScore(cube: Cube): number {
  const m = cube.n - 1;
  const groups = new Map<string, Wing[]>();
  for (const w of edgeCubies(cube)) {
    const k = slotKey(w.p, m);
    const list = groups.get(k) ?? [];
    list.push(w);
    groups.set(k, list);
  }
  let score = 0;
  const mid = m / 2;
  for (const list of groups.values()) {
    const anchor = list.find((w) => w.p.some((v, ax) => v === mid && !(v === 0 || v === m) && isInner(w.p, ax, m)));
    score += anchor ? matchCount(list, sigOf(anchor)) : majorityCount(list);
  }
  return score;
}

const matchCount = (list: Wing[], want: string): number => {
  let same = 0;
  for (const w of list) if (sigOf(w) === want) same++;
  return same;
};

const majorityCount = (list: Wing[]): number => {
  let best = 0;
  for (const w of list) best = Math.max(best, matchCount(list, sigOf(w)));
  return best;
};

const isInner = (p: Vec, axis: number, m: number): boolean => p[axis] !== 0 && p[axis] !== m;

/** Heights (y of the FR slot) a wing can occupy. */
function wingHeights(n: number): number[] {
  const out: number[] = [];
  for (let t = 1; t <= n - 2; t++) {
    if (n % 2 === 1 && t === (n - 1) / 2) continue; // midge layer
    out.push(t);
  }
  return out;
}

/** Insert one more wing somewhere; false = nothing insertable (kick time). */
function pairOneWing(ctx: Ctx): boolean {
  const base = ctx.scorers.edgeScore();
  // pick an anchor cubie of an unpaired group: prefer midges, else any wing
  // of a colorpair type that isn't fully merged
  for (const anchor of anchorCandidates(ctx)) {
    // park the anchor group at FR — outer turns only, free
    const aSticker = stickerOf(anchor);
    const park = bfsSticker(
      ctx.n,
      anchor.p,
      aSticker.nv,
      frGoals(ctx, aSticker.face),
      ["U", "D", "L", "R", "F", "B"],
      5,
    );
    if (!park) continue;
    play(ctx, park);
    if (tryInsertAt(ctx, base)) return true;
    // a matching wing may sit INSIDE the slot flipped (no outside candidate);
    // pull it out — it can re-enter re-oriented — and retry
    if (extractMismatched(ctx, base) && tryInsertAt(ctx, base)) return true;
  }
  return false;
}

/** Pull one mismatched wing out of the FR slot (validated: score keeps,
 *  centers keep, and the occupant of that height really changes). */
function extractMismatched(ctx: Ctx, base: number): boolean {
  const m = ctx.m;
  const fr = edgeCubies(ctx.cube).filter((w) => w.p[0] === m && w.p[2] === m);
  const midge = fr.find((w) => w.p[1] === m / 2);
  const anchorSig = midge ? sigOf(midge) : majoritySig(fr);
  for (const h of wingHeights(ctx.n)) {
    const cur = fr.find((w) => w.p[1] === h);
    if (!cur || sigOf(cur) === anchorSig) continue;
    const before = sigOf(cur);
    for (const prime of [false, true]) {
      const sy = ySlice(h, ctx.n, prime);
      for (const esc of ESCAPES) {
        const cand = [sy, ...esc, inverse(sy)];
        const probe = ctx.cube.clone();
        for (const mv of cand) probe.turn(mv);
        const after = edgeCubies(probe).find((w) => w.p[0] === m && w.p[2] === m && w.p[1] === h);
        if (after && sigOf(after) !== before && probeScore(probe) >= base && probeCenters(probe)) {
          play(ctx, cand);
          return true;
        }
      }
    }
  }
  return false;
}

/** First sticker of a wing as (face, nv) for BFS tracking. */
function stickerOf(w: Wing): { face: Face; nv: Vec } {
  const face = Object.keys(w.colors)[0] as Face;
  const nv: Vec = [0, 0, 0];
  const { axis, dir } = FACE_AXIS[face];
  nv[axis] = dir;
  return { face, nv };
}

/** Goal states: the tracked sticker anywhere on the FR slot. */
function frGoals(ctx: Ctx, _face: Face): { p: Vec; nv: Vec }[] {
  const goals: { p: Vec; nv: Vec }[] = [];
  for (const h of allHeights(ctx.n)) {
    for (const f of ["F", "R"] as Face[]) {
      const nv: Vec = [0, 0, 0];
      nv[FACE_AXIS[f].axis] = FACE_AXIS[f].dir;
      goals.push({ p: [ctx.m, h, ctx.m], nv });
    }
  }
  return goals;
}

function allHeights(n: number): number[] {
  const out: number[] = [];
  for (let t = 1; t <= n - 2; t++) out.push(t);
  return out;
}

/** Anchors: midges of unpaired groups first (5×5), else wings of unpaired types. */
function anchorCandidates(ctx: Ctx): Wing[] {
  const m = ctx.m;
  const wings = edgeCubies(ctx.cube);
  const bySlot = new Map<string, Wing[]>();
  for (const w of wings) {
    const k = slotKey(w.p, m);
    const list = bySlot.get(k) ?? [];
    list.push(w);
    bySlot.set(k, list);
  }
  const out: Wing[] = [];
  for (const list of bySlot.values()) {
    const sigs = new Set(list.map((w) => JSON.stringify(Object.entries(w.colors).sort())));
    if (sigs.size === 1) continue; // fully merged group
    const midge = list.find((w) => w.p.some((v, ax) => isInner(w.p, ax, m) && v === m / 2));
    out.push(midge ?? list[0]);
  }
  return out;
}

/**
 * With some anchor parked at FR: find a wing matching the anchor's colors for
 * a mismatched height, stage it at FL, and bracket it in. Each full candidate
 * is validated on a clone before being applied.
 */
function tryInsertAt(ctx: Ctx, base: number): boolean {
  const m = ctx.m;
  const fr = edgeCubies(ctx.cube).filter((w) => w.p[0] === m && w.p[2] === m);
  // a midge can never leave its layer, so it always dictates the group's pair
  const midge = fr.find((w) => w.p[1] === m / 2);
  const anchorSig = midge ? sigOf(midge) : majoritySig(fr);
  for (const h of wingHeights(ctx.n)) {
    const cur = fr.find((w) => w.p[1] === h);
    if (!cur || sigOf(cur) === anchorSig) continue; // height already matched
    // candidate wings with the right colors, anywhere else
    const pairWanted = anchorSig.replace(/[A-Z]([A-Z])/g, "$1"); // colors only
    for (const w of edgeCubies(ctx.cube)) {
      if (w.p[0] === m && w.p[2] === m) continue; // in FR already (incl. cur)
      if (pairKey(w) !== [...pairWanted].sort().join("")) continue;
      if (insertWing(ctx, w, h, base)) return true;
    }
  }
  return false;
}

function majoritySig(list: Wing[]): string {
  let best = "";
  let bestN = 0;
  for (const w of list) {
    const s = sigOf(w);
    let same = 0;
    for (const u of list) if (sigOf(u) === s) same++;
    if (same > bestN) {
      bestN = same;
      best = s;
    }
  }
  return best;
}

/** Stage wing w at FL height h (both orientations) and bracket it into FR. */
function insertWing(ctx: Ctx, w: Wing, h: number, base: number): boolean {
  const m = ctx.m;
  const tracked = stickerOf(w);
  for (const goalFace of ["L", "F"] as Face[]) {
    const nv: Vec = [0, 0, 0];
    nv[FACE_AXIS[goalFace].axis] = FACE_AXIS[goalFace].dir;
    const stage = bfsSticker(ctx.n, w.p, tracked.nv, [{ p: [0, h, m], nv }], ["U", "D", "L", "B"], 6);
    if (!stage) continue;
    for (const prime of [false, true]) {
      const sy = ySlice(h, ctx.n, prime);
      for (const esc of ESCAPES) {
        const candidate = [...stage, sy, ...esc, inverse(sy)];
        if (gains(ctx, candidate, base)) {
          play(ctx, candidate);
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Pair edge groups until fully reduced. Returns "stuck" when only a
 * parity-style tangle remains — the orchestrator then applies a slice kick
 * and re-runs the reduction. Every applied move is reported through `record`.
 */
export function pairEdges(cube: Cube, scorers: Scorers, record: (mv: Move) => void): PairOutcome {
  const ctx: Ctx = { cube, scorers, record, n: cube.n, m: cube.n - 1 };
  const max = edgeScoreMax(cube.n);
  for (let i = 0; i < MAX_WINGS; i++) {
    if (scorers.edgeScore() >= max && scorers.centersSolved()) return "paired";
    // the generic shallow search also covers ODD merges (e.g. one slice
    // quarter) that the bracket-shaped chain pairer can never express
    if (!pairOneWing(ctx) && !shallowMerge(ctx)) return "stuck";
  }
  return "stuck";
}

/** Depth-≤2 search over turn units for any score-raising move. Slice QUARTER
 *  units are excluded: every pairing op must keep slice parity even, or it
 *  would silently neutralize the orchestrator's parity kick. */
function shallowMerge(ctx: Ctx): boolean {
  const units = genGroups(ctx.n).filter((u) => (u[0].layer ?? 0) === 0 || u.length === 2);
  const base = ctx.scorers.edgeScore();
  const path: Move[][] = [];
  const step = (depth: number): boolean => {
    for (const unit of units) {
      const prev = path[path.length - 1];
      if (prev && sameSlice(prev[0], unit[0])) continue;
      for (const mv of unit) ctx.cube.turn(mv);
      path.push(unit);
      if (ctx.scorers.edgeScore() > base && ctx.scorers.centersSolved()) return true;
      if (depth > 1 && step(depth - 1)) return true;
      path.pop();
      for (let i = unit.length - 1; i >= 0; i--) ctx.cube.turn(inverse(unit[i]));
    }
    return false;
  };
  for (let d = 1; d <= 2; d++) {
    path.length = 0;
    if (step(d)) {
      for (const unit of path) for (const mv of unit) ctx.record(mv);
      return true;
    }
  }
  return false;
}
