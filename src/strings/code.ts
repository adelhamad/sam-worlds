// Code Lab player-facing strings. Rules: ≤ 8 simple words per line, warm
// tone, and the words "wrong" / "fail" never appear. Each section is owned by
// one part of the feature — add keys to your own section only.
import { persona } from "../persona.config";

const guide = persona.guide;

export const CODE = {
  title: "Code Lab",

  /** Puzzle prompts and hints written by the lesson planner (engine). */
  engine: {
    run: `Take ${guide} to the flag`,
    shortest: "Find the shortest way",
    stars: "Grab the stars, then the flag",
    trace: `Where will ${guide} stop?`,
    debug: "Fix the bug",
    loop: "Use a loop to reach the flag",
    hint: {
      run: "Follow the path one square at a time.",
      walls: "Go around the walls, step by step.",
      shortest: "Count the squares. Use the fewest arrows.",
      stars: "Visit every star before the flag.",
      trace: "Follow each arrow in order.",
      loopTrace: "Do the loop steps again and again.",
      loop: "Find the steps that repeat.",
      debug: "Step through it. One arrow is off.",
    },
  },

  /** Coding widgets and teach cards (UI agent owns this section). */
  exercise: {
    /** One instruction line above each widget (≤ 8 words). */
    help: {
      run: "Tap arrows, then press RUN!",
      stars: "Get every star, then the flag!",
      loop: "Tap a loop, put arrows inside!",
      debug: "One arrow needs to turn.",
      debugPick: "Which way should it point?",
      trace: `Tap where ${guide} will stop.`,
      traced: `${guide} stops there? Press CHECK!`,
    },
    running: `Go, ${guide}, go!`,
    won: "You did it!",
    bumped: "Bonk! A rock.",
    short: "Hmm, not at the flag.",
    full: "No room left!",
    runBtn: "Run",
    watch: "Watch",
    watching: "Watch the bug…",
    start: "Start",
    dir: { N: "up", E: "right", S: "down", W: "left" },
    arrow: (dir: string) => `Arrow ${dir}`,
    add: (dir: string) => `Add arrow ${dir}`,
    addLoop: (times: number) => `Add a loop, ${times} times`,
    remove: (dir: string) => `Take out arrow ${dir}`,
    change: (dir: string) => `Change arrow ${dir}`,
    pick: (dir: string) => `Point ${dir}`,
    loop: (times: number) => `Loop, ${times} times`,
    openLoop: (times: number) => `Put arrows in the loop, ${times} times`,
    removeLoop: "Take out the loop",
    closeLoop: "Close the loop",
    empty: "Your program",
    used: (used: number, max: number) => `${used} of ${max} blocks used`,
    starsGot: (got: number, all: number) => `${got} of ${all} stars`,
    square: (row: number, col: number) => `Row ${row}, column ${col}`,
    squareStart: (row: number, col: number) => `Row ${row}, column ${col}, ${guide} is here`,
    squareStar: (row: number, col: number) => `Row ${row}, column ${col}, a star`,
    pinned: `${guide} stops here`,
    /** The teach card (the "Almost — look at this." sheet). */
    teach: {
      run: "Follow each step in order.",
      stars: "Grab the stars, then the flag.",
      loop: "The loop does the same steps again.",
      debug: "This arrow was off.",
      trace: `${guide} stops on the pin.`,
      loopTrace: "Do the loop steps, then stop.",
      yourTap: "You tapped the ring.",
    },
  },

  /** Opening demos of a lesson (UI agent owns this section). */
  meet: {
    letsGo: "Let’s go!",
    tryIt: `Tap an arrow to move ${guide}!`,
    again: "Watch again",
    intros: {
      sequence: { title: "Meet code!", lines: ["A program is steps in order.", `${guide} does them one by one.`] },
      stars: { title: "Star path!", lines: ["Walk over a star to grab it.", "Get them all, then the flag."] },
      trace: { title: "Read the code!", lines: ["Read it. Where does it end?", "Follow each arrow in your head."] },
      bug: { title: "Bug hunt!", lines: ["A bug is a mistake you can fix.", "Turn the arrow, and it works!"] },
      loop: { title: "Loops!", lines: ["A loop repeats steps.", "×3 means do it three times."] },
    },
  },
};
