// Pure Rubik's-cube model for 2×2 / 3×3 / 4×4 (outer-layer turns).
// Stickers live in 3D lattice coordinates and turns are true 90° rotations,
// so the adjacency logic can't drift; the 2D net is just a projection.
// Solving is undo-based: the solution is always the inverse of the history.
import { randInt, type RNG } from "./rng";

export type Face = "U" | "D" | "L" | "R" | "F" | "B";
export interface Move {
  face: Face;
  prime: boolean; // true = counter-clockwise (as seen looking AT the face)
  /** How many outermost layers turn together (default 1 = just the face). */
  depth?: number;
  /** true = ONLY the single layer `depth` in from the face (an inner slice). */
  slice?: boolean;
}

export const FACES: Face[] = ["U", "D", "L", "R", "F", "B"];
/** Standard color scheme; faces keep their place (no whole-cube rotations). */
export const FACE_COLORS: Record<Face, string> = {
  U: "#f4f4f4", // white
  D: "#ffd500", // yellow
  F: "#1bb35a", // green
  B: "#2f6fde", // blue
  L: "#ff9a1f", // orange
  R: "#e23b3b", // red
};

export type Vec = [number, number, number];
interface Sticker {
  p: Vec; // cubie lattice position, each axis 0..n-1
  nv: Vec; // outward normal (unit axis vector)
  color: Face;
}

export type Axis = 0 | 1 | 2;
/** Plane axes rotated when turning about each axis: x→(y,z), y→(z,x), z→(x,y). */
const PLANE: Record<Axis, [number, number]> = { 0: [1, 2], 1: [2, 0], 2: [0, 1] };

// axis index + layer side for each face (x: L→R, y: D→U, z: B→F)
export const FACE_AXIS: Record<Face, { axis: Axis; dir: 1 | -1 }> = {
  R: { axis: 0, dir: 1 },
  L: { axis: 0, dir: -1 },
  U: { axis: 1, dir: 1 },
  D: { axis: 1, dir: -1 },
  F: { axis: 2, dir: 1 },
  B: { axis: 2, dir: -1 },
};

/** Rotate (a,b) 90° in a plane; m = n-1. CCW in standard right-handed sense. */
const rotCCW = (a: number, b: number, m: number): [number, number] => [m - b, a];
const rotCW = (a: number, b: number, m: number): [number, number] => [b, m - a];

export function rotateVec(v: Vec, axis: Axis, cw: boolean, m: number): Vec {
  const out: Vec = [...v];
  const [a, b] = PLANE[axis];
  const [ra, rb] = cw ? rotCW(v[a], v[b], m) : rotCCW(v[a], v[b], m);
  out[a] = ra;
  out[b] = rb;
  return out;
}

export function rotateNormal(nv: Vec, axis: Axis, cw: boolean): Vec {
  // same rotation applied to a direction vector (centered: CCW maps (a,b)→(-b,a))
  const out: Vec = [...nv];
  const [a, b] = PLANE[axis];
  if (cw) {
    out[a] = nv[b];
    out[b] = -nv[a];
  } else {
    out[a] = -nv[b];
    out[b] = nv[a];
  }
  return out;
}

export class Cube {
  readonly n: number;
  private stickers: Sticker[] = [];

  constructor(n: number) {
    this.n = n;
    const m = n - 1;
    for (const face of FACES) {
      const { axis, dir } = FACE_AXIS[face];
      const nv: Vec = [0, 0, 0];
      nv[axis] = dir;
      const layer = dir > 0 ? m : 0;
      const [a, b] = PLANE[axis];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const p: Vec = [0, 0, 0];
          p[axis] = layer;
          p[a] = i;
          p[b] = j;
          this.stickers.push({ p, nv: [...nv], color: face });
        }
      }
    }
  }

  /** Turn a face (or wide/slice layers). CW/CCW is as seen looking AT that face. */
  turn(move: Move): void {
    const { axis } = FACE_AXIS[move.face];
    const m = this.n - 1;
    const layers = new Set(layersFor(move, this.n));
    const cw = latticeCW(move);
    for (const s of this.stickers) {
      if (!layers.has(s.p[axis])) continue;
      s.p = rotateVec(s.p, axis, cw, m);
      s.nv = rotateNormal(s.nv, axis, cw);
    }
  }

  /** Project one face to a 2D grid of colors (row 0 = top of the net tile). */
  faceGrid(face: Face): Face[][] {
    const m = this.n - 1;
    const { axis, dir } = FACE_AXIS[face];
    const want: Vec = [0, 0, 0];
    want[axis] = dir;
    const grid: Face[][] = Array.from({ length: this.n }, () => Array.from({ length: this.n }, () => "U" as Face));
    for (const s of this.stickers) {
      if (s.nv[0] !== want[0] || s.nv[1] !== want[1] || s.nv[2] !== want[2]) continue;
      const [x, y, z] = s.p;
      let row = 0;
      let col = 0;
      switch (face) {
        case "F": row = m - y; col = x; break;
        case "B": row = m - y; col = m - x; break;
        case "U": row = z; col = x; break;
        case "D": row = m - z; col = x; break;
        case "R": row = m - y; col = m - z; break;
        case "L": row = m - y; col = z; break;
      }
      grid[row][col] = s.color;
    }
    return grid;
  }

  isSolved(): boolean {
    return FACES.every((f) => {
      const g = this.faceGrid(f);
      const c = g[0][0];
      return g.every((row) => row.every((cell) => cell === c));
    });
  }

  /** Deep copy (same sticker positions, normals and colors). */
  clone(): Cube {
    const c = new Cube(this.n);
    c.stickers = this.stickers.map((s) => ({ p: [...s.p] as Vec, nv: [...s.nv] as Vec, color: s.color }));
    return c;
  }

  /**
   * Build a cube from hand-entered face colors (each `grids[face]` is an n×n
   * array of color letters in the SAME orientation `faceGrid` returns). Lets a
   * physical cube's state be entered, then validated/turned/solved.
   */
  static fromColors(n: number, grids: Record<Face, Face[][]>): Cube {
    const cube = new Cube(n);
    const m = n - 1;
    for (const s of cube.stickers) {
      // which face does this sticker currently show? (solved cube: nv axis)
      const face = faceFromNormal(s.nv);
      const [row, col] = projectToGrid(face, s.p, m);
      s.color = grids[face][row][col];
    }
    return cube;
  }
}

