// Unit 12 — Les couleurs. Colours, sizes, what you like and don't like.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U12: LangUnitPack = {
  unit: {
    name: "Les couleurs",
    icon: iconRef("palette"),
    hue: "#60a5fa",
    blurb: "Name colours and say what you like.",
    souvenir: { icon: iconRef("butterfly"), name: "Paint Butterfly" },
    lessons: [
      { name: "Colours", kind: "words", teach: ["rouge", "bleu", "vert", "jaune", "noir"] },
      { name: "Big and Small", kind: "words", teach: ["blanc", "grand", "petit", "joli", "quelle-couleur"] },
      {
        name: "I Like It", kind: "talk",
        teach: ["c-est-rouge", "j-aime-ca", "je-naime-pas-ca", "j-aime-le-bleu"],
        scenes: ["colour-ask", "like-peas", "dislike", "pretty", "big-truck", "tiny-bug", "like-blue"],
      },
      {
        name: "Spell Colours", kind: "letters", spell: ["rouge", "bleu", "vert", "jaune", "blanc"],
        mission: "Point at something and ask \"Quelle couleur?\" Then say \"J'aime ça!\"",
      },
    ],
  },
  phrases: [
    { id: "rouge", text: "Rouge", en: "Red", art: "blob-red", topic: "thing", tip: "Say it 'roozh'." },
    { id: "bleu", text: "Bleu", en: "Blue", art: "blob-blue", topic: "thing", tip: "Say it 'bluh'." },
    { id: "vert", text: "Vert", en: "Green", art: "blob-green", topic: "thing", tip: "The t is silent. A girl word needs verte." },
    { id: "jaune", text: "Jaune", en: "Yellow", art: "blob-yellow", topic: "thing", tip: "Say it 'zhohn'." },
    { id: "noir", text: "Noir", en: "Black", art: "blob-black", topic: "thing", tip: "Say it 'nwahr'." },
    { id: "blanc", text: "Blanc", en: "White", art: "blob-white", topic: "thing", tip: "Say 'blahn' through the nose. A girl word needs blanche." },
    { id: "grand", text: "Grand", en: "Big, tall", topic: "thing", tip: "The d is silent." },
    { id: "petit", text: "Petit", en: "Small, little", topic: "thing", tip: "The t at the end is silent." },
    { id: "joli", text: "Joli", en: "Pretty, nice", topic: "thing", tip: "Say 'zho-LEE'. For girl words: jolie." },
    {
      id: "quelle-couleur", text: "Quelle couleur?", en: "What colour?", topic: "thing",
      words: [{ text: "Quelle" }, { text: "couleur" }], tip: "Point at something and ask it.",
    },
    {
      id: "c-est-rouge", text: "C'est rouge.", en: "It's red", topic: "thing",
      words: [{ text: "C'est" }, { text: "rouge" }], tip: "Swap rouge for any colour.",
    },
    {
      id: "j-aime-ca", text: "J'aime ça.", en: "I like that", topic: "feeling",
      words: [{ text: "J'aime" }, { text: "ça" }], tip: "The ç sounds like s.",
    },
    {
      id: "je-naime-pas-ca", text: "Je n'aime pas ça.", en: "I don't like that", topic: "feeling",
      words: [{ text: "Je" }, { text: "n'aime" }, { text: "pas" }, { text: "ça" }], tip: "Say it kindly. Kids often say J'aime pas ça.",
    },
    {
      id: "j-aime-le-bleu", text: "J'aime le bleu.", en: "I like blue", topic: "feeling",
      words: [{ text: "J'aime" }, { text: "le" }, { text: "bleu" }], tip: "Le bleu: the colour blue.",
    },
  ],
  scenes: [
    {
      id: "colour-ask", setup: "Léa holds up a red crayon and asks.", who: { name: "Léa" }, line: "quelle-couleur",
      reply: ["rouge", "c-est-rouge"],
    },
    {
      id: "like-peas", setup: "Grandma serves your favourite dish. You love it.", who: { name: "Grandma" },
      reply: ["j-aime-ca"], alsoOk: ["miam", "c-est-delicieux", "super", "merci", "merci-beaucoup", "content", "je-suis-content", "oui-merci", "encore"],
    },
    {
      id: "dislike", setup: "Grandma serves a food you really do not like.", who: { name: "Grandma" },
      reply: ["je-naime-pas-ca"], alsoOk: ["merci", "non-merci", "je-ne-veux-pas", "non", "je-nai-plus-faim"],
    },
    {
      id: "pretty", setup: "Léa shows you her new drawing. It is lovely.", who: { name: "Léa" },
      reply: ["joli"], alsoOk: ["super", "bravo", "j-aime-ca"],
    },
    {
      id: "big-truck", setup: "A huge truck rolls by. Show Hugo how big it is.", who: { name: "Hugo" },
      reply: ["grand"], alsoOk: ["regarde", "regarde-ca", "super"],
    },
    {
      id: "tiny-bug", setup: "Hugo shows you a snail. It is so tiny!", who: { name: "Hugo" },
      reply: ["petit"], alsoOk: ["regarde", "regarde-ca", "joli", "super"],
    },
    {
      id: "like-blue", setup: "Léa asks if you like blue. You do!", who: { name: "Léa" },
      reply: ["j-aime-le-bleu"], alsoOk: ["j-aime-ca", "oui", "bleu", "super"],
    },
  ],
};
