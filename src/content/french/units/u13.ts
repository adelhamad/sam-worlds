// Unit 13 — L'école. School words, and what to say to the teacher and friends.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U13: LangUnitPack = {
  unit: {
    name: "L'école",
    icon: iconRef("school"),
    hue: "#f97316",
    blurb: "Everything for school days.",
    souvenir: { icon: iconRef("backpack"), name: "Tiny Backpack" },
    lessons: [
      { name: "School Stuff", kind: "words", teach: ["ecole", "livre", "crayon", "recre", "devoirs"] },
      {
        name: "Teacher Talk", kind: "words",
        teach: ["maitresse", "maitre", "je-comprends", "je-ne-comprends-pas", "vous-pouvez-repeter"],
      },
      {
        name: "In Class", kind: "talk",
        teach: ["bonjour-maitresse", "tu-peux-repeter", "c-est-la-recre", "jai-des-devoirs"],
        scenes: ["arrive-school", "got-it", "lost", "repeat-teacher", "repeat-friend", "recess", "homework"],
      },
      {
        name: "Spell School", kind: "letters", spell: ["ecole", "livre", "crayon", "recre", "devoirs"],
        mission: "Say \"Je ne comprends pas\" if something is tricky. Then ask \"Tu peux répéter?\"",
      },
    ],
  },
  phrases: [
    { id: "ecole", text: "École", en: "School", art: "school", topic: "school", tip: "Say 'ay-KOL'." },
    { id: "livre", text: "Livre", en: "Book", art: "book", topic: "school", tip: "Say 'leevr'." },
    { id: "crayon", text: "Crayon", en: "Pencil", art: "pencil", topic: "school", tip: "Say 'kray-YON'." },
    { id: "recre", text: "Récré", en: "Break time", topic: "school", tip: "Short for récréation. What kids say." },
    { id: "devoirs", text: "Devoirs", en: "Homework", topic: "school", tip: "Say 'duh-VWAHR'. The s is silent." },
    { id: "maitresse", text: "Maîtresse", en: "Teacher (a woman)", topic: "school", like: ["maitre"], tip: "What primary kids call a woman teacher." },
    { id: "maitre", text: "Maître", en: "Teacher (a man)", topic: "school", like: ["maitresse"], tip: "What primary kids call a man teacher." },
    {
      id: "je-comprends", text: "Je comprends.", en: "I understand", topic: "school",
      words: [{ text: "Je" }, { text: "comprends" }], tip: "The ds at the end is silent.",
    },
    {
      id: "je-ne-comprends-pas", text: "Je ne comprends pas.", en: "I don't understand", topic: "school",
      words: [{ text: "Je" }, { text: "ne" }, { text: "comprends" }, { text: "pas" }], tip: "Kids often say Je comprends pas.",
    },
    {
      id: "vous-pouvez-repeter", text: "Vous pouvez répéter?", en: "Can you say it again? (teacher)", topic: "school",
      like: ["tu-peux-repeter"],
      words: [{ text: "Vous" }, { text: "pouvez" }, { text: "répéter" }], tip: "For a teacher or grown-up. To a friend: Tu peux répéter?",
    },
    {
      id: "bonjour-maitresse", text: "Bonjour, maîtresse.", en: "Hello, teacher", topic: "school",
      words: [{ text: "Bonjour" }, { text: "maîtresse" }], tip: "Say Bonjour, maître to a man.",
    },
    {
      id: "tu-peux-repeter", text: "Tu peux répéter?", en: "Can you say it again? (friend)", topic: "school",
      like: ["vous-pouvez-repeter"],
      words: [{ text: "Tu" }, { text: "peux" }, { text: "répéter" }], tip: "For a friend. To a teacher: Vous pouvez répéter?",
    },
    {
      id: "c-est-la-recre", text: "C'est la récré!", en: "It's break time!", topic: "school",
      words: [{ text: "C'est" }, { text: "la" }, { text: "récré" }], tip: "Shout it when the bell rings.",
    },
    {
      id: "jai-des-devoirs", text: "J'ai des devoirs.", en: "I have homework", topic: "school",
      words: [{ text: "J'ai" }, { text: "des" }, { text: "devoirs" }], tip: "Des means 'some'. Say 'day'.",
    },
  ],
  scenes: [
    {
      id: "arrive-school", setup: "Monday morning. Your teacher waits at the classroom door.", who: { name: "Teacher" },
      reply: ["bonjour-maitresse"], alsoOk: ["bonjour", "salut"],
    },
    {
      id: "got-it", setup: "The teacher explains a sum. You get it right away!", who: { name: "Teacher" },
      reply: ["je-comprends"], alsoOk: ["oui", "super", "bravo"],
    },
    {
      id: "lost", setup: "The teacher explains something tricky. You are lost.", who: { name: "Teacher" },
      reply: ["je-ne-comprends-pas"], alsoOk: ["vous-pouvez-repeter", "tu-peux-repeter", "pardon", "excusez-moi", "doucement", "non"],
    },
    {
      id: "repeat-teacher", setup: "The teacher speaks very fast. Ask her to say it again.", who: { name: "Teacher" },
      reply: ["vous-pouvez-repeter"], alsoOk: ["tu-peux-repeter", "pardon", "excusez-moi", "je-ne-comprends-pas", "doucement", "attends"],
    },
    {
      id: "repeat-friend", setup: "Your friend Léa whispers something. You did not hear.", who: { name: "Léa" },
      reply: ["tu-peux-repeter"], alsoOk: ["vous-pouvez-repeter", "pardon", "je-ne-comprends-pas"],
    },
    {
      id: "recess", setup: "The school bell rings. Time to play outside!", who: { name: "Hugo" },
      reply: ["c-est-la-recre"], alsoOk: ["on-y-va", "super", "on-joue", "on-joue-au-ballon", "vite", "viens", "viens-ici", "recre", "avec-moi"],
    },
    {
      id: "homework", setup: "Maman asks if you have homework tonight. You do.", who: { name: "Maman" },
      reply: ["jai-des-devoirs"], alsoOk: ["oui", "devoirs", "je-suis-fatigue"],
    },
  ],
};
