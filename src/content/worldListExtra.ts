// Additional "explore" worlds, kept here so worldList.ts stays under the
// 500-line cap. Merged into WORLDS by worlds.ts.
import mannersStages from "./manners/stages.json";
import safetyStages from "./safety/stages.json";
import helpersStages from "./helpers/stages.json";
import animalsStages from "./animals/stages.json";
import greenStages from "./green/stages.json";
import calendarStages from "./calendar/stages.json";
import oceanStages from "./ocean/stages.json";
import gardenStages from "./garden/stages.json";
import nutritionStages from "./nutrition/stages.json";
import colorsStages from "./colors/stages.json";
import culturesStages from "./cultures/stages.json";
import transportStages from "./transport/stages.json";
import moneySmartsStages from "./moneysmarts/stages.json";
import bugsStages from "./bugs/stages.json";
import machinesStages from "./machines/stages.json";
import patternsStages from "./patterns/stages.json";
import { iconRef } from "./iconNames";
import type { StageDef } from "./types";
import type { WorldDef } from "./worldList";

export const EXTRA_WORLDS: WorldDef[] = [
  {
    id: "manners", name: "Manners Manor", icon: iconRef("tophat"), tagline: "Magic words & being kind!",
    stages: mannersStages as StageDef[],
    milestones: [
      { stage: 10, name: "Kind Kid", icon: iconRef("star") },
      { stage: 20, name: "Polite Pal", icon: iconRef("medal") },
      { stage: 30, name: "Magic Words", icon: iconRef("tophat") },
      { stage: 40, name: "Helper Heart", icon: iconRef("flame") },
      { stage: 50, name: "Good Friend", icon: iconRef("crown") },
      { stage: 55, name: "Master of Manners", icon: iconRef("trophy") },
    ],
  },
  {
    id: "safety", name: "Safety Squad", icon: iconRef("traffic-light"), tagline: "Stay safe and smart!",
    stages: safetyStages as StageDef[],
    milestones: [
      { stage: 10, name: "Road Ready", icon: iconRef("star") },
      { stage: 20, name: "Safe Scout", icon: iconRef("medal") },
      { stage: 30, name: "Stranger Smart", icon: iconRef("traffic-light") },
      { stage: 40, name: "Emergency Expert", icon: iconRef("flame") },
      { stage: 50, name: "Safety Captain", icon: iconRef("crown") },
      { stage: 55, name: "Master of Safety", icon: iconRef("trophy") },
    ],
  },
  {
    id: "helpers", name: "Helpers Town", icon: iconRef("firetruck"), tagline: "People who help us!",
    stages: helpersStages as StageDef[],
    milestones: [
      { stage: 10, name: "Town Friend", icon: iconRef("star") },
      { stage: 20, name: "Job Spotter", icon: iconRef("medal") },
      { stage: 30, name: "Tool Time", icon: iconRef("firetruck") },
      { stage: 40, name: "Helper Expert", icon: iconRef("flame") },
      { stage: 50, name: "Community Star", icon: iconRef("crown") },
      { stage: 55, name: "Master of Helpers", icon: iconRef("trophy") },
    ],
  },
  {
    id: "animals", name: "Animal Kingdom", icon: iconRef("lion"), tagline: "Groups, babies & homes!",
    stages: animalsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Critter Cadet", icon: iconRef("star") },
      { stage: 20, name: "Baby Namer", icon: iconRef("medal") },
      { stage: 30, name: "Home Finder", icon: iconRef("lion") },
      { stage: 40, name: "Group Guru", icon: iconRef("flame") },
      { stage: 50, name: "Wildlife Whiz", icon: iconRef("crown") },
      { stage: 55, name: "Master of Animals", icon: iconRef("trophy") },
    ],
  },
  {
    id: "green", name: "Green Planet", icon: iconRef("recycle"), tagline: "Care for the Earth!",
    stages: greenStages as StageDef[],
    milestones: [
      { stage: 10, name: "Recycle Rookie", icon: iconRef("star") },
      { stage: 20, name: "Bin Sorter", icon: iconRef("medal") },
      { stage: 30, name: "Water Saver", icon: iconRef("recycle") },
      { stage: 40, name: "Earth Friend", icon: iconRef("flame") },
      { stage: 50, name: "Eco Hero", icon: iconRef("crown") },
      { stage: 55, name: "Master of the Earth", icon: iconRef("trophy") },
    ],
  },
  {
    id: "calendar", name: "Calendar Quest", icon: iconRef("calendar"), tagline: "Days, months & time!",
    stages: calendarStages as StageDef[],
    milestones: [
      { stage: 10, name: "Day Counter", icon: iconRef("star") },
      { stage: 20, name: "Week Walker", icon: iconRef("medal") },
      { stage: 30, name: "Month Master", icon: iconRef("calendar") },
      { stage: 40, name: "Order Keeper", icon: iconRef("flame") },
      { stage: 50, name: "Time Tracker", icon: iconRef("crown") },
      { stage: 55, name: "Master of Time", icon: iconRef("trophy") },
    ],
  },
  {
    id: "ocean", name: "Ocean Deep", icon: iconRef("fish"), tagline: "Sea creatures & ocean facts!",
    stages: oceanStages as StageDef[],
    milestones: [
      { stage: 10, name: "Rock Pooler", icon: iconRef("star") },
      { stage: 20, name: "Reef Explorer", icon: iconRef("medal") },
      { stage: 30, name: "Deep Diver", icon: iconRef("fish") },
      { stage: 40, name: "Whale Watcher", icon: iconRef("flame") },
      { stage: 50, name: "Sea Sage", icon: iconRef("crown") },
      { stage: 55, name: "Master of the Sea", icon: iconRef("trophy") },
    ],
  },
  {
    id: "garden", name: "Garden Grow", icon: iconRef("flower"), tagline: "Plants, seeds & how they grow!",
    stages: gardenStages as StageDef[],
    milestones: [
      { stage: 10, name: "Seed Sower", icon: iconRef("star") },
      { stage: 20, name: "Sprout Scout", icon: iconRef("medal") },
      { stage: 30, name: "Leaf Learner", icon: iconRef("flower") },
      { stage: 40, name: "Flower Friend", icon: iconRef("flame") },
      { stage: 50, name: "Green Grower", icon: iconRef("crown") },
      { stage: 55, name: "Master Gardener", icon: iconRef("trophy") },
    ],
  },
  {
    id: "nutrition", name: "Healthy Plate", icon: iconRef("apple"), tagline: "Food groups & healthy eating!",
    stages: nutritionStages as StageDef[],
    milestones: [
      { stage: 10, name: "Snack Sorter", icon: iconRef("star") },
      { stage: 20, name: "Food Group Pro", icon: iconRef("medal") },
      { stage: 30, name: "Farm to Plate", icon: iconRef("apple") },
      { stage: 40, name: "Vitamin Hero", icon: iconRef("flame") },
      { stage: 50, name: "Balanced Eater", icon: iconRef("crown") },
      { stage: 55, name: "Master of Meals", icon: iconRef("trophy") },
    ],
  },
  {
    id: "colors", name: "Color Lab", icon: iconRef("palette"), tagline: "Mix colors & paint the world!",
    stages: colorsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Color Spotter", icon: iconRef("star") },
      { stage: 20, name: "Mix Master", icon: iconRef("medal") },
      { stage: 30, name: "Rainbow Maker", icon: iconRef("palette") },
      { stage: 40, name: "Warm & Cool", icon: iconRef("flame") },
      { stage: 50, name: "Paint Pro", icon: iconRef("crown") },
      { stage: 55, name: "Master of Colors", icon: iconRef("trophy") },
    ],
  },
  {
    id: "cultures", name: "Around the World", icon: iconRef("globe"), tagline: "Greetings, places & continents!",
    stages: culturesStages as StageDef[],
    milestones: [
      { stage: 10, name: "World Greeter", icon: iconRef("star") },
      { stage: 20, name: "Landmark Spotter", icon: iconRef("medal") },
      { stage: 30, name: "Globe Trotter", icon: iconRef("globe") },
      { stage: 40, name: "Continent Champ", icon: iconRef("flame") },
      { stage: 50, name: "World Wanderer", icon: iconRef("crown") },
      { stage: 55, name: "Master Explorer", icon: iconRef("trophy") },
    ],
  },
  {
    id: "transport", name: "On the Move", icon: iconRef("bus"), tagline: "Land, air & water travel!",
    stages: transportStages as StageDef[],
    milestones: [
      { stage: 10, name: "Road Rider", icon: iconRef("star") },
      { stage: 20, name: "Sky Flyer", icon: iconRef("medal") },
      { stage: 30, name: "Water Sailor", icon: iconRef("bus") },
      { stage: 40, name: "Vehicle Picker", icon: iconRef("flame") },
      { stage: 50, name: "Travel Whiz", icon: iconRef("crown") },
      { stage: 55, name: "Master of Travel", icon: iconRef("trophy") },
    ],
  },
  {
    id: "moneysmarts", name: "Money Smarts", icon: iconRef("piggy"), tagline: "Needs, wants & saving!",
    stages: moneySmartsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Need or Want", icon: iconRef("star") },
      { stage: 20, name: "Piggy Saver", icon: iconRef("medal") },
      { stage: 30, name: "Smart Spender", icon: iconRef("piggy") },
      { stage: 40, name: "Hard Earner", icon: iconRef("flame") },
      { stage: 50, name: "Generous Giver", icon: iconRef("crown") },
      { stage: 55, name: "Master of Money", icon: iconRef("trophy") },
    ],
  },
  {
    id: "bugs", name: "Bug World", icon: iconRef("bug"), tagline: "Insects & the butterfly cycle!",
    stages: bugsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Bug Spotter", icon: iconRef("star") },
      { stage: 20, name: "Bee Friend", icon: iconRef("medal") },
      { stage: 30, name: "Web Watcher", icon: iconRef("bug") },
      { stage: 40, name: "Cycle Keeper", icon: iconRef("flame") },
      { stage: 50, name: "Minibeast Whiz", icon: iconRef("crown") },
      { stage: 55, name: "Master of Bugs", icon: iconRef("trophy") },
    ],
  },
  {
    id: "machines", name: "How It Works", icon: iconRef("gear"), tagline: "Simple machines & inventions!",
    stages: machinesStages as StageDef[],
    milestones: [
      { stage: 10, name: "Wheel Watcher", icon: iconRef("star") },
      { stage: 20, name: "Lever Lifter", icon: iconRef("medal") },
      { stage: 30, name: "Ramp Runner", icon: iconRef("gear") },
      { stage: 40, name: "Invention Spotter", icon: iconRef("flame") },
      { stage: 50, name: "Clever Tinkerer", icon: iconRef("crown") },
      { stage: 55, name: "Master of Machines", icon: iconRef("trophy") },
    ],
  },
  {
    id: "patterns", name: "Pattern Power", icon: iconRef("beads"), tagline: "Patterns, sorting & sequences!",
    stages: patternsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Pattern Spotter", icon: iconRef("star") },
      { stage: 20, name: "Odd-One Finder", icon: iconRef("medal") },
      { stage: 30, name: "Sequence Star", icon: iconRef("beads") },
      { stage: 40, name: "Logic Learner", icon: iconRef("flame") },
      { stage: 50, name: "Pattern Pro", icon: iconRef("crown") },
      { stage: 55, name: "Master of Patterns", icon: iconRef("trophy") },
    ],
  },
];
