// Geometry helpers for the 4×4/5×5 reduction solver: classify stickers into
// corner / edge / center pieces from lattice coordinates, measure reduction
// progress (solved centers, paired edge groups) and validate that hand-painted
// colors form real cube pieces. Pure functions over the verified Cube model.
import { Cube, faceFromNormal, FACES, type Face, type Move, type Sticker, type Vec } from "../cube";

const isBoundary = (v: number, m: number): boolean => v === 0 || v === m;

/** 3 = corner cubie, 2 = edge cubie (wing/midge), 1 = center cubie. */
export function boundaryCount(p: Vec, m: number): number {
  let c = 0;
  for (const v of p) if (isBoundary(v, m)) c++;
  return c;
}

/** All quarter turns the solver may use: outer layers + the inner slice of
 *  each face. For 5×5 this deliberately skips the middle slice, so the fixed
 *  centers (and midges) never move. */
export function genMoves(n: number): Move[] {
  const layers = n >= 4 ? [0, 1] : [0];
  const out: Move[] = [];
  for (const face of FACES) {
    for (const layer of layers) {
      out.push({ face, prime: false, layer }, { face, prime: true, layer });
    }
  }
  return out;
}

export const sameSlice = (a: Move, b: Move): boolean => a.face === b.face && (a.layer ?? 0) === (b.layer ?? 0);

/**
 * Search generators grouped per applied unit: each layer's CW / CCW quarter
 * plus its half turn. Consecutive units on the same slice are always
 * redundant, so searches prune them — and half turns must therefore be their
 * own unit or sequences like  u2 R u2  would be unreachable.
 */
export function genGroups(n: number): Move[][] {
  const out: Move[][] = [];
  for (const mv of genMoves(n)) {
    out.push([mv]);
    if (!mv.prime) out.push([mv, mv]); // one half turn per slice is enough
  }
  return out;
}

/** Count of center stickers per face already showing that face's color. */
export function centerCounts(cube: Cube): Record<Face, number> {
  const m = cube.n - 1;
  const counts = { U: 0, D: 0, L: 0, R: 0, F: 0, B: 0 };
  for (const s of cube.getStickers()) {
    if (boundaryCount(s.p, m) !== 1) continue;
    const face = faceFromNormal(s.nv);
    if (s.color === face) counts[face]++;
  }
  return counts;
}

export function centersSolved(cube: Cube): boolean {
  const full = (cube.n - 2) * (cube.n - 2);
  const counts = centerCounts(cube);
  return FACES.every((f) => counts[f] === full);
}

/** Identity of the cube edge an edge cubie sits on + its slot along it. */
function edgeSlot(p: Vec, m: number): { edge: string; t: number } {
  let edge = "";
  let t = 0;
  for (let axis = 0; axis < 3; axis++) {
    if (isBoundary(p[axis], m)) edge += `${axis}${p[axis] === 0 ? 0 : 1}`;
    else t = p[axis];
  }
  return { edge, t };
}

/** Fixed face → index order used by all Int32Array scorer outputs. */
export const FACE_ORD: Record<Face, number> = { U: 0, D: 1, L: 2, R: 3, F: 4, B: 5 };
const COLOR_CODE = FACE_ORD;
/** low + high·2 → 0..2 for the three boundary-axis pairs an edge can span. */
const AXIS_PAIR: Record<number, number> = { 2: 0, 4: 1, 5: 2 }; // (0,1) (0,2) (1,2)

/** Face a normal vector points at (one component is ±1). */
export function nvFace(nv: Vec): Face {
  if (nv[0] !== 0) return nv[0] > 0 ? "R" : "L";
  if (nv[1] !== 0) return nv[1] > 0 ? "U" : "D";
  return nv[2] > 0 ? "F" : "B";
}

export const edgeScoreMax = (n: number): number => 12 * (n - 2);

/** Center-piece classes. Slices and face turns keep every piece in its class,
 *  so on a 5×5 the cross and plus subsystems can be solved independently —
 *  each behaves exactly like 4×4 centers (4 pieces per face). */
export const CLS_ALL = 0b11;
export const CLS_CROSS = 0b01;
export const CLS_PLUS = 0b10;

