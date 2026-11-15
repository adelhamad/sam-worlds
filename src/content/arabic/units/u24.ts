// Unit 24 — Everyday Sayings: the little blessings Levantine families say all
// day long, and their answers: inshalla, na‘iiman, ya‘Tiik il-‘aafyeh…
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U24: LangUnitPack = {
  unit: {
    name: "Everyday Sayings",
    icon: iconRef("star"),
    hue: "#d9a0ff",
    blurb: "The kind words families say daily.",
    souvenir: { icon: iconRef("crown"), name: "Yalla Crown" },
    lessons: [
      { name: "Inshalla!", kind: "words", teach: ["inshalla", "naiiman", "bil-hana", "yaa-reit"] },
      { name: "Kind Words", kind: "words", teach: ["il-hamdilla-as-salaameh", "ahlaam-saiideh", "diir-baalak", "shaater"] },
      {
        name: "And the Answer", kind: "talk",
        teach: ["allah-yinim-aleiki", "yatiik-il-aafyeh", "allah-yaafiik", "allah-ysallmik"],
        scenes: ["u24-after-bath", "u24-teta-arrive", "u24-jiddo-garden", "u24-baba-bike", "u24-zoo-maybe", "u24-new-shoes", "u24-busy-road"],
      },
      {
        name: "Reading Sayings", kind: "letters", letters: ["ظ", "ذ", "ه"], spell: ["naiiman", "bil-hana", "yaa-reit", "shaater"],
        mission: "When someone at home is busy working, tell them: ya‘Tiik il-‘aafyeh!",
      },
    ],
  },
  phrases: [
    {
      id: "inshalla", text: "إن شاء الله", roman: "inshalla", say: "إن شاء الله", en: "I hope so! (God willing)", topic: "saying",
      tip: "inshalla: I hope so. Say it about tomorrow and wishes.",
    },
    {
      id: "naiiman", text: "نعيماً", roman: "na‘iiman", say: "نَعيماً", en: "Fresh and clean! (after a bath)", topic: "saying",
      tip: "Said after a bath or a haircut. Answer: allah yin‘im ‘aleiki.",
    },
    { id: "bil-hana", text: "بالهنا", roman: "bil-hana", say: "بِالهَنا", en: "Enjoy it! (something new)", topic: "saying", tip: "Enjoy it! Say it for new clothes or a new toy." },
    { id: "yaa-reit", text: "ياريت", roman: "yaa reit", say: "يا رَيت", en: "I wish!", topic: "saying", tip: "I wish! Want something a lot? Say yaa reit!" },
    {
      id: "il-hamdilla-as-salaameh", text: "الحمد لله عالسلامة", roman: "il-Hamdilla ‘as-salaameh", say: "الحَمْدِ لله عالسَّلامة",
      en: "Welcome back, safe and sound!", topic: "saying",
      tip: "Said to someone back from a trip, or feeling better.",
    },
    {
      id: "ahlaam-saiideh", text: "أحلام سعيدة", roman: "aHlaam sa‘iideh", say: "أَحْلام سَعيدة", en: "Sweet dreams", topic: "saying",
      like: ["tisbah-ala-kheir", "tisbahi-ala-kheir"],
      words: [{ text: "أحلام", roman: "aHlaam" }, { text: "سعيدة", roman: "sa‘iideh" }],
    },
    {
      id: "diir-baalak", text: "دير بالك", roman: "diir baalak", say: "دير بالَك", en: "Be careful! Take care!", topic: "saying",
      words: [{ text: "دير", roman: "diir" }, { text: "بالك", roman: "baalak" }],
      tip: "Be careful! To a girl: diiri baalik.",
    },
    { id: "shaater", text: "شاطر", roman: "shaaTer", say: "شاطِر", en: "Clever! Well done!", topic: "saying", tip: "Well done! For a boy. A clever girl is shaaTra." },
    {
      id: "allah-yinim-aleiki", text: "الله ينعم عليكي", roman: "allah yin‘im ‘aleiki", say: "الله يِنْعِم عَلَيكي", en: "Thanks! (after a bath, to her)",
      topic: "saying",
      words: [{ text: "الله", roman: "allah" }, { text: "ينعم", roman: "yin‘im" }, { text: "عليكي", roman: "‘aleiki" }],
      tip: "The answer to na‘iiman. To a man: allah yin‘im ‘aleik.",
    },
    {
      id: "yatiik-il-aafyeh", text: "يعطيك العافية", roman: "ya‘Tiik il-‘aafyeh", say: "يَعْطيك العافْية", en: "Thanks for your hard work!", topic: "saying",
      words: [{ text: "يعطيك", roman: "ya‘Tiik" }, { text: "العافية", roman: "il-‘aafyeh" }],
      tip: "Say it to anyone working hard. To a woman: ya‘Tiiki il-‘aafyeh.",
    },
    {
      id: "allah-yaafiik", text: "الله يعافيك", roman: "allah y‘aafiik", say: "الله يْعافيك", en: "Thanks! (after hard work)", topic: "saying",
      words: [{ text: "الله", roman: "allah" }, { text: "يعافيك", roman: "y‘aafiik" }],
      tip: "The answer to ya‘Tiik il-‘aafyeh. To a woman: allah y‘aafiiki.",
    },
    {
      id: "allah-ysallmik", text: "الله يسلمِك", roman: "allah ysallmik", say: "الله يْسَلّْمِك", en: "Thanks! (after a trip, to her)", topic: "saying",
      words: [{ text: "الله", roman: "allah" }, { text: "يسلمِك", roman: "ysallmik" }],
      tip: "The answer to il-Hamdilla ‘as-salaameh. To a man: allah ysallmak.",
    },
  ],
  scenes: [
    {
      id: "u24-after-bath", setup: "You come out of the bath, all clean. Mama smiles:", who: { name: "Mama" },
      line: "naiiman", reply: ["allah-yinim-aleiki"],
    },
    {
      id: "u24-teta-arrive", setup: "You land and run into Teta's arms. She says:", who: { name: "Teta" },
      line: "il-hamdilla-as-salaameh", reply: ["allah-ysallmik"], alsoOk: ["ishtatillik", "ishtatillik-ktiir", "marhaba", "ahlein", "kiifik"],
    },
    {
      id: "u24-jiddo-garden", setup: "You help Jiddo dig in the garden. He wipes his face and says:", who: { name: "Jiddo" },
      line: "yatiik-il-aafyeh", reply: ["allah-yaafiik"],
    },
    {
      id: "u24-baba-bike", setup: "Baba fixed your bike all afternoon. Now it works!", who: { name: "Baba" },
      reply: ["yatiik-il-aafyeh"], alsoOk: ["shaater"],
    },
    {
      id: "u24-zoo-maybe", setup: "Mama says maybe you will all go to the zoo tomorrow.", who: { name: "Mama" },
      reply: ["inshalla"], alsoOk: ["yaa-reit"],
    },
    {
      id: "u24-new-shoes", setup: "Your cousin Lina shows you her new shoes.", who: { name: "Lina" },
      reply: ["bil-hana"], alsoOk: ["mabrook"],
    },
    { id: "u24-busy-road", setup: "Your little cousin runs toward the busy road!", reply: ["diir-baalak"] },
  ],
};
