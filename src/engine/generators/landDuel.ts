import { pick, shuffle, type RNG } from "../rng";
import { countryLabel, rankedCountry } from "./countryStats";
import type { GenContext, Question } from "./types";
import type { GeographyParams } from "./geography";
import { STR } from "../../strings/en";

let qid = 0;

export function generateLandDuel(params: GeographyParams, rng: RNG, _ctx: GenContext): Question {
  const parts = pick(rng, params.items).split(":");
  const mode = parts.pop();
  const ranked = parts.map(rankedCountry);
  if (mode === "order") {
    const ordered = [...ranked].sort((a, b) => b.stats.landKm2 - a.stats.landKm2);
    const labels = ranked.map((item) => countryLabel(item.country));
    return {
      id: `land-order-${++qid}`,
      prompt: STR.geoStats.orderLand,
      answer: ordered.map((item) => countryLabel(item.country)).join(" → "),
      choices: [], hint: STR.geoStats.orderHint,
      inputMode: "order",
      dedupeKey: `land-order:${parts.sort().join(":")}`,
      payload: { items: shuffle(rng, labels), arrow: "→" },
    };
  }
  if (ranked.length !== 2 || (mode !== "larger" && mode !== "smaller")) {
    throw new Error(`Unknown land duel: ${parts.join(":")}:${mode}`);
  }
  const [a, b] = ranked;
  const byArea = [...ranked].sort((left, right) => right.stats.landKm2 - left.stats.landKm2);
  const winner = mode === "larger" ? byArea[0] : byArea[1];
  const answer = countryLabel(winner.country);
  const years = a.stats.landYear === b.stats.landYear ? a.stats.landYear : "2023–2024";
  return {
    id: `land-duel-${++qid}`,
    prompt: mode === "larger" ? STR.geoStats.moreLand : STR.geoStats.lessLand,
    answer,
    choices: shuffle(rng, [countryLabel(a.country), countryLabel(b.country)]),
    hint: STR.geoStats.bubbleHint,
    inputMode: "choices",
    dedupeKey: `land-pair:${parts.sort().join(":")}`,
    payload: { statPair: { codes: [a.country.code, b.country.code], metric: "area", showValues: false },
      statChoices: true, statNote: STR.geoStats.areaSource(years) },
  };
}
