// Unit 21 — Visiting Family: welcome and its answer, "I missed you", how is
// the family, and the words for big days: Eid, birthdays, congratulations.
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U21: LangUnitPack = {
  unit: {
    name: "Visiting Family",
    icon: iconRef("family"),
    hue: "#f87171",
    blurb: "Welcome family, and wish them well.",
    souvenir: { icon: iconRef("lantern"), name: "Eid Lantern" },
    lessons: [
      { name: "Welcome!", kind: "words", teach: ["ahla-w-sahla", "foot", "ishtatillak", "ishtatillik", "kiif-il-ahl"] },
      { name: "Big Days", kind: "words", teach: ["iid-mbaarak", "kull-sineh-w-inta-saalem", "kull-sineh-w-inti-saalmeh", "mabrook", "allah-ybaarik-fiik", "iidiyyeh"] },
      {
        name: "At Teta's Door", kind: "talk",
        teach: ["ahlein-fiik", "ahlein-fiiki", "sallimli-ala-jiddo"],
        scenes: ["u21-teta-door", "u21-khaalo-bell", "u21-jiddo-airport", "u21-eid-morning", "u21-swim-medal", "u21-baba-drives", "u21-omar-party"],
      },
      {
        name: "Reading Big Days", kind: "letters", letters: ["و", "ي", "ض"], spell: ["foot", "mabrook", "iidiyyeh", "ishtatillak"],
        mission: "Next time family comes over, open the door and say: ahla w sahla!",
      },
    ],
  },
  phrases: [
    {
      id: "ahla-w-sahla", text: "أهلا وسهلا", roman: "ahla w sahla", say: "أَهْلا وْسَهْلا", en: "Welcome to our home!", topic: "visit", like: ["marhaba", "ahlein"],
      words: [{ text: "أهلا", roman: "ahla" }, { text: "وسهلا", roman: "w sahla" }],
      tip: "Welcome! Say it when guests come in.",
    },
    { id: "foot", text: "فوت", roman: "foot", say: "فوت", en: "Come in!", topic: "visit", like: ["tfaddal"],
      tip: "Sounds like foot, means come in! To a girl: footi. tfaDDal is politer." },
    {
      id: "ishtatillak", text: "اشتقتلك", roman: "ishta’tillak", say: "إشْتَأْتِلَّك", en: "I missed you (to a boy)", topic: "visit",
      like: ["ishtatillik", "ishtatillik-ktiir"],
      tip: "I missed you, to a boy or a man, like Jiddo.",
    },
    {
      id: "ishtatillik", text: "اشتقتلِك", roman: "ishta’tillik", say: "إشْتَأْتِلِّك", en: "I missed you (to a girl)", topic: "visit",
      like: ["ishtatillak", "ishtatillik-ktiir"],
      tip: "I missed you, to a girl or a woman, like Teta.",
    },
    {
      id: "kiif-il-ahl", text: "كيف الأهل؟", roman: "kiif il-ahl?", say: "كِيف الأَهِل", en: "How is the family?", topic: "visit",
      words: [{ text: "كيف", roman: "kiif" }, { text: "الأهل", roman: "il-ahl" }],
      tip: "How is the family? Grown-ups ask it at every visit.",
    },
    {
      id: "iid-mbaarak", text: "عيد مبارك", roman: "‘iid mbaarak", say: "عيد مْبارَك", en: "Happy Eid! Happy holiday!", topic: "visit",
      like: ["kull-sineh-w-inta-saalem", "kull-sineh-w-inti-saalmeh"],
      words: [{ text: "عيد", roman: "‘iid" }, { text: "مبارك", roman: "mbaarak" }],
    },
    {
      id: "kull-sineh-w-inta-saalem", text: "كل سنة وإنت سالم", roman: "kull sineh w inta saalem", say: "كُلّ سِنة وِإنْتَ سالِم",
      en: "Happy birthday! (to a boy)", topic: "visit", like: ["kull-sineh-w-inti-saalmeh", "iid-mbaarak"],
      words: [{ text: "كل", roman: "kull" }, { text: "سنة", roman: "sineh" }, { text: "وإنت", roman: "w inta" }, { text: "سالم", roman: "saalem" }],
      tip: "For birthdays and for Eid, to a boy or a man.",
    },
    {
      id: "kull-sineh-w-inti-saalmeh", text: "كل سنة وإنتي سالمة", roman: "kull sineh w inti saalmeh", say: "كُلّ سِنة وِإنْتي سالْمِة",
      en: "Happy birthday! (to a girl)", topic: "visit", like: ["kull-sineh-w-inta-saalem", "iid-mbaarak"],
      words: [{ text: "كل", roman: "kull" }, { text: "سنة", roman: "sineh" }, { text: "وإنتي", roman: "w inti" }, { text: "سالمة", roman: "saalmeh" }],
      tip: "For birthdays and for Eid, to Teta, Mama or a girl.",
    },
    { id: "mabrook", text: "مبروك", roman: "mabrook", say: "مَبْروك", en: "Congratulations!", topic: "visit", tip: "Congratulations! For a prize, a new baby, a new bike." },
    {
      id: "allah-ybaarik-fiik", text: "الله يبارك فيك", roman: "allah ybaarik fiik", say: "الله يْبارِك فيك", en: "Thanks! (after congratulations)", topic: "visit",
      words: [{ text: "الله", roman: "allah" }, { text: "يبارك", roman: "ybaarik" }, { text: "فيك", roman: "fiik" }],
      tip: "The answer to mabrook. To a woman: allah ybaarik fiiki.",
    },
    { id: "iidiyyeh", text: "عيدية", roman: "‘iidiyyeh", say: "عيدِيّة", en: "Eid money gift", art: "gift", topic: "visit", like: ["masaari"], tip: "Grown-ups give children ‘iidiyyeh, money for Eid." },
    {
      id: "ahlein-fiik", text: "أهلين فيك", roman: "ahlein fiik", say: "أَهْلين فيك", en: "And welcome to you! (boy)", topic: "visit",
      like: ["ahlein-fiiki", "ahlein"],
      words: [{ text: "أهلين", roman: "ahlein" }, { text: "فيك", roman: "fiik" }],
      tip: "The answer to ahla w sahla, to a boy or a man.",
    },
    {
      id: "ahlein-fiiki", text: "أهلين فيكي", roman: "ahlein fiiki", say: "أَهْلين فيكي", en: "And welcome to you! (girl)", topic: "visit",
      like: ["ahlein-fiik", "ahlein"],
      words: [{ text: "أهلين", roman: "ahlein" }, { text: "فيكي", roman: "fiiki" }],
      tip: "The answer to ahla w sahla, to a girl or a woman.",
    },
    {
      id: "sallimli-ala-jiddo", text: "سلّملي على جدو", roman: "sallimli ‘ala jiddo", say: "سَلِّمْلي عَلى جِدّو", en: "Say hi to Jiddo for me", topic: "visit",
      words: [{ text: "سلّملي", roman: "sallimli" }, { text: "على", roman: "‘ala" }, { text: "جدو", roman: "jiddo" }],
      tip: "Say hi to Jiddo for me. To a woman: sallmiili ‘ala jiddo.",
    },
  ],
  scenes: [
    {
      id: "u21-teta-door", setup: "You arrive at Teta's house. She opens the door wide.", who: { name: "Teta" },
      line: "ahla-w-sahla", reply: ["ahlein-fiiki"], alsoOk: ["ishtatillik", "marhaba", "ahlein", "kiifik", "kiifik-teeta", "bhebbik"],
    },
    {
      id: "u21-khaalo-bell", setup: "The bell rings. It's Khaalo! You open the door.", who: { name: "Khaalo" },
      reply: ["ahla-w-sahla"], alsoOk: ["foot", "tfaddal", "taa", "marhaba", "ahlein", "kiifak", "ishtatillak"],
    },
    {
      id: "u21-jiddo-airport", setup: "You land after a long trip. Jiddo hugs you tight.", who: { name: "Jiddo" },
      reply: ["ishtatillak"], alsoOk: ["bhebbak", "marhaba", "ahlein", "kiifak"],
    },
    { id: "u21-eid-morning", setup: "It's the morning of Eid! Teta hugs you.", who: { name: "Teta" }, reply: ["kull-sineh-w-inti-saalmeh", "iid-mbaarak"], alsoOk: ["ishtatillik", "bhebbik"] },
    {
      id: "u21-swim-medal", setup: "You got a swimming medal. Khaalo shakes your hand and says:", who: { name: "Khaalo" },
      line: "mabrook", reply: ["allah-ybaarik-fiik"], alsoOk: ["shukran", "yislamo"],
    },
    { id: "u21-baba-drives", setup: "Baba is driving to see Jiddo. You have to stay home.", who: { name: "Baba" }, reply: ["sallimli-ala-jiddo"], alsoOk: ["maa-salaameh", "yalla-bye"] },
    {
      id: "u21-omar-party", setup: "It's your cousin Omar's birthday party.", who: { name: "Omar" },
      reply: ["kull-sineh-w-inta-saalem"], alsoOk: ["mabrook"],
    },
  ],
};
