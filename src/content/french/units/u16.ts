// Unit 16 — Au magasin. A real shopping trip: bakery, ice cream, thanks.
// Here the child says "vous" to the shopkeeper.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U16: LangUnitPack = {
  unit: {
    name: "Au magasin",
    icon: iconRef("shop"),
    hue: "#e879f9",
    blurb: "Buy bread and ice cream yourself.",
    souvenir: { icon: iconRef("coin"), name: "Shiny Coin" },
    lessons: [
      { name: "In the Shop", kind: "words", teach: ["madame", "monsieur", "voila", "glace", "bonbon"] },
      {
        name: "Buying Things", kind: "words",
        teach: ["une-baguette", "la-monnaie", "combien-ca-coute", "c-est-tout", "bonne-journee"],
      },
      {
        name: "Au magasin", kind: "talk",
        teach: ["bonjour-madame", "une-baguette-s-il-vous-plait", "je-voudrais-une-glace", "merci-vous-aussi"],
        scenes: ["enter-bakery", "order-bread", "order-ice", "ask-price", "get-bread", "thats-all", "goodbye-shop"],
      },
      {
        name: "Spell Shopping", kind: "letters", spell: ["madame", "voila", "glace", "bonbon"],
        mission: "Go to a shop and say \"Bonjour, madame\", then ask for something with \"Je voudrais...\"",
      },
    ],
  },
  phrases: [
    { id: "madame", text: "Madame", en: "Madam, Mrs", topic: "polite", tip: "Say it to a shopkeeper or a teacher." },
    { id: "monsieur", text: "Monsieur", en: "Sir, Mr", topic: "polite", tip: "Say it 'muh-SYUH'. For a man you don't know." },
    { id: "voila", text: "Voilà", en: "Here you are", topic: "polite", tip: "Say 'vwah-LAH'. Said when handing something over." },
    { id: "glace", text: "Glace", en: "Ice cream", art: "icecream", topic: "food", tip: "Say it 'glass'." },
    { id: "bonbon", text: "Bonbon", en: "A sweet", art: "candy", topic: "food", tip: "Say 'bon-BON', both through the nose." },
    {
      id: "une-baguette", text: "Une baguette", en: "A baguette", topic: "food", like: ["une-baguette-s-il-vous-plait"],
      words: [{ text: "Une" }, { text: "baguette" }], tip: "Say 'oon ba-GET'.",
    },
    {
      id: "la-monnaie", text: "La monnaie", en: "The change", topic: "polite",
      words: [{ text: "La" }, { text: "monnaie" }], tip: "The coins you get back.",
    },
    {
      id: "combien-ca-coute", text: "Combien ça coûte?", en: "How much is it?", topic: "polite", like: ["combien"],
      words: [{ text: "Combien" }, { text: "ça" }, { text: "coûte" }], tip: "Ask it to a shopkeeper. Say 'koot'.",
    },
    {
      id: "c-est-tout", text: "C'est tout.", en: "That's all", topic: "polite",
      words: [{ text: "C'est" }, { text: "tout" }], tip: "Say it when you don't want anything else.",
    },
    {
      id: "bonne-journee", text: "Bonne journée!", en: "Have a good day!", topic: "polite",
      words: [{ text: "Bonne" }, { text: "journée" }], tip: "Shopkeepers say it as you leave.",
    },
    {
      id: "bonjour-madame", text: "Bonjour, madame.", en: "Hello, madam", topic: "polite",
      words: [{ text: "Bonjour" }, { text: "madame" }], tip: "Always greet a shopkeeper first. Say Bonjour, monsieur to a man.",
    },
    {
      id: "une-baguette-s-il-vous-plait", text: "Une baguette, s'il vous plaît.", en: "A baguette, please", topic: "food",
      like: ["une-baguette"],
      words: [{ text: "Une" }, { text: "baguette" }, { text: "s'il" }, { text: "vous" }, { text: "plaît" }], tip: "To a shopkeeper: vous, not tu.",
    },
    {
      id: "je-voudrais-une-glace", text: "Je voudrais une glace.", en: "I'd like an ice cream", topic: "food",
      words: [{ text: "Je" }, { text: "voudrais" }, { text: "une" }, { text: "glace" }], tip: "Add s'il vous plaît at the end.",
    },
    {
      id: "merci-vous-aussi", text: "Merci, vous aussi.", en: "Thanks, you too (grown-up)", topic: "polite",
      like: ["merci-toi-aussi"],
      words: [{ text: "Merci" }, { text: "vous" }, { text: "aussi" }], tip: "The answer to Bonne journée.",
    },
  ],
  scenes: [
    {
      id: "enter-bakery", setup: "You walk into the bakery. A lady smiles behind the counter.", who: { name: "Baker" },
      reply: ["bonjour-madame"], alsoOk: ["bonjour", "madame", "bonsoir"],
    },
    {
      id: "order-bread", setup: "You said hello to the baker. Now ask for a baguette.", who: { name: "Baker" },
      reply: ["une-baguette-s-il-vous-plait"], alsoOk: ["une-baguette", "je-voudrais", "s-il-vous-plait"],
    },
    {
      id: "order-ice", setup: "Your turn at the ice-cream stand. Ask for one ice cream.", who: { name: "Ice-cream seller" },
      reply: ["je-voudrais-une-glace"], alsoOk: ["glace", "je-voudrais", "je-veux", "s-il-vous-plait"],
    },
    {
      id: "ask-price", setup: "You see a toy car in a shop. How much is it?", who: { name: "Shopkeeper" },
      reply: ["combien-ca-coute"], alsoOk: ["combien", "excusez-moi"],
    },
    {
      id: "get-bread", setup: "The baker hands you your warm bread and says it.", who: { name: "Baker" }, line: "voila",
      reply: ["merci", "merci-beaucoup"], alsoOk: ["oui-merci", "merci-vous-aussi", "bravo", "super", "bonne-journee", "au-revoir"],
    },
    {
      id: "thats-all", setup: "Madame asks if you want anything else. You are done.", who: { name: "Baker" },
      reply: ["c-est-tout"], alsoOk: ["non-merci", "non", "merci", "assez", "je-ne-veux-pas"],
    },
    {
      id: "goodbye-shop", setup: "The baker wishes you a nice day as you leave.", who: { name: "Baker" }, line: "bonne-journee",
      reply: ["merci-vous-aussi"], alsoOk: ["merci", "merci-beaucoup", "au-revoir", "bonne-journee", "au-revoir-a-demain"],
    },
  ],
};
