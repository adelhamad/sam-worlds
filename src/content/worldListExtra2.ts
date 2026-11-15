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
import traceStages from "./trace/stages.json";
import starsStages from "./stars/stages.json";
import ancientStages from "./ancient/stages.json";
import mythsStages from "./myths/stages.json";
import mapsStages from "./maps/stages.json";
import homophonesStages from "./homophones/stages.json";
import symmetryStages from "./symmetry/stages.json";
import chanceStages from "./chance/stages.json";
import signsStages from "./signs/stages.json";
import inventorsStages from "./inventors/stages.json";
import calmStages from "./calm/stages.json";
import traitsStages from "./traits/stages.json";
import { iconRef } from "./iconNames";
import type { StageDef } from "./types";
import type { WorldDef } from "./worldList";
import { STR } from "../strings/en";

function ms(a: string, b: string, c: string, d: string, e: string, icons: string[], master = "Grand Master"): WorldDef["milestones"] {
  return [
    { stage: 10, name: a, icon: icons[0] },
    { stage: 20, name: b, icon: icons[1] },
    { stage: 30, name: c, icon: icons[2] },
    { stage: 40, name: d, icon: icons[3] },
    { stage: 50, name: e, icon: icons[4] },
    { stage: 55, name: master, icon: icons[5] },
  ];
}

