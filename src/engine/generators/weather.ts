// Weather Watch — kinds of weather, the seasons, and the water cycle. Matching
// + ordering, simple true facts for a 7-year-old.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, name, unique clue]
const WEATHER: Array<[string, string, string]> = [
  ["🌧️", "rain", "is water drops falling from the clouds"],
  ["❄️", "snow", "is soft white flakes of frozen water"],
  ["☀️", "sunshine", "is bright warm light from the Sun"],
  ["⛈️", "a thunderstorm", "has flashes of lightning and loud thunder"],
  ["🌫️", "fog", "is a cloud near the ground that's hard to see through"],
  ["🌪️", "a tornado", "is a spinning funnel of very strong wind"],
  ["🌈", "a rainbow", "appears when the Sun shines through the rain"],
  ["💨", "wind", "is moving air you can feel but cannot see"],
  ["☁️", "cloudy weather", "is when grey clouds cover the sky"],
  ["🧊", "hail", "is little balls of ice that fall from the sky"],
];

// [emoji, season, clue]
const SEASONS: Array<[string, string, string]> = [
  ["🌸", "spring", "flowers bloom and baby animals are born"],
  ["☀️", "summer", "it is hot and sunny and we go to the beach"],
  ["🍂", "autumn", "leaves turn orange and fall from the trees"],
  ["❄️", "winter", "it is the coldest time and snow can fall"],
];

// [situation emoji+text, best item, wrongs]
const WEAR: Array<[string, string, string[]]> = [
  ["🌧️ It's raining outside.", "☂️ an umbrella", ["🕶️ sunglasses", "🩴 flip-flops", "🧺 a picnic"]],
  ["❄️ It's snowy and freezing.", "🧥 a warm coat", ["🩳 shorts", "👙 a swimsuit", "🕶️ sunglasses"]],
  ["☀️ It's hot and sunny.", "🧴 sunscreen and a hat", ["🧥 a heavy coat", "🧤 mittens", "🧣 a scarf"]],
  ["💨 It's very windy.", "🧢 hold onto your hat", ["☂️ open a big umbrella", "🪁 nothing at all", "🍦 an ice cream"]],
  ["🥶 It's a cold winter day.", "🧣 a scarf and gloves", ["🩴 sandals", "🩳 shorts", "🕶️ sunglasses"]],
  ["🏖️ It's a warm beach day.", "🩳 swim shorts", ["🧥 a winter coat", "🧤 thick gloves", "🥾 snow boots"]],
];

// [question, correct, wrongs] — sky & tools facts
const SKY: Array<[string, string, string[]]> = [
  ["What are clouds made of?", "tiny drops of water", ["cotton wool", "smoke", "white sand"]],
  ["What makes a rainbow appear?", "sunshine and rain together", ["only the Moon", "snow and wind", "a big fan"]],
  ["What is the bright flash in a storm?", "lightning", ["a rainbow", "a shooting star", "a streetlight"]],
  ["What is the loud rumble in a storm?", "thunder", ["a drum", "an airplane", "a lion"]],
  ["What do we call how hot or cold it is?", "the temperature", ["the weight", "the time", "the speed"]],
  ["Which tool measures temperature?", "a thermometer", ["a ruler", "a clock", "a scale"]],
  ["Where does rain fall from?", "the clouds", ["the ground", "the trees", "the ocean floor"]],
  ["What should you do in a thunderstorm?", "go inside where it's safe", ["fly a kite", "stand under a tall tree", "go swimming"]],
  ["Snow falls when it is very…", "cold", ["hot", "sunny", "dry"]],
  ["A weather forecast tells us…", "what the weather will be like", ["what time school ends", "what's for dinner", "how old you are"]],
];

export interface WeatherParams {
  types: Array<"identify" | "season" | "wear" | "sky" | "cycle">;
}

let qid = 0;
const id = () => `wx${++qid}`;

export function generateWeather(params: WeatherParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "season":
      return genSeason(rng);
    case "wear":
      return genWear(rng);
    case "sky":
      return genSky(rng);
    case "cycle":
      return genCycle(rng);
    default:
      return genIdentify(rng);
  }
}

function genIdentify(rng: RNG): Question {
  const [emoji, name, clue] = pick(rng, WEATHER);
  const wrong = shuffle(rng, WEATHER.filter((w) => w[1] !== name)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which weather ${clue}?`,
    answer: `${emoji} ${name}`,
    choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]),
    hint: "Picture looking out the window.",
    inputMode: "choices",
    dedupeKey: `id-${name}`,
  };
}

function genSeason(rng: RNG): Question {
  const [emoji, name, clue] = pick(rng, SEASONS);
  const wrong = shuffle(rng, SEASONS.filter((s) => s[1] !== name)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which season is it when ${clue}?`,
    answer: `${emoji} ${name}`,
    choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]),
    hint: "There are four seasons in a year.",
    inputMode: "choices",
    dedupeKey: `season-${name}`,
  };
}

function genWear(rng: RNG): Question {
  const [situation, best, wrong] = pick(rng, WEAR);
  return {
    id: id(),
    prompt: `${situation} What is best?`,
    answer: best,
    choices: shuffle(rng, [best, ...wrong]),
    hint: "Match what you wear to the weather.",
    inputMode: "choices",
    dedupeKey: `wear-${situation}`,
  };
}

function genSky(rng: RNG): Question {
  const [q, correct, wrong] = pick(rng, SKY);
  return {
    id: id(),
    prompt: q,
    answer: correct,
    choices: shuffle(rng, [correct, ...wrong]),
    hint: "Think about what happens up in the sky.",
    inputMode: "choices",
    dedupeKey: `sky-${q}`,
  };
}

// water cycle + season order
const CYCLES: Array<[string, string[]]> = [
  ["The water cycle:", ["☀️ Sun warms the water", "💨 it rises as vapor", "☁️ a cloud forms", "🌧️ rain falls"]],
  ["From puddle to rain:", ["💧 a puddle", "☁️ a cloud", "🌧️ rain"]],
  ["The seasons in a year:", ["🌸 spring", "☀️ summer", "🍂 autumn", "❄️ winter"]],
];

function genCycle(rng: RNG): Question {
  const [title, seq] = pick(rng, CYCLES);
  return {
    id: id(),
    prompt: `${title} Put it in order!`,
    answer: seq.join(" → "),
    choices: [],
    hint: `It starts with ${seq[0]}.`,
    inputMode: "order",
    dedupeKey: `cycle-${title}`,
    payload: { items: shuffle(rng, seq), arrow: "→" },
  };
}
