// Unit 8 — How I Feel: happy, upset, tired, scared, sick; "what's the
// matter?", "nothing", and "I love you" for Mama and Baba.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U08: LangUnitPack = {
  unit: {
    name: "How I Feel",
    icon: iconRef("heart"),
    hue: "#f43f5e",
    blurb: "Say how you feel inside.",
    souvenir: { icon: iconRef("heart"), name: "Mama's Hug Heart" },
    lessons: [
      { name: "Happy and Sad", kind: "words", teach: ["mabsoot", "zalaan", "taabaan", "nasaan"] },
      { name: "I Love You", kind: "words", teach: ["khaayif", "mariid", "bhebbak", "bhebbik"] },
      {
        name: "What's the Matter?", kind: "talk",
        teach: ["shu-bak", "wala-shi", "biddi-dammeh"],
        scenes: ["u08-teta-smile", "u08-mama-quiet", "u08-sleepy", "u08-cousin-cries", "u08-bedtime", "u08-baba-trip", "u08-fever"],
      },
      {
        name: "Daad and Taa", kind: "letters", letters: ["ض", "ط"], spell: ["mabsoot", "mariid"],
        mission: "At bedtime, say bHibbik to Mama and bHibbak to Baba.",
      },
    ],
  },
  phrases: [
    { id: "mabsoot", text: "مبسوط", roman: "mabSooT", say: "مَبْسوط", en: "Happy", art: "smile", topic: "feeling", tip: "A girl says mabSooTa." },
    { id: "zalaan", text: "زعلان", roman: "za‘laan", say: "زَعْلان", en: "Upset, sad", topic: "feeling", tip: "A girl says za‘laaneh." },
    {
      id: "taabaan", text: "تعبان", roman: "ta‘baan", say: "تَعْبان", en: "Tired", topic: "feeling", like: ["nasaan", "mariid"],
      tip: "It also means not feeling well. A girl says ta‘baaneh.",
    },
    { id: "nasaan", text: "نعسان", roman: "na‘saan", say: "نَعْسان", en: "Sleepy", topic: "feeling", like: ["taabaan"], tip: "A girl says na‘saaneh." },
    { id: "khaayif", text: "خايف", roman: "khaayef", say: "خايِف", en: "Scared", topic: "feeling", tip: "A girl says khaayfeh." },
    { id: "mariid", text: "مريض", roman: "mariiD", say: "مَريض", en: "Sick", topic: "feeling", like: ["taabaan"], tip: "A girl says mariiDa." },
    {
      id: "bhebbak", text: "بحبّك", roman: "bHibbak", say: "بْحِبَّك", en: "I love you (to a man)", art: "heart", topic: "feeling", like: ["bhebbik"],
      tip: "Say it to Baba or Jiddo.",
    },
    {
      id: "bhebbik", text: "بحبِّك", roman: "bHibbik", say: "بْحِبِّك", en: "I love you (to a woman)", art: "heart", topic: "feeling", like: ["bhebbak"],
      tip: "Say it to Mama or Teta.",
    },
    {
      id: "shu-bak", text: "شو بك؟", roman: "shu bak?", say: "شو بَك", en: "What's the matter?", topic: "feeling",
      words: [{ text: "شو", roman: "shu" }, { text: "بك", roman: "bak" }],
      tip: "To a girl: shu biki? Some families say shu maalak?",
    },
    {
      id: "wala-shi", text: "ولا شي", roman: "wala shi", say: "وَلا شي", en: "Nothing", topic: "feeling",
      words: [{ text: "ولا", roman: "wala" }, { text: "شي", roman: "shi" }],
      tip: "The answer to shu bak? when you are OK.",
    },
    {
      id: "biddi-dammeh", text: "بدّي ضمّة", roman: "biddi Dammeh", say: "بِدّي ضَمّة", en: "I want a hug", topic: "feeling",
      words: [{ text: "بدّي", roman: "biddi" }, { text: "ضمّة", roman: "Dammeh" }],
      tip: "A hug is Dammeh. Some families say HuDun.",
    },
  ],
  scenes: [
    {
      id: "u08-teta-smile", setup: "Teta sees your big smile and asks you.", who: { name: "Teta" },
      line: "kiifak", reply: ["mabsoot"], alsoOk: ["mniih", "hamdilla", "ana-mniih", "w-inta"],
    },
    {
      id: "u08-mama-quiet", setup: "You are quiet. Mama asks. You are fine, really.", who: { name: "Mama" },
      line: "shu-bak", reply: ["wala-shi"], alsoOk: ["mniih", "ana-mniih", "hamdilla", "mabsoot"],
    },
    { id: "u08-sleepy", setup: "It is late. Your eyes keep closing. Tell Mama.", who: { name: "Mama" }, reply: ["nasaan"], alsoOk: ["taabaan"] },
    { id: "u08-cousin-cries", setup: "Your little cousin is crying. Ask him what happened.", who: { name: "Cousin" }, reply: ["shu-bak"], alsoOk: ["kiifak"] },
    { id: "u08-bedtime", setup: "Mama tucks you into bed. Tell her you love her.", who: { name: "Mama" }, reply: ["bhebbik"], alsoOk: ["biddi-dammeh"] },
    {
      id: "u08-baba-trip", setup: "Baba is home after a long trip. Open your arms!", who: { name: "Baba" },
      reply: ["biddi-dammeh"], alsoOk: ["bhebbak", "marhaba", "ahlein", "kiifak-baba", "kiifak", "mabsoot"],
    },
    {
      id: "u08-fever", setup: "You have a fever and feel hot. Teta asks you.", who: { name: "Teta" },
      line: "kiifak", reply: ["mariid"], alsoOk: ["taabaan", "nasaan"],
    },
  ],
};
