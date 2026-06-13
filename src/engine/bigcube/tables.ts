// Sticker-permutation tables + lattice geometry for the 4×4/5×5 solver.
// Everything is derived from the verified Cube lattice helpers (rotateVec,
// projectToGrid, …) so the tables cannot drift from the engine; the dev
// harness additionally cross-checks them against Cube.turn.
import {
  FACE_AXIS,
  FACES,
  faceFromNormal,
  latticeCW,
  layersFor,
  projectToGrid,
  rotateNormal,
  rotateVec,
  type Face,
  type Move,
  type Vec,
} from "../cube";

/** Color/face index in FACES order (U,D,L,R,F,B). */
export const CIDX: Record<Face, number> = { U: 0, D: 1, L: 2, R: 3, F: 4, B: 5 };

export const slotIndex = (n: number, f: number, row: number, col: number): number => f * n * n + row * n + col;

interface SlotGeo {
  p: Vec;
  nv: Vec;
}

/** Lattice position + outward normal for every sticker slot, slot-indexed. */
function slotGeometry(n: number): SlotGeo[] {
  const m = n - 1;
  const out: SlotGeo[] = new Array(6 * n * n);
  for (let f = 0; f < 6; f++) {
    const face = FACES[f];
    const { axis, dir } = FACE_AXIS[face];
    const nv: Vec = [0, 0, 0];
    nv[axis] = dir;
    const layer = dir > 0 ? m : 0;
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        for (let z = 0; z < n; z++) {
          const p: Vec = [x, y, z];
          if (p[axis] !== layer) continue;
          const [row, col] = projectToGrid(face, p, m);
          out[slotIndex(n, f, row, col)] = { p, nv: [...nv] as Vec };
        }
      }
    }
  }
  return out;
}

const geoCache = new Map<number, SlotGeo[]>();
const geometry = (n: number): SlotGeo[] => {
  let g = geoCache.get(n);
  if (!g) {
    g = slotGeometry(n);
    geoCache.set(n, g);
  }
  return g;
};

/** Permutation for one move: result[i] = state[from[i]]. */
export function tableFor(n: number, move: Move): Int32Array {
  const geo = geometry(n);
  const m = n - 1;
  const { axis } = FACE_AXIS[move.face];
  const layers = new Set(layersFor(move, n));
  const cw = latticeCW(move);
  const from = new Int32Array(6 * n * n);
  for (let slot = 0; slot < geo.length; slot++) {
    const { p, nv } = geo[slot];
    if (!layers.has(p[axis])) {
      from[slot] = slot;
      continue;
    }
    const p2 = rotateVec(p, axis, cw, m);
    const nv2 = rotateNormal(nv, axis, cw);
    const face2 = faceFromNormal(nv2);
    const [row, col] = projectToGrid(face2, p2, m);
    from[slotIndex(n, CIDX[face2], row, col)] = slot;
  }
  return from;
}

/** Compose permutations applied left-to-right: applying A then B. */
export function composeTables(tables: Int32Array[]): Int32Array {
  let acc = tables[0].slice();
  for (let k = 1; k < tables.length; k++) {
    const b = tables[k];
    const next = new Int32Array(acc.length);
    for (let i = 0; i < acc.length; i++) next[i] = acc[b[i]];
    acc = next;
  }
  return acc;
}

export function applyTable(state: Uint8Array, from: Int32Array, out: Uint8Array): void {
  for (let i = 0; i < from.length; i++) out[i] = state[from[i]];
}

export const moveKey = (mv: Move): string => `${mv.face}${mv.prime ? "'" : ""}${mv.depth ?? 1}${mv.slice ? "s" : ""}`;

/** One searchable operation: a primitive move or a composed macro. */
export interface Op {
  seq: Move[];
  from: Int32Array;
  key: string;
  inv: number; // index of the inverse op in the same list (-1 if absent)
}

export function makeOps(n: number, seqs: Move[][]): Op[] {
  const ops: Op[] = seqs.map((seq) => ({
    seq,
    from: composeTables(seq.map((mv) => tableFor(n, mv))),
    key: seq.map(moveKey).join(" "),
    inv: -1,
  }));
  for (let i = 0; i < ops.length; i++) {
    if (ops[i].inv >= 0) continue;
    const invKey = [...ops[i].seq]
      .reverse()
      .map((mv) => moveKey({ ...mv, prime: !mv.prime }))
      .join(" ");
    const j = ops.findIndex((o) => o.key === invKey);
    if (j >= 0) {
      ops[i].inv = j;
      ops[j].inv = i;
    }
  }
  return ops;
}

