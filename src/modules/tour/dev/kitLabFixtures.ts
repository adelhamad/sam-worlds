// Fixtures for the Course Kit lab (DEV only). Templates meet the pool minimums
// of docs/COURSE_KIT.md §1.2 so the real planner can sample them; the MANUAL
// questions are hand-built worst cases the planner may never produce (clock
// boards like Tick Tock builds, the longest labels, the biggest boards).
// Pictures are named icons or clocks — never emoji.
import type { Question } from "../../../engine/generators/types";
import { orderAnswer, pairsAnswer, sentenceAnswer, sortAnswer } from "../../../engine/kit/answers";
import type { KitItem, KitPayload, KitSlide, KitTemplate } from "../../../engine/kit/types";
import { timeKey, timeWords } from "../../../engine/tick/clock";
import type { IconName } from "../../../content/iconNames";

/** A text-only card, or one with a drawn icon. */
const it = (id: string, label: string, icon?: IconName): KitItem => (icon ? { id, label, art: { kind: "icon", name: icon } } : { id, label });
/** A clock card: picture only, or with a label under it. */
const clock = (hour: number, minute: number, label = ""): KitItem => ({
  id: timeKey({ hour, minute }), label, art: { kind: "clock", hour, minute },
});
const said = (hour: number, minute: number): KitItem => ({ id: timeKey({ hour, minute }), label: timeWords({ hour, minute }) });

export const LAB_TEMPLATES: KitTemplate[] = [
  {
    kind: "pick", id: "lab-pick-icons", prompt: "Which one is an animal?", explain: "Animals are alive. They move and eat.",
    right: [it("cat", "Cat", "cat"), it("dog", "Dog", "dog"), it("fish", "Fish", "fish"), it("bird", "Bird", "bird")],
    wrong: [it("tree", "Tree", "tree"), it("car", "Car", "car"), it("ball", "Ball", "ball"), it("cup", "Cup", "cup"), it("shoe", "Shoe", "shoe")],
  },
  {
    kind: "pick", id: "lab-pick-text", prompt: "Which word means fast?", explain: "Quick and speedy both mean fast.",
    right: [it("quick", "Quick"), it("speedy", "Speedy")],
    wrong: [it("slow", "Slow"), it("sleepy", "Sleepy"), it("tiny", "Tiny"), it("soft", "Soft"), it("extraordinarily", "Extraordinarily")],
  },
  {
    kind: "pick", id: "lab-pick-clocks", prompt: "Which clock shows o'clock?", explain: "At o'clock the long hand points to 12.",
    right: [clock(3, 0), clock(7, 0), clock(11, 0)],
    wrong: [clock(3, 30), clock(7, 30), clock(10, 15), clock(4, 45), clock(1, 30)],
  },
  {
    kind: "pick", id: "lab-pick-long", prompt: "The game has a bug. What now?",
    explain: "Tell a grown-up what you saw. Then test again.",
    hero: it("bug", "The cat walks through walls", "bug"),
    right: [it("tell", "Tell a grown-up what you saw"), it("show", "Show the problem to someone")],
    wrong: [
      it("throw", "Throw the tablet in the pool"), it("shout", "Shout at the computer loudly"),
      it("delete", "Delete every single game now"), it("sleep", "Go to sleep and never look"),
    ],
  },
  {
    kind: "pick", id: "lab-pick-list", prompt: "Which sentence is true?", layout: "list",
    explain: "Read each sentence. Is it really so?",
    hero: it("lens", "Look closely", "lens"),
    right: [
      it("r1", "A square has four sides that are all the same length"),
      it("r2", "A triangle has three sides and three corners"),
    ],
    wrong: [it("w1", "A circle has corners"), it("w2", "A square is round"), it("w3", "Ten is less than two"), it("w4", "A triangle has five sides and it rolls down hills")],
  },
  {
    kind: "pairs", id: "lab-pairs", prompt: "What is it for?", explain: "Every thing has a job.",
    pairs: [
      { left: it("brush", "Toothbrush", "toothbrush"), right: it("brush", "Brushing teeth") },
      { left: it("cup", "Cup", "cup"), right: it("cup", "Drinking") },
      { left: it("bed", "Bed", "bed"), right: it("bed", "Sleeping") },
      { left: it("umbrella", "Umbrella", "umbrella"), right: it("umbrella", "Staying dry") },
      { left: it("book", "Book", "book"), right: it("book", "Reading") },
      { left: it("bike", "Bike", "bike"), right: it("bike", "Riding") },
      { left: it("ball", "Ball", "ball"), right: it("ball", "Playing catch") },
    ],
  },
  {
    kind: "order", id: "lab-order", prompt: "Put the steps in order", explain: "First things first, then the next.",
    sequences: [
      [
        it("idea", "You think of a game idea"), it("plan", "You draw a plan on paper"),
        it("build", "You build the game"), it("test", "You play and test it well"), it("fix", "You fix the bugs you find"),
      ],
      [it("seed", "Plant a seed"), it("water", "Water it"), it("sprout", "It sprouts"), it("bloom", "It blooms")],
      [it("wake", "Wake up"), it("dress", "Get dressed"), it("eat", "Eat breakfast"), it("bus", "Ride the bus")],
    ],
  },
  {
    kind: "sort", id: "lab-sort-3", prompt: "Animal, plant or thing?", explain: "Animals and plants are alive. Things are not.",
    buckets: [
      { bucket: it("animal", "Animal"), items: [it("cat", "Cat", "cat"), it("dog", "Dog", "dog"), it("fish", "Fish", "fish"), it("bird", "Bird", "bird")] },
      { bucket: it("plant", "Plant"), items: [it("tree", "Tree", "tree"), it("flower", "Flower", "flower"), it("apple", "Apple tree", "apple"), it("grass", "Grass")] },
      { bucket: it("thing", "Thing"), items: [it("car", "Car", "car"), it("ball", "Ball", "ball"), it("cup", "Cup", "cup"), it("shoe", "Shoe", "shoe")] },
    ],
  },
  {
    kind: "sort", id: "lab-sort-text", prompt: "Is it true or made up?", explain: "Check facts before you share them.",
    buckets: [
      { bucket: it("true", "True", "check"), items: [it("t1", "Fish live in water"), it("t2", "The sun is hot"), it("t3", "Cats can purr"), it("t4", "Ice is cold")] },
      { bucket: it("made", "Made up", "cloud"), items: [it("m1", "Dogs can fly to the moon"), it("m2", "Rocks eat pizza"), it("m3", "Trees can talk"), it("m4", "Snow is hot")] },
    ],
  },
  {
    kind: "build", id: "lab-build", prompt: "Build the sentence", explain: "First who, then what they do.",
    hero: it("pets", "Two good friends", "heart"),
    sentences: [
      { words: ["the", "cat", "and", "the", "dog", "can", "play"], decoys: ["cow", "sad"] },
      { words: ["I", "like", "red", "apples"], decoys: ["blue", "run"] },
      { words: ["the", "robot", "can", "draw"], decoys: ["eat", "tree"] },
      { words: ["we", "test", "the", "game"], decoys: ["sleep", "fish"] },
    ],
  },
  {
    kind: "number", id: "lab-number", prompt: "How many are there?", explain: "Count each one, one by one.",
    variants: [
      { items: Array.from({ length: 12 }, (_, i) => it(`s${i}`, "", "star")), answer: 12, caption: "Count the stars!" },
      { items: Array.from({ length: 3 }, (_, i) => it(`a${i}`, "", "apple")), answer: 3 },
      { items: Array.from({ length: 5 }, (_, i) => it(`b${i}`, "", "ball")), answer: 5 },
      { items: Array.from({ length: 7 }, (_, i) => it(`c${i}`, "", "car")), answer: 7, caption: "Cars in a row" },
      { items: Array.from({ length: 9 }, (_, i) => it(`d${i}`, "", "bird")), answer: 9 },
      { items: [it("n1", "10"), it("plus", "+"), it("n2", "15")], answer: 25, caption: "Add them up" },
    ],
  },
];

