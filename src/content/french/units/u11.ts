// Unit 11 — On joue? Inviting a friend to play, taking turns, winning, cheering.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U11: LangUnitPack = {
  unit: {
    name: "On joue?",
    icon: iconRef("ball"),
    hue: "#c084fc",
    blurb: "Invite friends to play with you.",
    souvenir: { icon: iconRef("trophy"), name: "Playground Medal" },
    lessons: [
      { name: "Let's Play", kind: "words", teach: ["on-joue", "ballon", "jeu", "bravo", "super"] },
      { name: "My Turn", kind: "words", teach: ["a-moi", "a-toi", "jai-gagne", "encore-une-fois", "avec-moi"] },
      {
        name: "Playground", kind: "talk",
        teach: ["c-est-mon-tour", "c-est-ton-tour", "tu-joues-avec-moi", "on-joue-au-ballon"],
        scenes: ["invite", "invited", "turn-me", "turn-her", "i-won", "friend-wins", "again"],
      },
      {
        name: "Spell Play", kind: "letters", spell: ["ballon", "jeu", "bravo", "super"],
        mission: "Ask someone \"On joue?\" and play a game. Say \"Bravo!\" when they do well.",
      },
    ],
  },
  phrases: [
    {
      id: "on-joue", text: "On joue?", en: "Shall we play?", topic: "play", like: ["on-joue-au-ballon", "tu-joues-avec-moi"],
      words: [{ text: "On" }, { text: "joue" }], tip: "On means 'we' when friends talk.",
    },
    { id: "ballon", text: "Ballon", en: "Ball", art: "ball", topic: "play", tip: "Say 'ba-LON'. The n is soft." },
    { id: "jeu", text: "Jeu", en: "Game", topic: "play", tip: "Say it 'zhuh'." },
    { id: "bravo", text: "Bravo!", en: "Well done!", topic: "play", like: ["super"], tip: "Shout it when a friend does well." },
    { id: "super", text: "Super!", en: "Great!", topic: "play", like: ["bravo"], tip: "Also a happy yes to 'On joue?'" },
    {
      id: "a-moi", text: "À moi!", en: "My turn!", topic: "play", like: ["c-est-mon-tour"],
      words: [{ text: "À" }, { text: "moi" }], tip: "Literally 'to me'.",
    },
    {
      id: "a-toi", text: "À toi!", en: "Your turn!", topic: "play", like: ["c-est-ton-tour"],
      words: [{ text: "À" }, { text: "toi" }], tip: "Literally 'to you'.",
    },
    {
      id: "jai-gagne", text: "J'ai gagné!", en: "I won!", topic: "play",
      words: [{ text: "J'ai" }, { text: "gagné" }], tip: "Same for a boy and a girl.",
    },
    {
      id: "encore-une-fois", text: "Encore une fois", en: "One more time", topic: "play", like: ["encore", "encore-s-il-te-plait"],
      words: [{ text: "Encore" }, { text: "une" }, { text: "fois" }], tip: "Say it when you want another go.",
    },
    {
      id: "avec-moi", text: "Avec moi", en: "With me", topic: "play", like: ["tu-joues-avec-moi"],
      words: [{ text: "Avec" }, { text: "moi" }], tip: "Say it to ask friends to join you.",
    },
    {
      id: "c-est-mon-tour", text: "C'est mon tour!", en: "It's my turn!", topic: "play", like: ["a-moi"],
      words: [{ text: "C'est" }, { text: "mon" }, { text: "tour" }], tip: "The r in tour is soft: 'toor'.",
    },
    {
      id: "c-est-ton-tour", text: "C'est ton tour!", en: "It's your turn!", topic: "play", like: ["a-toi"],
      words: [{ text: "C'est" }, { text: "ton" }, { text: "tour" }], tip: "Ton means your, to a friend.",
    },
    {
      id: "tu-joues-avec-moi", text: "Tu joues avec moi?", en: "Will you play with me?", topic: "play",
      like: ["on-joue", "avec-moi", "on-joue-au-ballon"],
      words: [{ text: "Tu" }, { text: "joues" }, { text: "avec" }, { text: "moi" }], tip: "A friendly way to ask someone new.",
    },
    {
      id: "on-joue-au-ballon", text: "On joue au ballon?", en: "Shall we play ball?", art: "ball", topic: "play",
      like: ["on-joue", "tu-joues-avec-moi"],
      words: [{ text: "On" }, { text: "joue" }, { text: "au" }, { text: "ballon" }], tip: "Au goes before games: jouer au ballon.",
    },
  ],
  scenes: [
    {
      id: "invite", setup: "Break time. Léa stands alone with a ball. You want to play.", who: { name: "Léa" },
      reply: ["on-joue", "tu-joues-avec-moi", "on-joue-au-ballon"], alsoOk: ["avec-moi", "salut", "coucou", "salut-ca-va"],
    },
    {
      id: "invited", setup: "Hugo asks if you want to play. You love that idea!", who: { name: "Hugo" }, line: "on-joue",
      reply: ["oui", "super"], alsoOk: ["oui-merci", "bravo", "avec-moi", "on-y-va", "vas-y", "je-suis-content"],
    },
    {
      id: "turn-me", setup: "Léa has thrown the ball for ages. Now it is your turn.", who: { name: "Léa" },
      reply: ["a-moi", "c-est-mon-tour"], alsoOk: ["moi", "je-veux", "donne-moi", "donne-moi-ca"],
    },
    {
      id: "turn-her", setup: "You just threw the ball. Now it is Léa's turn.", who: { name: "Léa" },
      reply: ["a-toi", "c-est-ton-tour"], alsoOk: ["vas-y", "prends", "toi"],
    },
    {
      id: "i-won", setup: "You won the race to the gate!", who: { name: "Hugo" },
      reply: ["jai-gagne"], alsoOk: ["oui", "super", "je-suis-content", "content", "moi"],
    },
    {
      id: "friend-wins", setup: "Léa scores a goal. Cheer for her!", who: { name: "Léa" },
      reply: ["bravo", "super"], alsoOk: ["vas-y", "regarde", "regarde-ca"],
    },
    {
      id: "again", setup: "The game was great. You want another go.", who: { name: "Hugo" },
      reply: ["encore-une-fois", "encore"], alsoOk: ["encore-s-il-te-plait", "on-joue", "je-veux", "je-voudrais", "avec-moi"],
    },
  ],
};
