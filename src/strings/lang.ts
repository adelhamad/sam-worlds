// Language-course player-facing strings (Arabic, French). Rules: ≤ 8 simple
// words per prompt, warm tone, no emoji, and the words "wrong" / "fail" never
// appear. Each section is owned by one part of the feature.
import type { LangCode } from "../engine/lang/types";

export const LANG = {
  /** How a language is named in prompts. */
  name: { ar: "Arabic", fr: "French" } satisfies Record<LangCode, string>,

  /** Prompts, hints and teach lines written by the lesson planner (engine). */
  engine: {
    hear: "Listen! What does it mean?",
    say: (language: string) => `How do you say it in ${language}?`,
    read: "Read it. What does it mean?",
    pairs: "Match each one to its meaning",
    build: (language: string) => `Say it in ${language}`,
    scene: "What do you say?",
    dictate: "Listen! Build what you hear",
    give: "Give Pogo what he asks for",
    spot: "Which word do you hear? Tap it",
    memory: "Find the pairs",
    spell: "Spell the word",
    trace: (name: string) => `Write the letter ${name}`,
    sound: "What sound does this letter make?",
    find: (name: string) => `Find the letter ${name}`,
    /** Teach lines for the "Almost — look at this." sheet. */
    means: (phrase: string, meaning: string) => `${phrase} means "${meaning}".`,
    sayIt: (meaning: string, phrase: string) => `"${meaning}" is ${phrase}.`,
    letterSound: (name: string, sound: string) => `${name} makes the sound ${sound}.`,
    traceTip: "Start at the dot. Follow the arrow.",
    hint: "Listen again, then choose.",
  },

  /** The lesson widgets (src/modules/tour/lang/). */
  ui: {
    listen: "Listen",
    listenAgain: "Listen again",
    slow: "Slowly",
    tapToHear: "Tap a card to hear it.",
    pickHelp: "Tap the right one.",
    pairsHelp: "Tap one on each side.",
    buildHelp: "Tap the words in order.",
    spellHelp: "Tap the letters in order.",
    undo: "Take the last one back",
    noVoice: "No voice on this device — read it out loud.",
    says: (name: string) => `${name} says:`,
    theySay: "You say:",
    means: "It means",
    watch: "Watch",
    yourTurn: "Your turn",
    /** Give it to Pogo (LangGive). */
    giveThis: (what: string) => `Pick up: ${what}`,
    /** Memory (LangMemory). */
    memCard: "A card. Tap to turn it over.",
    memFound: (found: number, all: number) => `${found} of ${all} pairs found`,
  },

  /** The teach-first slides and the real-life mission card. */
  meet: {
    newWords: "New words",
    newLetters: "New letters",
    sayIt: "Say it out loud!",
    next: "Next",
    start: "Let's go!",
    skip: "Skip",
    soundsLike: (sound: string) => `Sounds like ${sound}`,
    mission: "Real-life mission",
    missionNote: "Do it today, with someone at home.",
    /** "Your turn — say it!" (speaking practice, when the parent switched it on).
        Never judged: every line is glad he spoke. */
    speak: {
      mic: "Your turn",
      micLabel: "Your turn: tap and say it",
      stop: "Tap to stop",
      stopLabel: "Stop recording",
      starting: "Getting ready…",
      listening: "I'm listening…",
      model: "Listen…",
      you: "Now you!",
      again: "Again",
      both: "Hear both",
      earModel: "Listen",
      earYou: "You",
      cheers: ["You said it!", "I heard you!", "Great talking!", "That sounds like you!", "Lovely saying it!"],
      /** The speaking break inside a lesson. */
      breakTitle: "Say it to me!",
      breakHint: "Tap the mic and say it.",
      notNow: "Not now",
      next: "Continue",
    },
  },
};
