// Unit 23 — What I Did: telling the family about your day — I went, I ate,
// I played, I slept well — plus "I'm playing" and "I'm going to play".
// Whole sentences only: no grammar words, no tables.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U23: LangUnitPack = {
  unit: {
    name: "What I Did",
    icon: iconRef("footprints"),
    hue: "#f59e0b",
    blurb: "Tell the family about your day.",
    souvenir: { icon: iconRef("book"), name: "Day Diary" },
    lessons: [
      { name: "I Did It", kind: "words", teach: ["ruht", "akalt", "shribt", "libt"] },
      { name: "Now and Next", kind: "words", teach: ["shift", "am-bilab", "rah-ilab", "shu-milt-il-yoom"] },
      {
        name: "My Day", kind: "talk",
        teach: ["ruht-al-madraseh", "akalt-tuffaaha", "libt-taabeh", "nimt-mniih"],
        scenes: ["u23-after-school", "u23-teta-blocks", "u23-not-hungry", "u23-morning-baba", "u23-after-lunch", "u23-school-water"],
      },
      {
        name: "Reading My Day", kind: "letters", letters: ["ا", "خ", "ع"], spell: ["ruht", "akalt", "shribt", "libt", "shift"],
        mission: "At dinner, tell your family one thing you did today, like l‘ibt Taabeh.",
      },
    ],
  },
  phrases: [
    { id: "ruht", text: "رحت", roman: "ruHt", say: "رُحْت", en: "I went", topic: "did", tip: "ruHt means I went. ruHt ‘al-madraseh: I went to school." },
    { id: "akalt", text: "أكلت", roman: "akalt", say: "أَكَلْت", en: "I ate", topic: "did", tip: "akalt means I ate. A girl says it the same way." },
    { id: "shribt", text: "شربت", roman: "shribt", say: "شْرِبْت", en: "I drank", topic: "did", tip: "shribt means I drank. shribt mayy: I drank water." },
    { id: "libt", text: "لعبت", roman: "l‘ibt", say: "لْعِبْت", en: "I played", topic: "did", tip: "l‘ibt means I played. It already happened." },
    { id: "shift", text: "شفت", roman: "shift", say: "شِفْت", en: "I saw", topic: "did", tip: "shift means I saw. shift bisseh: I saw a cat." },
    {
      id: "am-bilab", text: "عم بلعب", roman: "‘am bil‘ab", say: "عَم بِلْعَب", en: "I'm playing right now", topic: "did",
      words: [{ text: "عم", roman: "‘am" }, { text: "بلعب", roman: "bil‘ab" }],
      tip: "I'm playing right now. ‘am means: busy doing it now.",
    },
    {
      id: "rah-ilab", text: "رح ألعب", roman: "raH il‘ab", say: "رَح إلْعَب", en: "I'm going to play", topic: "did",
      words: [{ text: "رح", roman: "raH" }, { text: "ألعب", roman: "il‘ab" }],
      tip: "I'm going to play. raH means soon: raH naam, I'm going to sleep.",
    },
    {
      id: "shu-milt-il-yoom", text: "شو عملت اليوم؟", roman: "shu ‘milt il-yoom?", say: "شو عْمِلْت اليوم", en: "What did you do today?", topic: "did",
      words: [{ text: "شو", roman: "shu" }, { text: "عملت", roman: "‘milt" }, { text: "اليوم", roman: "il-yoom" }],
      tip: "What did you do today? To a girl: shu ‘milti il-yoom?",
    },
    {
      id: "ruht-al-madraseh", text: "رحت عالمدرسة", roman: "ruHt ‘al-madraseh", say: "رُحْت عالمَدْرَسة", en: "I went to school", art: "school", topic: "did",
      words: [{ text: "رحت", roman: "ruHt" }, { text: "عالمدرسة", roman: "‘al-madraseh" }],
    },
    {
      id: "akalt-tuffaaha", text: "أكلت تفاحة", roman: "akalt tuffaaHa", say: "أَكَلْت تُفّاحة", en: "I ate an apple", art: "apple", topic: "did",
      words: [{ text: "أكلت", roman: "akalt" }, { text: "تفاحة", roman: "tuffaaHa" }],
    },
    {
      id: "libt-taabeh", text: "لعبت طابة", roman: "l‘ibt Taabeh", say: "لْعِبْت طابة", en: "I played ball", art: "ball", topic: "did",
      words: [{ text: "لعبت", roman: "l‘ibt" }, { text: "طابة", roman: "Taabeh" }],
    },
    {
      id: "nimt-mniih", text: "نمت منيح", roman: "nimt mniiH", say: "نِمْت مْنيح", en: "I slept well", topic: "did",
      words: [{ text: "نمت", roman: "nimt" }, { text: "منيح", roman: "mniiH" }],
      tip: "I slept well. nimt means I slept.",
    },
  ],
  scenes: [
    {
      id: "u23-after-school", setup: "After school, Mama asks. You played football all break.", who: { name: "Mama" },
      line: "shu-milt-il-yoom", reply: ["libt-taabeh"], alsoOk: ["libt", "ruht-al-madraseh", "ruht"],
    },
    {
      id: "u23-teta-blocks", setup: "Teta calls. You are in the middle of building with blocks. She asks:", who: { name: "Teta" },
      line: "shu-am-tamel", reply: ["am-bilab"],
    },
    {
      id: "u23-not-hungry", setup: "Mama brings lunch, but you just had an apple.", who: { name: "Mama" },
      reply: ["akalt-tuffaaha"], alsoOk: ["akalt"],
    },
    {
      id: "u23-morning-baba", setup: "Morning! Baba asks about your night. You slept like a log.", who: { name: "Baba" },
      reply: ["nimt-mniih"], alsoOk: ["mniih", "ana-mniih", "hamdilla"],
    },
    { id: "u23-after-lunch", setup: "Lunch is done. You tell Mama your plan: the swings!", who: { name: "Mama" }, reply: ["rah-ilab"] },
    { id: "u23-school-water", setup: "Baba asks if you had water at school. You did!", who: { name: "Baba" }, reply: ["shribt"] },
  ],
};
