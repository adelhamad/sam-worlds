// Critter Current — pure game content + wave logic. Real zoology: each animal
// is tagged per trait as true (valid target), false (safe decoy) or ABSENT
// (scientifically murky for a 7-year-old → never appears in that trait's
// waves). Trick combos (bat=mammal, penguin can't fly, dolphin breathes air)
// carry curated teaching lines shown on a wrong tap.
import { pick, randInt, shuffle, type RNG } from "./rng";

export type Trait =
  | "mammal"
  | "bird"
  | "reptile"
  | "eggs"
  | "nocturnal"
  | "herbivore"
  | "carnivore"
  | "fly"
  | "gills"
  | "insect";

export interface Critter {
  emoji: string;
  name: string;
  traits: Partial<Record<Trait, boolean>>;
  /** Teaching lines for famous misconceptions, shown on a wrong tap. */
  facts?: Partial<Record<Trait, string>>;
}

const C = (emoji: string, name: string, traits: Critter["traits"], facts?: Critter["facts"]): Critter => ({ emoji, name, traits, facts });

export const CRITTERS: Critter[] = [
  // birds
  C("🦉", "owl", { bird: true, mammal: false, reptile: false, eggs: true, nocturnal: true, carnivore: true, herbivore: false, fly: true, gills: false, insect: false }),
  C("🦅", "eagle", { bird: true, mammal: false, reptile: false, eggs: true, nocturnal: false, carnivore: true, herbivore: false, fly: true, gills: false, insect: false }),
  C("🦆", "duck", { bird: true, mammal: false, reptile: false, eggs: true, nocturnal: false, fly: true, gills: false, insect: false }),
  C("🦜", "parrot", { bird: true, mammal: false, reptile: false, eggs: true, nocturnal: false, herbivore: true, carnivore: false, fly: true, gills: false, insect: false }),
  C("🦢", "swan", { bird: true, mammal: false, eggs: true, nocturnal: false, herbivore: true, carnivore: false, fly: true, gills: false, insect: false }),
  C("🦩", "flamingo", { bird: true, mammal: false, eggs: true, fly: true, gills: false, insect: false }),
  C("🐓", "rooster", { bird: true, mammal: false, reptile: false, eggs: true, nocturnal: false, gills: false, insect: false }, { nocturnal: "A rooster crows at SUNRISE — he sleeps at night!" }),
  C(
    "🐧",
    "penguin",
    { bird: true, mammal: false, reptile: false, eggs: true, nocturnal: false, carnivore: true, herbivore: false, fly: false, gills: false, insect: false },
    { fly: "Penguins are birds that CANNOT fly — they fly underwater instead!", gills: "Penguins hold their breath when they dive — they breathe air!" },
  ),
  // mammals
  C("🦇", "bat", { mammal: true, bird: false, reptile: false, eggs: false, nocturnal: true, fly: true, gills: false, insect: false }, { bird: "A bat is a MAMMAL — fur and milk! The only mammal that truly flies.", eggs: "Bat babies are born alive and drink milk!" }),
  C("🐘", "elephant", { mammal: true, bird: false, reptile: false, eggs: false, herbivore: true, carnivore: false, fly: false, gills: false, insect: false }),
  C("🦒", "giraffe", { mammal: true, bird: false, eggs: false, nocturnal: false, herbivore: true, carnivore: false, fly: false, gills: false }),
  C("🦁", "lion", { mammal: true, bird: false, reptile: false, eggs: false, carnivore: true, herbivore: false, fly: false, gills: false, insect: false }),
  C("🐯", "tiger", { mammal: true, bird: false, eggs: false, carnivore: true, herbivore: false, fly: false, gills: false }),
  C("🐺", "wolf", { mammal: true, bird: false, eggs: false, carnivore: true, herbivore: false, fly: false, gills: false }),
  C("🐼", "panda", { mammal: true, bird: false, eggs: false, herbivore: true, carnivore: false, fly: false, gills: false }),
  C("🐨", "koala", { mammal: true, bird: false, eggs: false, nocturnal: true, herbivore: true, carnivore: false, fly: false, gills: false }),
  C("🦘", "kangaroo", { mammal: true, bird: false, eggs: false, herbivore: true, carnivore: false, fly: false, gills: false }),
  C("🐄", "cow", { mammal: true, bird: false, eggs: false, nocturnal: false, herbivore: true, carnivore: false, fly: false, gills: false }),
  C("🐇", "rabbit", { mammal: true, bird: false, eggs: false, herbivore: true, carnivore: false, fly: false, gills: false }),
  C("🐭", "mouse", { mammal: true, bird: false, eggs: false, nocturnal: true, fly: false, gills: false, insect: false }),
  C("🦔", "hedgehog", { mammal: true, bird: false, eggs: false, nocturnal: true, fly: false, gills: false }),
  C("🦝", "raccoon", { mammal: true, bird: false, eggs: false, nocturnal: true, fly: false, gills: false }),
  C("🦨", "skunk", { mammal: true, bird: false, eggs: false, nocturnal: true, fly: false, gills: false }),
  C("🐿️", "squirrel", { mammal: true, bird: false, eggs: false, nocturnal: false, herbivore: true, carnivore: false, fly: false, gills: false }),
  C(
    "🐬",
    "dolphin",
    { mammal: true, bird: false, reptile: false, eggs: false, nocturnal: false, carnivore: true, herbivore: false, fly: false, gills: false, insect: false },
    { gills: "A dolphin breathes AIR through its blowhole — it's a mammal!", eggs: "Dolphin babies are born alive and drink milk underwater!" },
  ),
  C("🐋", "whale", { mammal: true, bird: false, eggs: false, carnivore: true, herbivore: false, fly: false, gills: false }, { gills: "A whale breathes air through its blowhole — that's the spout!", eggs: "Whale babies are born alive — the biggest babies on Earth!" }),
  C("🦭", "seal", { mammal: true, bird: false, eggs: false, carnivore: true, herbivore: false, fly: false, gills: false }, { gills: "Seals hold their breath — they breathe air like us!" }),
  // fish & water breathers
  C("🦈", "shark", { mammal: false, bird: false, reptile: false, carnivore: true, herbivore: false, fly: false, gills: true, insect: false }, { mammal: "A shark is a FISH — it breathes with gills!" }),
  C("🐟", "fish", { mammal: false, bird: false, eggs: true, fly: false, gills: true, insect: false }),
  C("🐠", "tropical fish", { mammal: false, bird: false, eggs: true, fly: false, gills: true, insect: false }),
  C("🐙", "octopus", { mammal: false, bird: false, eggs: true, carnivore: true, herbivore: false, fly: false, gills: true, insect: false }),
  C("🦀", "crab", { mammal: false, bird: false, eggs: true, fly: false, gills: true, insect: false }, { insect: "Count again — a crab has TEN legs, not six!" }),
  // reptiles & amphibians
  C("🐢", "turtle", { reptile: true, mammal: false, bird: false, eggs: true, fly: false, gills: false, insect: false }, { gills: "Sea turtles hold their breath and come up for air!" }),
  C("🐊", "crocodile", { reptile: true, mammal: false, bird: false, eggs: true, carnivore: true, herbivore: false, fly: false, gills: false, insect: false }, { gills: "Crocodiles breathe air — watch their nose peek out of the water!" }),
  C("🐍", "snake", { reptile: true, mammal: false, bird: false, carnivore: true, herbivore: false, fly: false, gills: false, insect: false }),
  C("🦎", "lizard", { reptile: true, mammal: false, bird: false, eggs: true, fly: false, gills: false, insect: false }),
  C("🐸", "frog", { reptile: false, mammal: false, bird: false, eggs: true, carnivore: true, herbivore: false, fly: false, insect: false }, { reptile: "A frog is an AMPHIBIAN — smooth wet skin, not scales!" }),
  // little ones
  C("🐝", "bee", { insect: true, mammal: false, bird: false, eggs: true, nocturnal: false, herbivore: true, carnivore: false, fly: true, gills: false }),
  C("🐜", "ant", { insect: true, mammal: false, bird: false, eggs: true, gills: false }),
  C("🦋", "butterfly", { insect: true, mammal: false, bird: false, eggs: true, nocturnal: false, herbivore: true, carnivore: false, fly: true, gills: false }, { nocturnal: "Butterflies love sunshine — MOTHS fly at night!" }),
  C("🐞", "ladybug", { insect: true, mammal: false, bird: false, eggs: true, fly: true, carnivore: true, herbivore: false, gills: false }, { herbivore: "Ladybugs are tiny hunters — they gobble up aphids!" }),
  C("🦗", "cricket", { insect: true, mammal: false, bird: false, eggs: true, nocturnal: true, gills: false }),
  C("🕷️", "spider", { insect: false, mammal: false, bird: false, eggs: true, carnivore: true, herbivore: false, fly: false, gills: false }, { insect: "Count the legs — EIGHT! Spiders are arachnids, not insects." }),
  C("🦂", "scorpion", { insect: false, mammal: false, bird: false, eggs: false, nocturnal: true, carnivore: true, herbivore: false, fly: false, gills: false }, { insect: "Eight legs — a scorpion is an arachnid, like a spider!", eggs: "Surprise! Scorpion babies are born alive and ride on mom's back!" }),
  C("🐌", "snail", { insect: false, mammal: false, bird: false, eggs: true, herbivore: true, carnivore: false, fly: false }, { insect: "A snail has NO legs at all — it glides on slime!" }),
  C("🪱", "worm", { insect: false, mammal: false, bird: false, fly: false, gills: false }, { insect: "A worm has no legs — insects always have six!" }),
];

