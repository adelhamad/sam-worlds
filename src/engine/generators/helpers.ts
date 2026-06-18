// Helpers Town — community helpers and the jobs they do. Match the helper to
// the job, the tool they use, and where they work.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, helper, what they do, a tool they use, where they work]
const HELPERS: Array<[string, string, string, string, string]> = [
  ["🚒", "firefighter", "puts out fires and rescues people", "a hose", "a fire station"],
  ["🩺", "doctor", "helps sick people get better", "a stethoscope", "a hospital"],
  ["👩‍🏫", "teacher", "helps children learn", "a whiteboard", "a school"],
  ["🧑‍🌾", "farmer", "grows food and raises animals", "a tractor", "a farm"],
  ["🦷", "dentist", "takes care of your teeth", "a little mirror", "a dentist's office"],
  ["🐾", "vet", "helps sick animals", "a thermometer", "an animal clinic"],
  ["👮", "police officer", "keeps people safe and helps in trouble", "a whistle", "a police station"],
  ["📬", "mail carrier", "delivers letters and parcels", "a mail bag", "a post office"],
  ["👨‍🍳", "chef", "cooks delicious food", "a frying pan", "a kitchen"],
  ["✈️", "pilot", "flies the airplane", "a cockpit", "an airport"],
  ["💈", "barber", "cuts and styles hair", "scissors", "a barber shop"],
  ["📚", "librarian", "helps you find books", "a stamp", "a library"],
  ["🚌", "bus driver", "drives people around town", "a big steering wheel", "a bus"],
  ["🔧", "plumber", "fixes pipes and taps", "a wrench", "your home"],
  ["🚑", "paramedic", "rushes to help hurt people", "an ambulance", "an ambulance"],
  ["🎨", "artist", "makes paintings and art", "a paintbrush", "a studio"],
  ["🔬", "scientist", "does experiments to learn new things", "a microscope", "a lab"],
  ["🚀", "astronaut", "travels into space", "a space suit", "a rocket"],
];

export interface HelpersParams {
  types: Array<"who" | "tool" | "place">;
}

let qid = 0;
const id = () => `hl${++qid}`;
const article = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");

function fourChoices(rng: RNG, answer: string, pool: string[]): string[] {
  const wrong = shuffle(rng, [...new Set(pool)].filter((x) => x !== answer)).slice(0, 3);
  return shuffle(rng, [answer, ...wrong]);
}

export function generateHelpers(params: HelpersParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const [emoji, who, does, tool, place] = pick(rng, HELPERS);
  if (type === "tool") {
    return {
      id: id(),
      prompt: `What does ${article(who)} ${who} use?`,
      answer: tool,
      choices: fourChoices(rng, tool, HELPERS.map((h) => h[3])),
      hint: `Think about ${article(who)} ${who}'s job: they ${does}.`,
      inputMode: "choices",
      dedupeKey: `tool-${who}`,
      payload: { bigSymbol: emoji },
    };
  }
  if (type === "place") {
    return {
      id: id(),
      prompt: `Where does ${article(who)} ${who} work?`,
      answer: place,
      choices: fourChoices(rng, place, HELPERS.map((h) => h[4])),
      hint: `Remember: ${article(who)} ${who} ${does}.`,
      inputMode: "choices",
      dedupeKey: `place-${who}`,
      payload: { bigSymbol: emoji },
    };
  }
  return {
    id: id(),
    prompt: `Who ${does}?`,
    answer: `${emoji} ${who}`,
    choices: fourChoices(rng, `${emoji} ${who}`, HELPERS.map((h) => `${h[0]} ${h[1]}`)),
    hint: "Match the job to the helper.",
    inputMode: "choices",
    dedupeKey: `who-${who}`,
  };
}
