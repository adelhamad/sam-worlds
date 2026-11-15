// Unit 4 — Ma famille. Mum, dad, grandparents, and "this is my...".
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U04: LangUnitPack = {
  unit: {
    name: "Ma famille",
    icon: iconRef("family"),
    hue: "#8be28b",
    blurb: "Say who is who in your family.",
    souvenir: { icon: iconRef("home"), name: "Family Photo" },
    lessons: [
      { name: "Maman et Papa", kind: "words", teach: ["maman", "papa", "frere", "soeur", "bebe"] },
      { name: "Mamie et Papi", kind: "words", teach: ["mamie", "papi", "oncle", "tante", "cousin"] },
      {
        name: "This Is My...", kind: "talk",
        teach: ["c-est-mon-frere", "c-est-ma-cousine", "jai-un-frere", "jai-une-soeur"],
        scenes: ["see-papa", "who-brother", "cousin-park", "grandma-door", "has-sister", "has-brother", "uncle-visit"],
      },
      {
        name: "Spell Family", kind: "letters", spell: ["maman", "papa", "frere", "mamie", "tante"],
        mission: "Call \"Maman!\" and \"Papa!\" in your best French voice today.",
      },
    ],
  },
  phrases: [
    { id: "maman", text: "Maman", en: "Mum", topic: "family", tip: "Say ma-MAHN. The end goes through the nose." },
    { id: "papa", text: "Papa", en: "Dad", topic: "family", tip: "Say it pa-PA." },
    { id: "frere", text: "Frère", en: "Brother", topic: "family", tip: "Sounds like 'frair'." },
    { id: "soeur", text: "Sœur", en: "Sister", topic: "family", tip: "Sounds like 'sur'." },
    { id: "bebe", text: "Bébé", en: "Baby", topic: "family", tip: "Both é sound like 'ay'." },
    { id: "mamie", text: "Mamie", en: "Grandma", topic: "family", tip: "What kids say. Also grand-mère." },
    { id: "papi", text: "Papi", en: "Grandpa", topic: "family", tip: "What kids say. Also grand-père." },
    { id: "oncle", text: "Oncle", en: "Uncle", topic: "family", tip: "Kids also say tonton." },
    { id: "tante", text: "Tante", en: "Aunt", topic: "family", tip: "Kids also say tata." },
    { id: "cousin", text: "Cousin", en: "Cousin (a boy)", topic: "family", tip: "A girl cousin is a cousine." },
    {
      id: "c-est-mon-frere", text: "C'est mon frère.", en: "This is my brother", topic: "family",
      words: [{ text: "C'est" }, { text: "mon" }, { text: "frère" }], tip: "Mon goes with boy words, ma with girl words.",
    },
    {
      id: "c-est-ma-cousine", text: "C'est ma cousine.", en: "This is my girl cousin", topic: "family",
      words: [{ text: "C'est" }, { text: "ma" }, { text: "cousine" }], tip: "Ma goes with girl words, like sœur.",
    },
    {
      id: "jai-un-frere", text: "J'ai un frère.", en: "I have a brother", topic: "family",
      words: [{ text: "J'ai" }, { text: "un" }, { text: "frère" }], tip: "Un goes with boy words.",
    },
    {
      id: "jai-une-soeur", text: "J'ai une sœur.", en: "I have a sister", topic: "family",
      words: [{ text: "J'ai" }, { text: "une" }, { text: "sœur" }], tip: "Une goes with girl words.",
    },
  ],
  scenes: [
    {
      id: "see-papa", setup: "You spot Papa across the street. Call out to him.", who: { name: "Papa" },
      reply: ["papa"], alsoOk: ["salut", "coucou", "bonjour", "salut-ca-va", "ca-va"],
    },
    {
      id: "who-brother", setup: "A friend points at your big brother. Who is he?", who: { name: "Léa" },
      reply: ["c-est-mon-frere"], alsoOk: ["frere"],
    },
    {
      id: "cousin-park", setup: "At the park, Léa asks who Zoé is. She is your cousin.", who: { name: "Léa" },
      reply: ["c-est-ma-cousine"],
    },
    {
      id: "grandma-door", setup: "Grandma arrives at the door with a big hug.", who: { name: "Grandma" },
      reply: ["mamie"], alsoOk: ["salut", "coucou", "bonjour", "bonsoir", "salut-ca-va", "ca-va"],
    },
    { id: "has-sister", setup: "Léa asks if you have a sister. You do.", who: { name: "Léa" }, reply: ["jai-une-soeur"], alsoOk: ["oui"] },
    { id: "has-brother", setup: "Hugo asks if you have a brother. You do.", who: { name: "Hugo" }, reply: ["jai-un-frere"], alsoOk: ["oui"] },
    {
      id: "uncle-visit", setup: "Your mum's brother visits. What do you call him?", who: { name: "Uncle" },
      reply: ["oncle"], alsoOk: ["salut", "coucou", "bonjour", "salut-ca-va", "ca-va"],
    },
  ],
};
