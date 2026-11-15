// Unit 15 — Today and Tomorrow: now, later, yesterday, morning and night, and
// the two greetings said every day at home: good morning and good night.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U15: LangUnitPack = {
  unit: {
    name: "Today and Tomorrow",
    icon: iconRef("calendar"),
    hue: "#ffd23f",
    blurb: "Morning, night, now and later.",
    souvenir: { icon: iconRef("moon"), name: "Sleepy Moon" },
    lessons: [
      { name: "Now or Later?", kind: "words", teach: ["il-yoom", "bukra", "mbaarih", "halla", "badein"] },
      { name: "Good Morning!", kind: "words", teach: ["is-subih", "il-masa", "il-leil", "sabaah-il-kheir", "sabaah-in-noor"] },
      {
        name: "Good Night!", kind: "talk",
        teach: ["tisbah-ala-kheir", "tisbahi-ala-kheir", "w-inti-min-ahlo", "bukra-is-sabt"],
        scenes: ["u15-kitchen-tea", "u15-teta-curtains", "u15-lights-off", "u15-baba-sofa", "u15-zoo-trip", "u15-cake-now", "u15-no-school"],
      },
      {
        name: "Reading Time", kind: "letters", letters: ["ح", "ق", "ك"], spell: ["il-yoom", "bukra", "mbaarih", "halla", "badein"],
        mission: "At bedtime, say tiSbaH ‘ala kheir to Baba, or tiSbaHi ‘ala kheir to Mama.",
      },
    ],
  },
  phrases: [
    { id: "il-yoom", text: "اليوم", roman: "il-yoom", say: "اليوم", en: "Today", topic: "time" },
    { id: "bukra", text: "بكرة", roman: "bukra", say: "بُكْرا", en: "Tomorrow", topic: "time" },
    { id: "mbaarih", text: "مبارح", roman: "mbaariH", say: "مْبارِح", en: "Yesterday", topic: "time" },
    { id: "halla", text: "هلّق", roman: "halla’", say: "هَلَّأ", en: "Now", topic: "time", tip: "halla’ means now, right now. Some families say hassa." },
    { id: "badein", text: "بعدين", roman: "ba‘dein", say: "بَعْدَين", en: "Later", topic: "time", tip: "ba‘dein means later, after a while." },
    { id: "is-subih", text: "الصبح", roman: "iS-SubiH", say: "الصُّبِح", en: "Morning", topic: "time" },
    { id: "il-masa", text: "المسا", roman: "il-masa", say: "المَسا", en: "Evening", topic: "time" },
    { id: "il-leil", text: "الليل", roman: "il-leil", say: "اللَّيل", en: "Night", topic: "time" },
    {
      id: "sabaah-il-kheir", text: "صباح الخير", roman: "SabaaH il-kheir", say: "صَباح الخَير", en: "Good morning", topic: "time",
      like: ["sabaah-in-noor"],
      words: [{ text: "صباح", roman: "SabaaH" }, { text: "الخير", roman: "il-kheir" }],
      tip: "Good morning! The answer is SabaaH in-noor.",
    },
    {
      id: "sabaah-in-noor", text: "صباح النور", roman: "SabaaH in-noor", say: "صَباح النّور", en: "Good morning to you too", topic: "time",
      like: ["sabaah-il-kheir"],
      words: [{ text: "صباح", roman: "SabaaH" }, { text: "النور", roman: "in-noor" }],
      tip: "The answer to SabaaH il-kheir. It means: a morning of light.",
    },
    {
      id: "tisbah-ala-kheir", text: "تصبح على خير", roman: "tiSbaH ‘ala kheir", say: "تِصْبَح عَلى خَير", en: "Good night (to a boy)", topic: "time",
      like: ["tisbahi-ala-kheir", "w-inti-min-ahlo", "ahlaam-saiideh"],
      words: [{ text: "تصبح", roman: "tiSbaH" }, { text: "على", roman: "‘ala" }, { text: "خير", roman: "kheir" }],
      tip: "Good night, to a boy or a man, like Baba.",
    },
    {
      id: "tisbahi-ala-kheir", text: "تصبحي على خير", roman: "tiSbaHi ‘ala kheir", say: "تِصْبَحي عَلى خَير", en: "Good night (to a girl)", topic: "time",
      like: ["tisbah-ala-kheir", "w-inti-min-ahlo", "ahlaam-saiideh"],
      words: [{ text: "تصبحي", roman: "tiSbaHi" }, { text: "على", roman: "‘ala" }, { text: "خير", roman: "kheir" }],
      tip: "Good night, to a girl or a woman, like Mama.",
    },
    {
      id: "w-inti-min-ahlo", text: "وإنتي من أهله", roman: "w inti min ahlo", say: "وِإنْتي مِن أَهْلو", en: "Good night to you too", topic: "time",
      like: ["tisbah-ala-kheir", "tisbahi-ala-kheir"],
      words: [{ text: "وإنتي", roman: "w inti" }, { text: "من", roman: "min" }, { text: "أهله", roman: "ahlo" }],
      tip: "The answer to good night, to Mama. To Baba: w inta min ahlo.",
    },
    {
      id: "bukra-is-sabt", text: "بكرة السبت", roman: "bukra is-sabt", say: "بُكْرا السَّبْت", en: "Tomorrow is Saturday", topic: "time",
      words: [{ text: "بكرة", roman: "bukra" }, { text: "السبت", roman: "is-sabt" }],
      tip: "Tomorrow is Saturday. Sunday is il-aHad, Friday is il-jum‘a.",
    },
  ],
  scenes: [
    {
      id: "u15-kitchen-tea", setup: "Morning! You walk into the kitchen. Baba is making tea.", who: { name: "Baba" },
      reply: ["sabaah-il-kheir"], alsoOk: ["marhaba", "ahlein", "kiifak", "kiifak-baba"],
    },
    {
      id: "u15-teta-curtains", setup: "Teta opens the curtains and smiles at you.", who: { name: "Teta" },
      line: "sabaah-il-kheir", reply: ["sabaah-in-noor"], alsoOk: ["marhaba", "ahlein", "kiifik"],
    },
    {
      id: "u15-lights-off", setup: "Bedtime. Mama kisses you and turns off the light.", who: { name: "Mama" },
      line: "tisbah-ala-kheir", reply: ["w-inti-min-ahlo"], alsoOk: ["tisbahi-ala-kheir"],
    },
    { id: "u15-baba-sofa", setup: "You are sleepy and going to bed. Baba is on the sofa.", who: { name: "Baba" }, reply: ["tisbah-ala-kheir"] },
    { id: "u15-zoo-trip", setup: "Teta asks when you went to the zoo. It was one day ago.", who: { name: "Teta" }, reply: ["mbaarih"] },
    { id: "u15-cake-now", setup: "Mama asks when you want your cake. You can't wait!", who: { name: "Mama" }, reply: ["halla"], alsoOk: ["il-yoom"] },
    {
      id: "u15-no-school", setup: "No school tomorrow! Tell Jiddo what day it will be.", who: { name: "Jiddo" },
      reply: ["bukra-is-sabt"], alsoOk: ["bukra"],
    },
  ],
};