export const EXTRA_WORLDS2: WorldDef[] = [
  { id: "synonyms", name: "Word Twins", icon: iconRef("loop"), tagline: "Same & opposite words!", stages: synonymsStages as StageDef[], milestones: ms("Same Sayer", "Opposite Pro", "Twin Finder", "Word Matcher", "Vocab Star", [iconRef("star"), iconRef("medal"), iconRef("loop"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Word Twins") },
  { id: "punctuation", name: "Punctuation Park", icon: iconRef("question"), tagline: "Periods, ? and capitals!", stages: punctuationStages as StageDef[], milestones: ms("Full-Stopper", "Question Asker", "Capital Pro", "Mark Maker", "Sentence Star", [iconRef("star"), iconRef("medal"), iconRef("question"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Marks") },
  { id: "story", name: "Story Time", icon: iconRef("book"), tagline: "Characters, settings & order!", stages: storyStages as StageDef[], milestones: ms("Word Knower", "Character Spotter", "Setting Finder", "Order Keeper", "Bookworm", [iconRef("star"), iconRef("medal"), iconRef("book"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master Storyteller") },
  { id: "compare", name: "More or Less", icon: iconRef("croc"), tagline: "Bigger, smaller, order!", stages: compareStages as StageDef[], milestones: ms("Greater Getter", "Smaller Spotter", "Sign Reader", "Order Maker", "Number Ninja", [iconRef("star"), iconRef("medal"), iconRef("croc"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Compare") },
  { id: "data", name: "Data Detectives", icon: iconRef("chart"), tagline: "Charts, tally & graphs!", stages: dataStages as StageDef[], milestones: ms("Chart Counter", "Most Finder", "Fewest Finder", "Tally Tracker", "Graph Guru", [iconRef("star"), iconRef("medal"), iconRef("chart"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Data") },
  { id: "roman", name: "Roman Numerals", icon: iconRef("columns"), tagline: "I, V, X and more!", stages: romanStages as StageDef[], milestones: ms("Numeral Reader", "Numeral Writer", "Symbol Sage", "Roman Pro", "Toga Champ", [iconRef("star"), iconRef("medal"), iconRef("columns"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Numerals") },
  { id: "rocks", name: "Rock Lab", icon: iconRef("gem"), tagline: "Gems, volcanoes & Earth!", stages: rocksStages as StageDef[], milestones: ms("Pebble Picker", "Gem Spotter", "Volcano Watcher", "Earth Digger", "Geo Whiz", [iconRef("star"), iconRef("medal"), iconRef("gem"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Rocks") },
  { id: "habitats", name: "Habitat Hunt", icon: iconRef("cactus"), tagline: "Deserts, ice & jungles!", stages: habitatsStages as StageDef[], milestones: ms("Home Finder", "Desert Ranger", "Arctic Explorer", "Jungle Scout", "Biome Boss", [iconRef("star"), iconRef("medal"), iconRef("cactus"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Habitats") },
  { id: "town", name: "Around Town", icon: iconRef("shop"), tagline: "Places & what you do!", stages: townStages as StageDef[], milestones: ms("Street Walker", "Place Finder", "Errand Runner", "Map Reader", "Town Expert", [iconRef("star"), iconRef("medal"), iconRef("shop"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of the Town") },
  { id: "instruments", name: "Instrument Island", icon: iconRef("drum"), tagline: "Strings, drums & keys!", stages: instrumentsStages as StageDef[], milestones: ms("String Strummer", "Horn Blower", "Drum Beater", "Key Presser", "Band Leader", [iconRef("star"), iconRef("medal"), iconRef("drum"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Music") },
  { id: "landforms", name: "Landform Land", icon: iconRef("island"), tagline: "Mountains, rivers & isles!", stages: landformsStages as StageDef[], milestones: ms("Hill Climber", "River Follower", "Island Hopper", "Cave Crawler", "Geo Explorer", [iconRef("star"), iconRef("medal"), iconRef("island"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Landforms") },
  { id: "chef", name: "Little Chef", icon: iconRef("pan"), tagline: "Tastes, tools & recipes!", stages: chefStages as StageDef[], milestones: ms("Taste Tester", "Tool User", "Recipe Reader", "Sous Chef", "Head Cook", [iconRef("star"), iconRef("medal"), iconRef("pan"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master Chef") },
  { id: "riddles", name: "Riddle Room", icon: iconRef("brain"), tagline: "What am I? Brain teasers!", stages: riddlesStages as StageDef[], milestones: ms("Clue Catcher", "Tricky Thinker", "Puzzle Solver", "Brain Bender", "Riddle Whiz", [iconRef("star"), iconRef("medal"), iconRef("brain"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Riddles") },
  { id: "sports", name: "Sports Arena", icon: iconRef("ball"), tagline: "Games, gear & teams!", stages: sportsStages as StageDef[], milestones: ms("Rookie", "Gear Getter", "Court Knower", "All-Star", "Champion", [iconRef("star"), iconRef("medal"), iconRef("ball"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Sports") },
  { id: "compounds", name: "Word Joiner", icon: iconRef("link"), tagline: "Two words make one!", stages: compoundsStages as StageDef[], milestones: ms("Word Gluer", "Word Finisher", "Joiner Pro", "Builder", "Word Smith", [iconRef("star"), iconRef("medal"), iconRef("link"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master Joiner") },
  { id: "birds", name: "Bird World", icon: iconRef("bird"), tagline: "Feathers, beaks & flight!", stages: birdsStages as StageDef[], milestones: ms("Bird Spotter", "Fact Finder", "Nest Knower", "Sky Watcher", "Bird Whiz", [iconRef("star"), iconRef("medal"), iconRef("bird"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Birds") },
  { id: "thennow", name: "Then & Now", icon: iconRef("hourglass"), tagline: "Old ways vs new ways!", stages: thennowStages as StageDef[], milestones: ms("Time Peeker", "Old-Ways Knower", "New-Ways Knower", "Past Finder", "History Buff", [iconRef("star"), iconRef("medal"), iconRef("hourglass"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Time") },
  { id: "ordinals", name: "Race Ranks", icon: iconRef("podium"), tagline: "First, second, third!", stages: ordinalsStages as StageDef[], milestones: ms("Spot Speller", "Line Reader", "Rank Counter", "Place Pro", "Podium Star", [iconRef("star"), iconRef("medal"), iconRef("podium"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Ranks") },
  { id: "family", name: "Family Tree", icon: iconRef("family"), tagline: "Who's who in the family!", stages: familyStages as StageDef[], milestones: ms("Sibling Sorter", "Parent Pro", "Grandkid", "Cousin Counter", "Tree Climber", [iconRef("star"), iconRef("medal"), iconRef("family"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Family") },
  { id: "pets", name: "Pet Pals", icon: iconRef("paw"), tagline: "Pets & how to care!", stages: petsStages as StageDef[], milestones: ms("Pet Greeter", "Good Carer", "Wild Spotter", "Kind Owner", "Pet Pro", [iconRef("star"), iconRef("medal"), iconRef("paw"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Pets") },
  { id: "trace", name: "Trace It", icon: iconRef("pencil"), tagline: "Draw numbers, letters & shapes!", stages: traceStages as StageDef[], milestones: ms("Number Tracer", "Letter Tracer", "Shape Tracer", "Steady Hand", "Neat Writer", [iconRef("star"), iconRef("medal"), iconRef("pencil"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master Tracer") },
  { id: "stars", name: "Star Map", icon: iconRef("telescope"), tagline: "Constellations & stargazing!", stages: starsStages as StageDef[], milestones: ms("Star Gazer", "Dipper Finder", "Bear Spotter", "Sky Reader", "Night Navigator", [iconRef("star"), iconRef("medal"), iconRef("telescope"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master Stargazer") },
  { id: "ancient", name: "Ancient Worlds", icon: iconRef("pyramid"), tagline: "Pyramids, Rome & knights!", stages: ancientStages as StageDef[], milestones: ms("Time Traveler", "Pyramid Pal", "Rome Roamer", "Castle Climber", "History Buff", [iconRef("star"), iconRef("medal"), iconRef("pyramid"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of History") },
  { id: "myths", name: "Myths & Legends", icon: iconRef("dragon"), tagline: "Dragons, unicorns & more!", stages: mythsStages as StageDef[], milestones: ms("Tale Teller", "Dragon Tamer", "Unicorn Finder", "Legend Keeper", "Myth Maker", [iconRef("star"), iconRef("medal"), iconRef("dragon"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Legends") },
  { id: "maps", name: "Treasure Maps", icon: iconRef("map"), tagline: "Read maps & find treasure!", stages: mapsStages as StageDef[], milestones: ms("Map Reader", "Symbol Spotter", "Treasure Tracker", "Path Finder", "Map Whiz", [iconRef("star"), iconRef("medal"), iconRef("map"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master Navigator") },
  { id: "homophones", name: "Sound-Alikes", icon: iconRef("ear"), tagline: "Words that sound the same!", stages: homophonesStages as StageDef[], milestones: ms("Sound Matcher", "Spelling Spotter", "Twin Word Pro", "Sentence Star", "Word Wizard", [iconRef("star"), iconRef("medal"), iconRef("ear"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Sound-Alikes") },
  { id: "symmetry", name: "Mirror Magic", icon: iconRef("butterfly"), tagline: "Symmetry & matching halves!", stages: symmetryStages as StageDef[], milestones: ms("Half Finder", "Fold Master", "Mirror Letters", "Balance Pro", "Symmetry Star", [iconRef("star"), iconRef("medal"), iconRef("butterfly"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Mirrors") },
  { id: "chance", name: "Chance & Luck", icon: iconRef("dice"), tagline: "Certain, likely or impossible!", stages: chanceStages as StageDef[], milestones: ms("Coin Flipper", "Dice Roller", "Odds Spotter", "Likely Logic", "Chance Pro", [iconRef("star"), iconRef("medal"), iconRef("dice"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Chance") },
  { id: "signs", name: "Hand Signs", icon: iconRef("hand"), tagline: "Talk with your hands!", stages: signsStages as StageDef[], milestones: ms("Wave Hello", "Thumbs Up", "Quiet Sign", "Gesture Pro", "Sign Reader", [iconRef("star"), iconRef("medal"), iconRef("hand"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Signs") },
  { id: "inventors", name: "Great Minds", icon: iconRef("bulb"), tagline: "Inventors & their big ideas!", stages: inventorsStages as StageDef[], milestones: ms("Idea Spotter", "Bulb Brightener", "Flight Fan", "Science Star", "Genius Pal", [iconRef("star"), iconRef("medal"), iconRef("bulb"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Great Minds") },
  { id: "calm", name: "Calm Corner", icon: iconRef("moon"), tagline: "Breathe, relax & feel calm!", stages: calmStages as StageDef[], milestones: ms("Deep Breather", "Calm Counter", "Break Taker", "Kind Heart", "Peaceful Pro", [iconRef("star"), iconRef("medal"), iconRef("moon"), iconRef("flame"), iconRef("crown"), iconRef("trophy")], "Master of Calm") },
  {
    id: "traits", name: STR.traits.worldName, icon: iconRef("turtle"), tagline: STR.traits.tagline,
    stages: traitsStages as StageDef[],
    milestones: [
      { stage: 10, name: STR.traits.milestones[0], icon: iconRef("star") },
      { stage: 20, name: STR.traits.milestones[1], icon: iconRef("medal") },
      { stage: 30, name: STR.traits.milestones[2], icon: iconRef("turtle") },
      { stage: 40, name: STR.traits.milestones[3], icon: iconRef("flame") },
      { stage: 50, name: STR.traits.milestones[4], icon: iconRef("crown") },
      { stage: 55, name: STR.traits.milestones[5], icon: iconRef("trophy") },
    ],
  },
];
