// World Tour player-facing strings. Rules: ≤ 8 simple words per line, warm
// tone, and the words "wrong" / "fail" never appear. Each section is owned by
// one part of the feature — add keys to your own section only.
import { persona } from "../persona.config";

const n = persona.name;
const guide = persona.guide;

export const TOUR = {
  title: "World Tour",
  guide,
  tagline: `Show ${guide} around planet Earth!`,

  /** Question prompts and hints written by the lesson planner (engine). */
  engine: {
    pickFlag: (country: string) => `Tap the flag of ${country}`,
    pickShape: "Which shape is this country?",
    pickFlagForShape: "Whose flag fits this shape?",
    pairsFlags: "Match the flags",
    pairsShapes: "Match the shapes",
    buildFromFlag: "Whose flag is this?",
    buildFromShape: "Which country is this?",
    mapName: (country: string) => `Tap ${country} on the map`,
    mapFlag: "Tap this flag's country",
    sort: "Sort the countries",
    paint: (country: string) => `Paint the flag of ${country}`,
    hintContinent: (country: string, continent: string) => `${country} is in ${continent}.`,
    hintHiddenContinent: (continent: string) => `This country is in ${continent}.`,
    hintPairs: "Start with the ones you know.",
    hintBuild: (letter: string, continent: string) => `It starts with ${letter}. It is in ${continent}.`,
    /** "Blue, white, then red." — colour names in band order. */
    hintPaint: (colors: string[]) => {
      const words = colors.map((color) => color.toLowerCase());
      const line = words.length > 1 ? `${words.slice(0, -1).join(", ")}, then ${words[words.length - 1]}.` : `${words[0]}.`;
      return line.charAt(0).toUpperCase() + line.slice(1);
    },
  },

  /** Exercise widgets + teach cards. */
  exercise: {
    sortHelp: "Tap a card, then its home",
    paintHelp: "Pick a paint, then tap the flag",
    copyIt: "Copy it",
    mapSpot: "A country on the map",
    paintBand: (n: number) => `Flag part ${n}`,
    paintPot: (color: string) => `${color} paint`,
    // teach cards (inside the "Almost — look at this." sheet)
    thisIs: (country: string) => `This is ${country}.`,
    thatWas: (country: string) => `That was ${country}.`,
    isIn: (continent: string) => `It is in ${continent}.`,
    goesWith: "goes with",
    spells: "It spells",
  },

  /** Lesson screen: feedback, combo, completion. */
  lesson: {
    check: "Check",
    continue: "Continue",
    gotIt: "Got it",
    almost: "Almost — look at this.",
    praise: ["Great!", "Yes!", "Nice one!", "You got it!", "Brilliant!"],
    proveAgain: "Yes! One more to be sure…",
    readAloud: "Read it to me",
    newStamp: "New stamp:",
    comboBanner: (count: number) => `${count} in a row!`,
    comboChip: (count: number) => `${count} in a row`,
    slowDown: `No rush, ${n}. ${guide} can wait!`,
    skip: (cost: number) => `Skip (${cost} ✨)`,
    lookFirst: "Look first…",
    // Quit sheet
    quit: "Take a break",
    quitTitle: "Take a break?",
    quitNote: "Your spot is saved.",
    keepGoing: "Keep going",
    leave: "Leave",
    // Meet intro
    meetTitle: "New friends today!",
    meetSub: "Tap a card to say hello.",
    meetAllSeen: `${guide} waved at them all!`,
    letsGo: "Let's go!",
    // Completion
    complete: "Lesson complete!",
    perfect: "Perfect!",
    statDust: "Star Dust",
    statFirstTry: "First try",
    statStars: "Stars",
    replayNote: "Replays give a little Star Dust.",
    newStamps: "New passport stamps!",
    stampProgress: "Passport stamps",
    stampGoal: (goal: number) => `${goal} first-try answers earn a stamp.`,
    dayChip: (day: number) => `Day ${day}`,
    dayNote: "on tour!",
    trophy: "New trophy!",
    surprise: "Surprise treasure!",
    chestTease: "A treasure chest is waiting on the path!",
    noQuestions: `${guide} is still packing this lesson.`,
    // Edge cases
    unknown: `${guide} can't find this lesson.`,
    backToPath: "Back to the path",
  },

  /** Path screen, passport, chests. */
  path: {
    back: "Base",
    start: "Start",
    title: `${guide}'s World Tour`,
    day: (days: number) => `Day ${days}`,
    passport: "Passport",
    unit: (index: number) => `Unit ${index}`,
    startTag: "START",
    openTag: "OPEN",
    // Lesson card
    lessonOf: (index: number, total: number) => `Lesson ${index} of ${total}`,
    reward: (dust: number) => `Up to +${dust} ✨`,
    replayHint: "Fresh questions every time!",
    playAgain: "Play again",
    continue: "Continue",
    more: "…",
    close: "Close",
    // Gentle nudges
    locked: "Finish the one before!",
    chestLocked: "Finish all 5 lessons first!",
    // Treasure chest
    chestTitle: "Treasure chest!",
    chestFound: (souvenir: string) => `You found the ${souvenir}!`,
    chestDone: "Yay!",
    souvenirOwned: (souvenir: string) => `Your ${souvenir}`,
    // End of the tour
    finished: `We saw the whole world, ${n}!`,
    finishedSub: "Play any lesson again!",
    // Passport
    passportTitle: `${n}'s Passport`,
    stamps: (count: number, total: number) => `${count} / ${total} stamps`,
    stampHow: (goal: number) => `${goal} first-try answers earn a stamp.`,
    souvenirs: "Souvenirs",
    stamped: (country: string) => `${country} — stamped!`,
    stampProgress: (country: string, count: number, goal: number) => `${country}: ${count} of ${goal}`,
    notMet: "Meet me on the tour!",
    souvenirHidden: "Open a chest to find me!",
  },

  /** Hub banner. */
  hub: {
    banner: `${guide}'s World Tour`,
    bannerSub: `${guide} needs a guide, ${persona.title} ${n}!`,
    go: "Let's go!",
    newTag: "NEW",
    lessons: (done: number, total: number) => `${done}/${total} lessons`,
    stamps: (count: number) => `${count} stamps`,
    day: (days: number) => `Day ${days}`,
  },

  /** Parent Section block (plain admin English). */
  parent: {
    heading: "🛸 World Tour (trial)",
    summary: (lessons: number, total: number, stamps: number, countries: number, chests: number, units: number, days: number) =>
      `Lessons ${lessons}/${total} · stamps ${stamps}/${countries} · chests opened ${chests}/${units} · tour days ${days}`,
  },
};
