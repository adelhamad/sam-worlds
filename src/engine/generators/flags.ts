// World Flags — match flags to countries and back. True matching, so choice
// buttons are allowed (anti-guessing rule 2); a wrong tap regenerates (rule 1).
// High bands draw distractors from look-alike groups (Nordic crosses,
// tricolors) so it stays tricky.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

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

export interface FlagsParams {
  pools: Array<"iconic" | "wider" | "similar">;
  modes: Array<"toCountry" | "toFlag">;
}

let qid = 0;

export function generateFlags(params: FlagsParams, rng: RNG, ctx: GenContext): Question {
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