export const TRAIT_ASK: Record<Trait, string> = {
  mammal: "Tap the MAMMALS — babies drink milk! 🍼",
  bird: "Tap the BIRDS — feathers and beaks! 🪶",
  reptile: "Tap the REPTILES — dry scaly skin! 🐉",
  eggs: "Tap everyone who HATCHES from an EGG! 🥚",
  nocturnal: "Tap the NIGHT animals — awake while you sleep! 🌙",
  herbivore: "Tap the PLANT-eaters! 🌿",
  carnivore: "Tap the MEAT-eaters! 🍖",
  fly: "Tap everyone who can FLY! 🪽",
  gills: "Tap who breathes UNDERWATER with gills! 🫧",
  insect: "Tap the INSECTS — exactly SIX legs! 🐜",
};

/** Generic wrong-tap teaching lines, used when no curated fact exists. */
const WRONG_TEMPLATE: Record<Trait, (name: string) => string> = {
  mammal: (n) => `Almost! The ${n} isn't a mammal — no milk for its babies.`,
  bird: (n) => `Almost! The ${n} has no feathers — not a bird.`,
  reptile: (n) => `Almost! The ${n} isn't a reptile — no dry scales.`,
  eggs: (n) => `Almost! ${cap(n)} babies are born alive — no egg!`,
  nocturnal: (n) => `Almost! The ${n} is awake in the DAYtime.`,
  herbivore: (n) => `Almost! The ${n} eats meat, not plants.`,
  carnivore: (n) => `Almost! The ${n} eats plants, not meat.`,
  fly: (n) => `Almost! The ${n} can't fly.`,
  gills: (n) => `Almost! The ${n} breathes AIR, not underwater.`,
  insect: (n) => `Almost! The ${n} isn't an insect — count six legs!`,
};
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function wrongTapFact(c: Critter, trait: Trait): string {
  return c.facts?.[trait] ?? WRONG_TEMPLATE[trait](c.name);
}

