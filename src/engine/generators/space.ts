// Space Voyage — the Solar System, Sun & Moon, day/night, and space objects.
// Matching + ordering + counting, with friendly emoji. Facts are kept simple
// and true for a 7-year-old.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, name, unique clue, rank from the Sun 1..8]
const PLANETS: Array<[string, string, string, number]> = [
  ["🌑", "Mercury", "is the closest planet to the Sun", 1],
  ["🟡", "Venus", "is the hottest planet of all", 2],
  ["🌍", "Earth", "is the planet we live on", 3],
  ["🔴", "Mars", "is the dusty Red Planet", 4],
  ["🟠", "Jupiter", "is the biggest planet of all", 5],
  ["🪐", "Saturn", "has beautiful icy rings", 6],
  ["🔵", "Uranus", "spins on its side like a ball", 7],
  ["🔷", "Neptune", "is the farthest, windiest planet", 8],
];

// [emoji, name, what it is]
const SPACE_THINGS: Array<[string, string, string]> = [
  ["🚀", "a rocket", "blasts off to carry people to space"],
  ["👨‍🚀", "an astronaut", "is a person who travels in space"],
  ["🔭", "a telescope", "helps us see faraway stars and planets"],
  ["☄️", "a comet", "is an icy ball with a long glowing tail"],
  ["🌌", "a galaxy", "is a huge family of billions of stars"],
  ["🛰️", "a satellite", "circles the Earth and sends signals"],
  ["🌠", "a shooting star", "is a streak of light zooming across the sky"],
  ["🌕", "the Moon", "circles the Earth and glows at night"],
  ["⭐", "a star", "is a giant ball of hot glowing gas"],
  ["🛸", "a space station", "is a home in space where astronauts live"],
];

// [question, correct, wrongs] — sky & space facts
const SKY: Array<[string, string, string[]]> = [
  ["What gives us light in the daytime?", "☀️ the Sun", ["🌙 the Moon", "⭐ a star far away", "💡 a lamp"]],
  ["What is the Sun?", "a star", ["a planet", "a moon", "a big cloud"]],
  ["What makes day turn into night?", "the Earth spinning around", ["the Sun moving away", "clouds covering us", "the Moon hiding"]],
  ["The Moon travels around the…", "Earth", ["Sun", "Mars", "stars"]],
  ["The Earth travels around the…", "Sun", ["Moon", "Jupiter", "stars"]],
  ["Why is it dark at night?", "our side of Earth faces away from the Sun", ["the Sun turns off", "the Moon eats the Sun", "clouds block it"]],
  ["What are stars made of?", "hot glowing gas", ["ice and snow", "rock and sand", "water"]],
  ["Which is much bigger?", "☀️ the Sun", ["🌍 the Earth", "🌙 the Moon", "🔴 Mars"]],
  ["What do astronauts wear in space?", "a space suit", ["a swimsuit", "a raincoat", "pajamas"]],
  ["What is at the center of our Solar System?", "the Sun", ["the Earth", "the Moon", "a black hole"]],
  ["Where is there no air to breathe?", "in outer space", ["at the beach", "on a mountain", "in a forest"]],
  ["What shape is a planet?", "round like a ball", ["flat like a plate", "square like a box", "pointy like a star"]],
];

// [question, number] — counting facts
const COUNT: Array<[string, number]> = [
  ["How many planets orbit our Sun?", 8],
  ["How many moons does the Earth have?", 1],
  ["Earth is which planet counting from the Sun?", 3],
  ["How many planets are closer to the Sun than Earth?", 2],
  ["How many stars are at the center of our Solar System?", 1],
  ["Mars is which planet counting from the Sun?", 4],
];

export interface SpaceParams {
  types: Array<"planet" | "thing" | "sky" | "count" | "order">;
}

let qid = 0;
const id = () => `sp${++qid}`;

