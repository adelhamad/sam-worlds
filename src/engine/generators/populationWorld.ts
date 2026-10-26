import { pick, shuffle, type RNG } from "../rng";
import { MAX_POPULATION, countryLabel, populationLabel, rankedCountry, sizeChoices } from "./countryStats";
import type { GenContext, Question } from "./types";
import type { GeographyParams } from "./geography";
import { STR } from "../../strings/en";

let qid = 0;

export function generatePopulationWorld(params: GeographyParams, rng: RNG, _ctx: GenContext): Question {
  const parts = pick(rng, params.items).split(":");
  const mode = parts.pop();
  if (mode === "estimate") {
    const { country, stats } = rankedCountry(parts[0]);
    const answer = populationLabel(stats.population);
    return {
      id: `pop-estimate-${++qid}`,
      prompt: STR.geoStats.peopleOf(country.name), answer,
      choices: shuffle(rng, sizeChoices(stats.population, MAX_POPULATION, populationLabel)),
      hint: STR.geoStats.peopleHint, inputMode: "choices",
      dedupeKey: `pop-estimate:${country.code}`,
      payload: { mapCode: country.code, mapStyle: "world", statNote: STR.geoStats.populationSource,
        statChoices: true },
    };
  }
  if (parts.length !== 2 || (mode !== "more" && mode !== "fewer")) {
    throw new Error(`Unknown population comparison: ${mode}`);
  }
  const [a, b] = parts.map(rankedCountry);
  const byPopulation = [a, b].sort((left, right) => right.stats.population - left.stats.population);
  const winner = mode === "more" ? byPopulation[0] : byPopulation[1];
  return {
    id: `pop-duel-${++qid}`,
    prompt: mode === "more" ? STR.geoStats.morePeople : STR.geoStats.fewerPeople,
    answer: countryLabel(winner.country),
    choices: shuffle(rng, [countryLabel(a.country), countryLabel(b.country)]),
    hint: STR.geoStats.bubbleHint, inputMode: "choices",
    dedupeKey: `pop-pair:${parts.sort().join(":")}`,
    payload: { statPair: { codes: [a.country.code, b.country.code], metric: "population", showValues: false },
      statNote: STR.geoStats.populationSource, statChoices: true },
  };
}
