// Unit 19 — Animals and Outside: the cat on the wall, the dog next door, the
// sea and the moon — and "shu haada?", the question grown-ups love to ask.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U19: LangUnitPack = {
  unit: {
    name: "Animals and Outside",
    icon: iconRef("paw"),
    hue: "#84cc16",
    blurb: "Name the animals you see outside.",
    souvenir: { icon: iconRef("bird"), name: "Little Bird" },
    lessons: [
      { name: "Animals", kind: "words", teach: ["bisseh", "kalb", "asfoor", "hsaan", "samakeh"] },
      { name: "Outside", kind: "words", teach: ["shajara", "shams", "amar", "bahr", "jabal"] },
      {
        name: "What Is This?", kind: "talk",
        teach: ["shu-haada", "shoof-il-bisseh", "ana-bkhaaf-min-il-kalb"],
        scenes: ["u19-farm", "u19-night-sky", "u19-pet-shop", "u19-cat-wall", "u19-big-dog", "u19-holiday", "u19-teta-garden"],
      },
      {
        name: "Reading Outside", kind: "letters", letters: ["ج", "ل", "ش"], spell: ["kalb", "shams", "bahr", "jabal", "amar", "bisseh"],
        mission: "Point at something outside and ask someone at home: shu haada?",
      },
    ],
  },
  phrases: [
    { id: "bisseh", text: "بسة", roman: "bisseh", say: "بِسّة", en: "Cat", art: "cat", topic: "animal" },
    { id: "kalb", text: "كلب", roman: "kalb", say: "كَلْب", en: "Dog", art: "dog", topic: "animal" },
    { id: "asfoor", text: "عصفور", roman: "‘aSfoor", say: "عَصْفور", en: "Bird", art: "bird", topic: "animal", tip: "‘aSfoor is a little bird, the kind that sings." },
    { id: "hsaan", text: "حصان", roman: "HSaan", say: "حْصان", en: "Horse", topic: "animal" },
    { id: "samakeh", text: "سمكة", roman: "samakeh", say: "سَمَكة", en: "Fish", art: "fish", topic: "animal" },
    { id: "shajara", text: "شجرة", roman: "shajara", say: "شَجَرة", en: "Tree", art: "tree", topic: "nature" },
    { id: "shams", text: "شمس", roman: "shams", say: "شَمْس", en: "Sun", art: "sun", topic: "nature" },
    { id: "amar", text: "قمر", roman: "’amar", say: "أَمَر", en: "Moon", art: "moon", topic: "nature" },
    { id: "bahr", text: "بحر", roman: "baHr", say: "بَحْر", en: "Sea", topic: "nature" },
    { id: "jabal", text: "جبل", roman: "jabal", say: "جَبَل", en: "Mountain", art: "mountain", topic: "nature" },
    {
      id: "shu-haada", text: "شو هادا؟", roman: "shu haada?", say: "شو هادا", en: "What is this?", topic: "nature",
      words: [{ text: "شو", roman: "shu" }, { text: "هادا", roman: "haada" }],
      tip: "What is this? Point and ask. In Lebanon: shu hayda?",
    },
    {
      id: "shoof-il-bisseh", text: "شوف البسة", roman: "shoof il-bisseh", say: "شوف البِسّة", en: "Look at the cat!", art: "cat", topic: "animal", like: ["shoof"],
      words: [{ text: "شوف", roman: "shoof" }, { text: "البسة", roman: "il-bisseh" }],
      tip: "Look at the cat! To a girl: shoofi il-bisseh.",
    },
    {
      id: "ana-bkhaaf-min-il-kalb", text: "أنا بخاف من الكلب", roman: "ana bkhaaf min il-kalb", say: "أَنا بْخاف مِن الكَلْب",
      en: "I'm scared of the dog", topic: "animal",
      words: [{ text: "أنا", roman: "ana" }, { text: "بخاف", roman: "bkhaaf" }, { text: "من", roman: "min" }, { text: "الكلب", roman: "il-kalb" }],
      tip: "bkhaaf: dogs scare me. Scared right now? ana khaayef.",
    },
  ],
  scenes: [
    { id: "u19-farm", setup: "On the farm, Jiddo points at an animal you can ride.", who: { name: "Jiddo" }, line: "shu-haada", reply: ["hsaan"] },
    { id: "u19-night-sky", setup: "Night time. Teta points up at the round, white light and asks:", who: { name: "Teta" }, line: "shu-haada", reply: ["amar"] },
    { id: "u19-pet-shop", setup: "At the pet shop, your cousin points into the water tank.", who: { name: "Karim" }, line: "shu-haada", reply: ["samakeh"] },
    { id: "u19-cat-wall", setup: "A cat walks on the wall. Show your little brother!", reply: ["shoof-il-bisseh"], alsoOk: ["bisseh", "shoof"] },
    { id: "u19-big-dog", setup: "A big dog runs at you, barking. Tell Baba.", who: { name: "Baba" }, reply: ["ana-bkhaaf-min-il-kalb"], alsoOk: ["khaayif", "kalb"] },
    { id: "u19-holiday", setup: "Baba asks where to go in the summer. You love swimming in waves.", who: { name: "Baba" }, reply: ["bahr"] },
    { id: "u19-teta-garden", setup: "Something small sings in Teta's tree. She asks you.", who: { name: "Teta" }, line: "shu-haada", reply: ["asfoor"] },
  ],
};
