// Unit 1 — Hello! The first things Sam can say the moment he walks in: hello,
// how are you, I'm fine, goodbye. This file is the worked example of
// docs/LANGUAGES.md.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U01: LangUnitPack = {
  unit: {
    name: "Hello!",
    icon: iconRef("hand"),
    hue: "#ffb454",
    blurb: "Say hello like family does.",
    souvenir: { icon: iconRef("hand"), name: "Friendly Wave" },
    lessons: [
      { name: "Say Hello", kind: "words", teach: ["marhaba", "ahlein", "mama", "baba"] },
      { name: "How Are You?", kind: "words", teach: ["kiifak", "kiifik", "mniih", "hamdilla"] },
      {
        name: "Hello, Teta!", kind: "talk",
        teach: ["marhaba-mama", "kiifak-baba", "ana-mniih", "maa-salaameh", "yalla-bye"],
        scenes: ["walk-in", "teta-asks", "baba-hello", "leaving", "after-school", "ask-mama"],
      },
      {
        name: "Alif and Baa", kind: "letters", letters: ["ا", "ب"], spell: ["baba"],
        mission: "Say marHaba to someone at home, then ask: kiifak?",
      },
    ],
  },
  phrases: [
    { id: "marhaba", text: "مرحبا", roman: "marHaba", say: "مَرْحَبا", en: "Hello", art: "hand", topic: "greeting", like: ["ahlein", "aloo", "ahla-w-sahla"] },
    {
      id: "ahlein", text: "أهلين", roman: "ahlein", say: "أَهْلين", en: "Hi! (a warm answer)", topic: "greeting", like: ["marhaba", "ahla-w-sahla", "ahlein-fiik", "ahlein-fiiki"],
      tip: "Someone says marHaba? Answer: ahlein!",
    },
    { id: "mama", text: "ماما", roman: "maama", en: "Mom", topic: "family" },
    { id: "baba", text: "بابا", roman: "baaba", en: "Dad", topic: "family" },
    {
      id: "kiifak", text: "كيفك؟", roman: "kiifak?", say: "كِيفَك", en: "How are you? (to a boy)", topic: "greeting", like: ["kiifik"],
      tip: "kiifak is for a boy or a man.",
    },
    {
      id: "kiifik", text: "كيفِك؟", roman: "kiifik?", say: "كِيفِك", en: "How are you? (to a girl)", topic: "greeting", like: ["kiifak"],
      tip: "kiifik is for a girl or a woman.",
    },
    {
      id: "mniih", text: "منيح", roman: "mniiH", say: "مْنيح", en: "Good, fine", topic: "greeting", like: ["ana-mniih", "hamdilla"],
      tip: "A boy says mniiH. A girl says mniiHa.",
    },
    {
      id: "hamdilla", text: "الحمد لله", roman: "il-Hamdilla", say: "الحَمْدِ لله", en: "Thank God, I'm well", topic: "greeting", like: ["mniih", "ana-mniih", "il-hamdilla-as-salaameh"],
      tip: "Grown-ups love this answer to kiifak.",
    },
    {
      id: "marhaba-mama", text: "مرحبا ماما", roman: "marHaba maama", en: "Hello, Mom", topic: "greeting",
      words: [{ text: "مرحبا", roman: "marHaba" }, { text: "ماما", roman: "maama" }],
    },
    {
      id: "kiifak-baba", text: "كيفك بابا؟", roman: "kiifak baaba?", say: "كِيفَك بابا", en: "How are you, Dad?", topic: "greeting",
      words: [{ text: "كيفك", roman: "kiifak" }, { text: "بابا", roman: "baaba" }],
    },
    {
      id: "ana-mniih", text: "أنا منيح", roman: "ana mniiH", say: "أَنا مْنيح", en: "I am fine", topic: "greeting", like: ["mniih", "hamdilla"],
      words: [{ text: "أنا", roman: "ana" }, { text: "منيح", roman: "mniiH" }],
    },
    {
      id: "maa-salaameh", text: "مع السلامة", roman: "ma‘ is-salaameh", say: "مَع السَّلامة", en: "Goodbye", art: "hand", topic: "greeting", like: ["yalla-bye", "bshoofik-an-ariib"],
      words: [{ text: "مع", roman: "ma‘" }, { text: "السلامة", roman: "is-salaameh" }],
    },
    {
      id: "yalla-bye", text: "يلا باي", roman: "yalla baay", say: "يَلّا باي", en: "OK, bye!", topic: "greeting", like: ["maa-salaameh", "bshoofik-an-ariib"],
      words: [{ text: "يلا", roman: "yalla" }, { text: "باي", roman: "baay" }],
    },
  ],
  scenes: [
    {
      id: "walk-in", setup: "You walk in. Teta is in the kitchen.", who: { name: "Teta" },
      reply: ["marhaba", "ahlein"], alsoOk: ["kiifik", "kiifak"],
    },
    { id: "teta-asks", setup: "Teta smiles and asks you.", who: { name: "Teta" }, line: "kiifak", reply: ["mniih", "hamdilla", "ana-mniih"] },
    { id: "baba-hello", setup: "Baba comes home from work.", who: { name: "Baba" }, line: "marhaba", reply: ["ahlein"], alsoOk: ["kiifak-baba", "kiifak", "kiifik"] },
    { id: "leaving", setup: "Time to go home from Teta's house.", who: { name: "Teta" }, reply: ["maa-salaameh", "yalla-bye"] },
    {
      id: "after-school", setup: "Mama picks you up from school.", who: { name: "Mama" },
      reply: ["marhaba-mama"], alsoOk: ["marhaba", "ahlein", "kiifik", "kiifak"],
    },
    { id: "ask-mama", setup: "You want to know how Mama is today.", who: { name: "Mama" }, reply: ["kiifik"], alsoOk: ["kiifak"] },
  ],
};
