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
    id: "numberforge", name: "Number Forge", icon: "🔥", tagline: "Power the machines",
    stages: numberforgeStages as StageDef[],
    milestones: [
      { stage: 10, name: "Forge Apprentice", icon: "🔥" },
      { stage: 20, name: "Carry Master", icon: "⚒️" },
      { stage: 30, name: "Times Tamer", icon: "✖️" },
      { stage: 40, name: "Forge Engineer", icon: "⚙️" },
      { stage: 50, name: "Number Knight", icon: "🛡️" },
      { stage: 55, name: "Forge Master", icon: "🏆" },
    ],
  },
  {
    id: "melody", name: "Melody Engine", icon: "🎹", tagline: "Make the engine sing",
    stages: melodyStages as StageDef[],
    milestones: [
      { stage: 10, name: "Echo Cadet", icon: "🎧" },
      { stage: 20, name: "Harmony Smith", icon: "🎼" },
      { stage: 30, name: "Engine Maestro", icon: "🎹" },
      { stage: 40, name: "Phrase Weaver", icon: "🎵" },
      { stage: 50, name: "Perfect Pitch", icon: "👂" },
      { stage: 55, name: "Grand Maestro", icon: "🏆" },
    ],
  },
  {
    id: "logic", name: "Logic Circuits", icon: "💡", tagline: "Wire it like redstone",
    stages: logicStages as StageDef[],
    milestones: [
      { stage: 10, name: "Switch Tamer", icon: "🔌" },
      { stage: 20, name: "Gate Wizard", icon: "💡" },
      { stage: 30, name: "Circuit Master", icon: "⚡" },
      { stage: 40, name: "Truth Hunter", icon: "🔦" },
      { stage: 50, name: "Grand Designer", icon: "🏛️" },
      { stage: 55, name: "Architect of Light", icon: "🏆" },
    ],
  },
  {
    id: "robot", name: "Robot Valley", icon: "🤖", tagline: "Program the miner-bot",
    stages: robotStages as StageDef[],
    milestones: [
      { stage: 10, name: "Path Finder", icon: "🧭" },
      { stage: 20, name: "Tunnel Coder", icon: "⛏️" },
      { stage: 30, name: "Robot Whisperer", icon: "🤖" },
      { stage: 40, name: "Deep Digger", icon: "💎" },
      { stage: 50, name: "Route Master", icon: "🗺️" },
      { stage: 55, name: "Legend of the Mines", icon: "🏆" },
    ],
  },
  {
    id: "time", name: "Time Keep", icon: "🕰️", tagline: "Wind the great tower",
    stages: timeStages as StageDef[],
    milestones: [
      { stage: 10, name: "Clock Winder", icon: "🕰️" },
      { stage: 20, name: "Minute Master", icon: "⏱️" },
      { stage: 30, name: "Keeper of Hours", icon: "⏳" },
      { stage: 40, name: "Timetable Tamer", icon: "🚂" },
      { stage: 50, name: "Master of Minutes", icon: "⏰" },
      { stage: 55, name: "Lord of Time", icon: "🏆" },
    ],
  },
  {
    id: "cipher", name: "Cipher Bay", icon: "🔐", tagline: "Crack the codes",
    stages: cipherStages as StageDef[],
    milestones: [
      { stage: 10, name: "Code Spotter", icon: "🔍" },
      { stage: 20, name: "Shift Breaker", icon: "🗝️" },
      { stage: 30, name: "Code Breaker", icon: "🔐" },
      { stage: 40, name: "Glyph Hunter", icon: "🔣" },
      { stage: 50, name: "Grand Decryptor", icon: "🧩" },
      { stage: 55, name: "Cipher Supreme", icon: "🏆" },
    ],
  },
  {
    id: "builder", name: "Builder's Reach", icon: "🏗️", tagline: "Balance, aim, FIRE!",
    stages: builderStages as StageDef[],
    milestones: [
      { stage: 10, name: "Lever Lord", icon: "⚖️" },
      { stage: 20, name: "Cannon Captain", icon: "🧨" },
      { stage: 30, name: "Master Engineer", icon: "🏗️" },
      { stage: 40, name: "Pinpoint Gunner", icon: "🎯" },
      { stage: 50, name: "Canyon King", icon: "🏔️" },
      { stage: 55, name: "Architect Supreme", icon: "🏆" },
    ],
  },
  {
    id: "living", name: "Living Planet", icon: "🌋", tagline: "Explore wild nature",
    stages: livingStages as StageDef[],
    milestones: [
      { stage: 10, name: "Seed Scout", icon: "🌱" },
      { stage: 20, name: "Chain Keeper", icon: "🦊" },
      { stage: 30, name: "Planet Guardian", icon: "🌍" },
      { stage: 40, name: "Web Weaver", icon: "🕸️" },
      { stage: 50, name: "Ecosystem Sage", icon: "🌿" },
      { stage: 55, name: "Heart of the Planet", icon: "🏆" },
    ],
  },
  {
    id: "atlas", name: "Explorer's Atlas", icon: "🪐", tagline: "Map the universe",
    stages: atlasStages as StageDef[],
    milestones: [
      { stage: 10, name: "Star Mapper", icon: "🌟" },
      { stage: 20, name: "World Stitcher", icon: "🗺️" },
      { stage: 30, name: "Grand Explorer", icon: "🪐" },
      { stage: 40, name: "Chronicle Keeper", icon: "📜" },
      { stage: 50, name: "Master Explorer", icon: "🧭" },
      { stage: 55, name: "Eye of the World", icon: "🏆" },
    ],
  },
  {
    id: "flags", name: "World Flags", icon: "🚩", tagline: "Raise the colors",
    stages: flagsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Flag Finder", icon: "🚩" },
      { stage: 20, name: "Banner Expert", icon: "🎌" },
      { stage: 30, name: "Flag Grandmaster", icon: "🏁" },
      { stage: 40, name: "Eagle Eyes", icon: "🦅" },
      { stage: 50, name: "Banner Legend", icon: "🎖️" },
      { stage: 55, name: "Keeper of Colors", icon: "🏆" },
    ],
  },
  {
    id: "arabic", name: "Letter Garden", icon: "🕌", tagline: "اقرأ — read the letters!",
    stages: arabicStages as StageDef[],
    milestones: [
      { stage: 10, name: "Letter Scout", icon: "🔤" },
      { stage: 20, name: "Sound Finder", icon: "👂" },
      { stage: 30, name: "Word Builder", icon: "🧱" },
      { stage: 40, name: "Number Sage", icon: "🔢" },
      { stage: 50, name: "Reading Star", icon: "📖" },
      { stage: 55, name: "Master of Letters", icon: "🏆" },
    ],
  },
  {
    id: "craft", name: "Craft Caverns", icon: "⛏️", tagline: "Mobs, tools & crafting!",
    stages: craftStages as StageDef[],
    milestones: [
      { stage: 10, name: "Mob Expert", icon: "🟩" },
      { stage: 20, name: "Master Crafter", icon: "🛠️" },
      { stage: 30, name: "Loot Hunter", icon: "🎁" },
      { stage: 40, name: "Biome Explorer", icon: "🌋" },
      { stage: 50, name: "Diamond Hunter", icon: "💎" },
      { stage: 55, name: "Netherite Master", icon: "🏆" },
    ],
  },
  {
    id: "wordwizard", name: "Word Wizard", icon: "🔤", tagline: "Rhyme, spell, unscramble!",
    stages: wordWizardStages as StageDef[],
    milestones: [
      { stage: 10, name: "Rhyme Finder", icon: "🎵" },
      { stage: 20, name: "Word Builder", icon: "🔡" },
      { stage: 30, name: "Sound Sleuth", icon: "🔍" },
      { stage: 40, name: "Spelling Bee", icon: "🐝" },
      { stage: 50, name: "Word Smith", icon: "📚" },
      { stage: 55, name: "Master of Words", icon: "🏆" },
    ],
  },
  {
    id: "body", name: "Body Explorer", icon: "🫀", tagline: "How your body works!",
    stages: bodyStages as StageDef[],
    milestones: [
      { stage: 10, name: "Sense Scout", icon: "👀" },
      { stage: 20, name: "Organ Expert", icon: "🫁" },
      { stage: 30, name: "Health Hero", icon: "🥦" },
      { stage: 40, name: "Body Buff", icon: "💪" },
      { stage: 50, name: "Junior Doctor", icon: "🩺" },
      { stage: 55, name: "Body Master", icon: "🏆" },
    ],
  },
  {
    id: "feelings", name: "Feelings Forest", icon: "🎭", tagline: "Name and tame feelings!",
    stages: feelingsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Face Reader", icon: "😊" },
      { stage: 20, name: "Mood Finder", icon: "🌈" },
      { stage: 30, name: "Calm Keeper", icon: "🌬️" },
      { stage: 40, name: "Kind Heart", icon: "💛" },
      { stage: 50, name: "Empathy Star", icon: "🤝" },
      { stage: 55, name: "Master of Hearts", icon: "🏆" },
    ],
  },
  {
    id: "affix", name: "Word Builders", icon: "🧩", tagline: "Prefixes & suffixes!",
    stages: affixStages as StageDef[],
    milestones: [
      { stage: 10, name: "Prefix Finder", icon: "🔼" },
      { stage: 20, name: "Suffix Finder", icon: "🔽" },
      { stage: 30, name: "Root Digger", icon: "🌱" },
      { stage: 40, name: "Word Architect", icon: "🏗️" },
      { stage: 50, name: "Morphology Star", icon: "✨" },
      { stage: 55, name: "Master of Word Parts", icon: "🏆" },
    ],
  },
  {
    id: "grammar", name: "Grammar Galaxy", icon: "📝", tagline: "Nouns, verbs & more!",
    stages: grammarStages as StageDef[],
    milestones: [
      { stage: 10, name: "Word Sorter", icon: "🗂️" },
      { stage: 20, name: "Plural Pro", icon: "👥" },
      { stage: 30, name: "Time Traveler", icon: "⏳" },
      { stage: 40, name: "Sentence Star", icon: "⭐" },
      { stage: 50, name: "Grammar Guru", icon: "📖" },
      { stage: 55, name: "Master of Grammar", icon: "🏆" },
    ],
  },
  {
    id: "prepositions", name: "Preposition Park", icon: "🛝", tagline: "On, under, between!",
    stages: prepositionStages as StageDef[],
    milestones: [
      { stage: 10, name: "Spot Finder", icon: "📍" },
      { stage: 20, name: "Sentence Scout", icon: "🔎" },
      { stage: 30, name: "Opposite Expert", icon: "🔃" },
      { stage: 40, name: "Position Pro", icon: "🎯" },
      { stage: 50, name: "Park Ranger", icon: "🌳" },
      { stage: 55, name: "Master of Places", icon: "🏆" },
    ],
  },
  {
    id: "directions", name: "Compass Cove", icon: "🧭", tagline: "Left, right, north, south!",
    stages: directionStages as StageDef[],
    milestones: [
      { stage: 10, name: "Left-Right Scout", icon: "↔️" },
      { stage: 20, name: "Grid Walker", icon: "🗺️" },
      { stage: 30, name: "Turn Master", icon: "🔄" },
      { stage: 40, name: "Compass Reader", icon: "🧭" },
      { stage: 50, name: "Wayfinder", icon: "⭐" },
      { stage: 55, name: "Master Navigator", icon: "🏆" },
    ],
  },
  {
    id: "physics", name: "Tinker Lab", icon: "🧲", tagline: "Push, pull, sink, float!",
    stages: physicsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Float Tester", icon: "🛟" },
      { stage: 20, name: "Magnet Hunter", icon: "🧲" },
      { stage: 30, name: "Force Finder", icon: "🫸" },
      { stage: 40, name: "Gravity Guru", icon: "🌍" },
      { stage: 50, name: "Shadow Sage", icon: "🔦" },
      { stage: 55, name: "Master Tinkerer", icon: "🏆" },
    ],
  },
  {
    id: "chemistry", name: "Potion Lab", icon: "🧪", tagline: "Mix, melt, fizz!",
    stages: chemistryStages as StageDef[],
    milestones: [
      { stage: 10, name: "State Sorter", icon: "🧊" },
      { stage: 20, name: "Melt Master", icon: "🫠" },
      { stage: 30, name: "Dissolve Detective", icon: "✨" },
      { stage: 40, name: "Material Expert", icon: "🪟" },
      { stage: 50, name: "Fizz Wizard", icon: "🫧" },
      { stage: 55, name: "Master Chemist", icon: "🏆" },
    ],
  },
  {
    id: "algebra", name: "Equation Station", icon: "⚖️", tagline: "Find the hidden number!",
    stages: algebraStages as StageDef[],
    milestones: [
      { stage: 10, name: "Box Detective", icon: "📦" },
      { stage: 20, name: "Fruit Coder", icon: "🍎" },
      { stage: 30, name: "Pair Solver", icon: "🍌" },
      { stage: 40, name: "Times Boxer", icon: "✖️" },
      { stage: 50, name: "Balance Brain", icon: "⚖️" },
      { stage: 55, name: "Master of Equations", icon: "🏆" },
    ],
  },
  {
    id: "placevalue", name: "Tower of Tens", icon: "🗼", tagline: "Tens, hundreds & big numbers!",
    stages: placeValueStages as StageDef[],
    milestones: [
      { stage: 10, name: "Tower Builder", icon: "🧱" },
      { stage: 20, name: "Place Spotter", icon: "🔢" },
      { stage: 30, name: "Skip Counter", icon: "🦘" },
      { stage: 40, name: "Hundreds Climber", icon: "🗼" },
      { stage: 50, name: "Number Sage", icon: "🧠" },
      { stage: 55, name: "Place Value Master", icon: "🏆" },
    ],
  },
];

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  stageId: string;
}