/** Environment palette per trait wave (fog, water, light, motes). */
export const TRAIT_PALETTE: Record<Trait, { fog: number; water: number; light: number; mote: number }> = {
  mammal: { fog: 0x1a1430, water: 0x3b2a6b, light: 0xffd9a0, mote: 0xffd27f },
  bird: { fog: 0x0e2138, water: 0x1f4d6e, light: 0xbfe3ff, mote: 0xa8d8ff },
  reptile: { fog: 0x14260f, water: 0x2c5a23, light: 0xc8ff9e, mote: 0x9fe87a },
  eggs: { fog: 0x2a2110, water: 0x6e5320, light: 0xffe9b8, mote: 0xffe18a },
  nocturnal: { fog: 0x0a0a26, water: 0x1d1d52, light: 0x8a8aff, mote: 0xb0b0ff },
  herbivore: { fog: 0x0f2616, water: 0x1f5c33, light: 0xb8ffd0, mote: 0x8affb0 },
  carnivore: { fog: 0x2a0f12, water: 0x6b1f28, light: 0xffb0a0, mote: 0xff9d8a },
  fly: { fog: 0x10243d, water: 0x265a8a, light: 0xcfe8ff, mote: 0xffffff },
  gills: { fog: 0x06222b, water: 0x0e5566, light: 0x9ff0ff, mote: 0x7fe8ff },
  insect: { fog: 0x1d2410, water: 0x4a5c1f, light: 0xeaff9e, mote: 0xd6ff7a },
};

