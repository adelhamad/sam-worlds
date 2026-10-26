import { pick, shuffle, type RNG } from "../rng";
import { MAX_LAND_KM2, areaLabel, rankedCountry, sizeChoices } from "./countryStats";
import type { GenContext, Question } from "./types";
import type { GeographyParams } from "./geography";
import { STR } from "../../strings/en";

let qid = 0;
const FACTORS = [2, 3, 5, 10, 20];

export function generateAreaAtlas(params: GeographyParams, rng: RNG, _ctx: GenContext): Question {
  const parts = pick(rng, params.items).split(":");
  const mode = parts.pop();
  if (mode === "estimate") {
    const { country, stats } = rankedCountry(parts[0]);
    const answer = areaLabel(stats.landKm2);
    return {
      id: `area-estimate-${++qid}`,
      prompt: STR.geoStats.areaOf(country.name), answer,
      choices: shuffle(rng, sizeChoices(stats.landKm2, MAX_LAND_KM2, areaLabel)),
      hint: STR.geoStats.areaHint, inputMode: "choices",
      dedupeKey: `area-estimate:${country.code}`,
      payload: { mapCode: country.code, mapStyle: "outline",
        statNote: STR.geoStats.areaSource(stats.landYear), statChoices: true },
    };
  }
  const factor = Number(mode?.replace("ratio", ""));
  if (parts.length !== 2 || !FACTORS.includes(factor)) throw new Error(`Unknown area ratio: ${mode}`);
  const ranked = parts.map(rankedCountry).sort((a, b) => b.stats.landKm2 - a.stats.landKm2);
  const [large, small] = ranked;
  const answer = STR.geoStats.times(factor);
  const years = large.stats.landYear === small.stats.landYear ? large.stats.landYear : "2023–2024";
  const options = [factor, ...FACTORS.filter((item) => item !== factor).slice(0, 3)]
    .map(STR.geoStats.times);
  return {
    id: `area-ratio-${++qid}`,
    prompt: STR.geoStats.ratioOf(large.country.name, small.country.name), answer,
    choices: shuffle(rng, options),
    hint: STR.geoStats.ratioHint, inputMode: "choices",
    dedupeKey: `area-ratio:${parts.sort().join(":")}`,
    payload: { statPair: { codes: [large.country.code, small.country.code], metric: "area", showValues: true },
      statNote: STR.geoStats.areaSource(years), statChoices: true },
  };
}
