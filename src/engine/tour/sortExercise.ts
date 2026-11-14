// "Sort the countries into continents" builder. Buckets are continent names;
// cards come from the lesson pool, with well-known anchors borrowed only when
// the pool cannot fill two continents on its own.
import type { Question } from "../generators/types";
import { pick, shuffle } from "../rng";
import { TOUR } from "../../strings/tour";
import { sortAnswer } from "./answers";
import { continentOf } from "./countries";
import { TOUR_ANCHORS, countryOf, tourQuestion, type BuildEnv } from "./pool";

const MIN_CARDS = 4;
const MAX_BUCKETS = 3;

function byContinent(codes: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const code of codes) groups.set(continentOf(code), [...(groups.get(continentOf(code)) ?? []), code]);
  return groups;
}

/** Deal cards round-robin so every bucket gets one before any gets a second. */
function deal(buckets: string[], supply: Map<string, string[]>, want: number): string[] {
  const perBucket = Math.ceil(want / buckets.length);
  const cards: string[] = [];
  for (let round = 0; round < perBucket; round++) {
    for (const bucket of buckets) {
      const card = supply.get(bucket)?.[round];
      if (card && cards.length < want) cards.push(card);
    }
  }
  return cards;
}

interface Draft {
  buckets: string[];
  cards: string[];
}

function draftSort(code: string, env: BuildEnv, attempt: number): Draft {
  const { pool, rng, ctx } = env;
  const hard = !ctx.easier && ctx.difficulty > 0.6;
  let want = hard ? 6 : 5;
  if (ctx.easier) want = MIN_CARDS;
  const order = attempt === 0 && env.partners ? env.partners : shuffle(rng, pool.all);
  const supply = byContinent([code, ...order.filter((other) => other !== code)]);
  const home = continentOf(code);
  // Continents with at least two known countries make the better second bucket.
  const size = (continent: string) => Math.min(2, supply.get(continent)?.length ?? 0);
  const others = shuffle(rng, [...supply.keys()].filter((continent) => continent !== home))
    .sort((a, b) => size(b) - size(a));
  const buckets = [home, ...others.slice(0, hard ? MAX_BUCKETS - 1 : 1)];
  let cards = deal(buckets, supply, want);
  // Too few cards: a third known continent beats borrowing unknown countries.
  if (cards.length < MIN_CARDS && buckets.length < MAX_BUCKETS && others.length >= buckets.length) {
    buckets.push(others[buckets.length - 1]);
    cards = deal(buckets, supply, want);
  }
  if (buckets.length >= 2 && cards.length >= MIN_CARDS) return { buckets, cards };
  return borrowAnchors(buckets, supply, env);
}

/** Last resort: top the buckets up (or add a second one) from the anchors. */
function borrowAnchors(buckets: string[], supply: Map<string, string[]>, env: BuildEnv): Draft {
  const anchors = byContinent(shuffle(env.rng, TOUR_ANCHORS));
  const open = [...buckets];
  if (open.length < 2) open.push(pick(env.rng, [...anchors.keys()].filter((continent) => continent !== open[0])));
  const topped = new Map(open.map((bucket) => {
    const own = supply.get(bucket) ?? [];
    return [bucket, [...own, ...(anchors.get(bucket) ?? []).filter((code) => !own.includes(code))]];
  }));
  return { buckets: open, cards: deal(open, topped, MIN_CARDS) };
}

function sortQuestion(code: string, draft: Draft, env: BuildEnv): Question | null {
  const country = countryOf(code);
  const filled = draft.buckets.every((bucket) => draft.cards.some((card) => continentOf(card) === bucket));
  if (!country || !filled || draft.cards.length < MIN_CARDS || !draft.cards.includes(code)) return null;
  const buckets = shuffle(env.rng, draft.buckets);
  const placed = Object.fromEntries(draft.cards.map((card) => [card, continentOf(card)]));
  const codes = [code, ...draft.cards.filter((card) => card !== code)];
  return tourQuestion(TOUR.engine.sort, sortAnswer(buckets, placed), TOUR.engine.hintContinent(country.name, country.continent),
    { tour: "sort", codes, buckets, cards: shuffle(env.rng, draft.cards) }, codes);
}

export function buildSort(code: string, env: BuildEnv): Question | null {
  for (let attempt = 0; attempt < 8; attempt++) {
    const question = sortQuestion(code, draftSort(code, env, attempt), env);
    if (question && !env.isTaken?.(question.dedupeKey ?? "")) return question;
  }
  return null;
}
