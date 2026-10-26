import capitalStages from "./capitals/stages.json";
import mapStages from "./countrymaps/stages.json";
import landDuelStages from "./landduel/stages.json";
import areaAtlasStages from "./areaatlas/stages.json";
import populationStages from "./population/stages.json";
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
  {
    id: "landduel", name: "Land League", icon: "⚖️", tagline: "See which countries cover more ground!",
    stages: landDuelStages as StageDef[],
    milestones: [
      { stage: 10, name: "Land Lookout", icon: "🔎" },
      { stage: 20, name: "Size Scout", icon: "📏" },
      { stage: 30, name: "Land Judge", icon: "⚖️" },
      { stage: 40, name: "Podium Pilot", icon: "🥇" },
      { stage: 50, name: "Size Champion", icon: "🌍" },
      { stage: 55, name: "Master of Land", icon: "🏆" },
    ],
  },
  {
    id: "areaatlas", name: "Area Atlas", icon: "📐", tagline: "Measure the land inside each country!",
    stages: areaAtlasStages as StageDef[],
    milestones: [
      { stage: 10, name: "Area Reader", icon: "📐" },
      { stage: 20, name: "Measure Maker", icon: "📏" },
      { stage: 30, name: "Double Discoverer", icon: "✌️" },
      { stage: 40, name: "Scale Solver", icon: "🔢" },
      { stage: 50, name: "Area Expert", icon: "🗺️" },
      { stage: 55, name: "Master of Area", icon: "🏆" },
    ],
  },
  {
    id: "population", name: "People Planet", icon: "👥", tagline: "Explore how many people live in each country!",
    stages: populationStages as StageDef[],
    milestones: [
      { stage: 10, name: "People Counter", icon: "👥" },
      { stage: 20, name: "Crowd Scout", icon: "🔎" },
      { stage: 30, name: "Population Pilot", icon: "🌎" },
      { stage: 40, name: "Crowd Compass", icon: "🧭" },
      { stage: 50, name: "People Expert", icon: "✨" },
      { stage: 55, name: "Master of People", icon: "🏆" },
    ],
  },
];
