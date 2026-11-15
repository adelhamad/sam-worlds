// Language courses — CONTRACT shared by the content (src/content/<language>/),
// the planner (./planner.ts), the widgets (src/modules/tour/lang/) and the
// lesson screen. A language course is DATA: phrases a child can really say,
// real-life scenes, letters to write. The planner turns a lesson's data into
// questions; every question is a normal engine `Question` with
// `inputMode: "tour"`, `repeatable: true` and a `lang-*` payload, judged by the
// store with plain `typed === question.answer` (serialisers: ./answers.ts).
// Authoring guide: docs/LANGUAGES.md.
import type { IconName } from "../../content/iconNames";
import type { Question } from "../generators/types";

/** "ar" = spoken Levantine Arabic, "fr" = French. */
export type LangCode = "ar" | "fr";

/** One word inside a phrase (a tile in "build the sentence"). */
export interface PhraseWord {
  /** In the language's own writing. */
  text: string;
  /** Arabic: how it sounds, in Latin letters. */
  roman?: string;
}

/** One thing the child learns to SAY: a word or a whole phrase. */
export interface Phrase {
  /** Unique in the course, permanent, kebab-case Latin: "kiifak", "biddi-mayy". */
  id: string;
  /** In the language's own writing, the way family would text it: "كيفك؟", "Ça va ?". */
  text: string;
  /** Arabic (required there): how it sounds, in Latin letters — docs/LANGUAGES.md has the scheme. */
  roman?: string;
  /** What the voice reads, when plain `text` would be read badly (Arabic: with harakat, spelled as it sounds). */
  say?: string;
  /** The meaning in simple English (≤ 6 words): "How are you?". */
  en: string;
  /** A drawn icon, for things you can see (water, bread, cat). Never an emoji. */
  art?: IconName;
  /** The words of `text` in speaking order (2–5), for sentence building. Omit for single words. */
  words?: PhraseWord[];
  /** One short tip (≤ 14 simple words) for when it is taught or missed: "To a girl, say kiifik." */
  tip?: string;
  /** Ids of phrases that mean (almost) the same, or would also be a fine answer wherever this
   * one is — they are never offered as the "other" options next to it. Keep it symmetric. */
  like?: string[];
  /** A loose topic ("food", "family", "greeting"): other options are drawn from the same topic first. */
  topic?: string;
}

/** A real-life moment: something happens or someone speaks — what do you say? */
export interface Scene {
  /** Unique in the course, kebab-case. */
  id: string;
  /** The moment, in simple English (≤ 14 words): "Teta gives you a cookie." */
  setup: string;
  /** Who is there, e.g. { name: "Teta", art: "…" }. */
  who?: { name: string; art?: IconName };
  /** What they say to you (a phrase id): it is shown and spoken. Omit for a moment without words. */
  line?: string;
  /** Right things to say back (phrase ids). The first is the model answer. */
  reply: string[];
  /** Phrases that would ALSO be fine here — never used as the "other" options. */
  alsoOk?: string[];
}

/** A letter of the alphabet as a card (Arabic). `id` matches content/arabic/letters.ts. */
export interface LetterCard {
  id: string;
  /** The letter itself (isolated form). */
  char: string;
  /** Its name in Latin letters: "baa". */
  name: string;
  /** How it sounds, one short hint: "b". */
  sound: string;
  /** What the voice reads for it. */
  say?: string;
}

/** What a lesson may ask. */
export type LangTask =
  | "hear" // hear a phrase → tap what it means
  | "say" // see the meaning → tap how you say it
  | "read" // read it in its own writing (no Latin help) → tap what it means
  | "pairs" // match phrases to meanings
  | "build" // put the words in order to say it
  | "scene" // a real-life moment → tap what you would say
  | "spell" // build a word from its letters
  | "trace" // write a letter with your finger
  | "sound" // see a letter → tap its sound
  | "find"; // hear a letter → tap the letter

/** How a lesson is weighted. */
export type LangLessonKind = "words" | "talk" | "letters" | "review";

