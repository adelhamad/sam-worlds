// World Tour exercise builders — one pure builder per kind. Each takes the
// country the question is about plus a BuildEnv and returns a Question, or
// null when that country cannot carry that kind (no map room, name too long…).
import type { Question } from "../generators/types";
import { shuffle } from "../rng";
import { TOUR } from "../../strings/tour";
import { lettersOf, pairsAnswer, paintAnswer } from "./answers";
import { nameChunks } from "./chunks";
import { mapEligible, mapView } from "./mapView";
import { PAINT_COLORS, PAINT_COLOR_BY_ID, PAINT_FLAGS, paintWeights } from "./paintFlags";
import { TOUR_ANCHORS, countryOf, tourQuestion, type BuildEnv, type LessonPool } from "./pool";
import { buildSort } from "./sortExercise";
import type { PickPayload, TourKind } from "./types";

const E = TOUR.engine;
const MAX_TILES = 9;

/** Difficulty has reached `level` (never while the child needs it gentler). */
function reached(env: BuildEnv, level: number): boolean {
  return !env.ctx.easier && env.ctx.difficulty >= level;
}

/** Difficulty is strictly past `level`. */
function past(env: BuildEnv, level: number): boolean {
  return !env.ctx.easier && env.ctx.difficulty > level;
}

/** Other countries to show beside `code`: lesson pool first, anchors as a top-up. */
function distractors(code: string, count: number, env: BuildEnv, taken: string[] = []): string[] {
  const free = (list: string[]) => list.filter((other) => other !== code && !taken.includes(other));
  const base = env.wide ? [...new Set([...env.pool.all, ...TOUR_ANCHORS])] : env.pool.all;
  const others = shuffle(env.rng, free(base));
  const continent = countryOf(code)?.continent;
  const near = (other: string) => countryOf(other)?.continent === continent;
  // Harder: neighbours from the same continent are the tempting ones.
  const ordered = reached(env, 0.5) ? [...others.filter(near), ...others.filter((other) => !near(other))] : others;
  const spare = shuffle(env.rng, free(TOUR_ANCHORS).filter((other) => !ordered.includes(other)));
  return [...ordered, ...spare].slice(0, count);
}

function pickLook(env: BuildEnv): Pick<PickPayload, "ask" | "show"> {
  const roll = env.rng();
  if (env.basic || !reached(env, 0.5) || roll >= 0.6) return { ask: "name", show: "flag" };
  return roll < 0.3 ? { ask: "flag", show: "outline" } : { ask: "outline", show: "flag" };
}

function pickPrompt(ask: PickPayload["ask"], name: string): string {
  if (ask === "name") return E.pickFlag(name);
  return ask === "flag" ? E.pickShape : E.pickFlagForShape;
}

export function buildPick(code: string, env: BuildEnv): Question | null {
  const country = countryOf(code);
  if (!country) return null;
  const look = pickLook(env);
  const options = shuffle(env.rng, [code, ...distractors(code, env.ctx.easier ? 2 : 3, env)]);
  const hint = look.ask === "name" ? E.hintContinent(country.name, country.continent) : E.hintHiddenContinent(country.continent);
  return tourQuestion(pickPrompt(look.ask, country.name), code, hint,
    { tour: "pick", codes: [code], guessable: true, ...look, code, options }, [code]);
}

function pairsSize(env: BuildEnv): number {
  if (env.ctx.easier) return 3;
  return env.ctx.difficulty > 0.6 ? 5 : 4;
}

/** The cards for one try: the favourite partners first, wider and smaller as tries go on. */
function pairsLeft(code: string, env: BuildEnv, attempt: number): string[] {
  const partners = (env.partners ?? shuffle(env.rng, env.pool.all)).filter((other) => other !== code);
  const size = Math.max(3, Math.min(pairsSize(env), partners.length + 1) - (attempt >= 4 ? 1 : 0));
  const chosen = attempt === 0 ? partners : shuffle(env.rng, partners.slice(0, size - 1 + attempt * 2));
  const left = [code, ...chosen.slice(0, size - 1)];
  return left.length < size ? [...left, ...distractors(code, size - left.length, env, left)] : left;
}

export function buildPairs(code: string, env: BuildEnv): Question | null {
  if (!countryOf(code)) return null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const cards = pairsLeft(code, env, attempt);
    const question = pairsQuestion(code, cards, env);
    if (!env.isTaken?.(question.dedupeKey ?? "")) return question;
  }
  return null;
}

function pairsQuestion(code: string, cards: string[], env: BuildEnv): Question {
  // One spare name on the right, so the last pair is never free by elimination.
  const decoy = past(env, 0.3) ? distractors(code, 1, env, cards) : [];
  const shapes = past(env, 0.55) && env.rng() < 0.4;
  const left = shuffle(env.rng, cards);
  const right = shuffle(env.rng, [...cards, ...decoy]);
  return tourQuestion(shapes ? E.pairsShapes : E.pairsFlags, pairsAnswer(left), E.hintPairs,
    { tour: "pairs", codes: cards, leftKind: shapes ? "outline" : "flag", left, right }, cards);
}

