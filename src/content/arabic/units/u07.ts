// Unit 7 — One to Ten: counting the way family counts out loud — stairs,
// cookies, fingers — and asking "how many?" and "how old?".
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U07: LangUnitPack = {
  unit: {
    name: "One to Ten",
    icon: iconRef("abacus"),
    hue: "#facc15",
    blurb: "Count to ten with Jiddo.",
    souvenir: { icon: iconRef("beads"), name: "Jiddo's Counting Beads" },
    lessons: [
      { name: "One to Five", kind: "words", teach: ["waahad", "tnein", "tlaateh", "arbaa", "khamseh"] },
      { name: "Six to Ten", kind: "words", teach: ["sitteh", "saba", "tmaanyeh", "tisaa", "ashra"] },
      {
        name: "How Many?", kind: "talk",
        teach: ["kam-waahad", "biddi-tnein", "yalla-nidd", "umrik-addeish"],
        scenes: ["u07-stairs", "u07-cookies", "u07-cousin-age", "u07-park-girl", "u07-hide-seek", "u07-fingers", "u07-eggs"],
      },
      {
        name: "Shiin and Saad", kind: "letters", letters: ["ش", "ص"], spell: ["shway", "khalas"],
        mission: "Count to ten for someone at home: waaHad, tnein, tlaateh…",
      },
    ],
  },
  phrases: [
    { id: "waahad", text: "واحد", roman: "waaHad", say: "واحَد", en: "One", topic: "number" },
    { id: "tnein", text: "تنين", roman: "tnein", say: "تْنين", en: "Two", topic: "number", tip: "Some families say itnein." },
    { id: "tlaateh", text: "تلاتة", roman: "tlaateh", say: "تْلاتة", en: "Three", topic: "number" },
    { id: "arbaa", text: "أربعة", roman: "arba‘a", say: "أَرْبَعة", en: "Four", topic: "number" },
    { id: "khamseh", text: "خمسة", roman: "khamseh", say: "خَمْسة", en: "Five", topic: "number" },
    { id: "sitteh", text: "ستة", roman: "sitteh", say: "سِتّة", en: "Six", topic: "number" },
    { id: "saba", text: "سبعة", roman: "sab‘a", say: "سَبْعة", en: "Seven", topic: "number", tip: "Seven years old is sab‘ sniin." },
    { id: "tmaanyeh", text: "تمانية", roman: "tmaanyeh", say: "تْمانْيِة", en: "Eight", topic: "number", tip: "Some families say tmeneh." },
    { id: "tisaa", text: "تسعة", roman: "tis‘a", say: "تِسْعة", en: "Nine", topic: "number" },
    { id: "ashra", text: "عشرة", roman: "‘ashra", say: "عَشْرة", en: "Ten", topic: "number" },
    {
      id: "kam-waahad", text: "كم واحد؟", roman: "kam waaHad?", say: "كَم واحَد", en: "How many?", topic: "number",
      words: [{ text: "كم", roman: "kam" }, { text: "واحد", roman: "waaHad" }],
      tip: "Answer with a number: tlaateh!",
    },
    {
      id: "biddi-tnein", text: "بدّي تنين", roman: "biddi tnein", say: "بِدّي تْنين", en: "I want two", topic: "number",
      words: [{ text: "بدّي", roman: "biddi" }, { text: "تنين", roman: "tnein" }],
    },
    {
      id: "yalla-nidd", text: "يلا نعدّ", roman: "yalla n‘idd", say: "يَلّا نْعِدّ", en: "Let's count!", topic: "number",
      words: [{ text: "يلا", roman: "yalla" }, { text: "نعدّ", roman: "n‘idd" }],
    },
    {
      id: "umrik-addeish", text: "عمرِك قدّيش؟", roman: "‘umrik ’addeish?", say: "عُمْرِك أَدّيش", en: "How old are you? (girl)", topic: "me",
      like: ["umrak-addeish"],
      words: [{ text: "عمرِك", roman: "‘umrik" }, { text: "قدّيش", roman: "’addeish" }],
      tip: "Ask a girl or a woman this way.",
    },
  ],
  scenes: [
    { id: "u07-stairs", setup: "Jiddo counts the stairs: one, two, three. What comes next?", who: { name: "Jiddo" }, reply: ["arbaa"] },
    { id: "u07-cookies", setup: "Mama opens the cookie box. You want three!", who: { name: "Mama" }, line: "kam-waahad", reply: ["tlaateh"] },
    {
      id: "u07-cousin-age", setup: "Your little cousin looks up at you and asks.", who: { name: "Cousin" },
      line: "umrak-addeish", reply: ["umri-sab-sniin"], alsoOk: ["saba"],
    },
    { id: "u07-park-girl", setup: "A girl at the park is as tall as you. Ask her age.", who: { name: "A girl" }, reply: ["umrik-addeish"] },
    {
      id: "u07-hide-seek", setup: "Hide and seek! Ask your cousins to count with you.", who: { name: "Cousins" },
      reply: ["yalla-nidd"], alsoOk: ["waahad"],
    },
    { id: "u07-fingers", setup: "Baba holds up all his fingers and asks you.", who: { name: "Baba" }, line: "kam-waahad", reply: ["ashra"] },
    { id: "u07-eggs", setup: "Teta asks how many eggs you want. Just two!", who: { name: "Teta" }, reply: ["biddi-tnein"], alsoOk: ["tnein"] },
  ],
};
