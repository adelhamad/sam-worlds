// Code Lab's Course Kit templates: thinking like a programmer without the
// grid — steps in order (recipes), sorting, simple if-then rules and
// patterns. Authoring rules: docs/COURSE_KIT.md §1.2–1.3. Template ids may
// change freely (saves never store them); lessons pick them in units.ts.
// No emoji: cards are words; a few carry a drawn icon (src/content/iconNames.ts).
import type { IconName } from "../iconNames";
import type { KitItem, KitTemplate } from "../../engine/kit/types";

const card = (id: string, label: string, icon?: IconName): KitItem => (icon ? { id, label, art: { kind: "icon", name: icon } } : { id, label });
const num = (n: number): KitItem => ({ id: `n${n}`, label: String(n) });

const STEPS_KITCHEN: KitTemplate = {
  kind: "order", id: "code-steps-kitchen", prompt: "Put the cooking steps in order",
  explain: "A recipe is steps in order — just like code.",
  sequences: [
    [
      card("bread", "Get two slices of bread"), card("butter", "Spread the butter"),
      card("cheese", "Add the cheese"), card("top", "Put the top slice on"), card("eat", "Eat your sandwich"),
    ],
    [
      card("wash", "Wash the oranges"), card("cut", "Cut them in half"),
      card("squeeze", "Squeeze out the juice"), card("pour", "Pour it into a cup"), card("drink", "Drink it up"),
    ],
    [
      card("mix", "Mix the dough"), card("shape", "Shape the cookies"),
      card("bake", "Bake with a grown-up"), card("cool", "Let them cool down"), card("munch", "Eat a cookie"),
    ],
  ],
};

const STEPS_DAY: KitTemplate = {
  kind: "order", id: "code-steps-day", prompt: "What comes first? Put them in order.",
  explain: "Do one step at a time, first to last.",
  sequences: [
    [
      card("paste", "Put paste on the brush"), card("brush", "Brush your teeth"),
      card("spit", "Spit it out"), card("rinse", "Rinse the brush"),
    ],
    [
      card("dig", "Dig a little hole"), card("drop", "Drop in the seed"),
      card("cover", "Cover it with soil"), card("water", "Water it"), card("grow", "Watch it grow"),
    ],
    [
      card("wet", "Wet your hands"), card("soap", "Add soap"), card("scrub", "Scrub all over"),
      card("rinse-off", "Rinse off the soap"), card("dry", "Dry your hands"),
    ],
    [
      card("socks", "Put on your socks"), card("shoes", "Put on your shoes"),
      card("laces", "Tie the laces"), card("out", "Go out to play"),
    ],
  ],
};

const ORDER_NUMBERS: KitTemplate = {
  kind: "order", id: "code-order-numbers", prompt: "Put the numbers from smallest to biggest",
  explain: "Smaller numbers come first. Compare two at a time.",
  sequences: [
    [1, 4, 7, 9, 12, 16].map(num),
    [3, 8, 10, 15, 21, 30].map(num),
    [2, 5, 11, 14, 20, 25].map(num),
    [6, 13, 17, 19, 40, 50].map(num),
  ],
};

const ORDER_SIZES: KitTemplate = {
  kind: "order", id: "code-order-sizes", prompt: "Order them from smallest to biggest",
  explain: "Look at two at a time. Which one is smaller?",
  sequences: [
    [card("ant", "Ant"), card("mouse", "Mouse"), card("cat", "Cat"), card("horse", "Horse"), card("elephant", "Elephant"), card("whale", "Blue whale")],
    [card("bee", "Bee"), card("chick", "Chick"), card("dog", "Dog"), card("bear", "Bear")],
    [card("coin", "Coin"), card("book", "Book"), card("chair", "Chair"), card("car", "Car"), card("bus", "Bus"), card("plane", "Big airplane")],
    [card("ball", "Ball"), card("house", "House"), card("mountain", "Mountain"), card("moon", "Moon"), card("earth", "Earth"), card("sun", "Sun")],
  ],
};

const ORDER_TALL: KitTemplate = {
  kind: "order", id: "code-order-tall", prompt: "Order them from shortest to tallest",
  explain: "Shortest goes first, tallest goes last.",
  sequences: [
    [card("sprout", "Sprout"), card("tulip", "Tulip"), card("kid", "Child"), card("door", "Door"), card("tree", "Tall tree")],
    [card("t-mouse", "Mouse"), card("t-cat", "Cat"), card("t-horse", "Horse"), card("giraffe", "Giraffe")],
    [card("cup", "Cup"), card("t-chair", "Chair"), card("adult", "Grown-up"), card("t-bus", "Bus"), card("tower", "Skyscraper")],
    [card("chick", "Chick"), card("puppy", "Puppy"), card("child", "Child"), card("t-giraffe", "Giraffe")],
  ],
};

const SORT_NUMBERS: KitTemplate = {
  kind: "sort", id: "code-sort-numbers", prompt: "Rule: is it less than 10?",
  explain: "Check each number with the rule, one by one.",
  buckets: [
    { bucket: card("less", "Less than 10", "arrow-down"), items: [1, 2, 3, 5, 7, 9].map(num) },
    { bucket: card("more", "10 or more", "arrow-up"), items: [10, 11, 12, 15, 18, 20].map(num) },
  ],
};