function manual(id: string, prompt: string, answer: string, payload: KitPayload): Question {
  return {
    id, prompt, answer, choices: [], hint: payload.explain, inputMode: "tour", repeatable: true, dedupeKey: `lab:${id}`,
    payload: payload as unknown as Record<string, unknown>,
  };
}

const LONG_PAIRS = [
  [it("p1", "A list of steps to follow"), it("p1", "A plan, like a recipe card")],
  [it("p2", "Clear words that say a lot"), it("p2", "A good question with details")],
  [it("p3", "Checking that the game works"), it("p3", "Testing the thing you made")],
  [it("p4", "Something does not work", "bug"), it("p4", "A bug that needs a fix", "tools")],
  [it("p5", "Share it with your family", "home"), it("p5", "Show the finished game", "rocket")],
] as const;

// Tick Tock style: five picture-only clocks on the left, written times (one decoy) on the right.
const CLOCK_PAIRS = [[3, 0], [7, 30], [10, 0], [1, 30], [5, 45]] as const;
// The planner shows at most 5 steps; all labels near the 28-character limit.
const FIVE = [
  it("o1", "You dream up a very fun idea"), it("o2", "You tell a friend about it"),
  it("o3", "You draw a long plan on it"), it("o4", "You build your little game"),
  it("o5", "You test it and find a bug!"),
];
const CLOCKS = [clock(1, 0), clock(2, 30), clock(4, 15), clock(8, 0), clock(11, 45)];
const DAY = [clock(7, 0, "Wake up"), clock(8, 30, "School starts"), clock(12, 0, "Lunch"), clock(3, 30, "Home time")];

const SORT_CARDS = [
  [it("k1", "A robot that sweeps the floor", "robot"), "made"], [it("k2", "A kitten playing with yarn", "cat"), "alive"],
  [it("k3", "A red bike with a bell", "bike"), "made"], [it("k4", "An oak tree in the park", "tree"), "alive"],
  [it("k5", "A cup of warm milk", "cup"), "made"], [it("k6", "A goldfish in a bowl", "fish"), "alive"],
  [it("k7", "A school bus on its way", "bus"), "made"], [it("k8", "A busy little bird", "bird"), "alive"],
] as const;

