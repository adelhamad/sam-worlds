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
import type { StageDef } from "./types";
import type { WorldDef } from "./worldList";

export const EXTRA_WORLDS: WorldDef[] = [
  {
    id: "manners", name: "Manners Manor", icon: "🎩", tagline: "Magic words & being kind!",
    stages: mannersStages as StageDef[],
    milestones: [
      { stage: 10, name: "Kind Kid", icon: "😊" },
      { stage: 20, name: "Polite Pal", icon: "🤝" },
      { stage: 30, name: "Magic Words", icon: "🪄" },
      { stage: 40, name: "Helper Heart", icon: "💛" },
      { stage: 50, name: "Good Friend", icon: "🌟" },
      { stage: 55, name: "Master of Manners", icon: "🏆" },
    ],
  },
  {
    id: "safety", name: "Safety Squad", icon: "🦺", tagline: "Stay safe and smart!",
    stages: safetyStages as StageDef[],
    milestones: [
      { stage: 10, name: "Road Ready", icon: "🚦" },
      { stage: 20, name: "Safe Scout", icon: "🦺" },
      { stage: 30, name: "Stranger Smart", icon: "🛡️" },
      { stage: 40, name: "Emergency Expert", icon: "🚨" },
      { stage: 50, name: "Safety Captain", icon: "⛑️" },
      { stage: 55, name: "Master of Safety", icon: "🏆" },
    ],
  },
  {
    id: "helpers", name: "Helpers Town", icon: "🚒", tagline: "People who help us!",
    stages: helpersStages as StageDef[],
    milestones: [
      { stage: 10, name: "Town Friend", icon: "🤝" },
      { stage: 20, name: "Job Spotter", icon: "🔎" },
      { stage: 30, name: "Tool Time", icon: "🧰" },
      { stage: 40, name: "Helper Expert", icon: "🚒" },
      { stage: 50, name: "Community Star", icon: "🌟" },
      { stage: 55, name: "Master of Helpers", icon: "🏆" },
    ],
  },
  {
    id: "animals", name: "Animal Kingdom", icon: "🦁", tagline: "Groups, babies & homes!",
    stages: animalsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Critter Cadet", icon: "🐾" },
      { stage: 20, name: "Baby Namer", icon: "🐣" },
      { stage: 30, name: "Home Finder", icon: "🏠" },
      { stage: 40, name: "Group Guru", icon: "🦓" },
      { stage: 50, name: "Wildlife Whiz", icon: "🦁" },
      { stage: 55, name: "Master of Animals", icon: "🏆" },
    ],
  },
  {
    id: "green", name: "Green Planet", icon: "♻️", tagline: "Care for the Earth!",
    stages: greenStages as StageDef[],
    milestones: [
      { stage: 10, name: "Recycle Rookie", icon: "♻️" },
      { stage: 20, name: "Bin Sorter", icon: "🗑️" },
      { stage: 30, name: "Water Saver", icon: "💧" },
      { stage: 40, name: "Earth Friend", icon: "🌍" },
      { stage: 50, name: "Eco Hero", icon: "🌱" },
      { stage: 55, name: "Master of the Earth", icon: "🏆" },
    ],
  },
  {
    id: "calendar", name: "Calendar Quest", icon: "📅", tagline: "Days, months & time!",
    stages: calendarStages as StageDef[],
    milestones: [
      { stage: 10, name: "Day Counter", icon: "📆" },
      { stage: 20, name: "Week Walker", icon: "🗓️" },
      { stage: 30, name: "Month Master", icon: "📅" },
      { stage: 40, name: "Order Keeper", icon: "🔢" },
      { stage: 50, name: "Time Tracker", icon: "⏳" },
      { stage: 55, name: "Master of Time", icon: "🏆" },
    ],
  },
  {
    id: "ocean", name: "Ocean Deep", icon: "🌊", tagline: "Sea creatures & ocean facts!",
    stages: oceanStages as StageDef[],
    milestones: [
      { stage: 10, name: "Rock Pooler", icon: "🦀" },
      { stage: 20, name: "Reef Explorer", icon: "🐠" },
      { stage: 30, name: "Deep Diver", icon: "🐙" },
      { stage: 40, name: "Whale Watcher", icon: "🐳" },
      { stage: 50, name: "Sea Sage", icon: "🌊" },
      { stage: 55, name: "Master of the Sea", icon: "🏆" },
    ],
  },
  {
    id: "garden", name: "Garden Grow", icon: "🌱", tagline: "Plants, seeds & how they grow!",
    stages: gardenStages as StageDef[],
    milestones: [
      { stage: 10, name: "Seed Sower", icon: "🌰" },
      { stage: 20, name: "Sprout Scout", icon: "🌱" },
      { stage: 30, name: "Leaf Learner", icon: "🌿" },
      { stage: 40, name: "Flower Friend", icon: "🌻" },
      { stage: 50, name: "Green Grower", icon: "🪴" },
      { stage: 55, name: "Master Gardener", icon: "🏆" },
    ],
  },
  {
    id: "nutrition", name: "Healthy Plate", icon: "🥗", tagline: "Food groups & healthy eating!",
    stages: nutritionStages as StageDef[],
    milestones: [
      { stage: 10, name: "Snack Sorter", icon: "🍎" },
      { stage: 20, name: "Food Group Pro", icon: "🥦" },
      { stage: 30, name: "Farm to Plate", icon: "🚜" },
      { stage: 40, name: "Vitamin Hero", icon: "🍊" },
      { stage: 50, name: "Balanced Eater", icon: "🥗" },
      { stage: 55, name: "Master of Meals", icon: "🏆" },
    ],
  },
  {
    id: "colors", name: "Color Lab", icon: "🎨", tagline: "Mix colors & paint the world!",
    stages: colorsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Color Spotter", icon: "🔴" },
      { stage: 20, name: "Mix Master", icon: "🟠" },
      { stage: 30, name: "Rainbow Maker", icon: "🌈" },
      { stage: 40, name: "Warm & Cool", icon: "🔵" },
      { stage: 50, name: "Paint Pro", icon: "🎨" },
      { stage: 55, name: "Master of Colors", icon: "🏆" },
    ],
  },
  {
    id: "cultures", name: "Around the World", icon: "🌍", tagline: "Greetings, places & continents!",
    stages: culturesStages as StageDef[],
    milestones: [
      { stage: 10, name: "World Greeter", icon: "👋" },
      { stage: 20, name: "Landmark Spotter", icon: "🗼" },
      { stage: 30, name: "Globe Trotter", icon: "🌐" },
      { stage: 40, name: "Continent Champ", icon: "🗺️" },
      { stage: 50, name: "World Wanderer", icon: "🧳" },
      { stage: 55, name: "Master Explorer", icon: "🏆" },
    ],
  },
  {
    id: "transport", name: "On the Move", icon: "🚂", tagline: "Land, air & water travel!",
    stages: transportStages as StageDef[],
    milestones: [
      { stage: 10, name: "Road Rider", icon: "🚗" },
      { stage: 20, name: "Sky Flyer", icon: "✈️" },
      { stage: 30, name: "Water Sailor", icon: "⛵" },
      { stage: 40, name: "Vehicle Picker", icon: "🚀" },
      { stage: 50, name: "Travel Whiz", icon: "🚂" },
      { stage: 55, name: "Master of Travel", icon: "🏆" },
    ],
  },
  {
    id: "moneysmarts", name: "Money Smarts", icon: "🐷", tagline: "Needs, wants & saving!",
    stages: moneySmartsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Need or Want", icon: "🤔" },
      { stage: 20, name: "Piggy Saver", icon: "🐷" },
      { stage: 30, name: "Smart Spender", icon: "🛒" },
      { stage: 40, name: "Hard Earner", icon: "💪" },
      { stage: 50, name: "Generous Giver", icon: "💝" },
      { stage: 55, name: "Master of Money", icon: "🏆" },
    ],
  },
  {
    id: "bugs", name: "Bug World", icon: "🐛", tagline: "Insects & the butterfly cycle!",
    stages: bugsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Bug Spotter", icon: "🐞" },
      { stage: 20, name: "Bee Friend", icon: "🐝" },
      { stage: 30, name: "Web Watcher", icon: "🕷️" },
      { stage: 40, name: "Cycle Keeper", icon: "🦋" },
      { stage: 50, name: "Minibeast Whiz", icon: "🐛" },
      { stage: 55, name: "Master of Bugs", icon: "🏆" },
    ],
  },
  {
    id: "machines", name: "How It Works", icon: "🛠️", tagline: "Simple machines & inventions!",
    stages: machinesStages as StageDef[],
    milestones: [
      { stage: 10, name: "Wheel Watcher", icon: "🎡" },
      { stage: 20, name: "Lever Lifter", icon: "⚖️" },
      { stage: 30, name: "Ramp Runner", icon: "🛝" },
      { stage: 40, name: "Invention Spotter", icon: "💡" },
      { stage: 50, name: "Clever Tinkerer", icon: "🛠️" },
      { stage: 55, name: "Master of Machines", icon: "🏆" },
    ],
  },
  {
    id: "patterns", name: "Pattern Power", icon: "🔷", tagline: "Patterns, sorting & sequences!",
    stages: patternsStages as StageDef[],
    milestones: [
      { stage: 10, name: "Pattern Spotter", icon: "🔵" },
      { stage: 20, name: "Odd-One Finder", icon: "🔍" },
      { stage: 30, name: "Sequence Star", icon: "🔢" },
      { stage: 40, name: "Logic Learner", icon: "🧠" },
      { stage: 50, name: "Pattern Pro", icon: "🔷" },
      { stage: 55, name: "Master of Patterns", icon: "🏆" },
    ],
  },
];
