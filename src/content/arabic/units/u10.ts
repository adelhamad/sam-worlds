// Unit 10 — Where Is It?: where, here, there, up, down, inside, outside —
// finding people and things around the house.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U10: LangUnitPack = {
  unit: {
    name: "Where Is It?",
    icon: iconRef("compass"),
    hue: "#c084fc",
    blurb: "Find people and things.",
    souvenir: { icon: iconRef("map"), name: "Jiddo's Treasure Map" },
    lessons: [
      { name: "Here and There", kind: "words", teach: ["wein", "hoon", "hniik", "juwwa", "barra"] },
      { name: "Up and Down", kind: "words", teach: ["foo", "taht", "jamb", "ma-barif"] },
      {
        name: "Where Is Mama?", kind: "talk",
        teach: ["wein-mama", "ana-hoon", "baba-barra"],
        scenes: ["u10-mama-calls", "u10-quiet-house", "u10-teta-asks", "u10-cousin-ball", "u10-ball-tree", "u10-slipper", "u10-garden"],
      },
      {
        name: "Ghayn and Faa", kind: "letters", letters: ["غ", "ف"], spell: ["foo", "barra"],
        mission: "When someone calls your name today, answer: ana hoon!",
      },
    ],
  },
  phrases: [
    { id: "wein", text: "وين؟", roman: "wein?", en: "Where?", topic: "place" },
    { id: "hoon", text: "هون", roman: "hoon", say: "هُون", en: "Here", topic: "place", like: ["ana-hoon"] },
    { id: "hniik", text: "هنيك", roman: "hniik", say: "هْنيك", en: "There", topic: "place", tip: "Some families say hunaak." },
    { id: "juwwa", text: "جوا", roman: "juwwa", say: "جُوّا", en: "Inside", topic: "place" },
    { id: "barra", text: "برا", roman: "barra", say: "بَرّا", en: "Outside", topic: "place" },
    { id: "foo", text: "فوق", roman: "foo’", say: "فوء", en: "Up, on top", art: "arrow-up", topic: "place", tip: "It also means upstairs." },
    { id: "taht", text: "تحت", roman: "taHt", say: "تَحْت", en: "Down, under", art: "arrow-down", topic: "place", tip: "It also means downstairs." },
    { id: "jamb", text: "جنب", roman: "jamb", say: "جَنْب", en: "Next to", topic: "place", tip: "Some families say Hadd." },
    {
      id: "ma-barif", text: "ما بعرف", roman: "ma ba‘rif", say: "ما بَعْرِف", en: "I don't know", topic: "place",
      words: [{ text: "ما", roman: "ma" }, { text: "بعرف", roman: "ba‘rif" }],
    },
    {
      id: "wein-mama", text: "وين ماما؟", roman: "wein maama?", en: "Where is Mom?", topic: "place",
      words: [{ text: "وين", roman: "wein" }, { text: "ماما", roman: "maama" }],
      tip: "Change the name: wein baaba? wein teeta?",
    },
    {
      id: "ana-hoon", text: "أنا هون", roman: "ana hoon", say: "أَنا هُون", en: "I'm here!", topic: "place", like: ["hoon"],
      words: [{ text: "أنا", roman: "ana" }, { text: "هون", roman: "hoon" }],
    },
    {
      id: "baba-barra", text: "بابا برا", roman: "baaba barra", say: "بابا بَرّا", en: "Dad is outside", topic: "place",
      words: [{ text: "بابا", roman: "baaba" }, { text: "برا", roman: "barra" }],
    },
  ],
  scenes: [
    {
      id: "u10-mama-calls", setup: "You hide behind the sofa. Mama calls you.", who: { name: "Mama" },
      line: "wein", reply: ["ana-hoon"], alsoOk: ["hoon"],
    },
    { id: "u10-quiet-house", setup: "You come home. Mama is not there. Ask Baba.", who: { name: "Baba" }, reply: ["wein-mama"], alsoOk: ["wein"] },
    {
      id: "u10-teta-asks", setup: "Teta asks where Baba is. He is in the garden.", who: { name: "Teta" },
      reply: ["baba-barra"], alsoOk: ["barra", "hniik"],
    },
    { id: "u10-cousin-ball", setup: "Your cousin asks where the ball is. You have no idea!", who: { name: "Cousin" }, line: "wein", reply: ["ma-barif"] },
    { id: "u10-ball-tree", setup: "Your ball is stuck high up in a tree! Point and say:", who: { name: "Baba" }, reply: ["foo"], alsoOk: ["hniik"] },
    { id: "u10-slipper", setup: "Teta can't find her slipper. It is under the bed.", who: { name: "Teta" }, reply: ["taht"], alsoOk: ["hniik"] },
    { id: "u10-garden", setup: "Mama asks: inside or outside? You want the garden.", who: { name: "Mama" }, reply: ["barra"] },
  ],
};
