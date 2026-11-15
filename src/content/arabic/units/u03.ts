// Unit 3 — Magic Words: yes, no, please, thank you, sorry, never mind — the
// small words that make every grown-up smile.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U03: LangUnitPack = {
  unit: {
    name: "Magic Words",
    icon: iconRef("wizard"),
    hue: "#a78bfa",
    blurb: "Please, thank you and sorry.",
    souvenir: { icon: iconRef("key"), name: "Polite Magic Key" },
    lessons: [
      { name: "Yes and No", kind: "words", teach: ["ee", "aah", "la", "shukran", "yislamo"] },
      { name: "Please", kind: "words", teach: ["min-fadlak", "min-fadlik", "tfaddal", "afwan", "malesh"] },
      {
        name: "Sorry, Mama!", kind: "talk",
        teach: ["la-shukran", "aasif-mama", "law-samaht"],
        scenes: ["u03-teta-plate", "u03-more-rice", "u03-baba-thanks", "u03-spill", "u03-tower", "u03-shop", "u03-baba-tea"],
      },
      {
        name: "Jiim and Haa", kind: "letters", letters: ["ج", "ح"], spell: ["marhaba", "shukran"],
        mission: "When someone gives you something today, say: yislamo!",
      },
    ],
  },
  phrases: [
    { id: "ee", text: "إي", roman: "ee", en: "Yes", topic: "polite", like: ["aah"], tip: "Some families say aah." },
    { id: "aah", text: "آه", roman: "aah", en: "Yes, yeah", topic: "polite", like: ["ee"], tip: "Another way to say ee." },
    { id: "la", text: "لأ", roman: "la’", say: "لَأ", en: "No", topic: "polite", like: ["la-shukran"] },
    { id: "shukran", text: "شكرا", roman: "shukran", say: "شُكْراً", en: "Thank you", topic: "polite", like: ["yislamo"] },
    {
      id: "yislamo", text: "يسلمو", roman: "yislamo", say: "يِسْلَمو", en: "Thanks! (the warm family way)", topic: "polite", like: ["shukran"],
      tip: "Families say it all day, for big and small things.",
    },
    {
      id: "min-fadlak", text: "من فضلك", roman: "min faDlak", say: "مِن فَضْلَك", en: "Please (to a man)", topic: "polite",
      like: ["min-fadlik", "law-samaht"],
      words: [{ text: "من", roman: "min" }, { text: "فضلك", roman: "faDlak" }],
      tip: "Ask Baba, Jiddo or a man this way.",
    },
    {
      id: "min-fadlik", text: "من فضلِك", roman: "min faDlik", say: "مِن فَضْلِك", en: "Please (to a woman)", topic: "polite",
      like: ["min-fadlak"],
      words: [{ text: "من", roman: "min" }, { text: "فضلِك", roman: "faDlik" }],
      tip: "Ask Mama, Teta or a woman this way.",
    },
    {
      id: "tfaddal", text: "تفضل", roman: "tfaDDal", say: "تْفَضَّل", en: "Here you go! (to a man)", topic: "polite", like: ["khood"],
      tip: "Say it when you give something. To a woman: tfaDDali.",
    },
    { id: "afwan", text: "عفوا", roman: "‘afwan", say: "عَفْواً", en: "You're welcome", topic: "polite", tip: "The answer to shukran. Some families say tikram." },
    { id: "malesh", text: "معلش", roman: "ma‘lesh", say: "مَعْلِش", en: "Never mind, it's OK", topic: "polite", tip: "Say it when someone says sorry to you." },
    {
      id: "la-shukran", text: "لأ شكرا", roman: "la’ shukran", say: "لَأ شُكْراً", en: "No, thank you", topic: "polite", like: ["la"],
      words: [{ text: "لأ", roman: "la’" }, { text: "شكرا", roman: "shukran" }],
    },
    {
      id: "aasif-mama", text: "آسف ماما", roman: "aasif maama", say: "آسِف ماما", en: "Sorry, Mom", topic: "polite",
      words: [{ text: "آسف", roman: "aasif" }, { text: "ماما", roman: "maama" }],
      tip: "Sorry is aasif. A girl says aasfeh.",
    },
    {
      id: "law-samaht", text: "لو سمحت", roman: "law samaHt", say: "لَو سَمَحْت", en: "Excuse me (to a man)", topic: "polite",
      like: ["min-fadlak"],
      words: [{ text: "لو", roman: "law" }, { text: "سمحت", roman: "samaHt" }],
      tip: "It is a polite please too. To a woman: law samaHti.",
    },
  ],
  scenes: [
    { id: "u03-teta-plate", setup: "Teta hands you a plate of food.", who: { name: "Teta" }, line: "tfaddal", reply: ["yislamo", "shukran"] },
    {
      id: "u03-more-rice", setup: "Your aunt offers more rice. You are full.", who: { name: "Auntie" },
      reply: ["la-shukran"], alsoOk: ["la", "shukran", "yislamo"],
    },
    { id: "u03-baba-thanks", setup: "You bring Baba his glasses. He smiles.", who: { name: "Baba" }, line: "shukran", reply: ["afwan"] },
    { id: "u03-spill", setup: "Oops! You spill juice on Mama's dress.", who: { name: "Mama" }, reply: ["aasif-mama"] },
    { id: "u03-tower", setup: "Your cousin knocks over your tower, then says sorry.", who: { name: "Cousin" }, reply: ["malesh"] },
    {
      id: "u03-shop", setup: "At the shop, you need help from the man.", who: { name: "Shopkeeper" },
      reply: ["law-samaht"], alsoOk: ["min-fadlak", "min-fadlik", "marhaba", "ahlein"],
    },
    { id: "u03-baba-tea", setup: "Mama made tea. You carry the cup to Baba.", who: { name: "Baba" }, reply: ["tfaddal"] },
  ],
};
