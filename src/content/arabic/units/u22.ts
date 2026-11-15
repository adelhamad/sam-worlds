// Unit 22 — On the Phone: a real call with Teta, who lives far away — from
// "aloo?" and "miin ma‘i?" to "I miss you", "see you soon" and the kisses.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U22: LangUnitPack = {
  unit: {
    name: "On the Phone",
    icon: iconRef("bell"),
    hue: "#e879f9",
    blurb: "Call Teta and talk with her.",
    souvenir: { icon: iconRef("heart"), name: "Big Heart" },
    lessons: [
      { name: "Hello? Hello!", kind: "words", teach: ["aloo", "miin", "ana-saam", "booseh"] },
      { name: "Busy Teta", kind: "words", teach: ["shu-am-tamli", "shu-am-tamel", "w-ana-kamaan", "bboosik"] },
      {
        name: "Calling Teta", kind: "talk",
        teach: ["miin-mai", "ishtatillik-ktiir", "bshoofik-an-ariib"],
        scenes: ["u22-ring", "u22-who-is-it", "u22-its-teta", "u22-pots-pans", "u22-soft-voice", "u22-screen-kiss", "u22-hang-up"],
      },
      {
        name: "Reading Hello", kind: "letters", letters: ["ن", "ب", "ث"], spell: ["aloo", "miin", "booseh", "bboosik"],
        mission: "Call Teta today. Say aloo, kiifik teta? and end with bboosik.",
      },
    ],
  },
  phrases: [
    { id: "aloo", text: "ألو", roman: "aloo", say: "أَلو", en: "Hello? (on the phone)", topic: "phone", tip: "Pick up the phone and say: aloo?" },
    { id: "miin", text: "مين؟", roman: "miin?", say: "مين", en: "Who?", topic: "phone", like: ["miin-mai"], tip: "miin? means who? Knock knock: miin?" },
    {
      id: "ana-saam", text: "أنا سام", roman: "ana saam", say: "أَنا سام", en: "It's me, Sam!", topic: "phone",
      words: [{ text: "أنا", roman: "ana" }, { text: "سام", roman: "saam" }],
      tip: "It's me, Sam! Say it when someone asks miin?",
    },
    { id: "booseh", text: "بوسة", roman: "booseh", say: "بوسة", en: "A kiss", art: "heart", topic: "phone", like: ["bboosik"] },
    {
      id: "shu-am-tamli", text: "شو عم تعملي؟", roman: "shu ‘am ta‘mli?", say: "شو عَم تَعْمْلي", en: "What are you doing? (girl)",
      topic: "phone", like: ["shu-am-tamel"],
      words: [{ text: "شو", roman: "shu" }, { text: "عم", roman: "‘am" }, { text: "تعملي", roman: "ta‘mli" }],
      tip: "What are you doing? Ask Teta or Mama this way.",
    },
    {
      id: "shu-am-tamel", text: "شو عم تعمل؟", roman: "shu ‘am ta‘mel?", say: "شو عَم تَعْمِل", en: "What are you doing? (boy)",
      topic: "phone", like: ["shu-am-tamli"],
      words: [{ text: "شو", roman: "shu" }, { text: "عم", roman: "‘am" }, { text: "تعمل", roman: "ta‘mel" }],
      tip: "What are you doing? Ask Jiddo or Baba this way.",
    },
    {
      id: "w-ana-kamaan", text: "وأنا كمان", roman: "w ana kamaan", say: "وأَنا كَمان", en: "Me too!", topic: "phone",
      words: [{ text: "وأنا", roman: "w ana" }, { text: "كمان", roman: "kamaan" }],
      tip: "Me too! Teta says she misses you? Say w ana kamaan.",
    },
    {
      id: "bboosik", text: "ببوسِك", roman: "bboosik", say: "بْبوسِك", en: "Kisses! (to a girl)", topic: "phone", like: ["booseh"],
      tip: "Kisses, to Teta or Mama. To Jiddo or Baba: bboosak.",
    },
    {
      id: "miin-mai", text: "مين معي؟", roman: "miin ma‘i?", say: "مين مَعي", en: "Who is it? (on the phone)", topic: "phone", like: ["miin"],
      words: [{ text: "مين", roman: "miin" }, { text: "معي", roman: "ma‘i" }],
      tip: "Who is it? On the phone, it means: who is calling?",
    },
    {
      id: "ishtatillik-ktiir", text: "اشتقتلِك كتير", roman: "ishta’tillik ktiir", say: "إشْتَأْتِلِّك كْتير", en: "I miss you so much! (girl)",
      topic: "phone", like: ["ishtatillik", "ishtatillak"],
      words: [{ text: "اشتقتلِك", roman: "ishta’tillik" }, { text: "كتير", roman: "ktiir" }],
      tip: "I miss you so much! To Jiddo: ishta’tillak ktiir.",
    },
    {
      id: "bshoofik-an-ariib", text: "بشوفِك عن قريب", roman: "bshoofik ‘an ’ariib", say: "بْشوفِك عَن أَريب", en: "See you soon! (to a girl)",
      topic: "phone",
      words: [{ text: "بشوفِك", roman: "bshoofik" }, { text: "عن", roman: "‘an" }, { text: "قريب", roman: "’ariib" }],
      tip: "See you soon! To Jiddo: bshoofak ‘an ’ariib.",
    },
  ],
  scenes: [
    { id: "u22-ring", setup: "The phone rings. You pick it up.", reply: ["aloo"], alsoOk: ["marhaba"] },
    { id: "u22-who-is-it", setup: "You call Teta's house. A voice answers and asks:", who: { name: "Teta" }, line: "miin-mai", reply: ["ana-saam"] },
    { id: "u22-its-teta", setup: "It's Teta on the phone! Ask her how she is.", who: { name: "Teta" }, reply: ["kiifik-teeta"], alsoOk: ["kiifik"] },
    {
      id: "u22-pots-pans", setup: "You hear pots and pans behind Teta. Ask what she's up to.", who: { name: "Teta" },
      reply: ["shu-am-tamli"],
    },
    {
      id: "u22-soft-voice", setup: "Teta's voice goes soft. She says:", who: { name: "Teta" },
      line: "ishtatillak", reply: ["w-ana-kamaan"], alsoOk: ["ishtatillik", "ishtatillik-ktiir"],
    },
    { id: "u22-screen-kiss", setup: "On the video call, Teta blows you a kiss.", who: { name: "Teta" }, reply: ["bboosik"], alsoOk: ["booseh"] },
    {
      id: "u22-hang-up", setup: "Time to hang up. You will visit Teta next month.", who: { name: "Teta" },
      reply: ["bshoofik-an-ariib"], alsoOk: ["maa-salaameh", "yalla-bye", "bboosik", "booseh"],
    },
  ],
};
