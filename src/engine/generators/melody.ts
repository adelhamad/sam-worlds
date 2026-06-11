// Melody Engine — NOT piano lessons. Real music skills: READING written notes
// on the staff, ear training, chords, transposition. Answers are played on a
// real-pitch keyboard.
import { pick, randInt, type RNG } from "../rng";
import { transpose, triad, WHITE_KEYS } from "../music/notes";
import type { GenContext, Question } from "./types";

export interface MelodyParams {
  /** Question types this stage draws from. */
  types: Array<"read" | "echo" | "chord" | "transpose">;
  /** Echo/transpose melody length. */
  length?: number;
}

let qid = 0;
const id = () => `me${++qid}`;

export function generateMelody(params: MelodyParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "read":
      return genReadNote(rng);
    case "chord":
      return genChord(rng);
    case "transpose":
      return genTranspose(params, rng, ctx);
    default:
      return genEcho(params, rng, ctx);
  }
}

/** Read a written note on the treble staff, then play it on the keyboard. */
function genReadNote(rng: RNG): Question {
  const note = pick(rng, WHITE_KEYS);
  const letter = note.replace(/[45]/, "");
  return {
    id: id(),
    prompt: "Read the note — then play it!",
    answer: note,
    choices: [],
    hint: `Lines (bottom→top) are E G B D F. This one is ${letter}.`,
    inputMode: "piano",
    dedupeKey: `read-${note}`,
    payload: { staff: note, expected: 1 },
  };
}

function walk(rng: RNG, length: number): string[] {
  let i = randInt(rng, 0, WHITE_KEYS.length - 1);
  const out = [WHITE_KEYS[i]];
  for (let k = 1; k < length; k++) {
    i = Math.min(WHITE_KEYS.length - 1, Math.max(0, i + randInt(rng, -2, 2)));
    out.push(WHITE_KEYS[i]);
  }
  return out;
}

function genEcho(params: MelodyParams, rng: RNG, ctx: GenContext): Question {
  const length = Math.max(2, (params.length ?? 3) - (ctx.easier ? 1 : 0));
  const notes = walk(rng, length);
  return {
    id: id(),
    prompt: `🎧 Listen, then play it back! (${length} notes)`,
    answer: notes.join(" "),
    choices: [],
    hint: `It starts on ${notes[0]}.`,
    inputMode: "piano",
    dedupeKey: `echo-${notes.join("")}`,
    payload: { play: notes, listenFirst: true },
  };
}

function genChord(rng: RNG): Question {
  const quality = pick(rng, ["major", "minor"] as const);
  const candidates = WHITE_KEYS.slice(0, 6)
    .map((r) => ({ r, t: triad(r, quality) }))
    .filter((x) => x.t);
  const { r, t } = pick(rng, candidates);
  return {
    id: id(),
    prompt: `Build ${r.replace("4", "")} ${quality} — tap its 3 notes`,
    answer: t!.join(" "),
    choices: [],
    hint: `Root, then ${quality === "major" ? "4" : "3"} steps up, then the 5th.`,
    inputMode: "piano",
    payload: { sorted: true, expected: 3 },
  };
}

function genTranspose(params: MelodyParams, rng: RNG, ctx: GenContext): Question {
  const length = ctx.easier ? 2 : Math.min(3, params.length ?? 3);
  // small motif starting on C4, shift up so everything stays on the keyboard
  const motifSteps = Array.from({ length: length - 1 }, () => randInt(rng, 1, 2));
  const shift = pick(rng, [2, 4, 7]);
  const start = "C4";
  const motif: string[] = [start];
  let cur = start;
  for (const st of motifSteps) {
    cur = transpose(cur, st)!;
    motif.push(cur);
  }
  const target = motif.map((n) => transpose(n, shift));
  if (target.some((n) => !n)) return genEcho(params, rng, ctx);
  const newRoot = target[0]!;
  return {
    id: id(),
    prompt: `🎧 Same tune, but start on ${newRoot} — play it!`,
    answer: target.join(" "),
    choices: [],
    hint: `Keep the same jumps, just higher.`,
    inputMode: "piano",
    payload: { play: motif, listenFirst: true },
  };
}