export const BADGES: BadgeDef[] = WORLDS.flatMap((w) =>
  w.milestones.map((m) => ({
    // keep the original NF badge ids stable for existing saves
    id: w.id === "numberforge" ? m.name.toLowerCase().replace(/ /g, "-") : `${w.id}-${m.stage}`,
    name: m.name,
    icon: m.icon,
    stageId: w.stages[m.stage - 1]?.id ?? "",
  })),
);

const stageMap = new Map<string, { stage: StageDef; world: WorldDef; index: number }>();
for (const w of WORLDS) {
  w.stages.forEach((stage, index) => stageMap.set(stage.id, { stage, world: w, index }));
}

export function stageById(id: string): StageDef | undefined {
  return stageMap.get(id)?.stage;
}

export function worldOfStage(id: string): WorldDef | undefined {
  return stageMap.get(id)?.world;
}

export function stageIndexInWorld(id: string): number {
  return stageMap.get(id)?.index ?? -1;
}

export function worldById(id: string): WorldDef | undefined {
  return WORLDS.find((w) => w.id === id);
}

export function completedInWorld(world: WorldDef, progress: Record<string, { completed: boolean }>): number {
  return world.stages.filter((s) => progress[s.id]?.completed).length;
}

/** The world the Mission Board points at: first ENABLED one with stages left. */
export function focusWorldIn(worlds: WorldDef[], progress: Record<string, { completed: boolean }>): WorldDef | undefined {
  return worlds.find((w) => completedInWorld(w, progress) < w.stages.length) ?? worlds[0];
}

export function nextStageIn(world: WorldDef, progress: Record<string, { completed: boolean }>): StageDef {
  return world.stages.find((s) => !progress[s.id]?.completed) ?? world.stages[world.stages.length - 1];
}
