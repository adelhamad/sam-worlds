// Third batch of "explore" worlds, split out to keep each file under the
// 500-line cap. Merged into WORLDS by worlds.ts.
import synonymsStages from "./synonyms/stages.json";
import punctuationStages from "./punctuation/stages.json";
import storyStages from "./story/stages.json";
import compareStages from "./compare/stages.json";
import dataStages from "./data/stages.json";
import romanStages from "./roman/stages.json";
import rocksStages from "./rocks/stages.json";
import habitatsStages from "./habitats/stages.json";
import townStages from "./town/stages.json";
import instrumentsStages from "./instruments/stages.json";
import landformsStages from "./landforms/stages.json";
import chefStages from "./chef/stages.json";
import riddlesStages from "./riddles/stages.json";
import sportsStages from "./sports/stages.json";
import compoundsStages from "./compounds/stages.json";
import birdsStages from "./birds/stages.json";
import thennowStages from "./thennow/stages.json";
import ordinalsStages from "./ordinals/stages.json";
import familyStages from "./family/stages.json";
import petsStages from "./pets/stages.json";
import type { StageDef } from "./types";
import type { WorldDef } from "./worldList";

function ms(a: string, b: string, c: string, d: string, e: string, icons: string[]): WorldDef["milestones"] {
  return [
    { stage: 10, name: a, icon: icons[0] },
    { stage: 20, name: b, icon: icons[1] },
    { stage: 30, name: c, icon: icons[2] },
    { stage: 40, name: d, icon: icons[3] },
    { stage: 50, name: e, icon: icons[4] },
    { stage: 55, name: icons[6] ?? "Grand Master", icon: icons[5] },
  ];
}