/** Color state (CIDX values per slot) from hand-entered face grids. */
export function stateFromGrids(n: number, grids: Record<Face, Face[][]>): Uint8Array {
  const state = new Uint8Array(6 * n * n);
  for (let f = 0; f < 6; f++) {
    const g = grids[FACES[f]];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) state[slotIndex(n, f, r, c)] = CIDX[g[r][c]];
  }
  return state;
}

export function isAllSolved(n: number, state: Uint8Array): boolean {
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < n * n; i++) if (state[f * n * n + i] !== f) return false;
  }
  return true;
}

// ---- piece geometry ---------------------------------------------------------

export interface EdgeGeo {
  /** Sticker slots along the edge; a[i] and b[i] belong to the same cubie. */
  a: number[];
  b: number[];
}

/** The 12 edges; on odd cubes index (n-3)/2… the middle cubie is the midge. */
export function edgesOf(n: number): EdgeGeo[] {
  const m = n - 1;
  const out: EdgeGeo[] = [];
  for (let i = 0; i < 6; i++) {
    for (let j = i + 1; j < 6; j++) {
      const A = FACES[i];
      const B = FACES[j];
      const aAx = FACE_AXIS[A];
      const bAx = FACE_AXIS[B];
      if (aAx.axis === bAx.axis) continue;
      const tAxis = ([0, 1, 2] as const).find((ax) => ax !== aAx.axis && ax !== bAx.axis)!;
      const a: number[] = [];
      const b: number[] = [];
      for (let t = 1; t < m; t++) {
        const p: Vec = [0, 0, 0];
        p[aAx.axis] = aAx.dir > 0 ? m : 0;
        p[bAx.axis] = bAx.dir > 0 ? m : 0;
        p[tAxis] = t;
        const [ra, ca] = projectToGrid(A, p, m);
        const [rb, cb] = projectToGrid(B, p, m);
        a.push(slotIndex(n, i, ra, ca));
        b.push(slotIndex(n, j, rb, cb));
      }
      out.push({ a, b });
    }
  }
  return out;
}

export interface CornerGeo {
  /** Sticker slots ordered by normal axis (x, y, z). */
  slots: [number, number, number];
}

export function cornersOf(n: number): CornerGeo[] {
  const m = n - 1;
  const out: CornerGeo[] = [];
  for (const x of [0, m]) {
    for (const y of [0, m]) {
      for (const z of [0, m]) {
        const p: Vec = [x, y, z];
        const faces: Face[] = [x === m ? "R" : "L", y === m ? "U" : "D", z === m ? "F" : "B"];
        const slots = faces.map((f) => {
          const [r, c] = projectToGrid(f, p, m);
          return slotIndex(n, CIDX[f], r, c);
        }) as [number, number, number];
        out.push({ slots });
      }
    }
  }
  return out;
}

export interface CenterOrbits {
  /** Per face: corner-type ("X") center slots. */
  x: number[][];
  /** Per face: edge-type ("+") center slots (5×5 only). */
  plus: number[][];
  /** Per face: the fixed middle center slot (odd cubes only). */
  mid: number[];
}

export function centerOrbitsOf(n: number): CenterOrbits {
  const x: number[][] = [];
  const plus: number[][] = [];
  const mid: number[] = [];
  const c = (n - 1) / 2;
  for (let f = 0; f < 6; f++) {
    const xs: number[] = [];
    const ps: number[] = [];
    for (let r = 1; r < n - 1; r++) {
      for (let col = 1; col < n - 1; col++) {
        if (n % 2 === 1 && r === c && col === c) {
          mid.push(slotIndex(n, f, r, col));
        } else if (n % 2 === 1 && (r === c || col === c)) {
          ps.push(slotIndex(n, f, r, col));
        } else {
          xs.push(slotIndex(n, f, r, col));
        }
      }
    }
    x.push(xs);
    plus.push(ps);
  }
  return { x, plus, mid };
}

// ---- move sets ---------------------------------------------------------------

const BOTH = [false, true];

export const outerMoves = (): Move[] => FACES.flatMap((face) => BOTH.map((prime) => ({ face, prime })));

export const sliceMoves2 = (): Move[] =>
  FACES.flatMap((face) => BOTH.map((prime) => ({ face, prime, depth: 2, slice: true })));

/** Central slices on a 5×5 (one per axis, two directions). */
export const sliceMoves3 = (): Move[] =>
  (["R", "U", "F"] as Face[]).flatMap((face) => BOTH.map((prime) => ({ face, prime, depth: 3, slice: true })));