export const TRAITS: Trait[] = Object.keys(TRAIT_ASK) as Trait[];

export interface WaveSlot {
  critter: Critter;
  isMatch: boolean;
  golden: boolean;
}

export interface Wave {
  trait: Trait;
  ask: string;
  golden: boolean;
  slots: WaveSlot[];
}

const withTrait = (trait: Trait, value: boolean) => CRITTERS.filter((c) => c.traits[trait] === value);

/**
 * Build a wave: 3-4 matchers + 3-4 decoys (shuffled). `recent` critters that
 * are defined on this trait get re-featured — the rule-flip teaching moment.
 */
export function buildWave(rng: RNG, trait: Trait, recent: Critter[], size = 7): Wave {
  const matchers = shuffle(rng, withTrait(trait, true));
  const decoys = shuffle(rng, withTrait(trait, false));
  const nMatch = Math.min(matchers.length, randInt(rng, 3, 4));
  const nDecoy = Math.min(decoys.length, size - nMatch);
  const lineup = [...matchers.slice(0, nMatch).map((c) => ({ critter: c, isMatch: true, golden: false })), ...decoys.slice(0, nDecoy).map((c) => ({ critter: c, isMatch: false, golden: false }))];
  // rule-flip: swap one slot for a recently-seen critter viewed through this new lens
  const flip = recent.find((c) => c.traits[trait] !== undefined && !lineup.some((s) => s.critter === c));
  if (flip) {
    const isMatch = Boolean(flip.traits[trait]);
    const at = lineup.findIndex((s) => s.isMatch === isMatch);
    if (at >= 0) lineup[at] = { critter: flip, isMatch, golden: false };
  }
  return { trait, ask: TRAIT_ASK[trait], golden: false, slots: shuffle(rng, lineup) };
}

/** Golden rush: every bubble matches — pure pop joy as a combo reward. */
export function buildGoldenWave(rng: RNG, trait: Trait): Wave {
  const matchers = shuffle(rng, withTrait(trait, true)).slice(0, 6);
  return {
    trait,
    ask: "✨ GOLDEN RUSH — pop them ALL! ✨",
    golden: true,
    slots: matchers.map((c) => ({ critter: c, isMatch: true, golden: true })),
  };
}

export function pickTrait(rng: RNG, lastTrait: Trait | null): Trait {
  const options = TRAITS.filter((t) => t !== lastTrait);
  return pick(rng, options);
}

/** Fresh same-trait replacements after a wrong tap (anti-elimination rule). */
export function reshuffleSlots(rng: RNG, trait: Trait, exclude: Critter[], count: number): WaveSlot[] {
  const pool = shuffle(
    rng,
    CRITTERS.filter((c) => c.traits[trait] !== undefined && !exclude.includes(c)),
  );
  return pool.slice(0, count).map((c) => ({ critter: c, isMatch: Boolean(c.traits[trait]), golden: false }));
}
