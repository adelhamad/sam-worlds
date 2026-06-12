// Parity defects of a mapped 3×3 facelet string. A reduced big cube can carry
// two flaws a 3×3 solver silently normalizes away: odd edge-orientation
// parity ("OLL parity") and odd corner-vs-edge permutation parity ("PLL
// parity"). Both are cheap to read straight off the facelets, which lets the
// orchestrator apply the matching fix BEFORE wasting a solver round trip.
// Facelet layout: faces in U R F D L B order, each 9 chars row-major in
// faceGrid orientation (same string cubejs consumes).
import type { Face } from "../cube";

const FACE_AT: Record<Face, number> = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
const at = (face: Face, r: number, c: number): number => FACE_AT[face] * 9 + r * 3 + c;

/** The 12 edges as [reference sticker, other sticker]; the reference is the
 *  U/D-face sticker, or the F/B-face sticker for equator edges. */
const EDGES: [number, number][] = [
  [at("U", 0, 1), at("B", 0, 1)],
  [at("U", 1, 0), at("L", 0, 1)],
  [at("U", 1, 2), at("R", 0, 1)],
  [at("U", 2, 1), at("F", 0, 1)],
  [at("D", 0, 1), at("F", 2, 1)],
  [at("D", 1, 0), at("L", 2, 1)],
  [at("D", 1, 2), at("R", 2, 1)],
  [at("D", 2, 1), at("B", 2, 1)],
  [at("F", 1, 0), at("L", 1, 2)],
  [at("F", 1, 2), at("R", 1, 0)],
  [at("B", 1, 2), at("L", 1, 0)],
  [at("B", 1, 0), at("R", 1, 2)],
];

/** Corner sticker triples (any consistent order — only permutation matters). */
const CORNERS: [number, number, number][] = [
  [at("U", 0, 0), at("L", 0, 0), at("B", 0, 2)],
  [at("U", 0, 2), at("B", 0, 0), at("R", 0, 2)],
  [at("U", 2, 0), at("F", 0, 0), at("L", 0, 2)],
  [at("U", 2, 2), at("R", 0, 0), at("F", 0, 2)],
  [at("D", 0, 0), at("L", 2, 2), at("F", 2, 0)],
  [at("D", 0, 2), at("F", 2, 2), at("R", 2, 0)],
  [at("D", 2, 0), at("B", 2, 2), at("L", 2, 0)],
  [at("D", 2, 2), at("R", 2, 2), at("B", 2, 0)],
];

const UD = new Set<string>(["U", "D"]);
const LR = new Set<string>(["L", "R"]);

/** ZZ-style bad-edge rule; the total count's parity is the EO invariant. */
function edgeBad(ref: string, other: string): boolean {
  if (UD.has(ref)) return false;
  if (LR.has(ref)) return true;
  return UD.has(other); // ref shows F/B
}

/** Parity (0/1) of the permutation taking each slot's piece to its home. */
function permParity(pieces: string[], home: string[]): number {
  const idx = new Map(home.map((sig, i) => [sig, i]));
  const perm = pieces.map((sig) => idx.get(sig) ?? 0);
  const seen = new Array(perm.length).fill(false);
  let parity = 0;
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    let len = 0;
    let j = i;
    while (!seen[j]) {
      seen[j] = true;
      j = perm[j];
      len++;
    }
    parity ^= (len - 1) & 1;
  }
  return parity;
}

export interface MappedDefects {
  eoOdd: boolean;
  permOdd: boolean;
}

/** Read both parity defects off a mapped (centers-solved) facelet string. */
export function mappedDefects(facelets: string): MappedDefects {
  let bad = 0;
  const edgesNow: string[] = [];
  const edgesHome: string[] = [];
  for (const [a, b] of EDGES) {
    if (edgeBad(facelets[a], facelets[b])) bad++;
    edgesNow.push([facelets[a], facelets[b]].sort().join(""));
    edgesHome.push([faceOf(a), faceOf(b)].sort().join(""));
  }
  const cornersNow: string[] = [];
  const cornersHome: string[] = [];
  for (const [a, b, c] of CORNERS) {
    cornersNow.push([facelets[a], facelets[b], facelets[c]].sort().join(""));
    cornersHome.push([faceOf(a), faceOf(b), faceOf(c)].sort().join(""));
  }
  return {
    eoOdd: bad % 2 === 1,
    permOdd: (permParity(edgesNow, edgesHome) ^ permParity(cornersNow, cornersHome)) === 1,
  };
}

const FACE_NAMES: Face[] = ["U", "R", "F", "D", "L", "B"];
const faceOf = (facelet: number): Face => FACE_NAMES[Math.floor(facelet / 9)];
