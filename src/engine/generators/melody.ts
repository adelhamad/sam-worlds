// Melody Engine v2 — a music LABORATORY for a reader of both clefs (plan §6).
// Real theory, well past "name one note": interval ID, bass-clef reading, key
// signatures, chord quality by ear, scales, enharmonics, rhythm, and
// ear-training on familiar tunes. Answers are played on the keyboard or chosen.
import { pick, randInt, shuffle, type RNG } from "../rng";
import { KEYBOARD, transpose, WHITE_KEYS } from "../music/notes";
import {
  CHORD_QUALITIES, chordNotes, ENHARMONICS, INTERVAL_NAMES, MAJOR_KEYS,
  RHYTHM_FACTS, SIMPLE_INTERVALS, TUNES,
} from "../music/theory";
import type { GenContext, Question } from "./types";

export type MelodyType =
  | "read" | "readbass" | "echo" | "chord" | "chordId" | "interval"
  | "intervalEar" | "keysig" | "enharmonic" | "rhythm" | "transpose" | "wrongnote" | "scale";

export interface MelodyParams {
  types: MelodyType[];
  /** Echo / transpose phrase length. */
  length?: number;
}

let qid = 0;
const id = () => `me${++qid}`;

// Notes the one-octave keyboard can actually sound back.
const READ_NOTES = KEYBOARD; // C4..C5 incl. black keys
const BASS_NOTES = ["G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];
const CHORD_ROOTS = ["C4", "D4", "E4", "F4"]; // 5th stays on the keyboard

function noteLetter(note: string): string {
  return note.replace(/\d/g, "");
}

/** Read a written note on the treble staff (incl. sharps) → play it. */
function genRead(rng: RNG): Question {
  const note = pick(rng, READ_NOTES);
  return {
    id: id(),
    prompt: "Read the note, then play it!",
    answer: note,
    choices: [],
    hint: `Treble lines are E-G-B-D-F. This is ${noteLetter(note)}.`,
    inputMode: "piano",
    dedupeKey: `read-${note}`,
    payload: { staff: note, clef: "treble", expected: 1 },
  };
}

/** Read a note on the BASS staff → name it (out of keyboard range). */
function genReadBass(rng: RNG): Question {
  const note = pick(rng, BASS_NOTES);
  const letter = noteLetter(note);
  const wrong = shuffle(rng, ["A", "B", "C", "D", "E", "F", "G"].filter((l) => l !== letter)).slice(0, 3);
  return {
    id: id(),
    prompt: "Name this BASS-clef note.",
    answer: letter,
    choices: shuffle(rng, [letter, ...wrong]),
    hint: "Bass lines are G-B-D-F-A; spaces are A-C-E-G.",
    inputMode: "choices",
    dedupeKey: `readbass-${note}`,
    payload: { staff: note, clef: "bass" },
  };
}

function walk(rng: RNG, length: number, fromWhite: boolean): string[] {
  const pool = fromWhite ? WHITE_KEYS : READ_NOTES;
  let i = randInt(rng, 0, pool.length - 1);
  const out = [pool[i]];
  for (let k = 1; k < length; k++) {
    i = Math.min(pool.length - 1, Math.max(0, i + randInt(rng, -2, 2)));
    out.push(pool[i]);
  }
  return out;
}

function genEcho(params: MelodyParams, rng: RNG, ctx: GenContext): Question {
  const length = Math.max(3, (params.length ?? 4) - (ctx.easier ? 1 : 0));
  const notes = walk(rng, length, ctx.easier);
  return {
    id: id(),
    prompt: `🎧 Listen, then play it back (${length} notes).`,
    answer: notes.join(" "),
    choices: [],
    hint: `It starts on ${noteLetter(notes[0])}.`,
    inputMode: "piano",
    dedupeKey: `echo-${notes.join("")}`,
    payload: { play: notes, listenFirst: true },
  };
}

/** Build a triad (major/minor) from a root → play its 3 notes. */
function genChord(rng: RNG): Question {
  const root = pick(rng, CHORD_ROOTS);
  const quality = pick(rng, CHORD_QUALITIES.slice(0, 2)); // major / minor (playable)
  const notes = chordNotes(root, quality);
  return {
    id: id(),
    prompt: `Build ${noteLetter(root)} ${quality.name} — tap its 3 notes.`,
    answer: notes.join(" "),
    choices: [],
    hint: quality.name === "major" ? "Root, +4 semitones, +3 more." : "Root, +3 semitones, +4 more.",
    inputMode: "piano",
    dedupeKey: `chord-${root}-${quality.name}`,
    payload: { sorted: true, expected: 3 },
  };
}

/** Hear a triad → name its quality (major/minor/dim/aug). */
function genChordId(rng: RNG): Question {
  const root = pick(rng, CHORD_ROOTS);
  const quality = pick(rng, CHORD_QUALITIES);
  const notes = chordNotes(root, quality);
  return {
    id: id(),
    prompt: "Hear the chord — what quality is it?",
    answer: quality.name,
    choices: shuffle(rng, CHORD_QUALITIES.map((c) => c.name)),
    hint: "Major sounds bright, minor sad, diminished tense, augmented dreamy.",
    inputMode: "choices",
    dedupeKey: `chordId-${root}-${quality.name}`,
    payload: { play: notes, chord: true, listenFirst: true },
  };
}

/** Two notes on the staff → name the interval. */
function genInterval(rng: RNG): Question {
  const def = pick(rng, INTERVAL_NAMES);
  const lowIdx = randInt(rng, 0, READ_NOTES.length - 1 - def.semis);
  const low = READ_NOTES[lowIdx];
  const high = READ_NOTES[lowIdx + def.semis];
  const answer = SIMPLE_INTERVALS[def.semis] ?? def.name;
  const wrong = shuffle(rng, ["2nd", "3rd", "4th", "5th", "6th", "octave"].filter((n) => n !== answer)).slice(0, 3);
  return {
    id: id(),
    prompt: "Name the interval between the two notes.",
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint: "Count the letter names from the low note up to the high one.",
    inputMode: "choices",
    dedupeKey: `interval-${low}-${high}`,
    payload: { staff: [low, high], clef: "treble" },
  };
}

/** Hear two notes → name the full interval (with quality). */
function genIntervalEar(rng: RNG): Question {
  const def = pick(rng, INTERVAL_NAMES);
  const lowIdx = randInt(rng, 0, READ_NOTES.length - 1 - def.semis);
  const low = READ_NOTES[lowIdx];
  const high = READ_NOTES[lowIdx + def.semis];
  const wrong = shuffle(rng, INTERVAL_NAMES.filter((n) => n.name !== def.name)).slice(0, 3).map((n) => n.name);
  return {
    id: id(),
    prompt: "Hear the two notes — name the interval.",
    answer: def.name,
    choices: shuffle(rng, [def.name, ...wrong]),
    hint: "A 5th sounds open; a 3rd sounds sweet; an octave sounds the 'same'.",
    inputMode: "choices",
    dedupeKey: `intervalEar-${low}-${high}`,
    payload: { play: [low, high], listenFirst: true },
  };
}

/** Key-signature theory: count or name sharps/flats. */
function genKeysig(rng: RNG): Question {
  const key = pick(rng, MAJOR_KEYS);
  const askFlats = key.flats > 0 && rng() < 0.5;
  const count = askFlats ? key.flats : key.sharps;
  const word = askFlats ? "flats" : "sharps";
  const wrong = shuffle(rng, ["0", "1", "2", "3", "4"].filter((n) => n !== String(count))).slice(0, 3);
  return {
    id: id(),
    prompt: `How many ${word} are in ${key.name} major?`,
    answer: String(count),
    choices: shuffle(rng, [String(count), ...wrong]),
    hint: "Order of sharps: F C G D A. Order of flats: B E A D G.",
    inputMode: "choices",
    dedupeKey: `keysig-${key.name}-${word}`,
    payload: {},
  };
}

/** Enharmonic equivalents (two names for one key). */
function genEnharmonic(rng: RNG): Question {
  const [sharp, flat] = pick(rng, ENHARMONICS);
  const askSharp = rng() < 0.5;
  const given = askSharp ? sharp : flat;
  const answer = askSharp ? flat : sharp;
  const others = ENHARMONICS.flat().filter((n) => n !== given && n !== answer);
  const wrong = shuffle(rng, others).slice(0, 3);
  return {
    id: id(),
    prompt: `What is another name for ${given}?`,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint: `${sharp} and ${flat} are the same black key.`,
    inputMode: "choices",
    dedupeKey: `enh-${given}`,
    payload: {},
  };
}

/** Rhythm & note-value facts. */
function genRhythm(rng: RNG): Question {
  const fact = pick(rng, RHYTHM_FACTS);
  return {
    id: id(),
    prompt: fact.q,
    answer: fact.a,
    choices: shuffle(rng, fact.options),
    hint: "Whole=4, half=2, quarter=1, eighth=½ beats in 4/4.",
    inputMode: "choices",
    dedupeKey: `rhythm-${fact.q}`,
    payload: {},
  };
}

/** Scale-degree theory: which note is/ isn't in a major scale. */
function genScale(rng: RNG): Question {
  const key = pick(rng, MAJOR_KEYS);
  const askIn = rng() < 0.5;
  if (askIn) {
    const degree = randInt(rng, 2, 7); // 2nd..7th note
    const answer = key.notes[degree - 1];
    const wrong = shuffle(rng, key.notes.filter((n) => n !== answer)).slice(0, 3);
    return {
      id: id(),
      prompt: `What is note number ${degree} of the ${key.name} major scale?`,
      answer,
      choices: shuffle(rng, [answer, ...wrong]),
      hint: "Step up the scale: 1, 2, 3 … from the key note.",
      inputMode: "choices",
      dedupeKey: `scale-${key.name}-deg${degree}`,
      payload: {},
    };
  }
  const all = ["C", "D", "E", "F", "G", "A", "B", "F#", "Bb", "C#", "Eb", "G#"];
  const outsider = pick(rng, all.filter((n) => !key.notes.includes(n)));
  const insiders = shuffle(rng, key.notes).slice(0, 3);
  return {
    id: id(),
    prompt: `Which note is NOT in the ${key.name} major scale?`,
    answer: outsider,
    choices: shuffle(rng, [outsider, ...insiders]),
    hint: `${key.name} major uses: ${key.notes.join(" ")}.`,
    inputMode: "choices",
    dedupeKey: `scaleout-${key.name}-${outsider}`,
    payload: {},
  };
}

function genTranspose(params: MelodyParams, rng: RNG, ctx: GenContext): Question {
  const length = ctx.easier ? 3 : Math.min(4, params.length ?? 4);
  const start = pick(rng, WHITE_KEYS.slice(0, 3));
  const motif: string[] = [start];
  let cur = start;
  for (let k = 1; k < length; k++) {
    const next = transpose(cur, randInt(rng, 1, 2));
    if (!next) break;
    cur = next;
    motif.push(cur);
  }
  const shift = pick(rng, [2, 3, 4]);
  const target = motif.map((n) => transpose(n, shift));
  if (target.some((n) => !n)) return genEcho(params, rng, ctx);
  const out = target as string[];
  return {
    id: id(),
    prompt: `🎧 Same shape, ${shift} steps higher — play it starting on ${noteLetter(out[0])}.`,
    answer: out.join(" "),
    choices: [],
    hint: "Keep the SAME jumps, just higher.",
    inputMode: "piano",
    dedupeKey: `transpose-${motif.join("")}-${shift}`,
    payload: { play: motif, listenFirst: true },
  };
}

/** Ear-training: a known tune with ONE wrong note — find its position. */
function genWrongNote(rng: RNG): Question {
  const tune = pick(rng, TUNES);
  const pos = randInt(rng, 1, tune.notes.length - 1); // not the first
  const notes = [...tune.notes];
  const orig = notes[pos];
  const bumped = transpose(orig, pick(rng, [-2, -1, 1, 2])) ?? orig;
  notes[pos] = bumped;
  const human = pos + 1;
  const opts = new Set<number>([human]);
  while (opts.size < 4) opts.add(randInt(rng, 1, tune.notes.length));
  return {
    id: id(),
    prompt: `🎧 "${tune.name}" — one note is wrong. Which one (counting from 1)?`,
    answer: String(human),
    choices: shuffle(rng, [...opts].map(String)),
    hint: "Hum the real tune in your head and listen for the bump.",
    inputMode: "choices",
    dedupeKey: `wrong-${tune.name}-${pos}`,
    payload: { play: notes, listenFirst: true },
  };
}

const GENERATORS: Record<MelodyType, (p: MelodyParams, rng: RNG, ctx: GenContext) => Question> = {
  read: (_p, rng) => genRead(rng),
  readbass: (_p, rng) => genReadBass(rng),
  echo: genEcho,
  chord: (_p, rng) => genChord(rng),
  chordId: (_p, rng) => genChordId(rng),
  interval: (_p, rng) => genInterval(rng),
  intervalEar: (_p, rng) => genIntervalEar(rng),
  keysig: (_p, rng) => genKeysig(rng),
  enharmonic: (_p, rng) => genEnharmonic(rng),
  rhythm: (_p, rng) => genRhythm(rng),
  scale: (_p, rng) => genScale(rng),
  transpose: genTranspose,
  wrongnote: (_p, rng) => genWrongNote(rng),
};

export function generateMelody(params: MelodyParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  return (GENERATORS[type] ?? genRead)(params, rng, ctx);
}
