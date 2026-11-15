// Home screen, daily quests, motivators and reminders — player-facing strings.
// Rules: ≤ 9 simple words per line, warm tone, never guilt or countdowns, and
// the words "wrong" / "fail" never appear. Each section is owned by one part
// of the feature — add keys to your own section only.
import type { IconName } from "../content/iconNames";
import { persona } from "../persona.config";

const n = persona.name;
const guide = persona.guide;

export const HOME = {
  /** Home layout: top bar, continue card, course shelf, shortcuts. */
  home: {
    courses: `Learn with ${guide}`,
    wordmark: `${n}'s Worlds`,
    wordmarkTop: `${n}'s`,
    wordmarkBottom: "Worlds",
    dust: (dust: number) => `${dust} Star Dust`,
    day: (days: number) => `Day ${days}`,
    dayLabel: (days: number) => `You played on ${days} days`,
    sound: "Sound",
    music: "Music",
    parent: "Grown-ups",
    more: "More buttons",
    close: "Close",
    // Pogo's card — the one big button
    continueLesson: (lesson: string) => `Continue · ${lesson}`,
    startCourse: (title: string) => `Start: ${title}`,
    openChest: "Open your chest!",
    chestIn: (title: string) => `A treasure chest waits in ${title}`,
    exploreUniverse: "Explore the Universe",
    // Course shelf
    shelfSub: "Pick a course. Every lesson counts!",
    subjects: {
      explore: "Explore the world",
      think: "Think it through",
      create: "Make things",
      languages: "Languages",
    },
    newTag: "NEW",
    chestReady: "Chest ready!",
    nextUnit: (unit: string) => `Next: ${unit}`,
    allDone: "All done!",
    lessons: (done: number, total: number) => `${done}/${total}`,
    lessonsLabel: (done: number, total: number) => `${done} of ${total} lessons done`,
    // Sam's things
    things: `${n}'s things`,
    vault: "Treasure Vault",
    vaultSub: (owned: number, total: number) => `${owned}/${total} found`,
    workshop: "Workshop",
    workshopSub: "Daddy Rewards",
    // Universe door + screen
    universeTitle: "The Universe",
    universeDoor: "Explore the Universe",
    universeCount: (count: number) => `${count} more worlds to visit`,
    universeBack: "Home",
    universeContinue: (stage: string) => `Continue · ${stage}`,
  },

  /** Daily quests card. */
  quests: {
    title: "Today's quests",
    quest: (kind: "lessons" | "firstTry" | "combo" | "dust" | "perfect", target: number) => {
      if (kind === "lessons") return target === 1 ? "Finish 1 lesson" : `Finish ${target} lessons`;
      if (kind === "firstTry") return `Get ${target} answers first try`;
      if (kind === "combo") return `Get ${target} in a row`;
      if (kind === "dust") return `Earn ${target} Star Dust`;
      return target === 1 ? "Finish a perfect lesson" : `Finish ${target} perfect lessons`;
    },
    /** One drawn icon per quest kind (home rows + the lesson-complete row). */
    icon: { lessons: "book", firstTry: "target", combo: "bolt", dust: "dust", perfect: "star" } satisfies Record<string, IconName>,
    /** Short labels for tight rows. */
    short: { lessons: "Lessons", firstTry: "First try", combo: "In a row", dust: "Star Dust", perfect: "Perfect" },
    reward: (dust: number) => `+${dust}`,
    collect: "Collect!",
    collected: "Collected",
    chestHint: "Collect all three to open it",
    chestReady: "Open the quest chest!",
    chestOpened: "Chest opened. See you tomorrow!",
    daysDone: (days: number) => `Quest days: ${days}`,
  },

  /** What Pogo says at home (engine/quests/motivator.ts). */
  pogo: {
    hello: `Hi, ${n}! Ready to play?`,
    chestReady: [
      "Quest chest time! Let's open it!",
      "All three quests done! Open your chest!",
      `Wow, ${n}! Your quest chest is ready!`,
      "The quest chest is full. Tap to open!",
    ],
    collect: [
      (count: number) => (count === 1 ? "A quest is done! Collect your prize!" : `${count} quests done! Collect your prizes!`),
      (count: number) => (count === 1 ? "You finished a quest! Grab your Star Dust!" : `You finished ${count} quests! Grab your Star Dust!`),
      () => "Your quest prize is ready to collect!",
    ],
    chestWaiting: [
      (course: string) => `A treasure chest is waiting in ${course}!`,
      (course: string) => `Ooh! Your ${course} chest is ready to open!`,
      (course: string) => `Psst… your ${course} treasure chest is ready!`,
    ],
    welcome: [
      "Welcome back! I saved your spot.",
      `Welcome back, ${n}! Ready for more?`,
      "Yay, you're here! Let's learn together!",
      `Hello again, ${persona.title} ${n}! Let's go!`,
    ],
    praise: [
      (lessons: number) => (lessons === 1 ? "One lesson done today. Super!" : `${lessons} lessons done today. Super!`),
      () => "You learned so much today!",
      () => `Great work today, ${n}!`,
      (lessons: number) => (lessons === 1 ? `A lesson today! ${guide} is proud!` : `${lessons} lessons today! ${guide} is proud!`),
    ],
    praiseAllQuests: [
      "All quests done today! You're a star!",
      "Every quest done! What a day!",
      `Three quests done, ${n}! Amazing!`,
    ],
    /** How close the nearest open quest is, in plain words. */
    questClose: {
      lessons: (left: number) => (left === 1 ? "Nice! One more lesson finishes a quest!" : `Nice! ${left} more lessons finish a quest!`),
      firstTry: (left: number) => (left === 1 ? "One more first-try answer finishes a quest!" : `${left} more first-try answers finish a quest!`),
      combo: (_left: number, target: number) => `Get ${target} right in a row for a quest!`,
      dust: (left: number) => `${left} more Star Dust finishes a quest!`,
      perfect: () => "One perfect lesson finishes a quest!",
    },
    questsOpen: (open: number) => (open === 1 ? "One more quest to try today!" : `${open} more quests to try today!`),
    nearChest: [
      (left: number) => (left === 1 ? "One more lesson to the treasure chest!" : `${left} more lessons to the treasure chest!`),
      (left: number) => (left === 1 ? "The treasure chest is just one lesson away!" : `The treasure chest is ${left} lessons away!`),
      () => "A treasure chest is close. Let's go!",
    ],
    next: [
      (lesson: string) => `Next up: ${lesson}. Let's go!`,
      (lesson: string) => `Ready for ${lesson}? I am!`,
      (lesson: string) => `Let's play ${lesson} together!`,
      (lesson: string) => `${lesson} is next on our path!`,
    ],
    brandNew: [
      `Hi! I'm ${guide}. Pick a course to start!`,
      `Hello, ${n}! Tap a course to begin!`,
      "Welcome! Choose a course and let's learn!",
    ],
    morning: [
      "Good morning! Ready to learn something new?",
      `Morning, ${n}! Let's play!`,
      "Good morning! New day, new quests!",
    ],
    afternoon: [
      "Good afternoon! Time for a lesson?",
      `Hi, ${n}! Let's learn something cool!`,
      "Hello! What shall we explore today?",
    ],
    evening: [
      "Good evening! How about one cozy lesson?",
      `Evening, ${n}! Want to play a bit?`,
      "Hi there! Let's learn something fun.",
    ],
    night: [
      `Yawn… ${guide} is getting sleepy.`,
      "It's late. See you tomorrow!",
      "Sleepy time soon. Sweet dreams!",
    ],
    /** QuestRow on "Lesson complete!" (labels and icons come from HOME.quests). */
    questRowDone: (count: number) => (count === 1 ? "Quest done!" : `${count} quests done!`),
    questRowCollect: (count: number) => (count === 1 ? "Collect it at home!" : "Collect them at home!"),
    questRowLabel: "Today's quests",
  },

  /** Reminder notifications (engine/notify/reminders.ts). Title ≤ 5 words, body ≤ 12. */
  cheers: {
    chest: { title: "Treasure chest waiting", body: `Your treasure chest is ready to open, ${n}!` },
    quests: { title: "Today's quests are here", body: `Three fresh quests are ready. ${guide} picked them!` },
    next: (lesson: string) => ({ title: "Your next lesson", body: `${lesson} is ready. ${guide} saved your spot!` }),
    gift: { title: "A daily gift", body: `A little gift is ready for you, ${n}!` },
    /** One per course, in COURSES order (titles come from the registry). Titles
     *  are plain words: the course icon argument is ignored (no emoji). */
    course: [
      (title: string, _icon?: string) => ({ title: `${title} time!`, body: `${guide} has a fun ${title} lesson ready.` }),
      (title: string, _icon?: string) => ({ title: `${title} with ${guide}`, body: `Want to play ${title} together, ${n}?` }),
      (title: string, _icon?: string) => ({ title: `Hello from ${title}`, body: `A new ${title} lesson is ready when you are.` }),
      (title: string, _icon?: string) => ({ title: `${title} is open`, body: `${guide} wants to build something cool with you!` }),
    ],
    general: [
      { title: `${guide} says hi!`, body: `${guide} is ready for an adventure with you, ${n}!` },
      { title: "Learn something new", body: "A tiny lesson is ready whenever you are." },
      { title: "Star Dust time", body: `Earn some Star Dust with ${guide} today!` },
    ],
  },
};
