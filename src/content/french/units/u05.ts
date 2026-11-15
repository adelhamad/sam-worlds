// Unit 5 — Je veux. Asking for things and saying yes, no, more, enough.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U05: LangUnitPack = {
  unit: {
    name: "Je veux",
    icon: iconRef("cup"),
    hue: "#a78bfa",
    blurb: "Ask for what you want, nicely.",
    souvenir: { icon: iconRef("cup"), name: "Little Cup" },
    lessons: [
      { name: "More and Enough", kind: "words", teach: ["eau", "jus", "encore", "un-peu", "beaucoup", "assez"] },
      { name: "I Want", kind: "words", teach: ["je-veux", "je-voudrais", "tu-veux", "je-ne-veux-pas"] },
      {
        name: "Ask Nicely", kind: "talk",
        teach: ["je-veux-de-leau", "tu-veux-de-leau", "je-peux-avoir-de-leau", "encore-s-il-te-plait"],
        scenes: ["want-water", "offer-water", "refuse-cake", "little-juice", "stop-pouring", "more-cake", "lots-berries"],
      },
      {
        name: "Spell Want", kind: "letters", spell: ["eau", "jus", "encore", "assez"],
        mission: "Ask for a drink with \"Je peux avoir de l'eau?\" Don't forget Merci.",
      },
    ],
  },
  phrases: [
    { id: "eau", text: "Eau", en: "Water", art: "water", topic: "food", tip: "Say it like 'oh'." },
    { id: "jus", text: "Jus", en: "Juice", art: "juice", topic: "food", tip: "Say 'zhew', with round lips." },
    { id: "encore", text: "Encore", en: "More", topic: "action", like: ["encore-s-il-te-plait", "encore-une-fois"], tip: "Say it 'on-kor'." },
    {
      id: "un-peu", text: "Un peu", en: "A little", topic: "action",
      words: [{ text: "Un" }, { text: "peu" }], tip: "Peu sounds like 'puh'.",
    },
    { id: "beaucoup", text: "Beaucoup", en: "A lot", topic: "action", tip: "Say it 'boh-koo'." },
    { id: "assez", text: "Assez", en: "Enough", topic: "action", tip: "Say it 'ah-SAY'. Use it when you have had enough." },
    {
      id: "je-veux", text: "Je veux", en: "I want", topic: "action", like: ["je-voudrais", "je-veux-de-leau", "je-peux-avoir-de-leau"],
      words: [{ text: "Je" }, { text: "veux" }], tip: "Fine at home. With others, say Je voudrais.",
    },
    {
      id: "je-voudrais", text: "Je voudrais", en: "I would like", topic: "action", like: ["je-veux", "je-veux-de-leau", "je-peux-avoir-de-leau"],
      words: [{ text: "Je" }, { text: "voudrais" }], tip: "The polite way. Use it with grown-ups and in shops.",
    },
    {
      id: "tu-veux", text: "Tu veux?", en: "Do you want some?", topic: "action", like: ["tu-veux-de-leau"],
      words: [{ text: "Tu" }, { text: "veux" }], tip: "Say it to a friend. To a grown-up: Vous voulez?",
    },
    {
      id: "je-ne-veux-pas", text: "Je ne veux pas.", en: "I don't want any", topic: "action",
      words: [{ text: "Je" }, { text: "ne" }, { text: "veux" }, { text: "pas" }], tip: "Kids often drop the ne: Je veux pas.",
    },
    {
      id: "je-veux-de-leau", text: "Je veux de l'eau.", en: "I want some water", art: "cup", topic: "food",
      like: ["je-veux", "je-voudrais", "je-peux-avoir-de-leau"],
      words: [{ text: "Je" }, { text: "veux" }, { text: "de" }, { text: "l'eau" }], tip: "De l'eau means some water.",
    },
    {
      id: "tu-veux-de-leau", text: "Tu veux de l'eau?", en: "Do you want water?", art: "cup", topic: "food", like: ["tu-veux"],
      words: [{ text: "Tu" }, { text: "veux" }, { text: "de" }, { text: "l'eau" }], tip: "Say it to a friend or family.",
    },
    {
      id: "je-peux-avoir-de-leau", text: "Je peux avoir de l'eau?", en: "Can I have some water?", art: "cup", topic: "food",
      like: ["je-veux", "je-voudrais", "je-veux-de-leau"],
      words: [{ text: "Je" }, { text: "peux" }, { text: "avoir" }, { text: "de" }, { text: "l'eau" }], tip: "The nicest way to ask for anything.",
    },
    {
      id: "encore-s-il-te-plait", text: "Encore, s'il te plaît.", en: "More, please", topic: "food", like: ["encore", "encore-une-fois"],
      words: [{ text: "Encore" }, { text: "s'il" }, { text: "te" }, { text: "plaît" }], tip: "To a grown-up, say s'il vous plaît.",
    },
  ],
  scenes: [
    {
      id: "want-water", setup: "You are thirsty. Ask Maman for some water.", who: { name: "Maman" },
      reply: ["je-peux-avoir-de-leau", "je-veux-de-leau"], alsoOk: ["je-veux", "je-voudrais", "eau", "s-il-te-plait"],
    },
    {
      id: "offer-water", setup: "Papa offers you water. You are very thirsty.", who: { name: "Papa" }, line: "tu-veux-de-leau",
      reply: ["oui-merci", "oui-s-il-te-plait"],
      alsoOk: ["oui", "merci", "merci-beaucoup", "beaucoup", "je-veux", "je-voudrais", "je-veux-de-leau", "encore", "s-il-te-plait", "s-il-vous-plait"],
    },
    {
      id: "refuse-cake", setup: "Grandma holds out more cake. You are full.", who: { name: "Grandma" }, line: "tu-veux",
      reply: ["non-merci", "je-ne-veux-pas"], alsoOk: ["non", "merci", "assez"],
    },
    {
      id: "little-juice", setup: "Papa asks how much juice you want. Only a little.", who: { name: "Papa" },
      reply: ["un-peu"],
    },
    {
      id: "stop-pouring", setup: "Your glass is full. Tell Papa to stop pouring.", who: { name: "Papa" },
      reply: ["assez"], alsoOk: ["non-merci", "merci", "non", "je-ne-veux-pas"],
    },
    {
      id: "more-cake", setup: "The cake is great. You want some more.", who: { name: "Grandma" },
      reply: ["encore-s-il-te-plait", "encore"], alsoOk: ["je-veux", "je-voudrais", "oui-s-il-te-plait", "s-il-te-plait", "un-peu", "oui-merci"],
    },
    {
      id: "lots-berries", setup: "Mamie asks how many strawberries you want. Lots!", who: { name: "Mamie" },
      reply: ["beaucoup"], alsoOk: ["encore", "je-veux", "je-voudrais"],
    },
  ],
};
