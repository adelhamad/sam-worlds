import capitalStages from "./capitals/stages.json";
import mapStages from "./countrymaps/stages.json";
import type { StageDef } from "./types";
import type { WorldDef } from "./worldList";

export const GEOGRAPHY_WORLDS: WorldDef[] = [
  {
    id: "capitals", name: "Capital Quest", icon: "📍", tagline: "Find the cities that lead nations!",
    stages: capitalStages as StageDef[],
    milestones: [
      { stage: 10, name: "City Scout", icon: "🧭" },
      { stage: 20, name: "Capital Finder", icon: "📍" },
      { stage: 30, name: "Globe Hopper", icon: "🌍" },
      { stage: 40, name: "City Navigator", icon: "🗺️" },
      { stage: 50, name: "Capital Cartographer", icon: "✨" },
      { stage: 55, name: "Master of Capitals", icon: "🏆" },
    ],
  },
  {
    id: "countrymaps", name: "Map Detectives", icon: "🗺️", tagline: "Spot countries by shape and place!",
    stages: mapStages as StageDef[],
    milestones: [
      { stage: 10, name: "Shape Spotter", icon: "🔎" },
      { stage: 20, name: "Land Explorer", icon: "🧭" },
      { stage: 30, name: "World Locator", icon: "🌍" },
      { stage: 40, name: "Outline Expert", icon: "🗺️" },
      { stage: 50, name: "Map Detective", icon: "✨" },
      { stage: 55, name: "Master of Maps", icon: "🏆" },
    ],
  },
];