export interface Scorers {
  /** Center stickers per face already showing that face's color, split by
   *  class: indices 0–5 cross pieces, 6–11 plus pieces (face order U D L R F
   *  B). Fixed centers are never counted; even cubes only fill the cross half. */
  centerCounts(): Int32Array;
  /** Odd cubes: are all six fixed face centers on their own face? Guards the
   *  center-stage goals when middle slices take part in a bracket. */
  fixedOk(): boolean;
  centersSolved(): boolean;
  /**
   * Edge-pairing progress: per edge group, how many cubies already match the
   * anchor pair (the midge on odd cubes, the majority pair on even ones).
   * Fully reduced edges score 12 × (n−2).
   */
  edgeScore(): number;
}

/**
 * Hot-path progress measures, bound to one cube. A sticker's piece type never
 * changes when layers turn (rotations keep boundary coordinates boundary), so
 * the center/edge sticker lists are computed once. Allocation-free per call —
 * the search loops run these millions of times.
 */
export function makeScorers(cube: Cube): Scorers {
  const m = cube.n - 1;
  const span = cube.n - 2;
  const odd = cube.n % 2 === 1;
  const all = cube.getStickers().filter((s) => boundaryCount(s.p, m) === 1);
  // class per sticker is invariant: movable (non-fixed) centers keep their
  // cross/plus nature forever, so classify once. Even cubes: everything CROSS.
  const clsOf = (s: Sticker): number => {
    if (!odd) return CLS_CROSS;
    let onMid = 0;
    for (let a = 0; a < 3; a++) if (s.p[a] !== 0 && s.p[a] !== m && s.p[a] === m / 2) onMid++;
    if (onMid === 2) return 0; // fixed center — never counted, never moves
    return onMid === 1 ? CLS_PLUS : CLS_CROSS;
  };
  const centers = all.filter((s) => clsOf(s) !== 0);
  const centerOff = centers.map((s) => (clsOf(s) === CLS_PLUS ? 6 : 0));
  const edges = cube.getStickers().filter((s) => boundaryCount(s.p, m) === 2);
  const counts = new Int32Array(12);
  const pairs = new Int8Array(12 * span * 2);

  const centerCounts = (): Int32Array => {
    counts.fill(0);
    for (let i = 0; i < centers.length; i++) {
      const s = centers[i];
      const f = nvFace(s.nv);
      if (s.color === f) counts[centerOff[i] + COLOR_CODE[f]]++;
    }
    return counts;
  };

  const fixedCenters = all.filter((s) => clsOf(s) === 0);
  const fixedOk = (): boolean => {
    for (const s of fixedCenters) if (s.color !== nvFace(s.nv)) return false;
    return true;
  };

  const centersSolved = (): boolean => {
    for (const s of all) if (s.color !== nvFace(s.nv)) return false;
    return true;
  };

  const edgeScore = (): number => {
    fillPairs(edges, pairs, span, m);
    let score = 0;
    for (let g = 0; g < 12; g++) {
      score += odd ? groupScoreOdd(pairs, g, span, m) : groupScoreEven(pairs, g, span);
    }
    return score;
  };

  return { centerCounts, fixedOk, centersSolved, edgeScore };
}

/** Bucket every edge sticker into (group, slot, side) color codes. */
function fillPairs(edges: readonly Readonly<Sticker>[], pairs: Int8Array, span: number, m: number): void {
  pairs.fill(-1);
  for (const s of edges) {
    const lowAxis = s.p[0] === 0 || s.p[0] === m ? 0 : 1;
    const highAxis = s.p[2] === 0 || s.p[2] === m ? 2 : 1;
    const g = AXIS_PAIR[lowAxis + highAxis * 2] * 4 + (s.p[lowAxis] === m ? 2 : 0) + (s.p[highAxis] === m ? 1 : 0);
    const t = s.p[3 - lowAxis - highAxis];
    const slot = s.nv[lowAxis] !== 0 ? 0 : 1;
    pairs[(g * span + (t - 1)) * 2 + slot] = COLOR_CODE[s.color];
  }
}

