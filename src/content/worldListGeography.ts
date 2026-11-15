import capitalStages from "./capitals/stages.json";
import mapStages from "./countrymaps/stages.json";
import landDuelStages from "./landduel/stages.json";
import areaAtlasStages from "./areaatlas/stages.json";
import populationStages from "./population/stages.json";
import { iconRef } from "./iconNames";
import type { StageDef } from "./types";
import type { WorldDef } from "./worldList";

export const GEOGRAPHY_WORLDS: WorldDef[] = [
  {
    id: "capitals", name: "Capital Quest", icon: iconRef("pin"), tagline: "Find the cities that lead nations!",
    stages: capitalStages as StageDef[],
    milestones: [
      { stage: 10, name: "City Scout", icon: iconRef("star") },
      { stage: 20, name: "Capital Finder", icon: iconRef("medal") },
      { stage: 30, name: "Globe Hopper", icon: iconRef("pin") },
      { stage: 40, name: "City Navigator", icon: iconRef("flame") },
      { stage: 50, name: "Capital Cartographer", icon: iconRef("crown") },
      { stage: 55, name: "Master of Capitals", icon: iconRef("trophy") },
    ],
  },
  {
    id: "countrymaps", name: "Map Detectives", icon: iconRef("lens"), tagline: "Spot countries by shape and place!",
    stages: mapStages as StageDef[],
    milestones: [
      { stage: 10, name: "Shape Spotter", icon: iconRef("star") },
      { stage: 20, name: "Land Explorer", icon: iconRef("medal") },
      { stage: 30, name: "World Locator", icon: iconRef("lens") },
      { stage: 40, name: "Outline Expert", icon: iconRef("flame") },
      { stage: 50, name: "Map Detective", icon: iconRef("crown") },
      { stage: 55, name: "Master of Maps", icon: iconRef("trophy") },
    ],
  },
  {
    id: "landduel", name: "Land League", icon: iconRef("scales"), tagline: "See which countries cover more ground!",
    stages: landDuelStages as StageDef[],
    milestones: [
      { stage: 10, name: "Land Lookout", icon: iconRef("star") },
      { stage: 20, name: "Size Scout", icon: iconRef("medal") },
      { stage: 30, name: "Land Judge", icon: iconRef("scales") },
      { stage: 40, name: "Podium Pilot", icon: iconRef("flame") },
      { stage: 50, name: "Size Champion", icon: iconRef("crown") },
      { stage: 55, name: "Master of Land", icon: iconRef("trophy") },
    ],
  },
  {
    id: "areaatlas", name: "Area Atlas", icon: iconRef("set-square"), tagline: "Measure the land inside each country!",
    stages: areaAtlasStages as StageDef[],
    milestones: [
      { stage: 10, name: "Area Reader", icon: iconRef("star") },
      { stage: 20, name: "Measure Maker", icon: iconRef("medal") },
      { stage: 30, name: "Double Discoverer", icon: iconRef("set-square") },
      { stage: 40, name: "Scale Solver", icon: iconRef("flame") },
      { stage: 50, name: "Area Expert", icon: iconRef("crown") },
      { stage: 55, name: "Master of Area", icon: iconRef("trophy") },
    ],
  },
  {
    id: "population", name: "People Planet", icon: iconRef("crowd"), tagline: "Explore how many people live in each country!",
    stages: populationStages as StageDef[],
    milestones: [
      { stage: 10, name: "People Counter", icon: iconRef("star") },
      { stage: 20, name: "Crowd Scout", icon: iconRef("medal") },
      { stage: 30, name: "Population Pilot", icon: iconRef("crowd") },
      { stage: 40, name: "Crowd Compass", icon: iconRef("flame") },
      { stage: 50, name: "People Expert", icon: iconRef("crown") },
      { stage: 55, name: "Master of People", icon: iconRef("trophy") },
    ],
  },
];