export function generateSpace(params: SpaceParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "thing":
      return genThing(rng);
    case "sky":
      return genSky(rng);
    case "count":
      return genCount(rng);
    case "order":
      return genOrder(rng);
    default:
      return genPlanet(rng);
  }
}

function genPlanet(rng: RNG): Question {
  const [emoji, name, clue] = pick(rng, PLANETS);
  const wrong = shuffle(rng, PLANETS.filter((p) => p[1] !== name)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which planet ${clue}?`,
    answer: `${emoji} ${name}`,
    choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]),
    hint: "Picture the planets lined up from the Sun.",
    inputMode: "choices",
    dedupeKey: `planet-${name}`,
  };
}

function genThing(rng: RNG): Question {
  const [emoji, name, what] = pick(rng, SPACE_THINGS);
  const askByWhat = rng() < 0.5;
  if (askByWhat) {
    const wrong = shuffle(rng, SPACE_THINGS.filter((t) => t[1] !== name)).slice(0, 3);
    return {
      id: id(),
      prompt: `Which one ${what}?`,
      answer: `${emoji} ${name}`,
      choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]),
      hint: "Think about what each space thing does.",
      inputMode: "choices",
      dedupeKey: `thing-what-${name}`,
    };
  }
  const wrong = shuffle(rng, SPACE_THINGS.filter((t) => t[2] !== what)).slice(0, 3);
  return {
    id: id(),
    prompt: `What does ${name} do?`,
    answer: what,
    choices: shuffle(rng, [what, ...wrong.map(([, , w]) => w)]),
    hint: "Picture it up in space.",
    inputMode: "choices",
    dedupeKey: `thing-do-${name}`,
    payload: { bigSymbol: emoji },
  };
}

function genSky(rng: RNG): Question {
  const [q, correct, wrong] = pick(rng, SKY);
  return {
    id: id(),
    prompt: q,
    answer: correct,
    choices: shuffle(rng, [correct, ...wrong]),
    hint: "Think about the Sun, Moon, and Earth.",
    inputMode: "choices",
    dedupeKey: `sky-${q}`,
  };
}

function genCount(rng: RNG): Question {
  const [q, n] = pick(rng, COUNT);
  return {
    id: id(),
    prompt: q,
    answer: String(n),
    choices: [],
    hint: "Count carefully — our Solar System has 8 planets.",
    dedupeKey: `count-${q}`,
  };
}

// Fixed ordering puzzles + sliding triples of planets by distance from the Sun.
const ORDER_FIXED: Array<[string, string[]]> = [
  ["A rocket launch:", ["🔢 countdown", "🚀 blast off", "🌌 reach space"]],
  ["Smallest to biggest:", ["🌙 Moon", "🌍 Earth", "☀️ Sun"]],
];

function genOrder(rng: RNG): Question {
  // Half the time, order 3 neighboring planets by distance from the Sun.
  if (rng() < 0.6) {
    const start = 1 + Math.floor(rng() * (PLANETS.length - 2)); // ranks start..start+2
    const trio = PLANETS.filter((p) => p[3] >= start && p[3] <= start + 2);
    const ordered = trio.map(([e, n]) => `${e} ${n}`);
    return {
      id: id(),
      prompt: "Order these planets from the Sun outward!",
      answer: ordered.join(" → "),
      choices: [],
      hint: `Closest to the Sun comes first: ${trio[0][1]}.`,
      inputMode: "order",
      dedupeKey: `order-dist-${start}`,
      payload: { items: shuffle(rng, ordered), arrow: "→" },
    };
  }
  const [title, seq] = pick(rng, ORDER_FIXED);
  return {
    id: id(),
    prompt: `${title} Put it in order!`,
    answer: seq.join(" → "),
    choices: [],
    hint: `It starts with ${seq[0]}.`,
    inputMode: "order",
    dedupeKey: `order-${title}`,
    payload: { items: shuffle(rng, seq), arrow: "→" },
  };
}