/** Layer indices (along the move's axis) that a move rotates. */
export function layersFor(move: Move, n: number): number[] {
  const { dir } = FACE_AXIS[move.face];
  const d = move.depth ?? 1;
  const depths = move.slice ? [d - 1] : Array.from({ length: d }, (_, k) => k);
  return depths.map((k) => (dir > 0 ? n - 1 - k : k));
}

/** Face whose outward normal equals nv (only valid on a solved lattice). */
export function faceFromNormal(nv: Vec): Face {
  for (const f of FACES) {
    const { axis, dir } = FACE_AXIS[f];
    const want: Vec = [0, 0, 0];
    want[axis] = dir;
    if (nv[0] === want[0] && nv[1] === want[1] && nv[2] === want[2]) return f;
  }
  return "U";
}

/** Position → (row,col) in a face's 2D grid — mirror of Cube.faceGrid. */
export function projectToGrid(face: Face, p: Vec, m: number): [number, number] {
  const [x, y, z] = p;
  switch (face) {
    case "F": return [m - y, x];
    case "B": return [m - y, m - x];
    case "U": return [z, x];
    case "D": return [m - z, x];
    case "R": return [m - y, m - z];
    case "L": return [m - y, z];
  }
}

export const inverse = (mv: Move): Move => ({ ...mv, prime: !mv.prime });

/** Same face + same layer selection (so cancellation logic stays honest). */
export const sameLayers = (a: Move, b: Move): boolean =>
  a.face === b.face && (a.depth ?? 1) === (b.depth ?? 1) && !a.slice === !b.slice;

/**
 * Whether a move is a CLOCKWISE lattice rotation about its axis (viewed from
 * the +axis end). Shared with the 3D view so visuals can't diverge from logic.
 */
export function latticeCW(move: Move): boolean {
  const { dir } = FACE_AXIS[move.face];
  // looking from OUTSIDE along -normal: CW on a +dir face = CW lattice
  // rotation about the axis only when dir>0; flipped for the -dir face.
  return move.prime ? dir < 0 : dir > 0;
}

/** Random scramble that never undoes its own previous move. */
export function scramble(count: number, rng: RNG): Move[] {
  const out: Move[] = [];
  for (let i = 0; i < count; i++) {
    let mv: Move;
    do {
      mv = { face: FACES[randInt(rng, 0, 5)], prime: rng() < 0.5 };
    } while (out.length > 0 && mv.face === out[out.length - 1].face);
    out.push(mv);
  }
  return out;
}

/**
 * Cancel adjacent inverse pairs and collapse triple-same into one opposite
 * turn. Used for undo plans and to tidy generated solutions.
 */
export function cancelMoves(moves: Move[]): Move[] {
  const h: Move[] = [];
  for (const mv of moves) {
    const top = h[h.length - 1];
    if (top && sameLayers(top, mv) && top.prime !== mv.prime) {
      h.pop(); // X then X' cancels
      continue;
    }
    const a = h[h.length - 2];
    if (top && a && sameLayers(top, mv) && sameLayers(a, mv) && top.prime === mv.prime && a.prime === mv.prime) {
      h.pop();
      h.pop();
      h.push(inverse(mv)); // three same turns = one opposite turn
      continue;
    }
    h.push(mv);
  }
  return h;
}

/** History → shortest undo plan: cancel, then reverse + invert. */
export function solutionFor(history: Move[]): Move[] {
  return cancelMoves(history).map(inverse).reverse();
}
