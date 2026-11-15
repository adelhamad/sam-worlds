// Unit 20 — Weather: hot and cold, rain, snow and wind, summer and winter —
// and the jacket Mama always wants you to wear.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U20: LangUnitPack = {
  unit: {
    name: "Weather",
    icon: iconRef("weather"),
    hue: "#818cf8",
    blurb: "Sun, rain, snow and wind.",
    souvenir: { icon: iconRef("umbrella"), name: "Pocket Umbrella" },
    lessons: [
      { name: "Hot and Cold", kind: "words", teach: ["shoob", "bard", "matar", "talj", "hawa"] },
      { name: "Summer, Winter", kind: "words", teach: ["is-seif", "ish-shiti", "jaakeit", "shamsiyyeh"] },
      {
        name: "It's Raining!", kind: "talk",
        teach: ["am-tshatti", "ana-bardaan", "ilbas-il-jaakeit", "ktiir-shoob"],
        scenes: ["u20-window", "u20-door-jacket", "u20-snowball", "u20-white-morning", "u20-beach-noon", "u20-umbrella", "u20-kite"],
      },
      {
        name: "Reading the Weather", kind: "letters", letters: ["ط", "ر", "ه"], spell: ["talj", "bard", "hawa", "matar", "shoob"],
        mission: "Look outside and tell someone the weather: shoob, bard or ‘am tshatti!",
      },
    ],
  },
  phrases: [
    {
      id: "shoob", text: "شوب", roman: "shoob", en: "Hot (weather)", art: "hot", topic: "weather", like: ["ktiir-shoob"],
      tip: "shoob means hot weather. Some families say Harr.",
    },
    { id: "bard", text: "برد", roman: "bard", say: "بَرْد", en: "Cold (weather)", art: "cold", topic: "weather", tip: "bard means cold weather." },
    { id: "matar", text: "مطر", roman: "maTar", say: "مَطَر", en: "Rain", art: "rain", topic: "weather", like: ["am-tshatti", "ish-shiti"] },
    { id: "talj", text: "تلج", roman: "talj", say: "تَلْج", en: "Snow", art: "snow", topic: "weather" },
    { id: "hawa", text: "هوا", roman: "hawa", say: "هَوا", en: "Wind", art: "wind", topic: "weather", tip: "hawa is wind. fii hawa: it is windy." },
    { id: "is-seif", text: "الصيف", roman: "iS-Seif", say: "الصَّيف", en: "Summer", topic: "weather" },
    {
      id: "ish-shiti", text: "الشتي", roman: "ish-shiti", say: "الشِّتي", en: "Winter", topic: "weather", like: ["matar"],
      tip: "ish-shiti is winter. In Syria, shiti also means rain.",
    },
    { id: "jaakeit", text: "جاكيت", roman: "jaakeit", en: "Jacket, coat", art: "jacket", topic: "weather", tip: "jaakeit is a jacket. Some families say kabboot." },
    { id: "shamsiyyeh", text: "شمسية", roman: "shamsiyyeh", say: "شَمْسِيّة", en: "Umbrella", art: "umbrella", topic: "weather" },
    {
      id: "am-tshatti", text: "عم تشتي", roman: "‘am tshatti", say: "عَم تْشَتّي", en: "It's raining", art: "rain", topic: "weather", like: ["matar"],
      words: [{ text: "عم", roman: "‘am" }, { text: "تشتي", roman: "tshatti" }],
      tip: "It's raining! Some families say ‘am bitshatti.",
    },
    {
      id: "ana-bardaan", text: "أنا بردان", roman: "ana bardaan", say: "أَنا بَرْدان", en: "I'm cold", topic: "weather",
      words: [{ text: "أنا", roman: "ana" }, { text: "بردان", roman: "bardaan" }],
      tip: "I'm cold. A girl says bardaaneh. Too hot? ana shoobaan.",
    },
    {
      id: "ilbas-il-jaakeit", text: "البس الجاكيت", roman: "ilbas il-jaakeit", say: "إِلْبَس الجاكيت", en: "Put on your jacket", topic: "weather",
      words: [{ text: "البس", roman: "ilbas" }, { text: "الجاكيت", roman: "il-jaakeit" }],
    },
    {
      id: "ktiir-shoob", text: "كتير شوب", roman: "ktiir shoob", say: "كْتير شوب", en: "It's so hot!", topic: "weather", like: ["shoob"],
      words: [{ text: "كتير", roman: "ktiir" }, { text: "شوب", roman: "shoob" }],
    },
  ],
  scenes: [
    {
      id: "u20-window", setup: "Grey sky. Drops tap on the window. Tell Mama.", who: { name: "Mama" },
      reply: ["am-tshatti"], alsoOk: ["matar", "ish-shiti"],
    },
    {
      id: "u20-door-jacket", setup: "You run to the door. It is freezing outside. Mama calls:", who: { name: "Mama" },
      line: "ilbas-il-jaakeit", reply: ["haader"], alsoOk: ["ee", "aah"],
    },
    {
      id: "u20-snowball", setup: "Snowball fight! Your fingers are freezing. Tell Teta.", who: { name: "Teta" },
      reply: ["ana-bardaan"], alsoOk: ["bard"],
    },
    {
      id: "u20-white-morning", setup: "You look out. Everything is white! Jiddo points and asks:", who: { name: "Jiddo" },
      line: "shu-haada", reply: ["talj"], alsoOk: ["bard"],
    },
    {
      id: "u20-beach-noon", setup: "At the beach at noon. Sweat runs down your face.",
      reply: ["ktiir-shoob"], alsoOk: ["shoob", "is-seif"],
    },
    {
      id: "u20-umbrella", setup: "Baba opens the door. Rain! Grab this before you go out.", who: { name: "Baba" },
      reply: ["shamsiyyeh"], alsoOk: ["jaakeit"],
    },
    { id: "u20-kite", setup: "Your kite flies high. What pushes it up?", reply: ["hawa"] },
  ],
};
