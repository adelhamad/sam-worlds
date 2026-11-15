// Unit 7 — Un, deux, trois. Numbers one to twelve and how many / how old.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U07: LangUnitPack = {
  unit: {
    name: "Un, deux, trois",
    icon: iconRef("abacus"),
    hue: "#5b8cff",
    blurb: "Count from one to twelve.",
    souvenir: { icon: iconRef("dice"), name: "Lucky Dice" },
    lessons: [
      { name: "One to Six", kind: "words", teach: ["un", "deux", "trois", "quatre", "cinq", "six"] },
      { name: "Seven to Twelve", kind: "words", teach: ["sept", "huit", "neuf", "dix", "onze", "douze"] },
      {
        name: "Count With Me", kind: "talk",
        teach: ["combien", "un-deux-trois-partez", "il-a-quel-age", "mon-cousin-a-neuf-ans", "je-veux-deux-pommes"],
        scenes: ["four-fingers", "age-again", "cousin-age", "hide-seek", "race-start", "two-apples", "cookie-tin"],
      },
      {
        name: "Spell Numbers", kind: "letters", spell: ["deux", "trois", "quatre", "cinq", "douze"],
        mission: "Count to twelve in French out loud. Then ask someone \"Tu as quel âge?\"",
      },
    ],
  },
  phrases: [
    { id: "un", text: "Un", en: "One", art: "dots-1", topic: "number", tip: "Say 'uh', through the nose." },
    { id: "deux", text: "Deux", en: "Two", art: "dots-2", topic: "number", tip: "Say 'duh'." },
    { id: "trois", text: "Trois", en: "Three", art: "dots-3", topic: "number", tip: "Say 'trwah'. The s is silent." },
    { id: "quatre", text: "Quatre", en: "Four", art: "dots-4", topic: "number", tip: "Say 'katr'." },
    { id: "cinq", text: "Cinq", en: "Five", art: "dots-5", topic: "number", tip: "Say 'sank'." },
    { id: "six", text: "Six", en: "Six", art: "dots-6", topic: "number", tip: "Say 'seess'." },
    { id: "sept", text: "Sept", en: "Seven", art: "dots-7", topic: "number", tip: "The p is silent. Say 'set'." },
    { id: "huit", text: "Huit", en: "Eight", art: "dots-8", topic: "number", tip: "Say 'weet'." },
    { id: "neuf", text: "Neuf", en: "Nine", art: "dots-9", topic: "number", tip: "Say 'nuhf'." },
    { id: "dix", text: "Dix", en: "Ten", art: "dots-10", topic: "number", tip: "Say 'deess'." },
    { id: "onze", text: "Onze", en: "Eleven", topic: "number", tip: "Say 'onz'." },
    { id: "douze", text: "Douze", en: "Twelve", topic: "number", tip: "Say 'dooz'." },
    { id: "combien", text: "Combien?", en: "How many?", topic: "number", like: ["combien-ca-coute"], tip: "Say 'kom-BYAN'." },
    {
      id: "un-deux-trois-partez", text: "Un, deux, trois, partez!", en: "One, two, three, go!", topic: "number",
      words: [{ text: "Un" }, { text: "deux" }, { text: "trois" }, { text: "partez" }], tip: "Shout it at the start of a race.",
    },
    {
      id: "il-a-quel-age", text: "Il a quel âge?", en: "How old is he?", topic: "number",
      words: [{ text: "Il" }, { text: "a" }, { text: "quel" }, { text: "âge" }], tip: "About a boy. About a girl: Elle a quel âge?",
    },
    {
      id: "mon-cousin-a-neuf-ans", text: "Mon cousin a neuf ans.", en: "My cousin is nine", topic: "number",
      words: [{ text: "Mon" }, { text: "cousin" }, { text: "a" }, { text: "neuf" }, { text: "ans" }], tip: "French says 'my cousin has nine years'. Say 'neu-VAHN'.",
    },
    {
      id: "je-veux-deux-pommes", text: "Je veux deux pommes.", en: "I want two apples", art: "apple", topic: "number",
      words: [{ text: "Je" }, { text: "veux" }, { text: "deux" }, { text: "pommes" }], tip: "More than one apple: pommes. The s is silent.",
    },
  ],
  scenes: [
    {
      id: "four-fingers", setup: "Léa holds up four fingers and asks.", who: { name: "Léa" }, line: "combien",
      reply: ["quatre"],
    },
    {
      id: "age-again", setup: "Hugo's mum asks how old you are.", who: { name: "Hugo's mum" }, line: "tu-as-quel-age",
      reply: ["jai-sept-ans"], alsoOk: ["sept"],
    },
    {
      id: "cousin-age", setup: "Léa asks about your cousin. He is nine.", who: { name: "Léa" }, line: "il-a-quel-age",
      reply: ["mon-cousin-a-neuf-ans"], alsoOk: ["neuf"],
    },
    {
      id: "hide-seek", setup: "Hide and seek! Léa counts: huit, neuf... and then?", who: { name: "Léa" },
      reply: ["dix"],
    },
    {
      id: "race-start", setup: "You and Hugo are about to race. You start it.", who: { name: "Hugo" },
      reply: ["un-deux-trois-partez"],
    },
    {
      id: "two-apples", setup: "Maman asks how many apples you want. Two!", who: { name: "Maman" },
      reply: ["je-veux-deux-pommes", "deux"], alsoOk: ["je-veux", "je-voudrais"],
    },
    {
      id: "cookie-tin", setup: "Papa asks how many cookies are in the tin. Twelve!", who: { name: "Papa" }, line: "combien",
      reply: ["douze"],
    },
  ],
};
