// Unit 11 — My Home: the rooms and things of a house, being at home, and the
// one sentence every child must be able to say at Teta's: "I need the toilet".
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U11: LangUnitPack = {
  unit: {
    name: "My Home",
    icon: iconRef("home"),
    hue: "#a3e635",
    blurb: "Rooms and things at home.",
    souvenir: { icon: iconRef("key"), name: "Teta's Door Key" },
    lessons: [
      { name: "My House", kind: "words", teach: ["beit", "ooda", "matbakh", "hammaam", "takht"] },
      { name: "Door and Window", kind: "words", teach: ["baab", "shubbaak", "taawleh", "kursi", "jneineh"] },
      {
        name: "At Home", kind: "talk",
        teach: ["ana-bil-beit", "mama-bil-matbakh", "biddi-rooh-al-hammaam", "ana-bil-jneineh"],
        scenes: ["u11-teta-phone", "u11-baba-asks", "u11-toilet", "u11-cousin-garden", "u11-mama-calls", "u11-keys"],
      },
      {
        name: "Qaaf and Kaaf", kind: "letters", letters: ["ق", "ك"], spell: ["kursi", "beit"],
        mission: "When you get home today, call out: ana bil-beit!",
      },
    ],
  },
  phrases: [
    { id: "beit", text: "بيت", roman: "beit", say: "بَيْت", en: "House, home", art: "home", topic: "home" },
    { id: "ooda", text: "أوضة", roman: "ooDa", en: "Room", topic: "home", tip: "My room is ooDti. Some families say ghurfeh." },
    { id: "matbakh", text: "مطبخ", roman: "maTbakh", say: "مَطْبَخ", en: "Kitchen", art: "kitchen", topic: "home" },
    { id: "hammaam", text: "حمام", roman: "Hammaam", say: "حَمّام", en: "Bathroom, toilet", art: "bath", topic: "home" },
    { id: "takht", text: "تخت", roman: "takht", say: "تَخْت", en: "Bed", art: "bed", topic: "home", tip: "Some families say sriir." },
    { id: "baab", text: "باب", roman: "baab", en: "Door", art: "door", topic: "home" },
    { id: "shubbaak", text: "شباك", roman: "shubbaak", say: "شُبّاك", en: "Window", art: "window", topic: "home" },
    { id: "taawleh", text: "طاولة", roman: "Taawleh", say: "طاوْلة", en: "Table", art: "table", topic: "home" },
    { id: "kursi", text: "كرسي", roman: "kursi", say: "كُرْسي", en: "Chair", art: "chair", topic: "home" },
    { id: "jneineh", text: "جنينة", roman: "jneineh", say: "جْنَيْنة", en: "Garden", art: "flower", topic: "home" },
    {
      id: "ana-bil-beit", text: "أنا بالبيت", roman: "ana bil-beit", say: "أَنا بِالبَيْت", en: "I'm at home", art: "home", topic: "home",
      words: [{ text: "أنا", roman: "ana" }, { text: "بالبيت", roman: "bil-beit" }],
    },
    {
      id: "mama-bil-matbakh", text: "ماما بالمطبخ", roman: "maama bil-maTbakh", say: "ماما بِالمَطْبَخ", en: "Mom is in the kitchen", topic: "home",
      words: [{ text: "ماما", roman: "maama" }, { text: "بالمطبخ", roman: "bil-maTbakh" }],
      tip: "bil- means in the. bil-beit, bil-maTbakh.",
    },
    {
      id: "biddi-rooh-al-hammaam", text: "بدّي روح عالحمام", roman: "biddi rooH ‘al-Hammaam", say: "بِدّي روح عَالحَمّام",
      en: "I need the toilet!", topic: "home",
      words: [{ text: "بدّي", roman: "biddi" }, { text: "روح", roman: "rooH" }, { text: "عالحمام", roman: "‘al-Hammaam" }],
      tip: "Say it to any grown-up. They will help you.",
    },
    {
      id: "ana-bil-jneineh", text: "أنا بالجنينة", roman: "ana bil-jneineh", say: "أَنا بِالجْنَيْنة", en: "I'm in the garden", art: "flower", topic: "home",
      words: [{ text: "أنا", roman: "ana" }, { text: "بالجنينة", roman: "bil-jneineh" }],
    },
  ],
  scenes: [
    {
      id: "u11-teta-phone", setup: "Teta phones and asks where you are. You are home.", who: { name: "Teta" },
      reply: ["ana-bil-beit"], alsoOk: ["hoon", "ana-hoon", "beit"],
    },
    {
      id: "u11-baba-asks", setup: "Baba comes home. Mama is cooking dinner.", who: { name: "Baba" },
      line: "wein-mama", reply: ["mama-bil-matbakh"], alsoOk: ["matbakh", "juwwa", "hniik"],
    },
    { id: "u11-toilet", setup: "At Teta's house, you really need the toilet!", who: { name: "Teta" }, reply: ["biddi-rooh-al-hammaam"], alsoOk: ["hammaam"] },
    {
      id: "u11-cousin-garden", setup: "Your cousin is inside. Call him out to play in the garden!", who: { name: "Cousin" },
      reply: ["yalla"], alsoOk: ["taa", "barra", "jneineh"],
    },
    {
      id: "u11-mama-calls", setup: "Mama calls you. You are out in the garden.", who: { name: "Mama" },
      line: "wein", reply: ["ana-bil-jneineh"], alsoOk: ["barra", "ana-hoon", "hoon", "jneineh", "hniik", "ana-bil-beit"],
    },
    {
      id: "u11-keys", setup: "Jiddo can't find his keys. They are on the table.", who: { name: "Jiddo" },
      reply: ["taawleh"], alsoOk: ["foo", "hoon", "hniik"],
    },
  ],
};
