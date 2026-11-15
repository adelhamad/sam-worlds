// Unit 2 — Moi. Say your name, your age, where you live; ask the same back.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U02: LangUnitPack = {
  unit: {
    name: "Moi",
    icon: iconRef("smile"),
    hue: "#ffb454",
    blurb: "Tell a new friend who you are.",
    souvenir: { icon: iconRef("passport"), name: "Little Passport" },
    lessons: [
      { name: "Me and You", kind: "words", teach: ["moi", "toi", "garcon", "fille"] },
      { name: "Friends", kind: "words", teach: ["copain", "copine", "je-mappelle-sam", "jai-sept-ans", "jhabite-ici"] },
      {
        name: "New Friend", kind: "talk",
        teach: ["comment-tu-tappelles", "tu-as-quel-age", "tu-habites-ou"],
        scenes: ["new-kid", "ask-back", "age-ask", "where-live", "point-self", "friend-girl", "friend-boy"],
      },
      {
        name: "Spell Friends", kind: "letters", spell: ["garcon", "fille", "copain", "copine"],
        mission: "Ask a friend \"Comment tu t'appelles?\" Then say \"Je m'appelle Sam.\"",
      },
    ],
  },
  phrases: [
    { id: "moi", text: "Moi", en: "Me", topic: "greeting", tip: "Say 'mwah'. Point to yourself when you say it." },
    { id: "toi", text: "Toi", en: "You", topic: "greeting", tip: "Say 'twah'. To a grown-up you don't know, say vous." },
    { id: "garcon", text: "Garçon", en: "Boy", art: "boy", topic: "thing", tip: "The ç sounds like s. The n is soft." },
    { id: "fille", text: "Fille", en: "Girl", art: "girl", topic: "thing", tip: "Say it like 'fee-y'. The l is not heard." },
    { id: "copain", text: "Copain", en: "Friend (a boy)", topic: "family", tip: "A friend who is a boy. The n is soft." },
    { id: "copine", text: "Copine", en: "Friend (a girl)", topic: "family", tip: "A friend who is a girl." },
    {
      id: "je-mappelle-sam", text: "Je m'appelle Sam.", en: "My name is Sam", topic: "greeting",
      words: [{ text: "Je" }, { text: "m'appelle" }, { text: "Sam" }], tip: "Literally 'I call myself Sam'. Say it to anyone.",
    },
    {
      id: "jai-sept-ans", text: "J'ai sept ans.", en: "I am seven years old", topic: "greeting",
      words: [{ text: "J'ai" }, { text: "sept" }, { text: "ans" }], tip: "French says 'I have seven years'. The s in ans is silent.",
    },
    {
      id: "jhabite-ici", text: "J'habite ici.", en: "I live here", topic: "place",
      words: [{ text: "J'habite" }, { text: "ici" }], tip: "The h is silent. To name a town: J'habite à plus the town.",
    },
    {
      id: "comment-tu-tappelles", text: "Comment tu t'appelles?", en: "What's your name?", topic: "greeting",
      words: [{ text: "Comment" }, { text: "tu" }, { text: "t'appelles" }], tip: "For kids. To a grown-up: Comment vous appelez-vous?",
    },
    {
      id: "tu-as-quel-age", text: "Tu as quel âge?", en: "How old are you?", topic: "greeting",
      words: [{ text: "Tu" }, { text: "as" }, { text: "quel" }, { text: "âge" }], tip: "Say it to kids. They answer J'ai... ans.",
    },
    {
      id: "tu-habites-ou", text: "Tu habites où?", en: "Where do you live?", topic: "place",
      words: [{ text: "Tu" }, { text: "habites" }, { text: "où" }], tip: "Say it to kids. The h is silent.",
    },
  ],
  scenes: [
    {
      id: "new-kid", setup: "A new kid at the park asks your name.", who: { name: "New kid" }, line: "comment-tu-tappelles",
      reply: ["je-mappelle-sam"],
    },
    {
      id: "ask-back", setup: "You told a new kid your name. Now ask theirs.", who: { name: "New kid" },
      reply: ["comment-tu-tappelles"], alsoOk: ["et-toi"],
    },
    { id: "age-ask", setup: "A boy in your class asks how old you are.", who: { name: "Hugo" }, line: "tu-as-quel-age", reply: ["jai-sept-ans"] },
    {
      id: "where-live", setup: "A kid on your street asks where you live.", who: { name: "Neighbour" }, line: "tu-habites-ou",
      reply: ["jhabite-ici"],
    },
    {
      id: "point-self", setup: "Who wants the first turn? You do!", who: { name: "Léa" },
      reply: ["moi"],
    },
    {
      id: "friend-girl", setup: "Papa asks about Léa. Tell him she is your friend.", who: { name: "Papa" },
      reply: ["copine"],
    },
    {
      id: "friend-boy", setup: "Papa asks about Hugo. Tell him he is your friend.", who: { name: "Papa" },
      reply: ["copain"],
    },
  ],
};
