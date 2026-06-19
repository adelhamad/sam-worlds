// Story Time — story words (character, setting, author…), putting events in
// order, and finding who/where in a tiny story.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [question, answer, wrongs] — story vocabulary
const TERMS: Array<[string, string, string[]]> = [
  ["The person or animal a story is about is the…", "character", ["setting", "author", "title"]],
  ["WHERE and WHEN a story happens is the…", "setting", ["character", "plot", "author"]],
  ["The person who writes a book is the…", "author", ["reader", "character", "artist"]],
  ["The person who draws the pictures is the…", "illustrator", ["author", "actor", "singer"]],
  ["The name at the top of a book is the…", "title", ["setting", "ending", "character"]],
  ["The three big parts of a story are…", "beginning, middle, and end", ["left, right, up", "red, blue, green", "one, two, ten"]],
  ["The exciting problem in a story is the…", "plot", ["title", "cover", "author"]],
  ["A made-up story with dragons and magic is…", "fiction", ["true facts", "a recipe", "a map"]],
  ["A book that teaches real, true facts is…", "non-fiction", ["a fairy tale", "a made-up story", "a comic"]],
];

// [story text, who is the character, where is the setting]
const STORIES: Array<[string, string, string]> = [
  ["Mia the cat sat under a big tree in the park.", "Mia the cat", "in the park"],
  ["Captain Sam sailed his boat across the deep blue sea.", "Captain Sam", "on the sea"],
  ["Little Bear found honey inside a tree in the forest.", "Little Bear", "in the forest"],
  ["Lucy the robot zoomed around the busy space station.", "Lucy the robot", "in space"],
  ["Tom the puppy dug a hole in the sandy beach.", "Tom the puppy", "at the beach"],
  ["Princess Ada read a book high up in her tall castle.", "Princess Ada", "in the castle"],
];

// [title, ordered events]
const ORDERS: Array<[string, string[]]> = [
  ["A day at school:", ["🌅 wake up", "🚌 ride the bus", "📚 learn in class"]],
  ["Baking a cake:", ["🥣 mix it", "🔥 bake it", "🎂 eat it"]],
  ["A story shape:", ["📖 beginning", "❓ middle", "🎉 end"]],
  ["Planting a flower:", ["🌱 plant a seed", "💧 water it", "🌸 it blooms"]],
];

export interface StoryParams {
  types: Array<"term" | "who" | "order">;
}

let qid = 0;
const id = () => `st${++qid}`;

export function generateStory(params: StoryParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "who") {
    const [text, who, where] = pick(rng, STORIES);
    const askChar = rng() < 0.5;
    if (askChar) {
      const wrong = shuffle(rng, STORIES.filter((s) => s[1] !== who).map((s) => s[1])).slice(0, 3);
      return { id: id(), prompt: `${text}  Who is the CHARACTER?`, answer: who, choices: shuffle(rng, [who, ...wrong]), hint: "The character is who the story is about.", inputMode: "choices", dedupeKey: `who-${who}` };
    }
    const wrong = shuffle(rng, STORIES.filter((s) => s[2] !== where).map((s) => s[2])).slice(0, 3);
    return { id: id(), prompt: `${text}  What is the SETTING?`, answer: where, choices: shuffle(rng, [where, ...wrong]), hint: "The setting is where it happens.", inputMode: "choices", dedupeKey: `where-${where}` };
  }
  if (type === "order") {
    const [title, seq] = pick(rng, ORDERS);
    return { id: id(), prompt: `${title} Put it in order!`, answer: seq.join(" → "), choices: [], hint: `It starts with ${seq[0]}.`, inputMode: "order", dedupeKey: `order-${title}`, payload: { items: shuffle(rng, seq), arrow: "→" } };
  }
  const [p, a, w] = pick(rng, TERMS);
  return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about the parts of a book.", inputMode: "choices", dedupeKey: `term-${p}` };
}
