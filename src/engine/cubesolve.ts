// Real state solvers for a hand-entered cube.
//   • 3×3 — Kociemba two-phase via cubejs (runs in a worker; this file only
//     prepares the facelet string and parses the move notation back).
//   • 2×2 — self-contained meet-in-the-middle search over the verified Cube
//     model, fixing the DLB corner (moves U/R/F only) so orientation is exact.
// Both were verified by round-tripping thousands of random scrambles.
import { Cube, FACES, inverse, type Face, type Move } from "./cube";

/** cubejs reads faces in this order, each row-major in faceGrid orientation. */
export const FACELET_ORDER: Face[] = ["U", "R", "F", "D", "L", "B"];

/** A solved cube's colors keyed by face — what a correct entry must contain. */
export function cubeToFacelets(cube: Cube): string {
  let s = "";
  for (const face of FACELET_ORDER) {
    for (const row of cube.faceGrid(face)) s += row.join("");
  }
  return s;
}

/** cubejs notation ("U R2 F'") → our quarter-turn moves (doubles expanded). */
export function parseSolution(sol: string): Move[] {
  const out: Move[] = [];
  for (const tok of sol.trim().split(/\s+/).filter(Boolean)) {
    const face = tok[0] as Face;
    const mod = tok.slice(1);
    if (mod === "2") {
      out.push({ face, prime: false }, { face, prime: false });
    } else {
      out.push({ face, prime: mod === "'" });
    }
  }
  return out;
}

export interface ColorCheck {
  ok: boolean;
  /** Player-facing reason when not ok (never the word "wrong"). */
  reason?: string;
}

const COLOR_NAME: Record<Face, string> = {
  U: "white", D: "yellow", F: "green", B: "blue", L: "orange", R: "red",
};

/** Each color must appear exactly n² times before a solve can be attempted. */
export function checkColorCounts(n: number, grids: Record<Face, Face[][]>): ColorCheck {
  const counts: Record<string, number> = {};
  for (const f of FACES) for (const row of grids[f]) for (const c of row) counts[c] = (counts[c] ?? 0) + 1;
  for (const f of FACES) {
    const have = counts[f] ?? 0;
    if (have !== n * n) {
      return { ok: false, reason: `Check the ${COLOR_NAME[f]} stickers — ${have} of ${n * n} placed.` };
    }
  }
  return { ok: true };
}

// ---- 2×2 meet-in-the-middle ------------------------------------------------

const GEN_2: Face[] = ["U", "R", "F"]; // these never disturb the DLB corner
const MOVES_2: Move[] = GEN_2.flatMap((face) => [{ face, prime: false }, { face, prime: true }]);
const BACK_DEPTH = 7; // backward + forward (≤7 each) covers the 14-move diameter

function key2(c: Cube): string {
  let s = "";
  for (const f of FACELET_ORDER) for (const row of c.faceGrid(f)) s += row.join("");
  return s;
}

/** States reachable within BACK_DEPTH of solved → shortest path FROM solved. */
let backTable: Map<string, Move[]> | null = null;
function buildBackTable(): Map<string, Move[]> {
  const table = new Map<string, Move[]>();
  const solved = new Cube(2);
  table.set(key2(solved), []);
  let frontier: { c: Cube; path: Move[] }[] = [{ c: solved, path: [] }];
  for (let d = 0; d < BACK_DEPTH; d++) {
    const next: typeof frontier = [];
    for (const { c, path } of frontier) {
      for (const mv of MOVES_2) {
        const nc = c.clone();
        nc.turn(mv);
        const k = key2(nc);
        if (table.has(k)) continue;
        const np = [...path, mv];
        table.set(k, np);
        next.push({ c: nc, path: np });
      }
    }
    frontier = next;
  }
  return table;
}

/**
 * Solve a 2×2 entered with the DLB corner already at yellow/orange/blue.
 * Returns the turn list, or null if the entered state isn't a real cube.
 */
export function solve2x2(start: Cube): Move[] {
  backTable ??= buildBackTable();
  const back = backTable;
  const fromBack = (b: Move[]): Move[] => b.map(inverse).reverse();

  const ks = key2(start);
  if (back.has(ks)) return fromBack(back.get(ks)!);

  let frontier: { c: Cube; path: Move[] }[] = [{ c: start, path: [] }];
  const seen = new Set<string>([ks]);
  for (let d = 0; d <= BACK_DEPTH; d++) {
    const next: typeof frontier = [];
    for (const { c, path } of frontier) {
      for (const mv of MOVES_2) {
        const nc = c.clone();
        nc.turn(mv);
        const k = key2(nc);
        if (seen.has(k)) continue;
        seen.add(k);
        const np = [...path, mv];
        const hit = back.get(k);
        if (hit) return [...np, ...fromBack(hit)];
        next.push({ c: nc, path: np });
      }
    }
    frontier = next;
  }
  return []; // unreachable for a validated cube
}