function decoyCount(env: BuildEnv): number {
  if (env.ctx.easier) return 1;
  return env.ctx.difficulty > 0.6 ? 3 : 2;
}

/** Chunks of OTHER countries' names; never a copy of a real chunk. */
function decoyChunks(code: string, real: string[], count: number, env: BuildEnv): string[] {
  const decoys: string[] = [];
  const sources = [...shuffle(env.rng, env.pool.all), ...shuffle(env.rng, TOUR_ANCHORS)].filter((other) => other !== code);
  for (const other of sources) {
    if (decoys.length >= count) break;
    const chunks = (nameChunks(countryOf(other)?.name ?? "") ?? []).flat();
    const fresh = shuffle(env.rng, chunks).find((chunk) => !real.includes(chunk) && !decoys.includes(chunk));
    if (fresh) decoys.push(fresh);
  }
  return decoys;
}

export function buildBuild(code: string, env: BuildEnv): Question | null {
  const country = countryOf(code);
  const words = country ? nameChunks(country.name) : null;
  if (!country || !words) return null;
  const real = words.flat();
  const decoys = decoyChunks(code, real, Math.max(0, Math.min(decoyCount(env), MAX_TILES - real.length)), env);
  const shape = past(env, 0.5) && env.rng() < 0.35;
  const answer = lettersOf(country.name);
  return tourQuestion(shape ? E.buildFromShape : E.buildFromFlag, answer, E.hintBuild(answer[0], country.continent), {
    tour: "build", codes: [code], from: shape ? "outline" : "flag", code,
    tiles: shuffle(env.rng, [...real, ...decoys]), words: words.map((word) => word.join("").length),
  }, [code]);
}

export function buildMap(code: string, env: BuildEnv): Question | null {
  const country = countryOf(code);
  const camera = country ? mapView(code, env.rng, env.ctx) : null;
  if (!country || !camera) return null;
  const byFlag = reached(env, 0.5) && env.rng() < 0.4;
  const hint = byFlag ? E.hintHiddenContinent(country.continent) : E.hintContinent(country.name, country.continent);
  return tourQuestion(byFlag ? E.mapFlag : E.mapName(country.name), code, hint,
    { tour: "map", codes: [code], guessable: true, ask: byFlag ? "flag" : "name", code, ...camera }, [code]);
}

/** Blue and sky blue side by side are a trap, not a lesson — only when it is meant to be hard. */
function confusable(color: string, flagColors: string[]): boolean {
  return (color === "sky" && flagColors.includes("blue")) || (color === "blue" && flagColors.includes("sky"));
}

export function buildPaint(code: string, env: BuildEnv): Question | null {
  const country = countryOf(code);
  const flag = PAINT_FLAGS[code];
  if (!country || !flag) return null;
  const hard = past(env, 0.6);
  const real = [...new Set(flag.colors)];
  const spare = PAINT_COLORS.map((color) => color.id)
    .filter((id) => !real.includes(id) && (hard || !confusable(id, real)));
  const extra = shuffle(env.rng, spare).slice(0, Math.max(0, (hard ? 6 : 5) - real.length));
  const names = flag.colors.map((id) => PAINT_COLOR_BY_ID.get(id)?.name ?? id);
  return tourQuestion(E.paint(country.name), paintAnswer(flag.colors), E.hintPaint(names), {
    tour: "paint", codes: [code], code, dir: flag.dir, weights: paintWeights(flag),
    palette: shuffle(env.rng, [...real, ...extra]), peek: env.ctx.easier || env.ctx.difficulty < 0.45,
  }, [code]);
}

const BUILDERS: Record<TourKind, (code: string, env: BuildEnv) => Question | null> = {
  pick: buildPick,
  pairs: buildPairs,
  build: buildBuild,
  map: buildMap,
  sort: buildSort,
  paint: buildPaint,
};

export function buildExercise(kind: TourKind, code: string, env: BuildEnv): Question | null {
  return BUILDERS[kind](code, env);
}

/** Can `code` be the primary country of a `kind` exercise? */
export function eligibleFor(kind: TourKind, code: string): boolean {
  if (!countryOf(code)) return false;
  if (kind === "build") return nameChunks(countryOf(code)?.name ?? "") !== null;
  if (kind === "map") return mapEligible(code);
  if (kind === "paint") return code in PAINT_FLAGS;
  return true;
}

/** How many different primary countries the pool offers for `kind`. */
export function kindCapacity(kind: TourKind, pool: LessonPool): number {
  return pool.all.filter((code) => eligibleFor(kind, code)).length;
}
