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

/** The world the Mission Board points at: first one with stages left. */
export function focusWorld(progress: Record<string, { completed: boolean }>): WorldDef {
  return WORLDS.find((w) => completedInWorld(w, progress) < w.stages.length) ?? WORLDS[0];
}

export function nextStageIn(world: WorldDef, progress: Record<string, { completed: boolean }>): StageDef {
  return world.stages.find((s) => !progress[s.id]?.completed) ?? world.stages[world.stages.length - 1];
}