/** Cubies matching the midge anchor of one group (odd cubes). */
function groupScoreOdd(pairs: Int8Array, g: number, span: number, m: number): number {
  const base = g * span * 2;
  const aIdx = base + (m / 2 - 1) * 2;
  let score = 0;
  for (let t = 0; t < span; t++) {
    if (pairs[base + t * 2] === pairs[aIdx] && pairs[base + t * 2 + 1] === pairs[aIdx + 1]) score++;
  }
  return score;
}

/** Size of the biggest same-colored faction in one group (even cubes). */
function groupScoreEven(pairs: Int8Array, g: number, span: number): number {
  const base = g * span * 2;
  let best = 0;
  for (let t = 0; t < span; t++) {
    let same = 0;
    for (let u = 0; u < span; u++) {
      if (pairs[base + t * 2] === pairs[base + u * 2] && pairs[base + t * 2 + 1] === pairs[base + u * 2 + 1]) same++;
    }
    if (same > best) best = same;
  }
  return best;
}

// ---- painted-input validation ----------------------------------------------

export interface PieceCheck {
  ok: boolean;
  /** Player-facing hint when the painted pieces can't exist (warm tone). */
  reason?: string;
}

/** Center class — slices and face turns can never move a piece between
 *  classes, so each class must hold the right colors on its own. */
function centerClass(p: Vec, m: number): string {
  const mid = m / 2;
  let onMid = 0;
  let inner = 0;
  for (const v of p) {
    if (isBoundary(v, m)) continue;
    inner++;
    if (v === mid) onMid++;
  }
  if (inner !== 2 || m % 2 === 1) return "c"; // even cube: one class
  if (onMid === 2) return "fixed";
  return onMid === 1 ? "plus" : "cross";
}

/** Multiset of per-cubie color signatures for one piece class. */
function pieceSignatures(cube: Cube, kind: "corner" | "wing" | "midge" | "center"): Map<string, number> {
  const m = cube.n - 1;
  const byCubie = new Map<string, { colors: Face[]; tag: string }>();
  for (const s of cube.getStickers()) {
    const b = boundaryCount(s.p, m);
    const { t } = edgeSlot(s.p, m);
    const isMidge = b === 2 && cube.n % 2 === 1 && t === m / 2;
    const match =
      (kind === "corner" && b === 3) ||
      (kind === "center" && b === 1) ||
      (kind === "wing" && b === 2 && !isMidge) ||
      (kind === "midge" && b === 2 && isMidge);
    if (!match) continue;
    const key = s.p.join(",");
    // fixed centers must sit on their own face; other classes roam freely
    const cls = kind === "center" ? centerClass(s.p, m) : "";
    const tag = cls === "fixed" ? `fixed:${faceFromNormal(s.nv)}` : cls;
    const cubie = byCubie.get(key) ?? { colors: [], tag };
    cubie.colors.push(s.color);
    byCubie.set(key, cubie);
  }
  const out = new Map<string, number>();
  for (const { colors, tag } of byCubie.values()) {
    const sig = tag + [...colors].sort().join("");
    out.set(sig, (out.get(sig) ?? 0) + 1);
  }
  return out;
}

function sameMultiset(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
}

const PIECE_HINT: Record<string, string> = {
  corner: "Almost — one of the corner pieces doesn't match a real cube. Check the corners!",
  wing: "Almost — one of the edge pieces doesn't match a real cube. Check the edges!",
  midge: "Almost — one of the middle edge pieces doesn't match a real cube. Check the edges!",
  center: "Almost — the middle stickers don't match a real cube. Check the centers!",
};

/** Compare every piece class against a solved cube's piece multiset. */
export function checkPieces(cube: Cube): PieceCheck {
  const solved = new Cube(cube.n);
  const kinds: ("corner" | "wing" | "midge" | "center")[] =
    cube.n % 2 === 1 ? ["corner", "wing", "midge", "center"] : ["corner", "wing", "center"];
  for (const kind of kinds) {
    if (!sameMultiset(pieceSignatures(cube, kind), pieceSignatures(solved, kind))) {
      return { ok: false, reason: PIECE_HINT[kind] };
    }
  }
  return { ok: true };
}
