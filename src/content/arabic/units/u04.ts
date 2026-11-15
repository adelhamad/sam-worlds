// Unit 4 — My Family: what Sam calls Teta, Jiddo, uncles, aunts and cousins,
// and how he shows them to a friend ("this is my…").
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U04: LangUnitPack = {
  unit: {
    name: "My Family",
    icon: iconRef("family"),
    hue: "#34d399",
    blurb: "Teta, Jiddo, uncles, aunts, cousins.",
    souvenir: { icon: iconRef("family"), name: "Teta's Photo Frame" },
    lessons: [
      { name: "Teta and Jiddo", kind: "words", teach: ["teeta", "jiddo", "akhi", "ukhti", "beebi"] },
      { name: "Uncles and Aunts", kind: "words", teach: ["ammo", "khaalo", "ammto", "khaalto", "ibn-ammi"] },
      {
        name: "This Is My Family", kind: "talk",
        teach: ["kiifik-teeta", "haada-ibn-ammi", "haadi-eilti"],
        scenes: ["u04-teta-door", "u04-ammo-door", "u04-khaalto-sofa", "u04-cousin", "u04-photo", "u04-jiddo-sweet", "u04-khaalo-asks"],
      },
      {
        name: "Khaa and Daal", kind: "letters", letters: ["خ", "د"], spell: ["jiddo", "khaalo"],
        mission: "Call or visit Teta and ask her: kiifik teeta?",
      },
    ],
  },
  phrases: [
    { id: "teeta", text: "تيتا", roman: "teeta", en: "Grandma", topic: "family", tip: "Some families say sitti." },
    { id: "jiddo", text: "جدو", roman: "jiddo", say: "جِدّو", en: "Grandpa", topic: "family", tip: "Some families say siidi." },
    { id: "akhi", text: "أخي", roman: "akhi", say: "أَخي", en: "My brother", topic: "family", tip: "Some families say khayyi or akhooy." },
    { id: "ukhti", text: "أختي", roman: "ukhti", say: "أُخْتي", en: "My sister", topic: "family", tip: "Some families say ikhti." },
    { id: "beebi", text: "بيبي", roman: "beebi", en: "Baby", topic: "family", tip: "Some families say nunu." },
    { id: "ammo", text: "عمو", roman: "‘ammo", say: "عَمّو", en: "Uncle (Dad's brother)", topic: "family", tip: "Kids also call any grown-up man ‘ammo." },
    { id: "khaalo", text: "خالو", roman: "khaalo", en: "Uncle (Mom's brother)", topic: "family" },
    { id: "ammto", text: "عمتو", roman: "‘ammto", say: "عَمّتو", en: "Aunt (Dad's sister)", topic: "family" },
    { id: "khaalto", text: "خالتو", roman: "khaalto", say: "خالْتو", en: "Aunt (Mom's sister)", topic: "family", tip: "Kids also call any grown-up lady khaalto." },
    {
      id: "ibn-ammi", text: "ابن عمي", roman: "ibn ‘ammi", say: "إِبِن عَمّي", en: "My cousin (‘ammo's son)", topic: "family",
      words: [{ text: "ابن", roman: "ibn" }, { text: "عمي", roman: "‘ammi" }],
      tip: "Khaalo's son: ibn khaali. A girl cousin: bint ‘ammi.",
    },
    {
      id: "kiifik-teeta", text: "كيفِك تيتا؟", roman: "kiifik teeta?", say: "كِيفِك تيتا", en: "How are you, Grandma?", topic: "family",
      words: [{ text: "كيفِك", roman: "kiifik" }, { text: "تيتا", roman: "teeta" }],
    },
    {
      id: "haada-ibn-ammi", text: "هادا ابن عمي", roman: "haada ibn ‘ammi", say: "هادا إِبِن عَمّي", en: "This is my cousin", topic: "family",
      words: [{ text: "هادا", roman: "haada" }, { text: "ابن", roman: "ibn" }, { text: "عمي", roman: "‘ammi" }],
      tip: "Lebanese families say hayda. A girl cousin: haadi bint ‘ammi.",
    },
    {
      id: "haadi-eilti", text: "هادي عيلتي", roman: "haadi ‘eilti", say: "هادي عيلْتي", en: "This is my family", art: "family", topic: "family",
      words: [{ text: "هادي", roman: "haadi" }, { text: "عيلتي", roman: "‘eilti" }],
      tip: "‘eileh means family. ‘eilti means my family.",
    },
  ],
  scenes: [
    {
      id: "u04-teta-door", setup: "You get to Teta's house. She opens the door.", who: { name: "Teta" },
      reply: ["kiifik-teeta"], alsoOk: ["marhaba", "ahlein", "kiifik", "teeta"],
    },
    {
      id: "u04-ammo-door", setup: "Baba's brother walks in. Call out to him!", who: { name: "Uncle" },
      reply: ["ammo"], alsoOk: ["marhaba", "ahlein", "kiifak"],
    },
    { id: "u04-khaalto-sofa", setup: "Mama's sister is on the sofa. Call her over!", who: { name: "Auntie" }, reply: ["khaalto"] },
    {
      id: "u04-cousin", setup: "Your friend asks who that boy is. He is ‘ammo's son.", who: { name: "Friend" },
      reply: ["haada-ibn-ammi"], alsoOk: ["ibn-ammi"],
    },
    { id: "u04-photo", setup: "You show your friend a photo of everyone at home.", who: { name: "Friend" }, reply: ["haadi-eilti"] },
    { id: "u04-jiddo-sweet", setup: "Jiddo gives you a sweet.", who: { name: "Jiddo" }, line: "tfaddal", reply: ["yislamo", "shukran"] },
    {
      id: "u04-khaalo-asks", setup: "Khaalo picks you up and asks.", who: { name: "Khaalo" },
      line: "kiifak", reply: ["mniih", "hamdilla", "ana-mniih"], alsoOk: ["w-inta"],
    },
  ],
};
