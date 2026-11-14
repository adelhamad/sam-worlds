// Decides WHICH exercise kind each slot of a lesson uses: two easy "pick"
// openers, a varied middle where no two neighbours share a kind, and a
// satisfying "pairs" finish.
import { pick, shuffle, type RNG } from "../rng";
import type { TourKind } from "./types";

/** Kinds every lesson should contain when they are possible, most important first. */
const MUST_HAVE: TourKind[] = ["build", "map", "sort", "paint", "pairs"];
/** How often a kind is drawn for the remaining free slots. */
const WEIGHT: Record<TourKind, number> = { pick: 2, pairs: 1, build: 2, map: 3, sort: 1, paint: 2 };
/** Soft ceiling per lesson, so no kind takes over. */
const CEILING: Record<TourKind, number> = { pick: 4, pairs: 3, build: 3, map: 3, sort: 2, paint: 2 };
/** Lessons this long get a second build exercise. */
const LONG_LESSON = 10;

type Capacity = (kind: TourKind) => number;

class Tally {
  private readonly used = new Map<TourKind, number>();

  constructor(private readonly capacity: Capacity) {}

  add(kind: TourKind, times = 1): void {
    this.used.set(kind, this.count(kind) + times);
  }

  count(kind: TourKind): number {
    return this.used.get(kind) ?? 0;
  }

  /** Still under the number of different countries that can carry this kind. */
  hasRoom(kind: TourKind): boolean {
    return this.count(kind) < this.capacity(kind);
  }

  underCeiling(kind: TourKind): boolean {
    return this.hasRoom(kind) && this.count(kind) < CEILING[kind];
  }
}

function weighted(rng: RNG, kinds: TourKind[]): TourKind {
  const total = kinds.reduce((sum, kind) => sum + WEIGHT[kind], 0);
  let roll = rng() * total;
  for (const kind of kinds) {
    roll -= WEIGHT[kind];
    if (roll < 0) return kind;
  }
  return kinds[kinds.length - 1];
}

function filler(allowed: TourKind[], tally: Tally, rng: RNG): TourKind {
  const calm = allowed.filter((kind) => tally.underCeiling(kind));
  const roomy = allowed.filter((kind) => tally.hasRoom(kind));
  if (calm.length) return weighted(rng, calm);
  return roomy.length ? weighted(rng, roomy) : pick(rng, allowed);
}

function middleKinds(allowed: TourKind[], length: number, long: boolean, tally: Tally, rng: RNG): TourKind[] {
  const middle: TourKind[] = [];
  const add = (kind: TourKind) => {
    middle.push(kind);
    tally.add(kind);
  };
  for (const kind of long ? [...MUST_HAVE, "build" as const] : MUST_HAVE) {
    if (middle.length < length && allowed.includes(kind) && tally.hasRoom(kind)) add(kind);
  }
  while (middle.length < length) add(filler(allowed, tally, rng));
  return middle;
}

function noNeighbours(sequence: TourKind[], from: number): boolean {
  for (let i = Math.max(1, from); i < sequence.length; i++) {
    if (sequence[i] === sequence[i - 1]) return false;
  }
  return true;
}

/** Fallback arrangement: always place the most plentiful kind that differs from its neighbour. */
function greedy(middle: TourKind[], before: TourKind, after: TourKind): TourKind[] {
  const left = [...middle];
  const out: TourKind[] = [];
  while (left.length) {
    const previous = out[out.length - 1] ?? before;
    const amount = (kind: TourKind) => left.filter((other) => other === kind).length;
    const fits = (kind: TourKind) => kind !== previous && (left.length > 1 || kind !== after);
    const choice = [...left].sort((a, b) => Number(fits(b)) - Number(fits(a)) || amount(b) - amount(a))[0];
    out.push(choice);
    left.splice(left.indexOf(choice), 1);
  }
  return out;
}

/**
 * The kind of every slot. `capacity(kind)` = how many pool countries can carry
 * that kind (0 = the kind is not possible in this lesson).
 */
export function planKinds(kinds: TourKind[], count: number, rng: RNG, capacity: Capacity): TourKind[] {
  const possible = [...new Set(kinds)].filter((kind) => capacity(kind) > 0);
  const allowed: TourKind[] = possible.length ? possible : ["pick"];
  if (count <= 1) return [pick(rng, allowed)];
  const opener = allowed.includes("pick") ? "pick" : allowed[0];
  const closer = allowed.includes("pairs") ? "pairs" : allowed[allowed.length - 1];
  const openers = Array.from({ length: Math.min(2, count - 1) }, () => opener);
  const tally = new Tally(capacity);
  tally.add(opener, openers.length);
  tally.add(closer);
  const middle = middleKinds(allowed, count - openers.length - 1, count >= LONG_LESSON, tally, rng);
  for (let attempt = 0; attempt < 40; attempt++) {
    const sequence = [...openers, ...shuffle(rng, middle), closer];
    if (noNeighbours(sequence, openers.length)) return sequence;
  }
  return [...openers, ...greedy(middle, opener, closer), closer];
}
