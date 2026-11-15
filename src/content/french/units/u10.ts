// Unit 10 — C'est où? Where things are, and where you are.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U10: LangUnitPack = {
  unit: {
    name: "C'est où?",
    icon: iconRef("map"),
    hue: "#fb7185",
    blurb: "Find things and say where they are.",
    souvenir: { icon: iconRef("compass"), name: "Pocket Compass" },
    lessons: [
      { name: "Here and There", kind: "words", teach: ["ici", "la", "sur", "sous", "dans"] },
      { name: "At Home, At School", kind: "words", teach: ["maison", "a-cote-de", "je-ne-sais-pas", "a-la-maison", "a-lecole"] },
      {
        name: "Where Is It?", kind: "talk",
        teach: ["c-est-ou", "ou-est-maman", "c-est-sur-la-table", "c-est-sous-le-lit"],
        scenes: ["lost-shoe", "where-mum", "dont-know", "juice-table", "teddy-bed", "phone-home", "school-morning"],
      },
      {
        name: "Spell Places", kind: "letters", spell: ["ici", "sur", "sous", "dans", "maison"],
        mission: "Hide a toy and tell someone \"C'est sous...\" or \"C'est sur...\" to help find it.",
      },
    ],
  },
  phrases: [
    { id: "ici", text: "Ici", en: "Here", topic: "place", tip: "Say it 'ee-see'." },
    { id: "la", text: "Là", en: "There", topic: "place", tip: "Say 'lah'. Là-bas is 'over there'." },
    { id: "sur", text: "Sur", en: "On", topic: "place", tip: "Round your lips: 'sewr'." },
    { id: "sous", text: "Sous", en: "Under", topic: "place", tip: "Say it 'soo'." },
    { id: "dans", text: "Dans", en: "In, inside", topic: "place", tip: "Say 'dahn' through the nose." },
    { id: "maison", text: "Maison", en: "House", art: "home", topic: "place", tip: "Say 'meh-ZON'." },
    {
      id: "a-cote-de", text: "À côté de", en: "Next to", topic: "place",
      words: [{ text: "À" }, { text: "côté" }, { text: "de" }], tip: "Côté sounds like 'koh-tay'.",
    },
    {
      id: "je-ne-sais-pas", text: "Je ne sais pas.", en: "I don't know", topic: "place",
      words: [{ text: "Je" }, { text: "ne" }, { text: "sais" }, { text: "pas" }], tip: "Kids often say 'Je sais pas.'",
    },
    {
      id: "a-la-maison", text: "À la maison", en: "At home", art: "home", topic: "place",
      words: [{ text: "À" }, { text: "la" }, { text: "maison" }], tip: "Say it when you are home or going home.",
    },
    {
      id: "a-lecole", text: "À l'école", en: "At school", art: "school", topic: "place",
      words: [{ text: "À" }, { text: "l'école" }], tip: "Also means 'to school'.",
    },
    {
      id: "c-est-ou", text: "C'est où?", en: "Where is it?", topic: "place",
      words: [{ text: "C'est" }, { text: "où" }], tip: "Say it when you look for something.",
    },
    {
      id: "ou-est-maman", text: "Où est Maman?", en: "Where is Mum?", topic: "place",
      words: [{ text: "Où" }, { text: "est" }, { text: "Maman" }], tip: "Swap Maman for Papa, or for a friend's name.",
    },
    {
      id: "c-est-sur-la-table", text: "C'est sur la table.", en: "It's on the table", topic: "place",
      words: [{ text: "C'est" }, { text: "sur" }, { text: "la" }, { text: "table" }], tip: "La table: the table.",
    },
    {
      id: "c-est-sous-le-lit", text: "C'est sous le lit.", en: "It's under the bed", art: "bed", topic: "place",
      words: [{ text: "C'est" }, { text: "sous" }, { text: "le" }, { text: "lit" }], tip: "Le lit: the bed. The t is silent.",
    },
  ],
  scenes: [
    { id: "lost-shoe", setup: "You cannot find your other shoe. Ask Papa.", who: { name: "Papa" }, reply: ["c-est-ou"] },
    {
      id: "where-mum", setup: "You get home and Maman is not in the kitchen.", reply: ["ou-est-maman"], alsoOk: ["maman", "c-est-ou"],
    },
    {
      id: "dont-know", setup: "Hugo asks where his ball is. You have no idea.", who: { name: "Hugo" }, line: "c-est-ou",
      reply: ["je-ne-sais-pas"], alsoOk: ["non", "pardon", "desole"],
    },
    {
      id: "juice-table", setup: "Léa asks where the juice is. It is on the table.", who: { name: "Léa" }, line: "c-est-ou",
      reply: ["c-est-sur-la-table"], alsoOk: ["sur", "ici", "la"],
    },
    {
      id: "teddy-bed", setup: "Papa asks where your teddy is. It is under the bed.", who: { name: "Papa" }, line: "c-est-ou",
      reply: ["c-est-sous-le-lit"], alsoOk: ["sous", "ici", "la"],
    },
    {
      id: "phone-home", setup: "Papa phones and asks where you are. You are home.", who: { name: "Papa" },
      reply: ["a-la-maison"], alsoOk: ["maison", "ici"],
    },
    {
      id: "school-morning", setup: "A neighbour asks where you are going this morning. School.", who: { name: "Neighbour" },
      reply: ["a-lecole"],
    },
  ],
};