/** Stage params of a language lesson (StageDef.params) — built by defineLangCourse. */
export interface LangParams {
  lang: LangCode;
  kind: LangLessonKind;
  /** The phrases this lesson teaches. */
  teach: Phrase[];
  /** Phrases of earlier lessons, mixed in to keep them alive. */
  review: Phrase[];
  /** Scenes practised here. */
  scenes: Scene[];
  /** Letters practised here. */
  letters: LetterCard[];
  /** Every letter met so far (the other options of letter questions, decoy tiles). */
  alphabet: LetterCard[];
  /** Single words to spell from letter tiles (phrases from `teach`/`review`). */
  spell: Phrase[];
  /** Reading without Latin help is allowed in this lesson (later units). */
  reads: boolean;
  /** A thing to do in real life after the lesson: "Say 'yislamo' to someone at home today." */
  mission?: string;
}

// ----------------------------------------------------------------- payloads

export type LangKind = "lang-choose" | "lang-pairs" | "lang-build" | "lang-trace";

/** One face in a question: a phrase or a letter, with as much as the widget may show. */
export interface LangCard {
  id: string;
  /** In the language's own writing ("" on a meaning-only card). */
  text: string;
  roman?: string;
  /** What the voice reads ("" = silent card). */
  say: string;
  /** The meaning (or a letter's sound). */
  en: string;
  art?: IconName;
  /** A single letter: draw it big. */
  letter?: boolean;
}

interface LangBase {
  tour: LangKind;
  lang: LangCode;
  /** The task this question came from (a replacement keeps the same task). */
  task: LangTask;
  /** The phrase / letter / scene being practised (the next replacement avoids it when it can). */
  target: string;
  /** The right answer as a card, for the "Almost — look at this." sheet. */
  model: LangCard;
  /** One warm line for that sheet: what it means. */
  explain: string;
  /** The phrase's own tip, shown under it. */
  tip?: string;
}

/** Tap the one right card. answer = the right option's id. */
export interface ChoosePayload extends LangBase {
  tour: "lang-choose";
  /** What sits above the options. */
  hero:
    | { kind: "hear"; card: LangCard } // a big speaker: the phrase is heard, not shown
    | { kind: "mean"; card: LangCard } // the meaning: English + picture
    | { kind: "read"; card: LangCard } // the phrase in its own writing
    | { kind: "scene"; setup: string; who?: { name: string; art?: IconName }; line?: LangCard };
  /** How the options are drawn: their meaning, or the phrase itself (tap to hear it). */
  show: "meaning" | "phrase";
  options: LangCard[];
  /** Hide the Latin spelling (reading practice). */
  noRoman: boolean;
}

/** Match each phrase to its meaning. Partners share an id. answer = pairsAnswer(ids of `left`). */
export interface PairsPayload extends LangBase {
  tour: "lang-pairs";
  /** Phrase side (shown in its own writing). */
  left: LangCard[];
  /** Meaning side, shuffled. */
  right: LangCard[];
  noRoman: boolean;
}

export interface LangTile {
  text: string;
  roman?: string;
  /** What the voice reads when the tile is tapped. */
  say: string;
}

/** Put tiles in order. answer = buildAnswer(texts in order, unit). */
export interface BuildPayload extends LangBase {
  tour: "lang-build";
  /** "word": tiles are words of a sentence. "letter": tiles are the letters of one word. */
  unit: "word" | "letter";
  /** What to build: its meaning (and picture); `say` lets the child hear the whole thing. */
  hero: LangCard;
  /** Shuffled, decoys included. */
  tiles: LangTile[];
  /** The line fills from the right (Arabic). */
  rtl: boolean;
}

/** Write a letter with a finger. answer = TRACED. */
export interface TracePayload extends LangBase {
  tour: "lang-trace";
  letter: LetterCard;
  /** "guided": the path, start dot and arrow show. "memory": only the faint letter. */
  guide: "guided" | "memory";
}

export type LangPayload = ChoosePayload | PairsPayload | BuildPayload | TracePayload;

/** `question.answer` of every finished trace. */
export const TRACED = "traced";

/** Narrow a generic question to its language payload (null for everything else). */
export function langPayload(q: Question | null | undefined): LangPayload | null {
  const p = q?.payload as { tour?: unknown } | undefined;
  return q?.inputMode === "tour" && typeof p?.tour === "string" && p.tour.startsWith("lang-")
    ? (q.payload as unknown as LangPayload)
    : null;
}