const IF_RAIN: KitTemplate = {
  kind: "pick", id: "code-if-rain", prompt: "If it rains, what do you take?",
  explain: "If it rains, then take something for rain.",
  hero: card("rain", "It is raining", "rain"),
  right: [card("umbrella", "Umbrella"), card("raincoat", "Raincoat"), card("boots", "Rain boots")],
  wrong: [
    card("shades", "Sunglasses"), card("sunhat", "Sun hat"), card("icecream", "Ice cream"),
    card("suncream", "Sun cream"), card("swimsuit", "Swimsuit"),
  ],
};

const IF_LIGHT: KitTemplate = {
  kind: "pick", id: "code-if-light", prompt: "If the light is red, what do you do?",
  explain: "Red means stop. If it is red, then wait.",
  hero: card("red", "The light is red"),
  right: [card("stop", "Stop"), card("wait", "Wait on the side"), card("green", "Wait for green")],
  wrong: [
    card("run", "Run across"), card("walk", "Walk across"), card("ride", "Ride across"),
    card("skip", "Skip across"), card("dash", "Dash across"),
  ],
};

const IF_WHEELS: KitTemplate = {
  kind: "sort", id: "code-if-wheels", prompt: "If it has wheels, it goes in the garage",
  explain: "Check the rule for each one: wheels or no wheels?",
  buckets: [
    {
      bucket: card("garage", "Garage: has wheels", "home"),
      items: [card("car", "Car"), card("bike", "Bike"), card("scooter", "Scooter"), card("skateboard", "Skateboard"), card("tractor", "Tractor"), card("bus", "Bus")],
    },
    {
      bucket: card("toybox", "Toy box: no wheels", "chest"),
      items: [card("ball", "Ball"), card("teddy", "Teddy bear"), card("kite", "Kite"), card("yoyo", "Yo-yo"), card("drum", "Drum"), card("puzzle", "Puzzle")],
    },
  ],
};

const PATTERN_ROW: KitTemplate = {
  kind: "pick", id: "code-pattern-row", prompt: "Which row repeats a pattern?", layout: "list",
  explain: "A pattern repeats the same part again and again.",
  // Rows are words, letters and numbers (one card holds one picture, so a row
  // of shapes is written out). Every right row repeats a part at least twice.
  right: [
    card("p1", "A B A B A B"), card("p2", "up down up down up down"), card("p3", "1 2 1 2 1 2"),
    card("p4", "A A B A A B"), card("p5", "1 2 3 1 2 3"),
  ],
  // None of these repeats any part (checked for repeats of 1, 2 and 3 cards).
  wrong: [
    card("x1", "A B A B B A"), card("x2", "up down up up down down"), card("x3", "1 2 2 1 1 2"),
    card("x4", "A B A A B B"), card("x5", "1 2 3 2 1 3"),
  ],
};

/** Number cards of one pattern (ids carry the pattern, so they stay unique in the template). */
const row = (tag: string, ...values: number[]): KitItem[] => values.map((n) => ({ id: `${tag}-${n}`, label: String(n) }));

const PATTERN_NEXT: KitTemplate = {
  kind: "number", id: "code-pattern-next", prompt: "What number comes next?",
  explain: "Find the jump between the numbers. Jump again!",
  variants: [
    { items: row("v1", 1, 2, 3, 4), answer: 5 },
    { items: row("v2", 2, 4, 6, 8), answer: 10 },
    { items: row("v3", 5, 10, 15, 20), answer: 25 },
    { items: row("v4", 10, 20, 30, 40), answer: 50 },
    { items: row("v5", 3, 6, 9, 12), answer: 15 },
    { items: row("v6", 1, 3, 5, 7), answer: 9 },
    { items: row("v7", 10, 9, 8, 7), answer: 6 },
    { items: row("v8", 20, 18, 16, 14), answer: 12 },
    { items: row("v9", 4, 8, 12, 16), answer: 20 },
    { items: row("v10", 2, 5, 8, 11), answer: 14 },
    { items: row("v11", 50, 40, 30, 20), answer: 10 },
    { items: row("v12", 6, 7, 8, 9), answer: 10 },
  ],
};

/** Every kit template of Code Lab (the kit audit scans this list). */
export const CODE_BANK: KitTemplate[] = [
  STEPS_KITCHEN, STEPS_DAY, ORDER_NUMBERS, ORDER_SIZES, ORDER_TALL, SORT_NUMBERS,
  IF_RAIN, IF_LIGHT, IF_WHEELS, PATTERN_ROW, PATTERN_NEXT,
];

const BY_ID = new Map(CODE_BANK.map((template) => [template.id, template]));

/** Templates by id (throws on a typo, so a broken lesson never ships). */
export function codeKit(...ids: string[]): KitTemplate[] {
  return ids.map((id) => {
    const template = BY_ID.get(id);
    if (!template) throw new Error(`Code Lab: unknown kit template "${id}"`);
    return template;
  });
}