export const EXTRA_WORLDS2: WorldDef[] = [
  { id: "synonyms", name: "Word Twins", icon: "🔁", tagline: "Same & opposite words!", stages: synonymsStages as StageDef[], milestones: ms("Same Sayer", "Opposite Pro", "Twin Finder", "Word Matcher", "Vocab Star", ["😊", "🔃", "👯", "🧩", "✨", "🏆", "Master of Word Twins"]) },
  { id: "punctuation", name: "Punctuation Park", icon: "✏️", tagline: "Periods, ? and capitals!", stages: punctuationStages as StageDef[], milestones: ms("Full-Stopper", "Question Asker", "Capital Pro", "Mark Maker", "Sentence Star", ["⏹️", "❓", "🔠", "❗", "✍️", "🏆", "Master of Marks"]) },
  { id: "story", name: "Story Time", icon: "📖", tagline: "Characters, settings & order!", stages: storyStages as StageDef[], milestones: ms("Word Knower", "Character Spotter", "Setting Finder", "Order Keeper", "Bookworm", ["📕", "🧒", "🏞️", "🔢", "🐛", "🏆", "Master Storyteller"]) },
  { id: "compare", name: "More or Less", icon: "⚖️", tagline: "Bigger, smaller, order!", stages: compareStages as StageDef[], milestones: ms("Greater Getter", "Smaller Spotter", "Sign Reader", "Order Maker", "Number Ninja", ["🔼", "🔽", "↔️", "🔢", "🥷", "🏆", "Master of Compare"]) },
  { id: "data", name: "Data Detectives", icon: "📊", tagline: "Charts, tally & graphs!", stages: dataStages as StageDef[], milestones: ms("Chart Counter", "Most Finder", "Fewest Finder", "Tally Tracker", "Graph Guru", ["🔢", "📈", "📉", "✋", "📊", "🏆", "Master of Data"]) },
  { id: "roman", name: "Roman Numerals", icon: "🏛️", tagline: "I, V, X and more!", stages: romanStages as StageDef[], milestones: ms("Numeral Reader", "Numeral Writer", "Symbol Sage", "Roman Pro", "Toga Champ", ["🔡", "✍️", "🔣", "🏛️", "👑", "🏆", "Master of Numerals"]) },
  { id: "rocks", name: "Rock Lab", icon: "🪨", tagline: "Gems, volcanoes & Earth!", stages: rocksStages as StageDef[], milestones: ms("Pebble Picker", "Gem Spotter", "Volcano Watcher", "Earth Digger", "Geo Whiz", ["🪨", "💎", "🌋", "⛏️", "🔬", "🏆", "Master of Rocks"]) },
  { id: "habitats", name: "Habitat Hunt", icon: "🏜️", tagline: "Deserts, ice & jungles!", stages: habitatsStages as StageDef[], milestones: ms("Home Finder", "Desert Ranger", "Arctic Explorer", "Jungle Scout", "Biome Boss", ["🏠", "🐪", "🐧", "🐒", "🌍", "🏆", "Master of Habitats"]) },
  { id: "town", name: "Around Town", icon: "🏙️", tagline: "Places & what you do!", stages: townStages as StageDef[], milestones: ms("Street Walker", "Place Finder", "Errand Runner", "Map Reader", "Town Expert", ["🚶", "📍", "🛒", "🗺️", "🏙️", "🏆", "Master of the Town"]) },
  { id: "instruments", name: "Instrument Island", icon: "🎺", tagline: "Strings, drums & keys!", stages: instrumentsStages as StageDef[], milestones: ms("String Strummer", "Horn Blower", "Drum Beater", "Key Presser", "Band Leader", ["🎸", "🎺", "🥁", "🎹", "🎶", "🏆", "Master of Music"]) },
  { id: "landforms", name: "Landform Land", icon: "🏔️", tagline: "Mountains, rivers & isles!", stages: landformsStages as StageDef[], milestones: ms("Hill Climber", "River Follower", "Island Hopper", "Cave Crawler", "Geo Explorer", ["⛰️", "🏞️", "🏝️", "🕳️", "🧭", "🏆", "Master of Landforms"]) },
  { id: "chef", name: "Little Chef", icon: "🍳", tagline: "Tastes, tools & recipes!", stages: chefStages as StageDef[], milestones: ms("Taste Tester", "Tool User", "Recipe Reader", "Sous Chef", "Head Cook", ["👅", "🥄", "📋", "🍳", "👨‍🍳", "🏆", "Master Chef"]) },
  { id: "riddles", name: "Riddle Room", icon: "🧠", tagline: "What am I? Brain teasers!", stages: riddlesStages as StageDef[], milestones: ms("Clue Catcher", "Tricky Thinker", "Puzzle Solver", "Brain Bender", "Riddle Whiz", ["🔍", "🤔", "🧩", "🧠", "💡", "🏆", "Master of Riddles"]) },
  { id: "sports", name: "Sports Arena", icon: "⚽", tagline: "Games, gear & teams!", stages: sportsStages as StageDef[], milestones: ms("Rookie", "Gear Getter", "Court Knower", "All-Star", "Champion", ["🎽", "🎾", "🏀", "⭐", "🏅", "🏆", "Master of Sports"]) },
  { id: "compounds", name: "Word Joiner", icon: "🧩", tagline: "Two words make one!", stages: compoundsStages as StageDef[], milestones: ms("Word Gluer", "Word Finisher", "Joiner Pro", "Builder", "Word Smith", ["🔗", "➕", "🧩", "🏗️", "📚", "🏆", "Master Joiner"]) },
  { id: "birds", name: "Bird World", icon: "🦅", tagline: "Feathers, beaks & flight!", stages: birdsStages as StageDef[], milestones: ms("Bird Spotter", "Fact Finder", "Nest Knower", "Sky Watcher", "Bird Whiz", ["🐦", "🪶", "🪺", "🦅", "👀", "🏆", "Master of Birds"]) },
  { id: "thennow", name: "Then & Now", icon: "🕰️", tagline: "Old ways vs new ways!", stages: thennowStages as StageDef[], milestones: ms("Time Peeker", "Old-Ways Knower", "New-Ways Knower", "Past Finder", "History Buff", ["⏳", "🕯️", "💡", "📜", "🎓", "🏆", "Master of Time"]) },
  { id: "ordinals", name: "Race Ranks", icon: "🥇", tagline: "First, second, third!", stages: ordinalsStages as StageDef[], milestones: ms("Spot Speller", "Line Reader", "Rank Counter", "Place Pro", "Podium Star", ["🥇", "🚥", "🔢", "🏁", "🏅", "🏆", "Master of Ranks"]) },
  { id: "family", name: "Family Tree", icon: "👪", tagline: "Who's who in the family!", stages: familyStages as StageDef[], milestones: ms("Sibling Sorter", "Parent Pro", "Grandkid", "Cousin Counter", "Tree Climber", ["👫", "👩‍👧", "👵", "🧒", "🌳", "🏆", "Master of Family"]) },
  { id: "pets", name: "Pet Pals", icon: "🐾", tagline: "Pets & how to care!", stages: petsStages as StageDef[], milestones: ms("Pet Greeter", "Good Carer", "Wild Spotter", "Kind Owner", "Pet Pro", ["🐶", "🥣", "🦁", "💛", "🐾", "🏆", "Master of Pets"]) },
];
