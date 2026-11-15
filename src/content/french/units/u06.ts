// Unit 6 — À table. Food, being hungry or full, and table manners.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U06: LangUnitPack = {
  unit: {
    name: "À table",
    icon: iconRef("plate"),
    hue: "#ff9f6e",
    blurb: "Talk about food at the table.",
    souvenir: { icon: iconRef("pizza"), name: "Little Picnic" },
    lessons: [
      { name: "Good Food", kind: "words", teach: ["pain", "fromage", "lait", "pomme", "poulet"] },
      { name: "Hungry!", kind: "words", teach: ["riz", "gateau", "miam", "jai-faim", "jai-soif"] },
      {
        name: "At the Table", kind: "talk",
        teach: ["bon-appetit", "merci-toi-aussi", "c-est-delicieux", "je-nai-plus-faim"],
        scenes: ["hungry-home", "thirsty-park", "table-start", "tasty-chicken", "full-plate", "want-apple", "want-cheese"],
      },
      {
        name: "Spell Food", kind: "letters", spell: ["pain", "lait", "pomme", "gateau", "fromage"],
        mission: "Say \"Bon appétit!\" at dinner. Say \"C'est délicieux!\" to the cook.",
      },
    ],
  },
  phrases: [
    { id: "pain", text: "Pain", en: "Bread", topic: "food", tip: "Sounds like 'pan', said through the nose." },
    { id: "fromage", text: "Fromage", en: "Cheese", topic: "food", tip: "Say it fro-MAZH." },
    { id: "lait", text: "Lait", en: "Milk", topic: "food", tip: "Rhymes with 'lay'." },
    { id: "pomme", text: "Pomme", en: "Apple", art: "apple", topic: "food", tip: "Say it 'pom'." },
    { id: "poulet", text: "Poulet", en: "Chicken", topic: "food", tip: "Say poo-LAY. The t is silent." },
    { id: "riz", text: "Riz", en: "Rice", topic: "food", tip: "Sounds like 'ree'. The z is silent." },
    { id: "gateau", text: "Gâteau", en: "Cake", topic: "food", tip: "Say gah-TOH." },
    { id: "miam", text: "Miam", en: "Yum!", topic: "food", like: ["c-est-delicieux"], tip: "Say it with a big smile." },
    {
      id: "jai-faim", text: "J'ai faim.", en: "I'm hungry", topic: "feeling",
      words: [{ text: "J'ai" }, { text: "faim" }], tip: "French says 'I have hunger'.",
    },
    {
      id: "jai-soif", text: "J'ai soif.", en: "I'm thirsty", topic: "feeling",
      words: [{ text: "J'ai" }, { text: "soif" }], tip: "French says 'I have thirst'.",
    },
    {
      id: "bon-appetit", text: "Bon appétit!", en: "Enjoy your meal", topic: "food",
      words: [{ text: "Bon" }, { text: "appétit" }], tip: "Said before eating. The t at the end is silent.",
    },
    {
      id: "merci-toi-aussi", text: "Merci, toi aussi.", en: "Thanks, you too (friend)", topic: "food", like: ["merci-vous-aussi"],
      words: [{ text: "Merci" }, { text: "toi" }, { text: "aussi" }], tip: "The answer to Bon appétit.",
    },
    {
      id: "c-est-delicieux", text: "C'est délicieux.", en: "It's delicious", topic: "food", like: ["miam"],
      words: [{ text: "C'est" }, { text: "délicieux" }], tip: "Say it to the cook!",
    },
    {
      id: "je-nai-plus-faim", text: "Je n'ai plus faim.", en: "I'm full", topic: "feeling",
      words: [{ text: "Je" }, { text: "n'ai" }, { text: "plus" }, { text: "faim" }], tip: "Literally 'I have no more hunger'.",
    },
  ],
  scenes: [
    {
      id: "hungry-home", setup: "You get home from school. Your tummy rumbles.", who: { name: "Maman" },
      reply: ["jai-faim"], alsoOk: ["je-veux", "je-voudrais", "pain", "gateau", "pomme", "fromage", "jus"],
    },
    {
      id: "thirsty-park", setup: "It is hot at the park. You need a drink.", who: { name: "Papa" },
      reply: ["jai-soif"], alsoOk: ["je-peux-avoir-de-leau", "je-veux-de-leau", "je-veux", "je-voudrais", "eau", "jus", "lait"],
    },
    {
      id: "table-start", setup: "Papa sits down at the table and says it.", who: { name: "Papa" }, line: "bon-appetit",
      reply: ["merci-toi-aussi"], alsoOk: ["bon-appetit", "merci", "merci-beaucoup"],
    },
    {
      id: "tasty-chicken", setup: "Grandma made chicken. It tastes great!", who: { name: "Grandma" },
      reply: ["c-est-delicieux", "miam"], alsoOk: ["merci", "merci-beaucoup", "encore", "poulet"],
    },
    {
      id: "full-plate", setup: "Maman offers you more rice. You are full.", who: { name: "Maman" },
      reply: ["je-nai-plus-faim", "non-merci"], alsoOk: ["non", "assez", "merci", "je-ne-veux-pas"],
    },
    {
      id: "want-apple", setup: "Maman holds a bowl of fruit. You want an apple.", who: { name: "Maman" },
      reply: ["pomme"], alsoOk: ["je-veux", "je-voudrais", "oui-merci", "oui-s-il-te-plait"],
    },
    {
      id: "want-cheese", setup: "Papa makes a sandwich. You want cheese in it.", who: { name: "Papa" },
      reply: ["fromage"], alsoOk: ["je-veux", "je-voudrais", "oui-merci", "oui-s-il-te-plait"],
    },
  ],
};
