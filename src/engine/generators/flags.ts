// World Flags — match flags to countries and back. True matching, so choice
// buttons are allowed (anti-guessing rule 2); a wrong tap regenerates (rule 1).
// High bands draw distractors from look-alike groups (Nordic crosses,
// tricolors) so it stays tricky.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";
import { COUNTRIES, flagEmoji, otherCountries, pickFact, type GeographyParams } from "./geography";
import { STR } from "../../strings/en";

type Flag = [string, string]; // [emoji, country]

const ICONIC: Flag[] = [
  ["🇸🇦", "Saudi Arabia"], ["🇯🇵", "Japan"], ["🇨🇦", "Canada"], ["🇺🇸", "USA"],
  ["🇧🇷", "Brazil"], ["🇬🇧", "United Kingdom"], ["🇪🇬", "Egypt"], ["🇩🇪", "Germany"],
  ["🇨🇳", "China"], ["🇦🇺", "Australia"], ["🇨🇭", "Switzerland"], ["🇹🇷", "Türkiye"],
  ["🇮🇳", "India"], ["🇲🇽", "Mexico"], ["🇰🇷", "South Korea"], ["🇬🇷", "Greece"],
];

const WIDER: Flag[] = [
  ["🇫🇷", "France"], ["🇮🇹", "Italy"], ["🇪🇸", "Spain"], ["🇵🇹", "Portugal"],
  ["🇦🇷", "Argentina"], ["🇿🇦", "South Africa"], ["🇲🇦", "Morocco"], ["🇦🇪", "UAE"],
  ["🇶🇦", "Qatar"], ["🇯🇴", "Jordan"], ["🇰🇪", "Kenya"], ["🇳🇿", "New Zealand"],
  ["🇹🇭", "Thailand"], ["🇻🇳", "Vietnam"], ["🇺🇦", "Ukraine"], ["🇨🇴", "Colombia"],
];

/** Look-alike groups — distractors come from the same group. */
const SIMILAR: Flag[][] = [
  [["🇳🇱", "Netherlands"], ["🇱🇺", "Luxembourg"], ["🇫🇷", "France"], ["🇷🇺", "Russia"]],
  [["🇮🇩", "Indonesia"], ["🇲🇨", "Monaco"], ["🇵🇱", "Poland"], ["🇸🇬", "Singapore"]],
  [["🇮🇪", "Ireland"], ["🇮🇹", "Italy"], ["🇨🇮", "Ivory Coast"], ["🇲🇽", "Mexico"]],
  [["🇳🇴", "Norway"], ["🇮🇸", "Iceland"], ["🇩🇰", "Denmark"], ["🇸🇪", "Sweden"], ["🇫🇮", "Finland"]],
  [["🇦🇪", "UAE"], ["🇯🇴", "Jordan"], ["🇰🇼", "Kuwait"], ["🇸🇩", "Sudan"], ["🇵🇸", "Palestine"]],
  [["🇦🇺", "Australia"], ["🇳🇿", "New Zealand"], ["🇬🇧", "United Kingdom"], ["🇫🇯", "Fiji"]],
];

interface LegacyFlagsParams {
  pools: Array<"iconic" | "wider" | "similar">;
  modes: Array<"toCountry" | "toFlag">;
}
export type FlagsParams = LegacyFlagsParams | GeographyParams;

let qid = 0;

export function generateFlags(params: FlagsParams, rng: RNG, ctx: GenContext): Question {
  if ("items" in params) return generateCountryFlag(params, rng, ctx);
  const pool = ctx.easier ? "iconic" : pick(rng, params.pools);
  const mode = pick(rng, params.modes);

  let flag: Flag;
  let others: Flag[];
  if (pool === "similar") {
    const group = pick(rng, SIMILAR);
    flag = pick(rng, group);
    others = group.filter((f) => f[1] !== flag[1]);
  } else {
    const flags = pool === "wider" ? [...ICONIC, ...WIDER] : ICONIC;
    flag = pick(rng, flags);
    others = shuffle(rng, flags.filter((f) => f[1] !== flag[1]));
  }
  const distractors = others.slice(0, 3);
  const [emoji, country] = flag;

  if (mode === "toFlag") {
    return {
      id: `fl${++qid}`,
      prompt: `Which flag is ${country}?`,
      answer: emoji,
      choices: shuffle(rng, [emoji, ...distractors.map((f) => f[0])]),
      hint: `Picture ${country}'s colors…`,
      inputMode: "choices",
      dedupeKey: `toflag-${country}`,
      payload: { bigChoices: true },
    };
  }
  return {
    id: `fl${++qid}`,
    prompt: "Whose flag is this?",
    answer: country,
    choices: shuffle(rng, [country, ...distractors.map((f) => f[1])]),
    hint: `It starts with ${country[0]}…`,
    inputMode: "choices",
    dedupeKey: `tocountry-${country}`,
    payload: { bigSymbol: emoji },
  };
}

function generateCountryFlag(params: GeographyParams, rng: RNG, ctx: GenContext): Question {
  const { country, mode } = pickFact(params, rng);
  const flag = flagEmoji(country.iso2);
  if (mode === "toContinent") {
    const continents = [...new Set(COUNTRIES.map((item) => item.continent))];
    const others = shuffle(rng, continents.filter((item) => item !== country.continent)).slice(0, 3);
    return {
      id: `fl${++qid}`,
      prompt: STR.geo.flagContinentPrompt,
      answer: country.continent,
      choices: shuffle(rng, [country.continent, ...others]),
      hint: STR.geo.flagContinentHint(country.name),
      inputMode: "choices",
      dedupeKey: `flag-${country.code}-${mode}`,
      payload: { bigSymbol: flag },
    };
  }
  const others = otherCountries(country, rng, ctx, params.items);
  if (mode === "toFlag") {
    return {
      id: `fl${++qid}`,
      prompt: STR.geo.countryFlagPrompt(country.name),
      answer: flag,
      choices: shuffle(rng, [flag, ...others.map((item) => flagEmoji(item.iso2))]),
      hint: STR.geo.flagHint(country.name),
      inputMode: "choices",
      dedupeKey: `flag-${country.code}-${mode}`,
      payload: { bigChoices: true },
    };
  }
  return {
    id: `fl${++qid}`,
    prompt: STR.geo.flagCountryPrompt,
    answer: country.name,
    choices: shuffle(rng, [country.name, ...others.map((item) => item.name)]),
    hint: STR.geo.flagCountryHint(country.name[0]),
    inputMode: "choices",
    dedupeKey: `flag-${country.code}-${mode}`,
    payload: { bigSymbol: flag },
  };
}
