// Unit 16 — Bigger Numbers: eleven to twenty, the tens up to a hundred, and
// the words a child needs for prices: money, expensive, cheap, how much.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U16: LangUnitPack = {
  unit: {
    name: "Bigger Numbers",
    icon: iconRef("abacus"),
    hue: "#34d399",
    blurb: "Count higher and ask the price.",
    souvenir: { icon: iconRef("coin"), name: "Shiny Coin" },
    lessons: [
      { name: "Eleven to Fifteen", kind: "words", teach: ["hdash", "tnash", "tlattash", "arbatash", "khamstash"] },
      { name: "Up to a Hundred", kind: "words", teach: ["ishriin", "khamsiin", "miyyeh", "masaari", "ghaali"] },
      {
        name: "How Much?", kind: "talk",
        teach: ["addeish-haada", "ktiir-ghaali", "haada-rkhiis"],
        scenes: ["u16-hide-seek", "u16-stickers", "u16-toy-car", "u16-sweets-price", "u16-cheap-ball", "u16-price-tag", "u16-big-cake"],
      },
      {
        name: "Reading Numbers", kind: "letters", letters: ["ع", "غ", "ص"], spell: ["ishriin", "khamsiin", "miyyeh", "masaari", "ghaali"],
        mission: "In a shop, point at something and ask: addeish haada?",
      },
    ],
  },
  phrases: [
    { id: "hdash", text: "حدعش", roman: "Hda‘sh", say: "حْدَعْش", en: "Eleven", topic: "number" },
    { id: "tnash", text: "طنعش", roman: "Tna‘sh", say: "طْنَعْش", en: "Twelve", topic: "number" },
    { id: "tlattash", text: "تلطعش", roman: "tlaTTa‘sh", say: "تْلَطَّعْش", en: "Thirteen", topic: "number" },
    { id: "arbatash", text: "أربعطعش", roman: "arba‘Ta‘sh", say: "أَرْبَعْطَعْش", en: "Fourteen", topic: "number" },
    {
      id: "khamstash", text: "خمسطعش", roman: "khamsTa‘sh", say: "خَمِسْطَعْش", en: "Fifteen", topic: "number",
      tip: "Fifteen. Then siTTa‘sh, saba‘Ta‘sh, tmanTa‘sh, tisa‘Ta‘sh.",
    },
    {
      id: "ishriin", text: "عشرين", roman: "‘ishriin", say: "عِشْرين", en: "Twenty", topic: "number",
      tip: "Twenty. Then tlaatiin, arb‘iin, khamsiin: the tens end in -iin.",
    },
    { id: "khamsiin", text: "خمسين", roman: "khamsiin", say: "خَمْسين", en: "Fifty", topic: "number" },
    { id: "miyyeh", text: "مية", roman: "miyyeh", say: "مِيّة", en: "A hundred", topic: "number" },
    { id: "masaari", text: "مصاري", roman: "maSaari", say: "مَصاري", en: "Money", art: "coin", topic: "shop" },
    { id: "ghaali", text: "غالي", roman: "ghaali", en: "Expensive", topic: "shop", like: ["ktiir-ghaali"], tip: "ghaali means it costs a lot." },
    {
      id: "addeish-haada", text: "قدّيش هادا؟", roman: "addeish haada?", say: "أَدّيش هادا", en: "How much is this?", topic: "shop",
      words: [{ text: "قدّيش", roman: "addeish" }, { text: "هادا", roman: "haada" }],
      tip: "How much is this? Point at it and ask.",
    },
    {
      id: "ktiir-ghaali", text: "كتير غالي", roman: "ktiir ghaali", say: "كْتير غالي", en: "Too expensive!", topic: "shop", like: ["ghaali"],
      words: [{ text: "كتير", roman: "ktiir" }, { text: "غالي", roman: "ghaali" }],
    },
    {
      id: "haada-rkhiis", text: "هادا رخيص", roman: "haada rkhiiS", say: "هادا رْخيص", en: "This is cheap", topic: "shop",
      words: [{ text: "هادا", roman: "haada" }, { text: "رخيص", roman: "rkhiiS" }],
      tip: "This is cheap: it costs only a little.",
    },
  ],
  scenes: [
    { id: "u16-hide-seek", setup: "Hide and seek! You counted to ten. What comes next?", reply: ["hdash"] },
    { id: "u16-stickers", setup: "You count your stickers: twenty! Tell your cousin.", reply: ["ishriin"] },
    { id: "u16-toy-car", setup: "In the toy shop, you love a red car. Ask the price.", who: { name: "Shopkeeper" }, reply: ["addeish-haada"] },
    {
      id: "u16-sweets-price", setup: "You want a small bag of sweets. The man says the price.", who: { name: "Shopkeeper" },
      line: "khamsiin", reply: ["ktiir-ghaali"],
    },
    { id: "u16-cheap-ball", setup: "The ball costs only one coin! Tell Baba.", who: { name: "Baba" }, reply: ["haada-rkhiis"] },
    { id: "u16-price-tag", setup: "Jiddo points at a price tag that says 12. He asks:", who: { name: "Jiddo" }, line: "addeish-haada", reply: ["tnash"] },
    { id: "u16-big-cake", setup: "Uncle's birthday cake has a big number 50 on it.", reply: ["khamsiin"] },
  ],
};
