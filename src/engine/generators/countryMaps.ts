import { shuffle, type RNG } from "../rng";
import { otherCountries, pickFact, type GeographyParams } from "./geography";
import type { GenContext, Question } from "./types";
import { STR } from "../../strings/en";

let qid = 0;

export function generateCountryMaps(params: GeographyParams, rng: RNG, ctx: GenContext): Question {
  const { country, mode } = pickFact(params, rng);
  const others = otherCountries(country, rng, ctx, params.items);
  const select = mode === "select";
  const answer = country.name;
  const choices = shuffle(rng, [answer, ...others.map((item) => item.name)]);
  const ratio = country.viewBox[2] / country.viewBox[3];
  let shape = "compact";
  if (ratio > 1.7) shape = "wide";
  else if (ratio < 0.7) shape = "tall";
  const prompts: Record<string, string> = {
    select: STR.geo.selectPrompt(country.name),
    locate: STR.geo.locatePrompt,
    outline: STR.geo.outlinePrompt,
  };
  return {
    id: `map-${++qid}`,
    prompt: prompts[mode],
    answer,
    choices,
    hint: mode === "locate" ? STR.geo.mapHint(country.continent) : STR.geo.shapeHint(shape),
    inputMode: "choices",
    dedupeKey: `countrymaps:${country.code}:${mode}`,
    payload: select ? { mapChoices: choices.map((name) =>
      [country, ...others].find((item) => item.name === name)?.code) }
      : { mapCode: country.code, mapStyle: mode === "locate" ? "world" : "outline" },
  };
}
