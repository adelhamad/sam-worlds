// Additional "explore" worlds, kept here so worldList.ts stays under the
// 500-line cap. Merged into WORLDS by worlds.ts.
import mannersStages from "./manners/stages.json";
import safetyStages from "./safety/stages.json";
import helpersStages from "./helpers/stages.json";
import animalsStages from "./animals/stages.json";
import greenStages from "./green/stages.json";
import calendarStages from "./calendar/stages.json";
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
];