const BUILD_WORDS = ["the", "robot", "and", "the", "girl", "build", "games"];
const BUILD_TILES = ["games", "the", "fly", "girl", "and", "the", "eats", "robot", "build"]; // MAX_TILES = 9

export const LAB_MANUAL: Question[] = [
  manual("m-pairs-clocks", "Match the clocks", pairsAnswer(CLOCK_PAIRS.map(([h, m]) => timeKey({ hour: h, minute: m }))), {
    tour: "kit-pairs", template: "manual", explain: "The short hand shows the hour.",
    left: CLOCK_PAIRS.map(([h, m]) => clock(h, m)),
    right: [said(1, 30), said(10, 0), said(6, 15), said(3, 0), said(5, 45), said(7, 30)],
  }),
  manual("m-pairs", "Match the ideas", pairsAnswer(LONG_PAIRS.map(([left]) => left.id)), {
    tour: "kit-pairs", template: "manual", explain: "A plan is a list of steps, like a recipe.",
    left: LONG_PAIRS.map(([left]) => left),
    right: [LONG_PAIRS[2][1], LONG_PAIRS[0][1], it("decoy", "A sandwich with cheese"), LONG_PAIRS[4][1], LONG_PAIRS[1][1], LONG_PAIRS[3][1]],
  }),
  manual("m-order-clocks", "Put the times in order", orderAnswer(CLOCKS.map((card) => card.id)), {
    tour: "kit-order", template: "manual", explain: "Earlier times come first.",
    cards: [CLOCKS[3], CLOCKS[0], CLOCKS[4], CLOCKS[2], CLOCKS[1]],
  }),
  manual("m-order-day", "Put Sam's day in order", orderAnswer(DAY.map((card) => card.id)), {
    tour: "kit-order", template: "manual", explain: "Morning first, then the afternoon.",
    cards: [DAY[2], DAY[0], DAY[3], DAY[1]],
  }),
  manual("m-order", "Put the steps in order", orderAnswer(FIVE.map((step) => step.id)), {
    tour: "kit-order", template: "manual", explain: "Idea, tell, plan, build, then test.",
    cards: [FIVE[3], FIVE[0], FIVE[2], FIVE[4], FIVE[1]],
  }),
  manual("m-sort", "Is it alive or made?", sortAnswer(["made", "alive"], Object.fromEntries(SORT_CARDS.slice(0, 6).map(([card, b]) => [card.id, b]))), {
    tour: "kit-sort", template: "manual", explain: "Living things grow. Made things are built.",
    buckets: [it("made", "Made by people", "tools"), it("alive", "Alive", "flower")],
    cards: [0, 3, 5, 1, 4, 2].map((i) => SORT_CARDS[i][0]), // the planner shows at most 6
  }),
  manual("m-sort-clocks", "Morning or afternoon?", sortAnswer(["am", "pm"], { "7:00": "am", "9:30": "am", "10:15": "am", "2:00": "pm", "4:30": "pm", "5:45": "pm" }), {
    tour: "kit-sort", template: "manual", explain: "Breakfast is in the morning.",
    buckets: [it("am", "Morning", "sun"), it("pm", "Afternoon", "home")],
    cards: [clock(2, 0, "Snack"), clock(7, 0, "Breakfast"), clock(4, 30, "Park"), clock(9, 30, "Reading"), clock(5, 45, "Bath"), clock(10, 15, "Break")],
  }),
  manual("m-build", "Build the sentence", sentenceAnswer(BUILD_WORDS), {
    tour: "kit-build", template: "manual", explain: "Who builds? The robot and the girl.",
    hero: it("team", "A great team", "robot"), tiles: BUILD_TILES,
  }),
  manual("m-pick-art", "Which one is a fruit?", "apple", {
    tour: "kit-pick", template: "manual", explain: "An apple grows on a tree. It is a fruit.", layout: "grid",
    options: [it("car", "", "car"), it("apple", "", "apple"), it("shoe", "", "shoe"), it("ball", "", "ball")],
  }),
  manual("m-pick-clock-hero", "What time is lunch?", "noon", {
    tour: "kit-pick", template: "manual", explain: "Both hands point up at 12 o'clock.", layout: "grid",
    hero: clock(12, 0, "Lunch time"),
    options: [it("noon", "12 o'clock"), it("six", "6 o'clock"), it("half", "Half past 12"), it("three", "3 o'clock")],
  }),
  manual("m-number", "How many stars?", "12", {
    tour: "kit-number", template: "manual", explain: "Count each one, one by one.", caption: "Count them all!",
    items: Array.from({ length: 12 }, (_, i) => it(`s${i}`, "", "star")),
  }),
];

export const LAB_SLIDES: KitSlide[] = [
  { art: { kind: "icon", name: "circle" }, title: "Meet the circle", lines: ["It is round all the way.", "It has no corners at all."] },
  { art: { kind: "clock", hour: 3, minute: 0 }, title: "This is 3 o'clock", lines: ["The short hand points to 3.", "The long hand points to 12."] },
  { title: "Your turn now!", lines: ["Pogo will ask. You answer."] },
];
