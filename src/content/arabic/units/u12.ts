// Unit 12 — Colours and Sizes: six colours, big and small, pretty, "what
// colour is it?" and "I like…".
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U12: LangUnitPack = {
  unit: {
    name: "Colours and Sizes",
    icon: iconRef("palette"),
    hue: "#e879f9",
    blurb: "Colours, big and small.",
    souvenir: { icon: iconRef("palette"), name: "Rainbow Paint Box" },
    lessons: [
      { name: "Red and Blue", kind: "words", teach: ["ahmar", "azra", "akhdar", "asfar", "abyad"] },
      { name: "Big and Small", kind: "words", teach: ["aswad", "kbiir", "zghiir", "helw"] },
      {
        name: "I Like Blue", kind: "talk",
        teach: ["shu-loono", "bhebb-il-azra", "ktiir-helw", "ana-kbiir"],
        scenes: ["u12-balloon", "u12-dress", "u12-favourite", "u12-grass", "u12-grown", "u12-baby", "u12-crayon"],
      },
      {
        name: "Laam and Miim", kind: "letters", letters: ["ل", "م"], spell: ["helw", "mama"],
        mission: "Point at something and ask someone at home: shu loono?",
      },
    ],
  },
  phrases: [
    { id: "ahmar", text: "أحمر", roman: "aHmar", say: "أَحْمَر", en: "Red", art: "blob-red", topic: "colour", tip: "With some words it becomes Hamra." },
    { id: "azra", text: "أزرق", roman: "azra’", say: "أَزْرَء", en: "Blue", art: "blob-blue", topic: "colour", tip: "With some words it becomes zar’a." },
    { id: "akhdar", text: "أخضر", roman: "akhDar", say: "أَخْضَر", en: "Green", art: "blob-green", topic: "colour", tip: "With some words it becomes khaDra." },
    { id: "asfar", text: "أصفر", roman: "aSfar", say: "أَصْفَر", en: "Yellow", art: "blob-yellow", topic: "colour", tip: "With some words it becomes Safra." },
    { id: "abyad", text: "أبيض", roman: "abyaD", say: "أَبْيَض", en: "White", art: "blob-white", topic: "colour", tip: "With some words it becomes beiDa." },
    { id: "aswad", text: "أسود", roman: "aswad", say: "أَسْوَد", en: "Black", art: "blob-black", topic: "colour", tip: "With some words it becomes sooda." },
    { id: "kbiir", text: "كبير", roman: "kbiir", say: "كْبير", en: "Big", topic: "colour", like: ["ana-kbiir"], tip: "For a girl: kbiira." },
    { id: "zghiir", text: "زغير", roman: "zghiir", say: "زْغير", en: "Small", topic: "colour", tip: "Some families say Sghiir. For a girl: zghiira." },
    {
      id: "helw", text: "حلو", roman: "Hilu", say: "حِلُو", en: "Pretty, lovely", topic: "colour", like: ["ktiir-helw", "tayybeh"],
      tip: "It also means sweet. For a girl: Hilweh.",
    },
    {
      id: "shu-loono", text: "شو لونه؟", roman: "shu loono?", say: "شو لونو", en: "What colour is it?", art: "palette", topic: "colour",
      words: [{ text: "شو", roman: "shu" }, { text: "لونه", roman: "loono" }],
    },
    {
      id: "bhebb-il-azra", text: "بحب الأزرق", roman: "bHibb il-azra’", say: "بْحِبّ الأَزْرَء", en: "I like blue", topic: "colour",
      words: [{ text: "بحب", roman: "bHibb" }, { text: "الأزرق", roman: "il-azra’" }],
      tip: "Say your colour: bHibb il-aHmar. Not for you? ma bHibb.",
    },
    {
      id: "ktiir-helw", text: "كتير حلو", roman: "ktiir Hilu", say: "كْتير حِلُو", en: "So pretty!", topic: "colour", like: ["helw"],
      words: [{ text: "كتير", roman: "ktiir" }, { text: "حلو", roman: "Hilu" }],
    },
    {
      id: "ana-kbiir", text: "أنا كبير", roman: "ana kbiir", say: "أَنا كْبير", en: "I'm big!", topic: "colour", like: ["kbiir"],
      words: [{ text: "أنا", roman: "ana" }, { text: "كبير", roman: "kbiir" }],
      tip: "A girl says: ana kbiira.",
    },
  ],
  scenes: [
    { id: "u12-balloon", setup: "Teta holds up a red balloon and asks you.", who: { name: "Teta" }, line: "shu-loono", reply: ["ahmar"] },
    { id: "u12-dress", setup: "Mama shows you her new dress.", who: { name: "Mama" }, reply: ["ktiir-helw"], alsoOk: ["helw"] },
    {
      id: "u12-favourite", setup: "Baba asks which colour you like best. You love blue!", who: { name: "Baba" },
      reply: ["bhebb-il-azra"], alsoOk: ["azra"],
    },
    { id: "u12-grass", setup: "Your cousin points at the grass and asks you.", who: { name: "Cousin" }, line: "shu-loono", reply: ["akhdar"] },
    { id: "u12-grown", setup: "Jiddo says you have grown so tall! Tell him.", who: { name: "Jiddo" }, reply: ["ana-kbiir"], alsoOk: ["kbiir"] },
    { id: "u12-baby", setup: "Teta points at your tiny baby cousin. Big or small?", who: { name: "Teta" }, reply: ["zghiir"] },
    { id: "u12-crayon", setup: "Your friend hides a crayon behind his back. Ask its colour.", who: { name: "Friend" }, reply: ["shu-loono"] },
  ],
};
