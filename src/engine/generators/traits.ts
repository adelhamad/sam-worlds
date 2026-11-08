import { ADAPTATIONS, OBSERVATIONS } from "../../content/traits/examples";
import { CONCEPTS } from "../../content/traits/concepts";
import { TRAIT_CHANGE_EVENTS } from "../../content/traits/changes";
import { STR } from "../../strings/en";
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

export interface TraitsParams { items: string[] }
// Bump for intentional copy migrations; current questions resume exactly as saved.
export const TRAITS_COPY_VERSION = 2;
export type TraitMode = "spot" | "origin" | "concept" | "job" | "feature" | "pair";
const adaptations = new Map(ADAPTATIONS.map((item) => [item.id, item]));
const observations = new Map(OBSERVATIONS.map((item) => [item.id, item]));
const concepts = new Map(CONCEPTS.map((item) => [item.id, item]));

function adaptation(id: string) {
  const item = adaptations.get(id);
  if (!item) throw new Error(`Unknown adaptation: ${id}`);
  return item;
}

function choices(answer: string, distractors: readonly string[], rng: RNG, ctx: GenContext): string[] {
  return shuffle(rng, [answer, ...shuffle(rng, distractors).slice(0, ctx.easier ? 1 : 2)]);
}

/** Authored science facts, seeded matching; shared engine owns all grading. */
function traitQuestion(params: TraitsParams, rng: RNG, ctx: GenContext): Question {
  if (!params.items?.length) throw new Error("A traits chapter needs authored tasks");
  const token = pick(rng, params.items);
  const [mode, id, otherId] = token.split(":");
  const base = { id: `traits-${token}`, dedupeKey: `traits:${token}` };
  if (mode === "origin") {
    const item = observations.get(id);
    if (!item) throw new Error(`Unknown trait observation: ${id}`);
    const answer = item.example;
    const otherKinds = Object.keys(STR.traits.origins).filter((kind) => kind !== item.kind);
    const distractors = otherKinds.map((kind) => pick(rng, OBSERVATIONS.filter((other) => other.kind === kind)).example);
    const prompt = item.kind === "acquired" ? STR.traits.changePrompt(TRAIT_CHANGE_EVENTS[item.id]) : STR.traits.originPrompts[item.kind];
    return { ...base, prompt, answer,
      choices: choices(answer, distractors, rng, ctx), hint: item.hint, inputMode: "choices",
      payload: { workedExample: item.hint } };
  }
  if (mode === "concept") {
    const item = concepts.get(id);
    if (!item) throw new Error(`Unknown trait concept: ${id}`);
    return { ...base, prompt: item.prompt, answer: item.answer,
      choices: choices(item.answer, item.distractors, rng, ctx), hint: item.hint,
      inputMode: "choices", payload: { workedExample: item.explanation } };
  }
  const item = adaptation(id);
  const explanation = STR.traits.link(item.organism, item.trait, item.job);
  if (mode === "pair") {
    const other = adaptation(otherId);
    const ordered = [STR.traits.pairTrait(item.organism, item.trait), STR.traits.pairJob(item.job),
      STR.traits.pairTrait(other.organism, other.trait), STR.traits.pairJob(other.job)];
    return { ...base, prompt: STR.traits.pair(item.organism, other.organism),
      answer: ordered.join(" → "), choices: [], hint: ctx.easier ? explanation : STR.traits.pairHint,
      inputMode: "order", payload: { items: shuffle(rng, ordered), arrow: "→",
        traitOrganisms: [item.organism, other.organism],
        workedExample: `${explanation} ${STR.traits.link(other.organism, other.trait, other.job)}` } };
  }
  if (!["spot", "job", "feature"].includes(mode)) throw new Error(`Unknown trait task: ${token}`);
  const answer = mode === "job" ? item.job : item.trait;
  let prompt = STR.traits.spot(item.organism);
  let distractors: readonly string[] = item.distractorTraits;
  if (mode === "job") {
    prompt = STR.traits.job(item.organism, item.trait);
    distractors = item.distractorJobs;
  } else if (mode === "feature") {
    prompt = STR.traits.feature(item.organism, item.job);
    distractors = item.distractorTraits;
  }
  return { ...base, prompt, answer, choices: choices(answer, distractors, rng, ctx),
    hint: explanation, inputMode: "choices",
    payload: { workedExample: explanation, traitOrganisms: [item.organism] } };
}

export function generateTraits(params: TraitsParams, rng: RNG, ctx: GenContext): Question {
  const question = traitQuestion(params, rng, ctx);
  const cards = question.inputMode === "order" ? question.payload?.items as string[] : question.choices;
  return { ...question, payload: { ...question.payload,
    traitsCopyVersion: TRAITS_COPY_VERSION, speechText: [question.prompt, ...cards].join(". ") } };
}
