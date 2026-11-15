// Unit 6 — At the Table: the food on a family table, hungry / thirsty / full,
// and SaHtein with its answer — said at every meal.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U06: LangUnitPack = {
  unit: {
    name: "At the Table",
    icon: iconRef("plate"),
    hue: "#f97316",
    blurb: "Food words for every meal.",
    souvenir: { icon: iconRef("pan"), name: "Teta's Little Pot" },
    lessons: [
      { name: "Bread and Cheese", kind: "words", teach: ["khubz", "jibneh", "laban", "beid", "ruzz"] },
      { name: "Yummy!", kind: "words", teach: ["jaaj", "tiffaaha", "moozeh", "tayybeh", "sahtein"] },
      {
        name: "I'm Hungry!", kind: "talk",
        teach: ["ana-jooaan", "ana-atshaan", "ana-shabaan", "ala-albik"],
        scenes: ["u06-teta-sahtein", "u06-home-hungry", "u06-park-thirsty", "u06-jiddo-more", "u06-yummy", "u06-cousin-hungry", "u06-breakfast"],
      },
      {
        name: "Zaay and Siin", kind: "letters", letters: ["ز", "س"], spell: ["khubz", "ruzz"],
        mission: "When someone says SaHtein to you today, answer: ‘ala ’albik!",
      },
    ],
  },
  phrases: [
    { id: "khubz", text: "خبز", roman: "khubz", say: "خُبْز", en: "Bread", topic: "food" },
    { id: "jibneh", text: "جبنة", roman: "jibneh", say: "جِبْنة", en: "Cheese", topic: "food" },
    { id: "laban", text: "لبن", roman: "laban", say: "لَبَن", en: "Yoghurt", topic: "food", tip: "laban is yoghurt, not milk. Milk is Haliib." },
    { id: "beid", text: "بيض", roman: "beiD", say: "بَيْض", en: "Eggs", topic: "food", tip: "One egg is beiDa." },
    { id: "ruzz", text: "رز", roman: "ruzz", say: "رُزّ", en: "Rice", topic: "food", tip: "Some families say rizz." },
    { id: "jaaj", text: "جاج", roman: "jaaj", en: "Chicken", topic: "food" },
    { id: "tiffaaha", text: "تفاحة", roman: "tiffaaHa", say: "تِفّاحة", en: "An apple", art: "apple", topic: "food", tip: "Some families say tuffaaHa." },
    { id: "moozeh", text: "موزة", roman: "moozeh", say: "مُوزة", en: "A banana", topic: "food" },
    { id: "tayybeh", text: "طيبة", roman: "Tayybeh", say: "طَيّْبة", en: "Tasty, yummy", topic: "food", like: ["helw"], tip: "Some families say zaakyeh." },
    {
      id: "sahtein", text: "صحتين", roman: "SaHtein", say: "صَحْتين", en: "Enjoy your food!", topic: "food",
      tip: "Grown-ups say it while you eat. Answer: ‘ala ’albik!",
    },
    {
      id: "ana-jooaan", text: "أنا جوعان", roman: "ana joo‘aan", say: "أَنا جوعان", en: "I'm hungry", topic: "food",
      words: [{ text: "أنا", roman: "ana" }, { text: "جوعان", roman: "joo‘aan" }],
      tip: "A girl says: ana joo‘aaneh.",
    },
    {
      id: "ana-atshaan", text: "أنا عطشان", roman: "ana ‘aTshaan", say: "أَنا عَطْشان", en: "I'm thirsty", topic: "food",
      words: [{ text: "أنا", roman: "ana" }, { text: "عطشان", roman: "‘aTshaan" }],
      tip: "A girl says: ana ‘aTshaaneh.",
    },
    {
      id: "ana-shabaan", text: "أنا شبعان", roman: "ana shab‘aan", say: "أَنا شَبْعان", en: "I'm full", topic: "food", like: ["khalas"],
      words: [{ text: "أنا", roman: "ana" }, { text: "شبعان", roman: "shab‘aan" }],
      tip: "A girl says: ana shab‘aaneh.",
    },
    {
      id: "ala-albik", text: "على قلبِك", roman: "‘ala ’albik", say: "عَلى أَلْبِك", en: "Same to you! (after SaHtein)", topic: "food",
      words: [{ text: "على", roman: "‘ala" }, { text: "قلبِك", roman: "’albik" }],
      tip: "Say it to Mama or Teta. To a man: ‘ala ’albak.",
    },
  ],
  scenes: [
    {
      id: "u06-teta-sahtein", setup: "Teta brings dinner to the table.", who: { name: "Teta" },
      line: "sahtein", reply: ["ala-albik"], alsoOk: ["shukran", "yislamo", "tayybeh", "ana-jooaan"],
    },
    { id: "u06-home-hungry", setup: "You get home from school. Your tummy rumbles!", who: { name: "Mama" }, reply: ["ana-jooaan"] },
    {
      id: "u06-park-thirsty", setup: "You ran at the park. Your mouth is so dry!", who: { name: "Mama" },
      reply: ["ana-atshaan"], alsoOk: ["biddi-mayy", "atiini-mayy-min-fadlik", "mayy"],
    },
    {
      id: "u06-jiddo-more", setup: "Jiddo wants to give you more. You can't eat another bite!", who: { name: "Jiddo" },
      reply: ["ana-shabaan"], alsoOk: ["khalas", "la-shukran", "la", "ma-biddi", "shukran", "yislamo"],
    },
    { id: "u06-yummy", setup: "You taste Khaalto's cooking. It is so good!", who: { name: "Khaalto" }, reply: ["tayybeh"], alsoOk: ["yislamo", "shukran"] },
    { id: "u06-cousin-hungry", setup: "Your cousin looks at your bread and says:", who: { name: "Cousin" }, line: "ana-jooaan", reply: ["tfaddal"] },
    { id: "u06-breakfast", setup: "Breakfast time! Tell Mama what you want. You love eggs.", who: { name: "Mama" }, reply: ["beid"], alsoOk: ["biddi"] },
  ],
};
