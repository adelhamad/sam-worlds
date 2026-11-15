// Unit 2 — Me and You: I and you, names, age and where you are from — what
// every new grown-up or child asks Sam first.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U02: LangUnitPack = {
  unit: {
    name: "Me and You",
    icon: iconRef("smile"),
    hue: "#ff7aa8",
    blurb: "Tell people your name and age.",
    souvenir: { icon: iconRef("ticket"), name: "My Name Tag" },
    lessons: [
      { name: "Me and You", kind: "words", teach: ["ana", "inta", "inti", "walad", "bint"] },
      { name: "What's Your Name?", kind: "words", teach: ["shu-ismak", "shu-ismik", "ismi-saam", "w-inta"] },
      {
        name: "Nice to Meet You", kind: "talk",
        teach: ["umrak-addeish", "umri-sab-sniin", "inta-min-wein"],
        scenes: ["u02-cake", "u02-park-boy", "u02-park-girl", "u02-teta-friend", "u02-neighbour-age", "u02-baba-back", "u02-new-friend"],
      },
      {
        name: "Taa and Thaa", kind: "letters", letters: ["ت", "ث"], spell: ["bint"],
        mission: "Ask Baba: ‘umrak addeish? Then tell him: ‘umri sab‘ sniin!",
      },
    ],
  },
  phrases: [
    { id: "ana", text: "أنا", roman: "ana", say: "أَنا", en: "I, me", topic: "me", tip: "Who wants cake? Shout: ana!" },
    { id: "inta", text: "إنت", roman: "inta", say: "إِنْتَ", en: "You (to a boy)", topic: "me", like: ["inti"], tip: "inta is for a boy or a man." },
    { id: "inti", text: "إنتِ", roman: "inti", say: "إِنْتِ", en: "You (to a girl)", topic: "me", like: ["inta"], tip: "inti is for a girl or a woman." },
    { id: "walad", text: "ولد", roman: "walad", say: "وَلَد", en: "Boy", topic: "me", tip: "ana walad means I am a boy." },
    { id: "bint", text: "بنت", roman: "bint", say: "بِنْت", en: "Girl", topic: "me", tip: "A girl says: ana bint." },
    {
      id: "shu-ismak", text: "شو اسمك؟", roman: "shu ismak?", say: "شو إِسْمَك", en: "What's your name? (to a boy)", topic: "me", like: ["shu-ismik"],
      words: [{ text: "شو", roman: "shu" }, { text: "اسمك", roman: "ismak" }],
      tip: "shu means what. Ask a boy or a man this way.",
    },
    {
      id: "shu-ismik", text: "شو اسمِك؟", roman: "shu ismik?", say: "شو إِسْمِك", en: "What's your name? (to a girl)", topic: "me", like: ["shu-ismak"],
      words: [{ text: "شو", roman: "shu" }, { text: "اسمِك", roman: "ismik" }],
      tip: "Ask a girl or a woman this way.",
    },
    {
      id: "ismi-saam", text: "اسمي سام", roman: "ismi saam", say: "إِسْمي سام", en: "My name is Sam", topic: "me",
      words: [{ text: "اسمي", roman: "ismi" }, { text: "سام", roman: "saam" }],
      tip: "ismi means my name. Then say your name.",
    },
    {
      id: "w-inta", text: "وإنت؟", roman: "w inta?", say: "وِإنْتَ", en: "And you? (to a boy)", topic: "me",
      tip: "Say mniiH, then ask back: w inta? To a girl: w inti?",
    },
    {
      id: "umrak-addeish", text: "عمرك قدّيش؟", roman: "‘umrak addeish?", say: "عُمْرَك أَدّيش", en: "How old are you? (boy)", topic: "me", like: ["umrik-addeish"],
      words: [{ text: "عمرك", roman: "‘umrak" }, { text: "قدّيش", roman: "addeish" }],
      tip: "Grown-ups love to ask this. To a girl: ‘umrik addeish?",
    },
    {
      id: "umri-sab-sniin", text: "عمري سبع سنين", roman: "‘umri sab‘ sniin", say: "عُمْري سَبِع سْنين", en: "I am seven years old", topic: "me",
      words: [{ text: "عمري", roman: "‘umri" }, { text: "سبع", roman: "sab‘" }, { text: "سنين", roman: "sniin" }],
      tip: "The answer to ‘umrak addeish?",
    },
    {
      id: "inta-min-wein", text: "إنت من وين؟", roman: "inta min wein?", say: "إِنْتَ مِن وين", en: "Where are you from?", topic: "me",
      words: [{ text: "إنت", roman: "inta" }, { text: "من", roman: "min" }, { text: "وين", roman: "wein" }],
      tip: "To a girl: inti min wein? Answer: ana min… and your country.",
    },
  ],
  scenes: [
    { id: "u02-cake", setup: "Mama asks who wants cake. You do!", who: { name: "Mama" }, reply: ["ana"] },
    {
      id: "u02-park-boy", setup: "A new boy at the park waves. Ask his name.", who: { name: "A boy" },
      reply: ["shu-ismak"], alsoOk: ["marhaba", "ahlein", "kiifak"],
    },
    {
      id: "u02-park-girl", setup: "A girl at the park says hi. Ask her name.", who: { name: "A girl" },
      reply: ["shu-ismik"], alsoOk: ["marhaba", "ahlein", "kiifik"],
    },
    { id: "u02-teta-friend", setup: "Teta's friend smiles and asks you.", who: { name: "Teta's friend" }, line: "shu-ismak", reply: ["ismi-saam"] },
    { id: "u02-neighbour-age", setup: "The lady next door asks you.", who: { name: "Neighbour" }, line: "umrak-addeish", reply: ["umri-sab-sniin"] },
    {
      id: "u02-baba-back", setup: "Baba asks you. You are fine. Now ask him back!", who: { name: "Baba" },
      line: "kiifak", reply: ["w-inta"], alsoOk: ["kiifak-baba", "mniih", "ana-mniih", "hamdilla"],
    },
    { id: "u02-new-friend", setup: "A new boy just moved here. Ask where he is from.", who: { name: "A boy" }, reply: ["inta-min-wein"] },
  ],
};
