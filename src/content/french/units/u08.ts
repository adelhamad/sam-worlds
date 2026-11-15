// Unit 8 — Je me sens. Feelings, what's the matter, I love you, a hug.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U08: LangUnitPack = {
  unit: {
    name: "Je me sens",
    icon: iconRef("heart"),
    hue: "#f472b6",
    blurb: "Say how you feel.",
    souvenir: { icon: iconRef("heart"), name: "Heart Sticker" },
    lessons: [
      { name: "Feelings", kind: "words", teach: ["content", "triste", "fatigue", "malade", "calin"] },
      { name: "What's the Matter?", kind: "words", teach: ["jai-peur", "rien", "je-taime", "moi-aussi", "qu-est-ce-qu-il-y-a"] },
      {
        name: "I Feel...", kind: "talk",
        teach: ["je-suis-content", "je-suis-triste", "je-suis-fatigue", "je-suis-malade"],
        scenes: ["dropped-ice-cream", "won-race", "late-night", "sick-day", "scary-dog", "love-you", "cheer-up"],
      },
      {
        name: "Spell Feelings", kind: "letters", spell: ["content", "triste", "fatigue", "malade", "calin"],
        mission: "Tell someone how you feel: \"Je suis content.\" Then give them a \"câlin\".",
      },
    ],
  },
  phrases: [
    { id: "content", text: "Content", en: "Happy (a boy)", topic: "feeling", like: ["je-suis-content"], tip: "A girl says contente. The n is soft." },
    { id: "triste", text: "Triste", en: "Sad", art: "sad", topic: "feeling", like: ["je-suis-triste"], tip: "Same for a boy and a girl." },
    { id: "fatigue", text: "Fatigué", en: "Tired (a boy)", art: "tired", topic: "feeling", like: ["je-suis-fatigue"], tip: "A girl says fatiguée. It sounds the same." },
    { id: "malade", text: "Malade", en: "Sick", art: "sick", topic: "feeling", like: ["je-suis-malade"], tip: "Same for a boy and a girl." },
    { id: "calin", text: "Câlin", en: "A hug", topic: "feeling", tip: "Ask for one: Un câlin?" },
    {
      id: "jai-peur", text: "J'ai peur.", en: "I'm scared", topic: "feeling",
      words: [{ text: "J'ai" }, { text: "peur" }], tip: "French says 'I have fear'. Peur sounds like 'purr'.",
    },
    { id: "rien", text: "Rien", en: "Nothing", topic: "feeling", tip: "Say it 'ree-an'. A shy answer to 'what's the matter?'" },
    {
      id: "je-taime", text: "Je t'aime.", en: "I love you", topic: "feeling",
      words: [{ text: "Je" }, { text: "t'aime" }], tip: "For family. Say it with a hug.",
    },
    {
      id: "moi-aussi", text: "Moi aussi.", en: "Me too", topic: "feeling",
      words: [{ text: "Moi" }, { text: "aussi" }], tip: "Say it after Je t'aime, or to agree.",
    },
    {
      id: "qu-est-ce-qu-il-y-a", text: "Qu'est-ce qu'il y a?", en: "What's the matter?", topic: "feeling",
      words: [{ text: "Qu'est-ce" }, { text: "qu'il" }, { text: "y" }, { text: "a" }], tip: "Said when someone looks upset. Say it kindly.",
    },
    {
      id: "je-suis-content", text: "Je suis content.", en: "I am happy", topic: "feeling", like: ["content"],
      words: [{ text: "Je" }, { text: "suis" }, { text: "content" }], tip: "A girl says: Je suis contente.",
    },
    {
      id: "je-suis-triste", text: "Je suis triste.", en: "I am sad", topic: "feeling", like: ["triste"],
      words: [{ text: "Je" }, { text: "suis" }, { text: "triste" }], tip: "Same for a boy and a girl.",
    },
    {
      id: "je-suis-fatigue", text: "Je suis fatigué.", en: "I am tired", topic: "feeling", like: ["fatigue"],
      words: [{ text: "Je" }, { text: "suis" }, { text: "fatigué" }], tip: "A girl says: Je suis fatiguée.",
    },
    {
      id: "je-suis-malade", text: "Je suis malade.", en: "I am sick", topic: "feeling", like: ["malade"],
      words: [{ text: "Je" }, { text: "suis" }, { text: "malade" }], tip: "Same for a boy and a girl.",
    },
  ],
  scenes: [
    {
      id: "dropped-ice-cream", setup: "You dropped your ice cream. Maman asks what's the matter.", who: { name: "Maman" }, line: "qu-est-ce-qu-il-y-a",
      reply: ["je-suis-triste", "triste"], alsoOk: ["rien", "calin"],
    },
    {
      id: "won-race", setup: "You won the race! Léa asks how you feel.", who: { name: "Léa" },
      reply: ["je-suis-content", "content"], alsoOk: ["ca-va-bien", "ca-va-bien-et-toi"],
    },
    {
      id: "late-night", setup: "It is very late. You can hardly keep your eyes open.", who: { name: "Papa" },
      reply: ["je-suis-fatigue", "fatigue"], alsoOk: ["bonne-nuit", "je-suis-malade", "malade", "calin"],
    },
    {
      id: "sick-day", setup: "You have a fever. Maman feels your forehead.", who: { name: "Maman" },
      reply: ["je-suis-malade", "malade"], alsoOk: ["je-suis-fatigue", "fatigue", "je-suis-triste", "triste", "calin", "maman"],
    },
    { id: "scary-dog", setup: "A big dog barks loudly at you in the park.", who: { name: "Papa" }, reply: ["jai-peur"], alsoOk: ["calin", "maman", "papa"] },
    {
      id: "love-you", setup: "Maman tucks you in and tells you something sweet.", who: { name: "Maman" }, line: "je-taime",
      reply: ["moi-aussi", "je-taime"], alsoOk: ["merci", "calin", "bonne-nuit"],
    },
    {
      id: "cheer-up", setup: "Your friend Léa is crying. You want to comfort her.", who: { name: "Léa" },
      reply: ["calin", "qu-est-ce-qu-il-y-a"], alsoOk: ["je-taime", "triste", "ca-va", "ce-nest-pas-grave", "desole"],
    },
  ],
};
