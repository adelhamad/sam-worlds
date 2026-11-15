// Unit 15 — Dehors. Weather, animals and the park.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U15: LangUnitPack = {
  unit: {
    name: "Dehors",
    icon: iconRef("tree"),
    hue: "#34d399",
    blurb: "Talk about weather and outside.",
    souvenir: { icon: iconRef("flower"), name: "Pressed Flower" },
    lessons: [
      { name: "Sun and Rain", kind: "words", teach: ["soleil", "pluie", "chaud", "froid", "dehors"] },
      { name: "Park Friends", kind: "words", teach: ["chat", "chien", "arbre", "parc", "il-pleut"] },
      {
        name: "Let's Go Outside", kind: "talk",
        teach: ["jai-chaud", "jai-froid", "on-va-dehors", "regarde-un-chien"],
        scenes: ["raining", "hot-day", "cold-day", "dog-park", "papa-outside", "cat-wall", "go-out-play"],
      },
      {
        name: "Spell Outside", kind: "letters", spell: ["soleil", "pluie", "chat", "chien", "arbre"],
        mission: "Look out the window and tell someone: \"Il pleut!\" or \"Regarde, le soleil!\"",
      },
    ],
  },
  phrases: [
    { id: "soleil", text: "Soleil", en: "Sun", art: "sun", topic: "thing", tip: "Say 'so-LAY'." },
    { id: "pluie", text: "Pluie", en: "Rain", art: "rain", topic: "thing", tip: "Say 'plwee'." },
    { id: "chaud", text: "Chaud", en: "Hot", topic: "thing", tip: "Say 'show'. The d is silent." },
    { id: "froid", text: "Froid", en: "Cold", topic: "thing", tip: "Say 'frwah'. The d is silent." },
    { id: "dehors", text: "Dehors", en: "Outside", topic: "place", tip: "Say 'duh-OR'. The s is silent." },
    { id: "chat", text: "Chat", en: "Cat", art: "cat", topic: "thing", tip: "Say 'shah'. The t is silent." },
    { id: "chien", text: "Chien", en: "Dog", art: "dog", topic: "thing", tip: "Say 'shee-AN'." },
    { id: "arbre", text: "Arbre", en: "Tree", art: "tree", topic: "thing", tip: "Say it 'arbr'." },
    { id: "parc", text: "Parc", en: "Park", topic: "place", tip: "Say 'park'. The c is silent." },
    {
      id: "il-pleut", text: "Il pleut.", en: "It's raining", art: "rain", topic: "thing",
      words: [{ text: "Il" }, { text: "pleut" }], tip: "Say 'eel pluh'.",
    },
    {
      id: "jai-chaud", text: "J'ai chaud.", en: "I'm hot", topic: "feeling",
      words: [{ text: "J'ai" }, { text: "chaud" }], tip: "French says 'I have hot'.",
    },
    {
      id: "jai-froid", text: "J'ai froid.", en: "I'm cold", topic: "feeling",
      words: [{ text: "J'ai" }, { text: "froid" }], tip: "French says 'I have cold'.",
    },
    {
      id: "on-va-dehors", text: "On va dehors!", en: "Let's go outside!", topic: "action",
      words: [{ text: "On" }, { text: "va" }, { text: "dehors" }], tip: "Say it when the sun is out.",
    },
    {
      id: "regarde-un-chien", text: "Regarde, un chien!", en: "Look, a dog!", art: "dog", topic: "thing",
      words: [{ text: "Regarde" }, { text: "un" }, { text: "chien" }], tip: "Swap chien for chat.",
    },
  ],
  scenes: [
    {
      id: "raining", setup: "Grey clouds, and water drips down the window. Tell Papa.", who: { name: "Papa" },
      reply: ["il-pleut", "pluie"], alsoOk: ["regarde", "regarde-ca"],
    },
    {
      id: "hot-day", setup: "It is a very hot day at the park. You are sweating.", who: { name: "Maman" },
      reply: ["jai-chaud", "chaud"], alsoOk: ["jai-soif", "je-peux-avoir-de-leau", "je-veux-de-leau", "je-suis-fatigue", "fatigue", "eau", "jus", "je-veux"],
    },
    {
      id: "cold-day", setup: "It is freezing outside and you have no jacket.", who: { name: "Papa" },
      reply: ["jai-froid", "froid"], alsoOk: ["calin", "on-y-va", "vite", "jai-peur"],
    },
    {
      id: "dog-park", setup: "A friendly dog trots towards you at the park.", who: { name: "Hugo" },
      reply: ["regarde-un-chien", "chien"], alsoOk: ["regarde", "regarde-ca", "super", "joli", "petit", "grand"],
    },
    {
      id: "papa-outside", setup: "The sun is out. Papa calls it from the door.", who: { name: "Papa" }, line: "on-va-dehors",
      reply: ["super", "oui"], alsoOk: ["on-y-va", "bravo", "vite", "oui-merci", "je-suis-content", "viens"],
    },
    {
      id: "cat-wall", setup: "Léa asks what is sitting on the wall. It is a cat.", who: { name: "Léa" },
      reply: ["chat"], alsoOk: ["regarde", "regarde-ca", "joli", "petit"],
    },
    {
      id: "go-out-play", setup: "It is sunny and you are bored indoors. Ask Papa.", who: { name: "Papa" },
      reply: ["on-va-dehors"], alsoOk: ["dehors", "on-joue", "on-joue-au-ballon", "on-y-va", "parc"],
    },
  ],
};
