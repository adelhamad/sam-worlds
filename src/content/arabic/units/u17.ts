// Unit 17 — At the Shop: buying fruit and bread at the corner shop, from
// "shu biddak?" to paying and getting the change back.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U17: LangUnitPack = {
  unit: {
    name: "At the Shop",
    icon: iconRef("shop"),
    hue: "#fb923c",
    blurb: "Buy fruit and bread by yourself.",
    souvenir: { icon: iconRef("piggy"), name: "Piggy Bank" },
    lessons: [
      { name: "In the Shop", kind: "words", teach: ["dukkaan", "kiis", "kiilo", "il-baai"] },
      { name: "Buying", kind: "words", teach: ["biddi-ishtari", "shu-biddak", "bass-heik", "addeish-il-kiilo"] },
      {
        name: "A Kilo, Please", kind: "talk",
        teach: ["biddi-kiilo-tuffaah", "fii-andak-khubz", "tfaddal-il-masaari"],
        scenes: ["u17-fruit-man", "u17-bakery", "u17-bananas", "u17-pay", "u17-thats-all", "u17-change", "u17-full-arms"],
      },
      {
        name: "Reading the Shop", kind: "letters", letters: ["د", "س", "ز"], spell: ["dukkaan", "kiis", "kiilo", "il-baai"],
        mission: "At the shop, ask the seller: ’addeish il-kiilo? Then say: bass heik.",
      },
    ],
  },
  phrases: [
    { id: "dukkaan", text: "دكّان", roman: "dukkaan", say: "دُكّان", en: "Small shop", art: "shop", topic: "shop", tip: "dukkaan is a small shop. Some say dikkaan." },
    { id: "kiis", text: "كيس", roman: "kiis", en: "Bag (for shopping)", topic: "shop", tip: "kiis is a shopping bag. A school bag is a shanTa." },
    { id: "kiilo", text: "كيلو", roman: "kiilo", en: "A kilo", art: "scales", topic: "shop" },
    { id: "il-baai", text: "الباقي", roman: "il-baa’i", say: "الباءي", en: "The change (money back)", topic: "shop", tip: "il-baa’i is the money you get back." },
    {
      id: "biddi-ishtari", text: "بدّي اشتري", roman: "biddi ishtari", say: "بِدّي إشْتِري", en: "I want to buy", topic: "shop",
      words: [{ text: "بدّي", roman: "biddi" }, { text: "اشتري", roman: "ishtari" }],
      tip: "I want to buy. Then say what: biddi ishtari Taabeh.",
    },
    {
      id: "shu-biddak", text: "شو بدّك؟", roman: "shu biddak?", say: "شو بِدَّك", en: "What would you like?", topic: "shop",
      words: [{ text: "شو", roman: "shu" }, { text: "بدّك", roman: "biddak" }],
      tip: "What would you like? Said to a boy. To a girl: shu biddik?",
    },
    {
      id: "bass-heik", text: "بس هيك", roman: "bass heik", say: "بَسّ هَيك", en: "That's all", topic: "shop", like: ["khalas"],
      words: [{ text: "بس", roman: "bass" }, { text: "هيك", roman: "heik" }],
      tip: "That's all. Done shopping? Say bass heik, shukran.",
    },
    {
      id: "addeish-il-kiilo", text: "قدّيش الكيلو؟", roman: "’addeish il-kiilo?", say: "أَدّيش الكيلو", en: "How much for a kilo?", topic: "shop",
      words: [{ text: "قدّيش", roman: "’addeish" }, { text: "الكيلو", roman: "il-kiilo" }],
    },
    {
      id: "biddi-kiilo-tuffaah", text: "بدّي كيلو تفاح", roman: "biddi kiilo tiffaaH", say: "بِدّي كيلو تِفّاح", en: "I want a kilo of apples",
      art: "apple", topic: "shop",
      words: [{ text: "بدّي", roman: "biddi" }, { text: "كيلو", roman: "kiilo" }, { text: "تفاح", roman: "tiffaaH" }],
    },
    {
      id: "fii-andak-khubz", text: "في عندك خبز؟", roman: "fii ‘andak khubz?", say: "في عَنْدَك خُبْز", en: "Do you have bread?", topic: "shop",
      words: [{ text: "في", roman: "fii" }, { text: "عندك", roman: "‘andak" }, { text: "خبز", roman: "khubz" }],
      tip: "Do you have bread? Ask a man. To a woman: fii ‘andik?",
    },
    {
      id: "tfaddal-il-masaari", text: "تفضل المصاري", roman: "tfaDDal il-maSaari", say: "تْفَضَّل المَصاري", en: "Here's the money", topic: "shop", like: ["tfaddal"],
      words: [{ text: "تفضل", roman: "tfaDDal" }, { text: "المصاري", roman: "il-maSaari" }],
      tip: "Here's the money. To a woman: tfaDDali il-maSaari.",
    },
  ],
  scenes: [
    {
      id: "u17-fruit-man", setup: "You walk into the fruit shop. The man smiles and asks:", who: { name: "Shopkeeper" },
      line: "shu-biddak", reply: ["biddi-kiilo-tuffaah"], alsoOk: ["biddi-ishtari", "fii-andak-khubz", "addeish-il-kiilo", "addeish-haada", "biddi", "tiffaaha", "moozeh"],
    },
    { id: "u17-bakery", setup: "At the bakery, the shelves look empty. Ask the man.", who: { name: "Baker" }, reply: ["fii-andak-khubz"] },
    {
      id: "u17-bananas", setup: "The bananas look yummy. You want to know the price per kilo.", who: { name: "Shopkeeper" },
      reply: ["addeish-il-kiilo"], alsoOk: ["addeish-haada"],
    },
    {
      id: "u17-pay", setup: "You bought sweets. The shopkeeper tells you the price.", who: { name: "Shopkeeper" },
      line: "khamsiin", reply: ["tfaddal-il-masaari"], alsoOk: ["tfaddal", "ktiir-ghaali", "ghaali"],
    },
    { id: "u17-thats-all", setup: "You have everything on Mama's list. The man waits.", who: { name: "Shopkeeper" }, reply: ["bass-heik"], alsoOk: ["khalas", "la-shukran", "la", "shukran", "yislamo"] },
    { id: "u17-change", setup: "You paid too much. The man forgot to give money back.", who: { name: "Shopkeeper" }, reply: ["il-baai"] },
    { id: "u17-full-arms", setup: "Your arms are full of oranges. You need something to carry them.", reply: ["kiis"] },
  ],
};
