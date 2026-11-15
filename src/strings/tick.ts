// Tick Tock player-facing strings. Rules: ≤ 8 simple words per prompt, warm
// tone, no emoji, and the words "wrong" / "fail" never appear. Each section is
// owned by one part of the feature — add keys to your own section only.

const wordCount = (text: string) => text.trim().split(/\s+/).length;

export const TICK = {
  title: "Tick Tock",

  /** Puzzle prompts, hints and teach lines written by the lesson planner (engine). */
  engine: {
    read: "What time is it?",
    set: (say: string) => `Set the clock to ${say}`,
    match: "Match each clock to its time",
    pickClock: (say: string) => `Which clock shows ${say}?`,
    pickWords: "How do you say this time?",
    order: "Earliest first: put them in order",
    /** `jump` is a jump phrase ("30 minutes", "1 hour 30 minutes"). */
    laterRead: (jump: string) => {
      const long = `What time is it ${jump} later?`;
      return wordCount(long) <= 8 ? long : `What time, ${jump} later?`;
    },
    laterSet: (jump: string) => `Move the clock ${jump} later`,
    /** What the set widget shows as the target of a "later" puzzle. */
    laterSay: (jump: string) => `${jump} later`,
    /** Hints teach the rule; they never give the answer. */
    hint: {
      hour: "The short hand shows the hour.",
      oclock: "O'clock: the long hand points to 12.",
      half: "Half past: the long hand points to 6.",
      quarterPast: "Quarter past: the long hand points to 3.",
      quarterTo: "Quarter to: the hour is almost the next one.",
      fives: "Each number is 5 minutes for the long hand.",
      minutes: "Count by fives, then add the little marks.",
      match: "Short hand for the hour, long hand for minutes.",
      swap: "The long hand shows the minutes, not the hour.",
      order: "Smallest hour first. Same hour? Fewer minutes first.",
      laterHour: "One hour later: the short hand moves one number.",
      laterHalf: "Half an hour later: the long hand goes halfway round.",
      laterFives: "Each number is 5 more minutes for the long hand.",
      laterMix: "Add the hours first, then the minutes.",
    },
    /** One teaching line on the "Almost — look at this." card of a card puzzle. */
    explain: {
      match: "The short hand shows the hour. The long hand shows the minutes.",
      pickClock: "Find the short hand first, then check the long hand.",
      pickWords: "Read the short hand for the hour, then the long hand.",
      order: "Earliest means the smallest hour. Same hour? Fewer minutes first.",
    },
  },

  /** Clock widgets and teach cards (the UI agent owns this section). */
  exercise: {
    /** One instruction line above each widget (≤ 8 words). */
    help: {
      read: "Look at the hands. Type the time.",
      readHour: "Look at the short hand. Type the hour.",
      later: "Type the time after the jump.",
      set: "Drag the long hand to set it.",
      setHour: "Drag the short hand to the hour.",
      laterSet: "Move the hands to the new time.",
    },
    /** The jump chip of a "later" puzzle. */
    later: (jump: string) => `${jump} later`,
    now: "Now",
    /** Accessible names. */
    clock: (time: string) => `Clock showing ${time}`,
    clockSet: (time: string) => `Clock set to ${time}. Drag the hand to change it.`,
    hourField: "Hour",
    minuteField: "Minutes",
    erase: "Rub out",
    timeDisplay: "The time you typed",
    plus: (n: number, unit: string) => `Plus ${n} ${unit}`,
    minus: (n: number, unit: string) => `Minus ${n} ${unit}`,
    unitMin: "min",
    unitHour: "hour",
    /** Hand names, used everywhere the course talks about the hands. */
    hourHand: "short hand: hour",
    minuteHand: "long hand: minutes",
    /** The teach card (the "Almost — look at this." sheet). */
    teach: {
      oclock: "The long hand points to 12.",
      half: "Half past: the long hand points to 6.",
      quarterPast: "Quarter past: the long hand points to 3.",
      quarterTo: "Quarter to: the long hand points to 9.",
      fives: "Each number is 5 minutes.",
      minutes: "Count the small marks for minutes.",
      turn: "One full turn is one hour.",
      halfTurn: "30 minutes is half a turn.",
      quarterTurn: "15 minutes is a quarter turn.",
      youMade: (time: string) => `You made ${time}`,
      youTyped: (time: string) => `You typed ${time}`,
    },
  },

  /** Opening demos of the lessons (the UI agent owns this section). */
  meet: {
    letsGo: "Let’s go!",
    tryIt: "Try it! Drag the long hand.",
    tryHour: "Try it! Drag the short hand.",
    intros: {
      hands: { title: "Meet the clock!", lines: ["Short hand: hours.", "Long hand: minutes."] },
      oclock: { title: "O’clock!", lines: ["Long hand on 12: o’clock!", "The short hand shows the hour."] },
      half: { title: "Half past!", lines: ["Half past: halfway round.", "The long hand points to 6."] },
      quarter: { title: "Quarters!", lines: ["Quarter past. Quarter to.", "A quarter is 15 minutes."] },
      fives: { title: "Count by fives!", lines: ["Each number is 5 minutes.", "5, 10, 15, 20…"] },
      minutes: { title: "Every minute!", lines: ["Small marks are single minutes.", "Count them one by one."] },
      later: { title: "Later!", lines: ["One full turn is one hour.", "The short hand moves one number."] },
    },
  },
};
