import { shuffle, type RNG } from "../rng";
import { otherCountries, pickFact, type GeographyParams } from "./geography";
import type { GenContext, Question } from "./types";
import { STR } from "../../strings/en";

let qid = 0;

export function generateCapitals(params: GeographyParams, rng: RNG, ctx: GenContext): Question {
  const { country, mode } = pickFact(params, rng);
  const others = otherCountries(country, rng, ctx, params.items);
  const reverse = mode === "reverse";
  const pin = mode === "pin";
  const answer = reverse ? country.name : country.capital;
  const prompts: Record<string, string> = {
    reverse: STR.geo.countryOfCapital(country.capital),
    pin: STR.geo.capitalPin(country.name),
    capital: STR.geo.capitalOf(country.name),
  };
  return {
    id: `cap-${++qid}`,
    prompt: prompts[mode],
    answer,
    choices: shuffle(rng, [answer, ...others.map((item) => reverse ? item.name : item.capital)]),
    hint: reverse ? STR.geo.countryHint(country.name[0]) : STR.geo.capitalHint(country.capital[0]),
    inputMode: "choices",
    dedupeKey: `capitals:${country.code}:${mode}`,
    payload: pin ? { mapCode: country.code, mapStyle: "pin" } : undefined,
  };
}
