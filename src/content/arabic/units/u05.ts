// Unit 5 — I Want: asking for things — water, more, a little, enough — and
// asking others what they want.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U05: LangUnitPack = {
  unit: {
    name: "I Want",
    icon: iconRef("cup"),
    hue: "#60a5fa",
    blurb: "Ask for what you want.",
    souvenir: { icon: iconRef("cup"), name: "Jiddo's Water Cup" },
    lessons: [
      { name: "I Want", kind: "words", teach: ["biddi", "biddak", "biddik", "mayy"] },
      { name: "More or Enough?", kind: "words", teach: ["ma-biddi", "kamaan", "khalas", "shway", "ktiir"] },
      {
        name: "Water, Please!", kind: "talk",
        teach: ["biddi-mayy", "biddi-kamaan", "atiini-mayy-min-fadlik", "biddak-mayy"],
        scenes: ["u05-mama-cup", "u05-thirsty", "u05-more-juice", "u05-full", "u05-little-juice", "u05-cousin-crisps", "u05-ice-cream"],
      },
      {
        name: "Dhaal and Raa", kind: "letters", letters: ["ذ", "ر"], spell: ["ktiir", "kamaan"],
        mission: "At dinner, ask Mama: ‘aTiini mayy, min faDlik.",
      },
    ],
  },
  phrases: [
    { id: "biddi", text: "بدّي", roman: "biddi", say: "بِدّي", en: "I want", topic: "want", tip: "Some families say baddi." },
    {
      id: "biddak", text: "بدّك؟", roman: "biddak?", say: "بِدَّك", en: "Do you want? (to a boy)", topic: "want", like: ["biddik"],
      tip: "Ask a boy or a man this way.",
    },
    {
      id: "biddik", text: "بدِّك؟", roman: "biddik?", say: "بِدِّك", en: "Do you want? (to a girl)", topic: "want", like: ["biddak"],
      tip: "Ask a girl or a woman this way.",
    },
    { id: "mayy", text: "مي", roman: "mayy", say: "مَيّ", en: "Water", art: "cup", topic: "want", tip: "Some families say mayyeh." },
    {
      id: "ma-biddi", text: "ما بدّي", roman: "ma biddi", say: "ما بِدّي", en: "I don't want", topic: "want",
      words: [{ text: "ما", roman: "ma" }, { text: "بدّي", roman: "biddi" }],
      tip: "Add shukran to make it kind: ma biddi, shukran.",
    },
    { id: "kamaan", text: "كمان", roman: "kamaan", say: "كَمان", en: "More, also", topic: "want", like: ["biddi-kamaan", "kamaan-marra"] },
    { id: "khalas", text: "خلص", roman: "khalaS", say: "خَلَص", en: "Enough! All done!", topic: "want", like: ["ana-shabaan", "bass-heik"], tip: "Say it when you have had enough." },
    { id: "shway", text: "شوي", roman: "shway", say: "شْوَيّ", en: "A little bit", topic: "want" },
    { id: "ktiir", text: "كتير", roman: "ktiir", say: "كْتير", en: "A lot, very", topic: "want", tip: "shukran ktiir means thank you very much." },
    {
      id: "biddi-mayy", text: "بدّي مي", roman: "biddi mayy", say: "بِدّي مَيّ", en: "I want water", art: "cup", topic: "want",
      like: ["atiini-mayy-min-fadlik"],
      words: [{ text: "بدّي", roman: "biddi" }, { text: "مي", roman: "mayy" }],
    },
    {
      id: "biddi-kamaan", text: "بدّي كمان", roman: "biddi kamaan", say: "بِدّي كَمان", en: "I want more", topic: "want", like: ["kamaan"],
      words: [{ text: "بدّي", roman: "biddi" }, { text: "كمان", roman: "kamaan" }],
    },
    {
      id: "atiini-mayy-min-fadlik", text: "عطيني مي من فضلِك", roman: "‘aTiini mayy min faDlik", say: "عَطيني مَيّ مِن فَضْلِك",
      en: "Please give me water, Mom", art: "cup", topic: "want", like: ["biddi-mayy"],
      words: [{ text: "عطيني", roman: "‘aTiini" }, { text: "مي", roman: "mayy" }, { text: "من", roman: "min" }, { text: "فضلِك", roman: "faDlik" }],
      tip: "‘aTiini means give me. Some say a‘Tiini. To Baba: min faDlak.",
    },
    {
      id: "biddak-mayy", text: "بدّك مي؟", roman: "biddak mayy?", say: "بِدَّك مَيّ", en: "Do you want water? (boy)", art: "cup", topic: "want",
      words: [{ text: "بدّك", roman: "biddak" }, { text: "مي", roman: "mayy" }],
      tip: "Mama asks a boy this way. Answer: ee, or la’ shukran.",
    },
  ],
  scenes: [
    {
      id: "u05-mama-cup", setup: "You are thirsty. Mama holds up a cup and asks you.", who: { name: "Mama" },
      line: "biddak-mayy", reply: ["ee"], alsoOk: ["aah", "biddi-mayy", "atiini-mayy-min-fadlik", "shukran", "yislamo", "shway", "min-fadlik"],
    },
    {
      id: "u05-thirsty", setup: "You are thirsty. Mama is in the kitchen.", who: { name: "Mama" },
      reply: ["atiini-mayy-min-fadlik", "biddi-mayy"], alsoOk: ["mayy", "biddi"],
    },
    { id: "u05-more-juice", setup: "Teta's juice is yummy. Your cup is empty.", who: { name: "Teta" }, reply: ["biddi-kamaan"], alsoOk: ["kamaan", "biddi"] },
    {
      id: "u05-full", setup: "Teta keeps putting food on your plate. You are full!", who: { name: "Teta" },
      reply: ["khalas"], alsoOk: ["la-shukran", "ma-biddi", "la", "shukran", "yislamo"],
    },
    { id: "u05-little-juice", setup: "Baba pours you juice. You only want a bit.", who: { name: "Baba" }, reply: ["shway"], alsoOk: ["khalas"] },
    {
      id: "u05-cousin-crisps", setup: "Your cousin holds out his crisps. You love crisps!", who: { name: "Cousin" },
      line: "biddak", reply: ["ee"], alsoOk: ["aah", "biddi", "shukran", "yislamo", "shway", "min-fadlak"],
    },
    { id: "u05-ice-cream", setup: "Jiddo asks: a little ice cream, or a lot? You want lots!", who: { name: "Jiddo" }, reply: ["ktiir"], alsoOk: ["kamaan", "biddi-kamaan"] },
  ],
};
