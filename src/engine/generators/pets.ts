// Pet Pals — common pets and how to care for them kindly and responsibly.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, pet, a care fact]
const PETS: Array<[string, string, string]> = [
  ["🐶", "dog", "needs a walk every day"],
  ["🐱", "cat", "needs a clean litter box"],
  ["🐠", "fish", "needs a clean tank of water"],
  ["🐹", "hamster", "loves to run on a little wheel"],
  ["🐰", "rabbit", "munches on hay and fresh veggies"],
  ["🦜", "budgie", "lives in a roomy cage with toys"],
  ["🐢", "tortoise", "basks under a warm lamp"],
];

// good pet vs wild animal — [good pet "emoji name", wild ones]
const GOODPET: Array<[string, string[]]> = [
  ["🐱 a cat", ["🦁 a lion", "🐊 a crocodile", "🐻 a bear"]],
  ["🐶 a dog", ["🐯 a tiger", "🐍 a python", "🦈 a shark"]],
  ["🐠 a goldfish", ["🐙 an octopus", "🐊 an alligator", "🦅 an eagle"]],
  ["🐹 a hamster", ["🦊 a fox", "🦡 a badger", "🐺 a wolf"]],
];

// [question, answer, wrongs] — caring for pets
const CARE: Array<[string, string, string[]]> = [
  ["What should every pet always have?", "fresh water and food", ["candy and soda", "nothing at all", "chocolate"]],
  ["If your pet seems sick, you should…", "take it to the vet", ["ignore it", "give it medicine for people", "hide it"]],
  ["A kind pet owner makes sure to…", "care for their pet every day", ["forget about them", "leave them alone for days", "only play when bored"]],
  ["You should NEVER feed a dog…", "chocolate", ["dog food", "clean water", "a dog treat"]],
  ["Before getting a pet, you must be ready to…", "look after it for its whole life", ["return it when bored", "keep it in a box", "never touch it"]],
  ["A good way to show a pet love is to…", "be gentle and play kindly", ["pull its tail", "shout at it", "scare it"]],
];

export interface PetsParams {
  types: Array<"care" | "goodpet" | "match">;
}

let qid = 0;
const id = () => `pe${++qid}`;

export function generatePets(params: PetsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "goodpet") {
    const [good, wild] = pick(rng, GOODPET);
    return { id: id(), prompt: "Which one makes a good house pet?", answer: good, choices: shuffle(rng, [good, ...wild]), hint: "Wild animals are not safe house pets.", inputMode: "choices", dedupeKey: `goodpet-${good}` };
  }
  if (type === "match") {
    const [emoji, pet, fact] = pick(rng, PETS);
    const wrong = shuffle(rng, PETS.filter((p) => p[2] !== fact)).slice(0, 3);
    return { id: id(), prompt: `How do you care for a ${pet}?`, answer: `It ${fact}.`, choices: shuffle(rng, [`It ${fact}.`, ...wrong.map(([, , f]) => `It ${f}.`)]), hint: "Match the pet to what it needs.", inputMode: "choices", dedupeKey: `match-${pet}`, payload: { bigSymbol: emoji } };
  }
  const [p, a, w] = pick(rng, CARE);
  return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "A good owner is kind and responsible.", inputMode: "choices", dedupeKey: `care-${p}` };
}
