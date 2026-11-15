// Unit 13 — Let's Play: asking a cousin or a friend to play, whose turn it
// is, "I won!" and "again!". Authoring guide: docs/LANGUAGES.md.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U13: LangUnitPack = {
  unit: {
    name: "Let's Play",
    icon: iconRef("ball"),
    hue: "#ff5c8a",
    blurb: "Play games with cousins and friends.",
    souvenir: { icon: iconRef("dice"), name: "Lucky Dice" },
    lessons: [
      { name: "Shall We Play?", kind: "words", teach: ["taabeh", "libeh", "nilab", "mai"] },
      { name: "My Turn!", kind: "words", teach: ["doori", "doorak", "doorik", "ana-rbiht", "heik"] },
      {
        name: "Play With Me", kind: "talk",
        teach: ["yalla-nilab", "biddak-tilab-mai", "biddik-tilabi-mai", "kamaan-marra"],
        scenes: ["u13-maya-alone", "u13-park-boy", "u13-rainy-day", "u13-jiddo-cards", "u13-teta-dice", "u13-race-baba", "u13-spin-again"],
      },
      {
        name: "Nuun and Haa", kind: "letters", letters: ["ن", "ه"], spell: ["nilab", "heik"],
        mission: "Ask someone at home to play with you: biddak til‘ab ma‘i?",
      },
    ],
  },
  phrases: [
    {
      id: "taabeh", text: "طابة", roman: "Taabeh", en: "Ball", art: "ball", topic: "play", like: ["libeh"],
      tip: "Taabeh is a ball, any ball you kick or throw.",
    },
    {
      id: "libeh", text: "لعبة", roman: "li‘beh", say: "لِعْبة", en: "Toy, game", topic: "play", like: ["taabeh"],
      tip: "li‘beh is a toy. It can mean a game too.",
    },
    {
      id: "nilab", text: "نلعب؟", roman: "nil‘ab?", say: "نِلْعَب", en: "Shall we play?", topic: "play",
      like: ["yalla-nilab", "biddak-tilab-mai", "biddik-tilabi-mai"],
      tip: "nil‘ab? means: shall we play? Ask it to a friend.",
    },
    {
      id: "mai", text: "معي", roman: "ma‘i", say: "مَعي", en: "With me", topic: "play",
      tip: "ma‘i means with me. ma‘i Taabeh: I have a ball.",
    },
    {
      id: "doori", text: "دوري", roman: "doori", say: "دُوري", en: "My turn!", topic: "play",
      tip: "doori means my turn. Say it when it is your go!",
    },
    {
      id: "doorak", text: "دورك", roman: "doorak", say: "دُورَك", en: "Your turn (to a boy)", topic: "play", like: ["doorik"],
      tip: "doorak is your turn, for a boy or a man.",
    },
    {
      id: "doorik", text: "دورِك", roman: "doorik", say: "دُورِك", en: "Your turn (to a girl)", topic: "play", like: ["doorak"],
      tip: "doorik is your turn, for a girl or a woman.",
    },
    {
      id: "ana-rbiht", text: "أنا ربحت", roman: "ana rbiHt", say: "أَنا رْبِحْت", en: "I won!", topic: "play",
      words: [{ text: "أنا", roman: "ana" }, { text: "ربحت", roman: "rbiHt" }],
      tip: "ana rbiHt means I won! Some families say ana fizt.",
    },
    {
      id: "heik", text: "هيك؟", roman: "heik?", say: "هَيك", en: "Like this?", topic: "play",
      tip: "Not sure how to play? Show it and ask: heik?",
    },
    {
      id: "yalla-nilab", text: "يلا نلعب", roman: "yalla nil‘ab", say: "يَلّا نِلْعَب", en: "Let's play!", topic: "play",
      like: ["nilab", "biddak-tilab-mai", "biddik-tilabi-mai"],
      words: [{ text: "يلا", roman: "yalla" }, { text: "نلعب", roman: "nil‘ab" }],
    },
    {
      id: "biddak-tilab-mai", text: "بدّك تلعب معي؟", roman: "biddak til‘ab ma‘i?", say: "بِدَّك تِلْعَب مَعي",
      en: "Play with me? (to a boy)", topic: "play", like: ["biddik-tilabi-mai", "nilab", "yalla-nilab"],
      words: [{ text: "بدّك", roman: "biddak" }, { text: "تلعب", roman: "til‘ab" }, { text: "معي", roman: "ma‘i" }],
      tip: "Do you want to play with me? Ask a boy this way.",
    },
    {
      id: "biddik-tilabi-mai", text: "بدِّك تلعبي معي؟", roman: "biddik til‘abi ma‘i?", say: "بِدِّك تِلْعَبي مَعي",
      en: "Play with me? (to a girl)", topic: "play", like: ["biddak-tilab-mai", "nilab", "yalla-nilab"],
      words: [{ text: "بدِّك", roman: "biddik" }, { text: "تلعبي", roman: "til‘abi" }, { text: "معي", roman: "ma‘i" }],
      tip: "Do you want to play with me? Ask a girl this way.",
    },
    {
      id: "kamaan-marra", text: "كمان مرة", roman: "kamaan marra", say: "كَمان مَرّة", en: "Again! One more time!", topic: "play",
      like: ["iid-kamaan-marra", "iidi-kamaan-marra"],
      words: [{ text: "كمان", roman: "kamaan" }, { text: "مرة", roman: "marra" }],
    },
  ],
  scenes: [
    {
      id: "u13-maya-alone", setup: "Your cousin Maya sits alone. Ask her to play.", who: { name: "Maya" },
      reply: ["biddik-tilabi-mai"], alsoOk: ["yalla-nilab", "nilab"],
    },
    {
      id: "u13-park-boy", setup: "At the park, a boy with a ball asks you.", who: { name: "Adam" },
      line: "biddak-tilab-mai", reply: ["yalla-nilab"], alsoOk: ["nilab"],
    },
    {
      id: "u13-rainy-day", setup: "A rainy day. Mama holds up a board game.", who: { name: "Mama" },
      line: "nilab", reply: ["yalla-nilab"], alsoOk: ["biddak-tilab-mai", "biddik-tilabi-mai"],
    },
    { id: "u13-jiddo-cards", setup: "Cards with Jiddo. He just played. Now it is your go.", who: { name: "Jiddo" }, reply: ["doori"] },
    { id: "u13-teta-dice", setup: "You rolled the dice. Now it is Teta's go.", who: { name: "Teta" }, reply: ["doorik"] },
    { id: "u13-race-baba", setup: "You race Baba to the door and get there first!", who: { name: "Baba" }, reply: ["ana-rbiht"] },
    { id: "u13-spin-again", setup: "Baba spins you round and round. You want more!", who: { name: "Baba" }, reply: ["kamaan-marra"] },
  ],
};
