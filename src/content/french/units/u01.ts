// Unit 1 — Salut! The first things Sam can say to a French-speaking friend:
// hi, how are you, goodbye, good night.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U01: LangUnitPack = {
  unit: {
    name: "Salut!",
    icon: iconRef("hand"),
    hue: "#ff7a90",
    blurb: "Say hi and bye like a French kid.",
    souvenir: { icon: iconRef("tower"), name: "Paris Postcard" },
    lessons: [
      { name: "Say Hi", kind: "words", teach: ["salut", "coucou", "bonjour", "bonsoir", "ca-va"] },
      { name: "Fine, and You?", kind: "words", teach: ["ca-va-bien", "et-toi", "au-revoir", "a-demain", "bonne-nuit"] },
      {
        name: "Meet a Friend", kind: "talk",
        teach: ["salut-ca-va", "ca-va-bien-et-toi", "au-revoir-a-demain"],
        scenes: ["school-gate", "friend-asks", "evening-door", "park-bye", "bedtime", "cousin-calls"],
      },
      {
        name: "Spell Hello", kind: "letters", spell: ["salut", "coucou", "bonjour", "bonsoir"],
        mission: "Say \"Salut, ça va?\" to someone at home. Then say \"Bonne nuit\" at bedtime.",
      },
    ],
  },
  phrases: [
    { id: "salut", text: "Salut", en: "Hi!", topic: "greeting", like: ["coucou", "bonjour"], tip: "For friends and family. It also means bye. The t is silent." },
    { id: "coucou", text: "Coucou", en: "Hey there!", topic: "greeting", like: ["salut", "bonjour"], tip: "A cheerful hi for friends and family." },
    { id: "bonjour", text: "Bonjour", en: "Hello", topic: "greeting", like: ["salut", "coucou"], tip: "Fine for everyone, all day until evening." },
    { id: "bonsoir", text: "Bonsoir", en: "Good evening", topic: "greeting", tip: "Say it when you meet someone in the evening." },
    {
      id: "ca-va", text: "Ça va?", en: "How are you?", topic: "greeting", like: ["salut-ca-va"],
      words: [{ text: "Ça" }, { text: "va" }], tip: "Friends say it a lot. Answer: Ça va bien.",
    },
    {
      id: "ca-va-bien", text: "Ça va bien.", en: "I'm doing well", topic: "greeting", like: ["ca-va-bien-et-toi"],
      words: [{ text: "Ça" }, { text: "va" }, { text: "bien" }], tip: "The answer to Ça va? The n in bien is soft.",
    },
    { id: "et-toi", text: "Et toi?", en: "And you?", topic: "greeting", words: [{ text: "Et" }, { text: "toi" }], tip: "Ask it back after you answer." },
    {
      id: "au-revoir", text: "Au revoir", en: "Goodbye", topic: "greeting", like: ["a-demain", "au-revoir-a-demain"],
      words: [{ text: "Au" }, { text: "revoir" }], tip: "Say it to everybody when you leave.",
    },
    {
      id: "a-demain", text: "À demain", en: "See you tomorrow", topic: "greeting", like: ["au-revoir", "au-revoir-a-demain"],
      words: [{ text: "À" }, { text: "demain" }], tip: "Say it when you will meet again tomorrow.",
    },
    { id: "bonne-nuit", text: "Bonne nuit", en: "Good night", topic: "greeting", words: [{ text: "Bonne" }, { text: "nuit" }], tip: "Say it at bedtime, with a big kiss." },
    {
      id: "salut-ca-va", text: "Salut, ça va?", en: "Hi, how are you?", topic: "greeting", like: ["ca-va"],
      words: [{ text: "Salut" }, { text: "ça" }, { text: "va" }], tip: "Say hi and ask in one go.",
    },
    {
      id: "ca-va-bien-et-toi", text: "Ça va bien, et toi?", en: "Fine, and you?", topic: "greeting", like: ["ca-va-bien"],
      words: [{ text: "Ça" }, { text: "va" }, { text: "bien" }, { text: "et" }, { text: "toi" }], tip: "A friendly answer that asks back.",
    },
    {
      id: "au-revoir-a-demain", text: "Au revoir, à demain!", en: "Bye, see you tomorrow!", topic: "greeting", like: ["au-revoir", "a-demain"],
      words: [{ text: "Au" }, { text: "revoir" }, { text: "à" }, { text: "demain" }], tip: "Perfect at the school gate.",
    },
  ],
  scenes: [
    {
      id: "school-gate", setup: "Monday morning. You see your friend Léa at the school gate.", who: { name: "Léa" },
      reply: ["salut", "coucou", "bonjour"], alsoOk: ["salut-ca-va", "ca-va"],
    },
    {
      id: "friend-asks", setup: "Léa smiles and asks how you are.", who: { name: "Léa" }, line: "ca-va",
      reply: ["ca-va-bien", "ca-va-bien-et-toi"], alsoOk: ["ca-va", "et-toi"],
    },
    {
      id: "evening-door", setup: "It is evening. Léa's dad opens the door.", who: { name: "Léa's dad" },
      reply: ["bonsoir"], alsoOk: ["bonjour", "salut", "coucou", "salut-ca-va"],
    },
    {
      id: "park-bye", setup: "Time to go home from the park. You will play again tomorrow.", who: { name: "Léa" },
      reply: ["a-demain", "au-revoir-a-demain", "au-revoir"], alsoOk: ["salut"],
    },
    { id: "bedtime", setup: "Bedtime. Maman gives you a kiss.", who: { name: "Maman" }, line: "bonne-nuit", reply: ["bonne-nuit"], alsoOk: ["a-demain"] },
    {
      id: "cousin-calls", setup: "Your cousin waves from across the street.", who: { name: "Your cousin" }, line: "salut-ca-va",
      reply: ["ca-va-bien-et-toi", "ca-va-bien"], alsoOk: ["ca-va", "salut", "coucou", "et-toi", "bonjour"],
    },
  ],
};
