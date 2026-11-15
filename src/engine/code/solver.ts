// Shortest plain-arrow programs for a Code Lab grid. A breadth-first search
// over (square, stars still to collect): the first layer that stands on the
// flag holding every star is the shortest program, and among those the one
// with the fewest turns is kept (the easiest to read on a teach card).
// Because a run stops at its first win, "no program of ≤ n arrows wins" is
// exactly "the shortest program is longer than n".
import { stepFrom } from "./judge";
import type { CodeGrid, Dir } from "./types";

const DIRS: Dir[] = ["N", "E", "S", "W"];
/** Longest search; grids are at most 6×6 with 3 stars. */
const LIMIT = 48;

interface Node {
  sq: number;
  mask: number;
  dir: Dir | null;
  turns: number;
  prev: Node | null;
}

function maskAt(grid: CodeGrid, sq: number, mask: number): number {
  const star = grid.stars.indexOf(sq);
  return star < 0 ? mask : mask | (1 << star);
}

function programOf(node: Node): Dir[] {
  const out: Dir[] = [];
  for (let at: Node | null = node; at?.dir; at = at.prev) out.push(at.dir);
  return out.reverse();
}

function expand(grid: CodeGrid, layer: Node[], reached: Set<number>): Node[] {
  const next = new Map<string, Node>();
  for (const node of layer) {
    for (const dir of DIRS) {
      const sq = stepFrom(grid, node.sq, dir);
      if (sq === null) continue;
      const mask = maskAt(grid, sq, node.mask);
      if (reached.has(sq * 8 + mask)) continue;
      const turns = node.turns + (node.dir && node.dir !== dir ? 1 : 0);
      const key = `${sq}:${mask}:${dir}`;
      const known = next.get(key);
      if (!known || turns < known.turns) next.set(key, { sq, mask, dir, turns, prev: node });
    }
  }
  const nodes = [...next.values()];
  nodes.forEach((node) => reached.add(node.sq * 8 + node.mask));
  return nodes;
}

/** A shortest winning program of plain arrows (fewest turns among them), or null when the flag cannot be won. */
export function shortestProgram(grid: CodeGrid): Dir[] | null {
  if (grid.goal < 0 || grid.stars.length > 3) return null;
  const full = (1 << grid.stars.length) - 1;
  const reached = new Set<number>([grid.start * 8 + maskAt(grid, grid.start, 0)]);
  let layer: Node[] = [{ sq: grid.start, mask: maskAt(grid, grid.start, 0), dir: null, turns: 0, prev: null }];
  for (let length = 0; length < LIMIT && layer.length; length++) {
    layer = expand(grid, layer, reached);
    const wins = layer.filter((node) => node.sq === grid.goal && node.mask === full);
    if (wins.length) return programOf(wins.reduce((best, node) => (node.turns < best.turns ? node : best)));
  }
  return null;
}

/** Arrows in the shortest winning program (Infinity when there is none). */
export function shortestLength(grid: CodeGrid): number {
  return shortestProgram(grid)?.length ?? Infinity;
}
