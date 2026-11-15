// Unit 9 — Viens! Short commands a child gives and hears all day (tu forms).
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U09: LangUnitPack = {
  unit: {
    name: "Viens!",
    icon: iconRef("footprints"),
    hue: "#fbbf24",
    blurb: "Call, show, hurry and share.",
    souvenir: { icon: iconRef("shoe"), name: "Running Shoes" },
    lessons: [
      { name: "Come and Look", kind: "words", teach: ["viens", "regarde", "ecoute", "attends", "vite"] },
      { name: "Go and Take", kind: "words", teach: ["vas-y", "assieds-toi", "prends", "doucement", "donne-moi"] },
      {
        name: "Let's Go!", kind: "talk",
        teach: ["on-y-va", "viens-ici", "regarde-ca", "donne-moi-ca"],
        scenes: ["call-friend", "rainbow", "go-out", "too-fast", "hurry", "pass-crayon", "take-sweet"],
      },
      {
        name: "Spell Commands", kind: "letters", spell: ["viens", "vite", "ecoute", "attends", "prends"],
        mission: "Say \"Regarde ça!\" and show someone something. Then say \"On y va!\"",
      },
    ],
  },
  phrases: [
    { id: "viens", text: "Viens!", en: "Come!", topic: "action", like: ["viens-ici"], tip: "To a friend. To a grown-up, say Venez." },
    { id: "regarde", text: "Regarde!", en: "Look!", topic: "action", like: ["regarde-ca"], tip: "To a friend. To a grown-up, say Regardez." },
    { id: "ecoute", text: "Écoute!", en: "Listen!", topic: "action", tip: "To a friend. The final e is silent." },
    { id: "attends", text: "Attends!", en: "Wait!", topic: "action", tip: "Say 'ah-TAHN'. The d and s are silent." },
    { id: "vite", text: "Vite!", en: "Quick, hurry!", topic: "action", tip: "Say it 'veet'." },
    { id: "vas-y", text: "Vas-y!", en: "Go ahead!", topic: "action", tip: "Said to cheer someone on, or to let them go first." },
    { id: "assieds-toi", text: "Assieds-toi!", en: "Sit down!", topic: "action", tip: "To a friend. To a grown-up: Asseyez-vous." },
    { id: "prends", text: "Prends!", en: "Take it!", topic: "action", tip: "Sounds like 'prahn'. Handing something over, kids also say Tiens!" },
    { id: "doucement", text: "Doucement!", en: "Slowly, gently!", topic: "action", tip: "Say it 'dooss-MAN'." },
    { id: "donne-moi", text: "Donne-moi", en: "Give me", topic: "action", like: ["donne-moi-ca"], tip: "Add please: Donne-moi ça, s'il te plaît." },
    {
      id: "on-y-va", text: "On y va!", en: "Let's go!", topic: "action",
      words: [{ text: "On" }, { text: "y" }, { text: "va" }], tip: "Say it at the door, ready to leave.",
    },
    {
      id: "viens-ici", text: "Viens ici!", en: "Come here!", topic: "action", like: ["viens"],
      words: [{ text: "Viens" }, { text: "ici" }], tip: "To a friend or your little brother.",
    },
    {
      id: "regarde-ca", text: "Regarde ça!", en: "Look at that!", topic: "action", like: ["regarde"],
      words: [{ text: "Regarde" }, { text: "ça" }], tip: "Use it to show something cool.",
    },
    {
      id: "donne-moi-ca", text: "Donne-moi ça.", en: "Give me that", topic: "action", like: ["donne-moi"],
      words: [{ text: "Donne-moi" }, { text: "ça" }], tip: "Add s'il te plaît to be nice.",
    },
  ],
  scenes: [
    {
      id: "call-friend", setup: "Léa is far away. Call her over to see your drawing.", who: { name: "Léa" },
      reply: ["viens-ici", "viens"], alsoOk: ["regarde-ca", "regarde", "coucou", "salut", "vite"],
    },
    {
      id: "rainbow", setup: "A big rainbow appears in the sky. Show Léa.", who: { name: "Léa" },
      reply: ["regarde", "regarde-ca"], alsoOk: ["viens-ici", "viens"],
    },
    {
      id: "go-out", setup: "Papa waits at the door with the car keys. You go too.", who: { name: "Papa" },
      reply: ["on-y-va"], alsoOk: ["viens", "viens-ici", "vite", "vas-y", "attends"],
    },
    {
      id: "too-fast", setup: "Léa runs ahead too fast. You cannot keep up.", who: { name: "Léa" },
      reply: ["attends", "doucement"], alsoOk: ["pardon", "viens", "viens-ici"],
    },
    {
      id: "hurry", setup: "You will be late for school! Hurry your brother.", who: { name: "Your brother" },
      reply: ["vite"], alsoOk: ["on-y-va", "viens", "viens-ici", "vas-y"],
    },
    {
      id: "pass-crayon", setup: "You need the red crayon. It is next to Léa.", who: { name: "Léa" },
      reply: ["donne-moi-ca", "donne-moi"], alsoOk: ["s-il-te-plait", "je-veux", "je-voudrais"],
    },
    {
      id: "take-sweet", setup: "Léa holds out a sweet and says it. You love sweets.", who: { name: "Léa" }, line: "prends",
      reply: ["merci", "oui-merci"], alsoOk: ["merci-beaucoup", "oui", "oui-s-il-te-plait", "miam"],
    },
  ],
};
