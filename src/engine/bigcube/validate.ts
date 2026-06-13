// Piece-level validation of a hand-entered 4×4/5×5: every piece type the cube
// physically contains must be present in exactly the right amount. Deeper
// invariants (twists, parities) are caught later when the reduced 3×3 is
// handed to the solver, so a bad paint can never loop forever.
import { centerOrbitsOf, cornersOf, edgesOf } from "./tables";

export interface BigCheck {
  ok: boolean;
  reason?: string;
}

const COLOR_NAME = ["white", "yellow", "orange", "red", "green", "blue"]; // CIDX order U,D,L,R,F,B

/** A solved state: slot color = its face. */
function solvedState(n: number): Uint8Array {
  const s = new Uint8Array(6 * n * n);
  for (let f = 0; f < 6; f++) for (let i = 0; i < n * n; i++) s[f * n * n + i] = f;
  return s;
}

function multiset(items: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) m.set(it, (m.get(it) ?? 0) + 1);
  return m;
}

function sameMultiset(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
}

function centerCheck(n: number, state: Uint8Array): BigCheck {
  const orbits = centerOrbitsOf(n);
  for (const slots of [orbits.x.flat(), orbits.plus.flat()]) {
    if (slots.length === 0) continue;
    const counts = new Array<number>(6).fill(0);
    for (const s of slots) counts[state[s]]++;
    for (let c = 0; c < 6; c++) {
      if (counts[c] !== slots.length / 6) {
        return { ok: false, reason: `Check the ${COLOR_NAME[c]} centers — a real cube has ${slots.length / 6} of them there.` };
      }
    }
  }
  const nn = n * n;
  for (const s of orbits.mid) {
    if (state[s] !== Math.floor(s / nn)) return { ok: false, reason: "Check the middle centers." };
  }
  return { ok: true };
}

function cornerKey(state: Uint8Array, slots: [number, number, number]): string {
  return slots
    .map((s) => state[s])
    .sort((x, y) => x - y)
    .join("");
}

function edgeKeys(n: number, state: Uint8Array): { wings: string[]; midges: string[] } {
  const wings: string[] = [];
  const midges: string[] = [];
  const mid = (n - 3) / 2; // index of the midge cubie on odd cubes
  for (const e of edgesOf(n)) {
    for (let i = 0; i < e.a.length; i++) {
      const key = [state[e.a[i]], state[e.b[i]]].sort((x, y) => x - y).join("");
      if (n % 2 === 1 && i === mid) midges.push(key);
      else wings.push(key);
    }
  }
  return { wings, midges };
}

/** Full piece-multiset validation against a solved cube of the same size. */
export function validateBig(n: number, state: Uint8Array): BigCheck {
  const centers = centerCheck(n, state);
  if (!centers.ok) return centers;

  const solved = solvedState(n);
  const corners = cornersOf(n);
  const got = multiset(corners.map((c) => cornerKey(state, c.slots)));
  const want = multiset(corners.map((c) => cornerKey(solved, c.slots)));
  if (!sameMultiset(got, want)) {
    return { ok: false, reason: "Check the corner pieces — one corner doesn't match a real cube." };
  }

  const gotE = edgeKeys(n, state);
  const wantE = edgeKeys(n, solved);
  if (!sameMultiset(multiset(gotE.wings), multiset(wantE.wings))) {
    return { ok: false, reason: "Check the edge stickers — an edge piece doesn't match a real cube." };
  }
  if (!sameMultiset(multiset(gotE.midges), multiset(wantE.midges))) {
    return { ok: false, reason: "Check the middle edge stickers — one doesn't match a real cube." };
  }
  return { ok: true };
}
