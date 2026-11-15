// Unit 3 — Les mots magiques. Yes, no, please, thank you, sorry, excuse me.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U03: LangUnitPack = {
  unit: {
    name: "Les mots magiques",
    icon: iconRef("wizard"),
    hue: "#ffd166",
    blurb: "The magic words every French kid uses.",
    souvenir: { icon: iconRef("key"), name: "Golden Key" },
    lessons: [
      { name: "Yes and No", kind: "words", teach: ["oui", "non", "merci", "pardon", "desole"] },
      {
        name: "Please and Sorry", kind: "words",
        teach: ["s-il-te-plait", "s-il-vous-plait", "de-rien", "ce-nest-pas-grave", "excusez-moi"],
      },
      {
        name: "Polite Kid", kind: "talk",
        teach: ["oui-merci", "non-merci", "oui-s-il-te-plait", "merci-beaucoup"],
        scenes: ["cookie-offer", "no-thanks", "magic-word", "thanks-back", "bump", "sorry-ok", "ask-teacher"],
      },
      {
        name: "Spell Magic", kind: "letters", spell: ["oui", "non", "merci", "pardon", "desole"],
        mission: "Say \"Merci\" for something today. Then say \"De rien\" when someone thanks you.",
      },
    ],
  },
  phrases: [
    { id: "oui", text: "Oui", en: "Yes", topic: "polite", tip: "Say it like 'wee'." },
    { id: "non", text: "Non", en: "No", topic: "polite", tip: "The n at the end is soft." },
    { id: "merci", text: "Merci", en: "Thank you", topic: "polite", like: ["merci-beaucoup"], tip: "Say it like 'mehr-see'." },
    { id: "pardon", text: "Pardon", en: "Sorry, pardon me", topic: "polite", like: ["desole", "excusez-moi"], tip: "Say it when you bump someone, or did not hear." },
    { id: "desole", text: "Désolé", en: "I'm sorry", topic: "polite", like: ["pardon"], tip: "A girl writes désolée. It sounds the same." },
    {
      id: "s-il-te-plait", text: "S'il te plaît", en: "Please (to a friend)", topic: "polite", like: ["s-il-vous-plait"],
      words: [{ text: "S'il" }, { text: "te" }, { text: "plaît" }], tip: "For friends and family. Plaît sounds like 'play'.",
    },
    {
      id: "s-il-vous-plait", text: "S'il vous plaît", en: "Please (to a grown-up)", topic: "polite", like: ["s-il-te-plait"],
      words: [{ text: "S'il" }, { text: "vous" }, { text: "plaît" }], tip: "For teachers, shopkeepers and grown-ups you don't know.",
    },
    {
      id: "de-rien", text: "De rien", en: "You're welcome", topic: "polite",
      words: [{ text: "De" }, { text: "rien" }], tip: "The answer to Merci. It means 'it is nothing'.",
    },
    {
      id: "ce-nest-pas-grave", text: "Ce n'est pas grave", en: "It's okay, never mind", topic: "polite",
      words: [{ text: "Ce" }, { text: "n'est" }, { text: "pas" }, { text: "grave" }], tip: "Say it when someone says sorry to you.",
    },
    {
      id: "excusez-moi", text: "Excusez-moi", en: "Excuse me (to a grown-up)", topic: "polite", like: ["pardon"],
      tip: "For a teacher or a shopkeeper. To a friend: Excuse-moi.",
    },
    {
      id: "oui-merci", text: "Oui, merci.", en: "Yes, thank you", topic: "polite", like: ["oui-s-il-te-plait"],
      words: [{ text: "Oui" }, { text: "merci" }], tip: "The polite way to accept something.",
    },
    {
      id: "non-merci", text: "Non, merci.", en: "No, thank you", topic: "polite",
      words: [{ text: "Non" }, { text: "merci" }], tip: "The polite way to say no.",
    },
    {
      id: "oui-s-il-te-plait", text: "Oui, s'il te plaît.", en: "Yes, please", topic: "polite", like: ["oui-merci"],
      words: [{ text: "Oui" }, { text: "s'il" }, { text: "te" }, { text: "plaît" }], tip: "To a grown-up, say s'il vous plaît.",
    },
    {
      id: "merci-beaucoup", text: "Merci beaucoup", en: "Thank you very much", topic: "polite", like: ["merci"],
      words: [{ text: "Merci" }, { text: "beaucoup" }], tip: "Beaucoup sounds like 'boh-koo'.",
    },
  ],
  scenes: [
    {
      id: "cookie-offer", setup: "Grandma offers you a cookie. You want it.", who: { name: "Grandma" },
      reply: ["oui-merci", "oui-s-il-te-plait"], alsoOk: ["oui", "merci", "merci-beaucoup", "s-il-te-plait", "s-il-vous-plait"],
    },
    {
      id: "no-thanks", setup: "Grandma offers you more peas. You are full.", who: { name: "Grandma" },
      reply: ["non-merci"], alsoOk: ["non", "merci"],
    },
    {
      id: "magic-word", setup: "You ask Grandma for juice. She says: say the magic word!", who: { name: "Grandma" },
      reply: ["s-il-te-plait"], alsoOk: ["s-il-vous-plait", "oui-s-il-te-plait", "merci"],
    },
    {
      id: "thanks-back", setup: "You held the door. Léa says thank you.", who: { name: "Léa" }, line: "merci",
      reply: ["de-rien"],
    },
    {
      id: "bump", setup: "You bump into a boy in the corridor.", who: { name: "A boy" },
      reply: ["pardon", "desole"], alsoOk: ["excusez-moi"],
    },
    {
      id: "sorry-ok", setup: "Hugo bumps your elbow and says sorry.", who: { name: "Hugo" }, line: "desole",
      reply: ["ce-nest-pas-grave"],
    },
    {
      id: "ask-teacher", setup: "You want to ask your teacher a question.", who: { name: "Teacher" },
      reply: ["excusez-moi"], alsoOk: ["pardon"],
    },
  ],
};
