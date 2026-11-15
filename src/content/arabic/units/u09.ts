// Unit 9 — Come and Go: the little commands family says all day — come, go,
// look, sit, wait, quick, slowly — so Sam understands them and can say them.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U09: LangUnitPack = {
  unit: {
    name: "Come and Go",
    icon: iconRef("footprints"),
    hue: "#4ade80",
    blurb: "Come, go, look, wait, hurry!",
    souvenir: { icon: iconRef("bike"), name: "Cousin's Speedy Bike" },
    lessons: [
      { name: "Come and Go", kind: "words", teach: ["taa", "rooh", "shoof", "isma", "yalla"] },
      { name: "Sit and Stand", kind: "words", teach: ["uud", "oom", "khood", "jiib", "bsura"] },
      {
        name: "Wait a Little!", kind: "talk",
        teach: ["stanna-shway", "shway-shway", "yalla-bsura", "shoofi-mama"],
        scenes: ["u09-car", "u09-stairs", "u09-rainbow", "u09-mama-hurry", "u09-jiddo-coin", "u09-cousin-sit", "u09-ice-cream"],
      },
      {
        name: "Zaa and ‘Ayn", kind: "letters", letters: ["ظ", "ع"], spell: ["isma", "rooh"],
        mission: "Show Mama something fun today and say: shoofi maama!",
      },
    ],
  },
  phrases: [
    { id: "taa", text: "تعا", roman: "ta‘a", say: "تَعا", en: "Come here!", topic: "action", like: ["yalla"], tip: "To a girl or a woman: ta‘i." },
    { id: "rooh", text: "روح", roman: "rooH", en: "Go!", topic: "action", like: ["yalla"], tip: "To a girl or a woman: rooHi." },
    { id: "shoof", text: "شوف", roman: "shoof", en: "Look!", topic: "action", like: ["shoofi-mama"], tip: "To a girl or a woman: shoofi." },
    { id: "isma", text: "اسمع", roman: "isma‘", say: "إِسْمَع", en: "Listen!", art: "ear", topic: "action", tip: "To a girl or a woman: isma‘i." },
    {
      id: "yalla", text: "يلا", roman: "yalla", say: "يَلّا", en: "Come on! Let's go!", topic: "action", like: ["taa", "rooh", "yalla-bsura"],
      tip: "Family says yalla all day long.",
    },
    { id: "uud", text: "اقعد", roman: "u’‘ud", say: "أُأْعُد", en: "Sit down!", topic: "action", tip: "To a girl or a woman: u’‘udi." },
    { id: "oom", text: "قوم", roman: "’oom", say: "أوم", en: "Stand up! Get up!", topic: "action", tip: "To a girl or a woman: ’oomi." },
    { id: "khood", text: "خود", roman: "khood", en: "Take it!", topic: "action", like: ["tfaddal"], tip: "To a girl or a woman: khudi." },
    { id: "jiib", text: "جيب", roman: "jiib", en: "Bring it!", topic: "action", tip: "To a girl or a woman: jiibi." },
    { id: "bsura", text: "بسرعة", roman: "bsur‘a", say: "بْسُرْعة", en: "Quickly!", topic: "action", like: ["yalla-bsura"] },
    {
      id: "stanna-shway", text: "استنى شوي", roman: "stanna shway", say: "سْتَنّى شْوَيّ", en: "Wait a little!", topic: "action",
      words: [{ text: "استنى", roman: "stanna" }, { text: "شوي", roman: "shway" }],
      tip: "Wait is stanna. To a girl or Mama: stanni shway.",
    },
    {
      id: "shway-shway", text: "شوي شوي", roman: "shway shway", say: "شْوَيّ شْوَيّ", en: "Slowly, gently", topic: "action",
      words: [{ text: "شوي", roman: "shway" }, { text: "شوي", roman: "shway" }],
    },
    {
      id: "yalla-bsura", text: "يلا بسرعة", roman: "yalla bsur‘a", say: "يَلّا بْسُرْعة", en: "Come on, quick!", topic: "action",
      like: ["yalla", "bsura"],
      words: [{ text: "يلا", roman: "yalla" }, { text: "بسرعة", roman: "bsur‘a" }],
    },
    {
      id: "shoofi-mama", text: "شوفي ماما", roman: "shoofi maama", en: "Look, Mom!", topic: "action", like: ["shoof"],
      words: [{ text: "شوفي", roman: "shoofi" }, { text: "ماما", roman: "maama" }],
      tip: "To Baba: shoof baaba!",
    },
  ],
  scenes: [
    {
      id: "u09-car", setup: "Baba waits in the car. Your little cousin is so slow!", who: { name: "Cousin" },
      reply: ["yalla-bsura"], alsoOk: ["yalla", "bsura"],
    },
    {
      id: "u09-stairs", setup: "Your baby cousin runs down the stairs too fast.", who: { name: "Cousin" },
      reply: ["shway-shway"], alsoOk: ["stanna-shway"],
    },
    { id: "u09-rainbow", setup: "You see a rainbow out the window! Show Mama.", who: { name: "Mama" }, reply: ["shoofi-mama"], alsoOk: ["taa"] },
    { id: "u09-mama-hurry", setup: "Mama is at the door. You need one more minute.", who: { name: "Mama" }, line: "yalla-bsura", reply: ["stanna-shway"] },
    { id: "u09-jiddo-coin", setup: "Jiddo holds out a shiny coin for you.", who: { name: "Jiddo" }, line: "khood", reply: ["yislamo", "shukran"] },
    { id: "u09-cousin-sit", setup: "Your cousin visits. Ask him to sit next to you.", who: { name: "Cousin" }, reply: ["uud"], alsoOk: ["taa"] },
    { id: "u09-ice-cream", setup: "You hear the ice-cream van! Tell Baba to listen.", who: { name: "Baba" }, reply: ["isma"] },
  ],
};
