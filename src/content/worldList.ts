import numberforgeStages from "./numberforge/stages.json";
import melodyStages from "./melody/stages.json";
import logicStages from "./logic/stages.json";
import robotStages from "./robot/stages.json";
import timeStages from "./time/stages.json";
import cipherStages from "./cipher/stages.json";
import builderStages from "./builder/stages.json";
import livingStages from "./living/stages.json";
import atlasStages from "./atlas/stages.json";
import flagsStages from "./flags/stages.json";
import arabicStages from "./arabic/stages.json";
import craftStages from "./craft/stages.json";
import wordWizardStages from "./wordwizard/stages.json";
import bodyStages from "./body/stages.json";
import feelingsStages from "./feelings/stages.json";
import affixStages from "./affix/stages.json";
import grammarStages from "./grammar/stages.json";
import prepositionStages from "./prepositions/stages.json";
import directionStages from "./directions/stages.json";
import physicsStages from "./physics/stages.json";
import chemistryStages from "./chemistry/stages.json";
import algebraStages from "./algebra/stages.json";
import placeValueStages from "./placevalue/stages.json";
import moneyStages from "./money/stages.json";
import shapesStages from "./shapes/stages.json";
import measureStages from "./measure/stages.json";
import primesStages from "./primes/stages.json";
import binaryStages from "./binary/stages.json";
import fractionsStages from "./fractions/stages.json";
import elementsStages from "./elements/stages.json";
import spaceStages from "./space/stages.json";
import dinosStages from "./dinos/stages.json";
import weatherStages from "./weather/stages.json";
import phonicsStages from "./phonics/stages.json";
import idiomsStages from "./idioms/stages.json";
import { iconRef } from "./iconNames";
import type { StageDef } from "./types";

export interface WorldDef {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  stages: StageDef[];
  /** Milestone badge names at stages 10 / 20 / 30 (NF has extras below). */
  milestones: Array<{ stage: number; name: string; icon: string }>;
}

