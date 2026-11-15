// Unit 14 — Aujourd'hui. Today, tomorrow, the days of the week, the time.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U14: LangUnitPack = {
  unit: {
    name: "Aujourd'hui",
    icon: iconRef("calendar"),
    hue: "#84cc16",
    blurb: "Talk about days and time.",
    souvenir: { icon: iconRef("hourglass"), name: "Tiny Hourglass" },
    lessons: [
      { name: "Today and Tomorrow", kind: "words", teach: ["aujourdhui", "demain", "hier", "maintenant", "plus-tard", "matin"] },
      { name: "Days of the Week", kind: "words", teach: ["soir", "lundi", "mardi", "mercredi", "jeudi", "vendredi"] },
      {
        name: "What Day Is It?", kind: "talk",
        teach: ["quelle-heure-est-il", "il-est-huit-heures", "on-est-quel-jour", "samedi-et-dimanche"],
        scenes: ["yesterday", "tomorrow", "now", "later", "what-day", "what-time", "weekend"],
      },
      {
        name: "Spell Days", kind: "letters", spell: ["demain", "hier", "matin", "soir", "lundi"],
        mission: "Ask someone \"On est quel jour?\" Then say \"Demain, c'est...\" and the day.",
      },
    ],
  },
  phrases: [
    { id: "aujourdhui", text: "Aujourd'hui", en: "Today", topic: "time", tip: "Say 'oh-zhoor-DWEE'." },
    { id: "demain", text: "Demain", en: "Tomorrow", topic: "time", tip: "Say 'duh-MAN'." },
    { id: "hier", text: "Hier", en: "Yesterday", topic: "time", tip: "Say 'ee-YAIR'." },
    { id: "maintenant", text: "Maintenant", en: "Now", topic: "time", tip: "Say 'man-tuh-NAN'." },
    {
      id: "plus-tard", text: "Plus tard", en: "Later", topic: "time",
      words: [{ text: "Plus" }, { text: "tard" }], tip: "The d in tard is silent. Say 'plu tar'.",
    },
    { id: "matin", text: "Matin", en: "Morning", topic: "time", tip: "Say 'ma-TAN'. Le matin: in the morning." },
    { id: "soir", text: "Soir", en: "Evening", topic: "time", tip: "Bonsoir means 'good evening'." },
    { id: "lundi", text: "Lundi", en: "Monday", topic: "time", tip: "Days start with a small letter in French." },
    { id: "mardi", text: "Mardi", en: "Tuesday", topic: "time", tip: "Say it 'mar-DEE'." },
    { id: "mercredi", text: "Mercredi", en: "Wednesday", topic: "time", tip: "Say it 'mehr-kruh-DEE'." },
    { id: "jeudi", text: "Jeudi", en: "Thursday", topic: "time", tip: "Say it 'zhuh-DEE'." },
    { id: "vendredi", text: "Vendredi", en: "Friday", topic: "time", tip: "Say it 'van-druh-DEE'." },
    {
      id: "quelle-heure-est-il", text: "Quelle heure est-il?", en: "What time is it?", topic: "time",
      words: [{ text: "Quelle" }, { text: "heure" }, { text: "est-il" }], tip: "The h in heure is silent.",
    },
    {
      id: "il-est-huit-heures", text: "Il est huit heures.", en: "It is eight o'clock", topic: "time",
      words: [{ text: "Il" }, { text: "est" }, { text: "huit" }, { text: "heures" }], tip: "Swap huit for any number.",
    },
    {
      id: "on-est-quel-jour", text: "On est quel jour?", en: "What day is it?", topic: "time",
      words: [{ text: "On" }, { text: "est" }, { text: "quel" }, { text: "jour" }], tip: "Answer with the day: On est lundi.",
    },
    {
      id: "samedi-et-dimanche", text: "Samedi et dimanche", en: "Saturday and Sunday", topic: "time",
      words: [{ text: "Samedi" }, { text: "et" }, { text: "dimanche" }], tip: "The weekend days. No school!",
    },
  ],
  scenes: [
    {
      id: "yesterday", setup: "Léa asks when you went swimming. It was the day before today.", who: { name: "Léa" },
      reply: ["hier"],
    },
    {
      id: "tomorrow", setup: "Papa asks when your friend's party is. It is the day after today.", who: { name: "Papa" },
      reply: ["demain"],
    },
    {
      id: "now", setup: "Papa asks if you want to eat now or later. You are starving.", who: { name: "Papa" },
      reply: ["maintenant"], alsoOk: ["jai-faim", "vite", "on-y-va", "oui", "super"],
    },
    {
      id: "later", setup: "Hugo asks you to play. First you must finish your drawing.", who: { name: "Hugo" },
      reply: ["plus-tard"], alsoOk: ["attends", "non-merci", "desole", "pardon", "demain", "non"],
    },
    {
      id: "what-day", setup: "Léa asks what day it is. It is Monday.", who: { name: "Léa" }, line: "on-est-quel-jour",
      reply: ["lundi"],
    },
    {
      id: "what-time", setup: "The teacher asks what time it is. The clock says eight.", who: { name: "Teacher" }, line: "quelle-heure-est-il",
      reply: ["il-est-huit-heures"], alsoOk: ["huit"],
    },
    {
      id: "weekend", setup: "Papa asks on which days there is no school.", who: { name: "Papa" },
      reply: ["samedi-et-dimanche"],
    },
  ],
};