export const WORLDS: WorldDef[] = [
  {
    id: "numberforge", name: "Number Forge", icon: iconRef("anvil"), tagline: "Power the machines",
    stages: numberforgeStages as StageDef[],
    milestones: [
      { stage: 10, name: "Forge Apprentice", icon: iconRef("star") },
      { stage: 20, name: "Carry Master", icon: iconRef("medal") },
      { stage: 30, name: "Times Tamer", icon: iconRef("anvil") },
      { stage: 40, name: "Forge Engineer", icon: iconRef("flame") },
      { stage: 50, name: "Number Knight", icon: iconRef("crown") },
      { stage: 55, name: "Forge Master", icon: iconRef("trophy") },
    ],
  },
  {
    id: "melody", name: "Melody Engine", icon: iconRef("music"), tagline: "Make the engine sing",
    stages: melodyStages as StageDef[],
    milestones: [
      { stage: 10, name: "Echo Cadet", icon: iconRef("star") },
      { stage: 20, name: "Harmony Smith", icon: iconRef("medal") },
      { stage: 30, name: "Engine Maestro", icon: iconRef("music") },
      { stage: 40, name: "Phrase Weaver", icon: iconRef("flame") },
      { stage: 50, name: "Perfect Pitch", icon: iconRef("crown") },
      { stage: 55, name: "Grand Maestro", icon: iconRef("trophy") },
    ],
  },
  {
    id: "logic", name: "Logic Circuits", icon: iconRef("bolt"), tagline: "Wire it like redstone",
    stages: logicStages as StageDef[],
    milestones: [
      { stage: 10, name: "Switch Tamer", icon: iconRef("star") },
      { stage: 20, name: "Gate Wizard", icon: iconRef("medal") },
      { stage: 30, name: "Circuit Master", icon: iconRef("bolt") },
      { stage: 40, name: "Truth Hunter", icon: iconRef("flame") },
      { stage: 50, name: "Grand Designer", icon: iconRef("crown") },
      { stage: 55, name: "Architect of Light", icon: iconRef("trophy") },
    ],
  },
  {
    id: "robot", name: "Robot Valley", icon: iconRef("robot"), tagline: "Program the miner-bot",
    stages: robotStages as StageDef[],
    milestones: [
      { stage: 10, name: "Path Finder", icon: iconRef("star") },
      { stage: 20, name: "Tunnel Coder", icon: iconRef("medal") },
      { stage: 30, name: "Robot Whisperer", icon: iconRef("robot") },
      { stage: 40, name: "Deep Digger", icon: iconRef("flame") },
      { stage: 50, name: "Route Master", icon: iconRef("crown") },
      { stage: 55, name: "Legend of the Mines", icon: iconRef("trophy") },
    ],
  },
  {
    id: "time", name: "Time Keep", icon: iconRef("clock"), tagline: "Wind the great tower",
    stages: timeStages as StageDef[],
    milestones: [
      { stage: 10, name: "Clock Winder", icon: iconRef("star") },
      { stage: 20, name: "Minute Master", icon: iconRef("medal") },
      { stage: 30, name: "Keeper of Hours", icon: iconRef("clock") },
      { stage: 40, name: "Timetable Tamer", icon: iconRef("flame") },
      { stage: 50, name: "Master of Minutes", icon: iconRef("crown") },
      { stage: 55, name: "Lord of Time", icon: iconRef("trophy") },
    ],
  },
  {
    id: "cipher", name: "Cipher Bay", icon: iconRef("key"), tagline: "Crack the codes",
    stages: cipherStages as StageDef[],
    milestones: [
      { stage: 10, name: "Code Spotter", icon: iconRef("star") },
      { stage: 20, name: "Shift Breaker", icon: iconRef("medal") },
      { stage: 30, name: "Code Breaker", icon: iconRef("key") },
      { stage: 40, name: "Glyph Hunter", icon: iconRef("flame") },
      { stage: 50, name: "Grand Decryptor", icon: iconRef("crown") },
      { stage: 55, name: "Cipher Supreme", icon: iconRef("trophy") },
    ],
  },
  {
    id: "builder", name: "Builder's Reach", icon: iconRef("bricks"), tagline: "Balance, aim, FIRE!",
    stages: builderStages as StageDef[],
    milestones: [
      { stage: 10, name: "Lever Lord", icon: iconRef("star") },
      { stage: 20, name: "Cannon Captain", icon: iconRef("medal") },
      { stage: 30, name: "Master Engineer", icon: iconRef("bricks") },
      { stage: 40, name: "Pinpoint Gunner", icon: iconRef("flame") },
      { stage: 50, name: "Canyon King", icon: iconRef("crown") },
      { stage: 55, name: "Architect Supreme", icon: iconRef("trophy") },
    ],
  },
  {
    id: "living", name: "Living Planet", icon: iconRef("volcano"), tagline: "Explore wild nature",
    stages: livingStages as StageDef[],
    milestones: [
      { stage: 10, name: "Seed Scout", icon: iconRef("star") },
      { stage: 20, name: "Chain Keeper", icon: iconRef("medal") },
      { stage: 30, name: "Planet Guardian", icon: iconRef("volcano") },
      { stage: 40, name: "Web Weaver", icon: iconRef("flame") },
      { stage: 50, name: "Ecosystem Sage", icon: iconRef("crown") },
      { stage: 55, name: "Heart of the Planet", icon: iconRef("trophy") },
    ],
  },
  {
    id: "atlas", name: "Explorer's Atlas", icon: iconRef("planet"), tagline: "Map the universe",
    stages: atlasStages as StageDef[],
    milestones: [
      { stage: 10, name: "Star Mapper", icon: iconRef("star") },
      { stage: 20, name: "World Stitcher", icon: iconRef("medal") },
      { stage: 30, name: "Grand Explorer", icon: iconRef("planet") },
      { stage: 40, name: "Chronicle Keeper", icon: iconRef("flame") },
      { stage: 50, name: "Master Explorer", icon: iconRef("crown") },
      { stage: 55, name: "Eye of the World", icon: iconRef("trophy") },
    ],
  },
  {
    id: "flags", name: "World Flags", icon: iconRef("flag"), tagline: "Raise the colors",
    stages: flagsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Flag Finder", icon: iconRef("star") },
      { stage: 20, name: "Banner Expert", icon: iconRef("medal") },
      { stage: 30, name: "Flag Grandmaster", icon: iconRef("flag") },
      { stage: 40, name: "Eagle Eyes", icon: iconRef("flame") },
      { stage: 50, name: "Banner Legend", icon: iconRef("crown") },
      { stage: 55, name: "Keeper of Colors", icon: iconRef("trophy") },
    ],
  },
  {
    id: "arabic", name: "Letter Garden", icon: iconRef("mosque"), tagline: "اقرأ — read the letters!",
    stages: arabicStages as StageDef[],
    milestones: [
      { stage: 10, name: "Letter Scout", icon: iconRef("star") },
      { stage: 20, name: "Sound Finder", icon: iconRef("medal") },
      { stage: 30, name: "Word Builder", icon: iconRef("mosque") },
      { stage: 40, name: "Number Sage", icon: iconRef("flame") },
      { stage: 50, name: "Reading Star", icon: iconRef("crown") },
      { stage: 55, name: "Master of Letters", icon: iconRef("trophy") },
    ],
  },
  {
    id: "craft", name: "Craft Caverns", icon: iconRef("pickaxe"), tagline: "Mobs, tools & crafting!",
    stages: craftStages as StageDef[],
    milestones: [
      { stage: 10, name: "Mob Expert", icon: iconRef("star") },
      { stage: 20, name: "Master Crafter", icon: iconRef("medal") },
      { stage: 30, name: "Loot Hunter", icon: iconRef("pickaxe") },
      { stage: 40, name: "Biome Explorer", icon: iconRef("flame") },
      { stage: 50, name: "Diamond Hunter", icon: iconRef("crown") },
      { stage: 55, name: "Netherite Master", icon: iconRef("trophy") },
    ],
  },
  {
    id: "wordwizard", name: "Word Wizard", icon: iconRef("wizard"), tagline: "Rhyme, spell, unscramble!",
    stages: wordWizardStages as StageDef[],
    milestones: [
      { stage: 10, name: "Rhyme Finder", icon: iconRef("star") },
      { stage: 20, name: "Word Builder", icon: iconRef("medal") },
      { stage: 30, name: "Sound Sleuth", icon: iconRef("wizard") },
      { stage: 40, name: "Spelling Bee", icon: iconRef("flame") },
      { stage: 50, name: "Word Smith", icon: iconRef("crown") },
      { stage: 55, name: "Master of Words", icon: iconRef("trophy") },
    ],
  },
  {
    id: "body", name: "Body Explorer", icon: iconRef("heart"), tagline: "How your body works!",
    stages: bodyStages as StageDef[],
    milestones: [
      { stage: 10, name: "Sense Scout", icon: iconRef("star") },
      { stage: 20, name: "Organ Expert", icon: iconRef("medal") },
      { stage: 30, name: "Health Hero", icon: iconRef("heart") },
      { stage: 40, name: "Body Buff", icon: iconRef("flame") },
      { stage: 50, name: "Junior Doctor", icon: iconRef("crown") },
      { stage: 55, name: "Body Master", icon: iconRef("trophy") },
    ],
  },
  {
    id: "feelings", name: "Feelings Forest", icon: iconRef("smile"), tagline: "Name and tame feelings!",
    stages: feelingsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Face Reader", icon: iconRef("star") },
      { stage: 20, name: "Mood Finder", icon: iconRef("medal") },
      { stage: 30, name: "Calm Keeper", icon: iconRef("smile") },
      { stage: 40, name: "Kind Heart", icon: iconRef("flame") },
      { stage: 50, name: "Empathy Star", icon: iconRef("crown") },
      { stage: 55, name: "Master of Hearts", icon: iconRef("trophy") },
    ],
  },
  {
    id: "affix", name: "Word Builders", icon: iconRef("puzzle"), tagline: "Prefixes & suffixes!",
    stages: affixStages as StageDef[],
    milestones: [
      { stage: 10, name: "Prefix Finder", icon: iconRef("star") },
      { stage: 20, name: "Suffix Finder", icon: iconRef("medal") },
      { stage: 30, name: "Root Digger", icon: iconRef("puzzle") },
      { stage: 40, name: "Word Architect", icon: iconRef("flame") },
      { stage: 50, name: "Morphology Star", icon: iconRef("crown") },
      { stage: 55, name: "Master of Word Parts", icon: iconRef("trophy") },
    ],
  },
  {
    id: "grammar", name: "Grammar Galaxy", icon: iconRef("letters"), tagline: "Nouns, verbs & more!",
    stages: grammarStages as StageDef[],
    milestones: [
      { stage: 10, name: "Word Sorter", icon: iconRef("star") },
      { stage: 20, name: "Plural Pro", icon: iconRef("medal") },
      { stage: 30, name: "Time Traveler", icon: iconRef("letters") },
      { stage: 40, name: "Sentence Star", icon: iconRef("flame") },
      { stage: 50, name: "Grammar Guru", icon: iconRef("crown") },
      { stage: 55, name: "Master of Grammar", icon: iconRef("trophy") },
    ],
  },
  {
    id: "prepositions", name: "Preposition Park", icon: iconRef("slide"), tagline: "On, under, between!",
    stages: prepositionStages as StageDef[],
    milestones: [
      { stage: 10, name: "Spot Finder", icon: iconRef("star") },
      { stage: 20, name: "Sentence Scout", icon: iconRef("medal") },
      { stage: 30, name: "Opposite Expert", icon: iconRef("slide") },
      { stage: 40, name: "Position Pro", icon: iconRef("flame") },
      { stage: 50, name: "Park Ranger", icon: iconRef("crown") },
      { stage: 55, name: "Master of Places", icon: iconRef("trophy") },
    ],
  },
  {
    id: "directions", name: "Compass Cove", icon: iconRef("compass"), tagline: "Left, right, north, south!",
    stages: directionStages as StageDef[],
    milestones: [
      { stage: 10, name: "Left-Right Scout", icon: iconRef("star") },
      { stage: 20, name: "Grid Walker", icon: iconRef("medal") },
      { stage: 30, name: "Turn Master", icon: iconRef("compass") },
      { stage: 40, name: "Compass Reader", icon: iconRef("flame") },
      { stage: 50, name: "Wayfinder", icon: iconRef("crown") },
      { stage: 55, name: "Master Navigator", icon: iconRef("trophy") },
    ],
  },
  {
    id: "physics", name: "Tinker Lab", icon: iconRef("magnet"), tagline: "Push, pull, sink, float!",
    stages: physicsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Float Tester", icon: iconRef("star") },
      { stage: 20, name: "Magnet Hunter", icon: iconRef("medal") },
      { stage: 30, name: "Force Finder", icon: iconRef("magnet") },
      { stage: 40, name: "Gravity Guru", icon: iconRef("flame") },
      { stage: 50, name: "Shadow Sage", icon: iconRef("crown") },
      { stage: 55, name: "Master Tinkerer", icon: iconRef("trophy") },
    ],
  },
  {
    id: "chemistry", name: "Potion Lab", icon: iconRef("flask"), tagline: "Mix, melt, fizz!",
    stages: chemistryStages as StageDef[],
    milestones: [
      { stage: 10, name: "State Sorter", icon: iconRef("star") },
      { stage: 20, name: "Melt Master", icon: iconRef("medal") },
      { stage: 30, name: "Dissolve Detective", icon: iconRef("flask") },
      { stage: 40, name: "Material Expert", icon: iconRef("flame") },
      { stage: 50, name: "Fizz Wizard", icon: iconRef("crown") },
      { stage: 55, name: "Master Chemist", icon: iconRef("trophy") },
    ],
  },
  {
    id: "algebra", name: "Equation Station", icon: iconRef("scales"), tagline: "Find the hidden number!",
    stages: algebraStages as StageDef[],
    milestones: [
      { stage: 10, name: "Box Detective", icon: iconRef("star") },
      { stage: 20, name: "Fruit Coder", icon: iconRef("medal") },
      { stage: 30, name: "Pair Solver", icon: iconRef("scales") },
      { stage: 40, name: "Times Boxer", icon: iconRef("flame") },
      { stage: 50, name: "Balance Brain", icon: iconRef("crown") },
      { stage: 55, name: "Master of Equations", icon: iconRef("trophy") },
    ],
  },
  {
    id: "placevalue", name: "Tower of Tens", icon: iconRef("tower"), tagline: "Tens, hundreds & big numbers!",
    stages: placeValueStages as StageDef[],
    milestones: [
      { stage: 10, name: "Tower Builder", icon: iconRef("star") },
      { stage: 20, name: "Place Spotter", icon: iconRef("medal") },
      { stage: 30, name: "Skip Counter", icon: iconRef("tower") },
      { stage: 40, name: "Hundreds Climber", icon: iconRef("flame") },
      { stage: 50, name: "Number Sage", icon: iconRef("crown") },
      { stage: 55, name: "Place Value Master", icon: iconRef("trophy") },
    ],
  },
  {
    id: "money", name: "Coin Quest", icon: iconRef("coin"), tagline: "Count coins, make change!",
    stages: moneyStages as StageDef[],
    milestones: [
      { stage: 10, name: "Coin Counter", icon: iconRef("star") },
      { stage: 20, name: "Pocket Money", icon: iconRef("medal") },
      { stage: 30, name: "Coin Builder", icon: iconRef("coin") },
      { stage: 40, name: "Shopkeeper", icon: iconRef("flame") },
      { stage: 50, name: "Dollar Champ", icon: iconRef("crown") },
      { stage: 55, name: "Money Master", icon: iconRef("trophy") },
    ],
  },
  {
    id: "shapes", name: "Shape Studio", icon: iconRef("triangle"), tagline: "Shapes, solids & fractions!",
    stages: shapesStages as StageDef[],
    milestones: [
      { stage: 10, name: "Side Counter", icon: iconRef("star") },
      { stage: 20, name: "Shape Spotter", icon: iconRef("medal") },
      { stage: 30, name: "Fraction Finder", icon: iconRef("triangle") },
      { stage: 40, name: "Array Builder", icon: iconRef("flame") },
      { stage: 50, name: "Geometry Star", icon: iconRef("crown") },
      { stage: 55, name: "Shape Master", icon: iconRef("trophy") },
    ],
  },
  {
    id: "measure", name: "Measure Up", icon: iconRef("ruler"), tagline: "Longer, shorter, how far!",
    stages: measureStages as StageDef[],
    milestones: [
      { stage: 10, name: "Length Spotter", icon: iconRef("star") },
      { stage: 20, name: "Difference Finder", icon: iconRef("medal") },
      { stage: 30, name: "Unit Counter", icon: iconRef("ruler") },
      { stage: 40, name: "Ruler Reader", icon: iconRef("flame") },
      { stage: 50, name: "Estimate Expert", icon: iconRef("crown") },
      { stage: 55, name: "Measure Master", icon: iconRef("trophy") },
    ],
  },
  {
    id: "primes", name: "Prime Peaks", icon: iconRef("mountain"), tagline: "Tables, factors & primes!",
    stages: primesStages as StageDef[],
    milestones: [
      { stage: 10, name: "Times Climber", icon: iconRef("star") },
      { stage: 20, name: "Division Ace", icon: iconRef("medal") },
      { stage: 30, name: "Square Scaler", icon: iconRef("mountain") },
      { stage: 40, name: "Factor Hunter", icon: iconRef("flame") },
      { stage: 50, name: "Prime Seeker", icon: iconRef("crown") },
      { stage: 55, name: "Peak Grandmaster", icon: iconRef("trophy") },
    ],
  },
  {
    id: "binary", name: "Binary Beacon", icon: iconRef("lighthouse"), tagline: "Count like a computer!",
    stages: binaryStages as StageDef[],
    milestones: [
      { stage: 10, name: "Bit Reader", icon: iconRef("star") },
      { stage: 20, name: "Binary Writer", icon: iconRef("medal") },
      { stage: 30, name: "Bit Counter", icon: iconRef("lighthouse") },
      { stage: 40, name: "Binary Adder", icon: iconRef("flame") },
      { stage: 50, name: "Signal Master", icon: iconRef("crown") },
      { stage: 55, name: "Beacon Grandmaster", icon: iconRef("trophy") },
    ],
  },
  {
    id: "fractions", name: "Fraction Factory", icon: iconRef("pizza"), tagline: "Slices, parts & decimals!",
    stages: fractionsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Slice Reader", icon: iconRef("star") },
      { stage: 20, name: "Equal Twins", icon: iconRef("medal") },
      { stage: 30, name: "Adder of Parts", icon: iconRef("pizza") },
      { stage: 40, name: "Simplifier", icon: iconRef("flame") },
      { stage: 50, name: "Decimal Bridger", icon: iconRef("crown") },
      { stage: 55, name: "Fraction Master", icon: iconRef("trophy") },
    ],
  },
  {
    id: "elements", name: "Element Lab", icon: iconRef("atom"), tagline: "Atoms, gases & the table!",
    stages: elementsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Symbol Reader", icon: iconRef("star") },
      { stage: 20, name: "Molecule Maker", icon: iconRef("medal") },
      { stage: 30, name: "Atom Explorer", icon: iconRef("atom") },
      { stage: 40, name: "Lab Technician", icon: iconRef("flame") },
      { stage: 50, name: "Reaction Master", icon: iconRef("crown") },
      { stage: 55, name: "Master Chemist", icon: iconRef("trophy") },
    ],
  },
  {
    id: "space", name: "Space Voyage", icon: iconRef("rocket"), tagline: "Planets, stars & rockets!",
    stages: spaceStages as StageDef[],
    milestones: [
      { stage: 10, name: "Star Cadet", icon: iconRef("star") },
      { stage: 20, name: "Planet Spotter", icon: iconRef("medal") },
      { stage: 30, name: "Moon Walker", icon: iconRef("rocket") },
      { stage: 40, name: "Rocket Pilot", icon: iconRef("flame") },
      { stage: 50, name: "Galaxy Ranger", icon: iconRef("crown") },
      { stage: 55, name: "Master of the Stars", icon: iconRef("trophy") },
    ],
  },
  {
    id: "dinos", name: "Dino Dig", icon: iconRef("dino"), tagline: "Dinosaurs & fossils!",
    stages: dinosStages as StageDef[],
    milestones: [
      { stage: 10, name: "Bone Finder", icon: iconRef("star") },
      { stage: 20, name: "Fossil Hunter", icon: iconRef("medal") },
      { stage: 30, name: "Dino Spotter", icon: iconRef("dino") },
      { stage: 40, name: "Diet Detective", icon: iconRef("flame") },
      { stage: 50, name: "Paleontologist", icon: iconRef("crown") },
      { stage: 55, name: "Master of the Dinos", icon: iconRef("trophy") },
    ],
  },
  {
    id: "weather", name: "Weather Watch", icon: iconRef("weather"), tagline: "Sun, rain, snow & seasons!",
    stages: weatherStages as StageDef[],
    milestones: [
      { stage: 10, name: "Cloud Spotter", icon: iconRef("star") },
      { stage: 20, name: "Season Sage", icon: iconRef("medal") },
      { stage: 30, name: "Rain Reader", icon: iconRef("weather") },
      { stage: 40, name: "Storm Watcher", icon: iconRef("flame") },
      { stage: 50, name: "Cycle Keeper", icon: iconRef("crown") },
      { stage: 55, name: "Master of the Skies", icon: iconRef("trophy") },
    ],
  },
  {
    id: "phonics", name: "Sound It Out", icon: iconRef("sound"), tagline: "Letter sounds & spelling!",
    stages: phonicsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Sound Spotter", icon: iconRef("star") },
      { stage: 20, name: "Vowel Voyager", icon: iconRef("medal") },
      { stage: 30, name: "Digraph Detective", icon: iconRef("sound") },
      { stage: 40, name: "Word Blender", icon: iconRef("flame") },
      { stage: 50, name: "Syllable Star", icon: iconRef("crown") },
      { stage: 55, name: "Master of Sounds", icon: iconRef("trophy") },
    ],
  },
  {
    id: "idioms", name: "Idiom Island", icon: iconRef("chat"), tagline: "What sayings really mean!",
    stages: idiomsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Saying Spotter", icon: iconRef("star") },
      { stage: 20, name: "Meaning Finder", icon: iconRef("medal") },
      { stage: 30, name: "Figure of Speech", icon: iconRef("chat") },
      { stage: 40, name: "Saying Solver", icon: iconRef("flame") },
      { stage: 50, name: "Saying Sage", icon: iconRef("crown") },
      { stage: 55, name: "Master of Sayings", icon: iconRef("trophy") },
    ],
  },
];
