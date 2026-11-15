// Unit 18 — School and Friends: the school bag, the teacher, homework, and
// the most useful words in class: "I don't understand, say it again".
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U18: LangUnitPack = {
  unit: {
    name: "School and Friends",
    icon: iconRef("school"),
    hue: "#60a5fa",
    blurb: "Talk about school and friends.",
    souvenir: { icon: iconRef("pencil"), name: "Lucky Pencil" },
    lessons: [
      { name: "My School Bag", kind: "words", teach: ["madraseh", "ktaab", "alam", "daftar"] },
      { name: "Friends", kind: "words", teach: ["saahbi", "il-mallmeh", "wazaayef", "fhimt"] },
      {
        name: "Say It Again", kind: "talk",
        teach: ["ma-fhimt", "iidi-kamaan-marra", "iid-kamaan-marra", "haada-saahbi"],
        scenes: ["u18-card-game", "u18-fast-teacher", "u18-new-friend", "u18-break-time", "u18-every-morning", "u18-broken-pencil", "u18-teta-table"],
      },
      {
        name: "Reading at School", kind: "letters", letters: ["ف", "ت", "م"], spell: ["madraseh", "ktaab", "alam", "daftar", "fhimt"],
        mission: "If you don't understand someone today, say: ma fhimt, ‘iidi kamaan marra!",
      },
    ],
  },
  phrases: [
    { id: "madraseh", text: "مدرسة", roman: "madraseh", say: "مَدْرَسة", en: "School", art: "school", topic: "school" },
    { id: "ktaab", text: "كتاب", roman: "ktaab", say: "كْتاب", en: "Book", art: "book", topic: "school" },
    { id: "alam", text: "قلم", roman: "’alam", say: "أَلَم", en: "Pen, pencil", art: "pencil", topic: "school" },
    { id: "daftar", text: "دفتر", roman: "daftar", say: "دَفْتَر", en: "Notebook", art: "notebook", topic: "school" },
    {
      id: "saahbi", text: "صاحبي", roman: "SaaHbi", say: "صاحْبي", en: "My friend", topic: "school", like: ["haada-saahbi"],
      tip: "My friend. A girl friend is SaaHbti. In Lebanon: rfii’i.",
    },
    {
      id: "il-mallmeh", text: "المعلمة", roman: "il-m‘allmeh", say: "المْعَلّْمِة", en: "The teacher (a woman)", topic: "school",
      tip: "The teacher. In Syria: il-aanseh. A man teacher: il-astaaz.",
    },
    { id: "wazaayef", text: "وظايف", roman: "waZaayef", say: "وَظايِف", en: "Homework", topic: "school", tip: "waZaayef is homework. Some families say frooD." },
    {
      id: "fhimt", text: "فهمت", roman: "fhimt", say: "فْهِمْت", en: "I understand! Got it!", topic: "school",
      tip: "Someone asks fhimt? Answer fhimt! or ma fhimt.",
    },
    {
      id: "ma-fhimt", text: "ما فهمت", roman: "ma fhimt", say: "ما فْهِمْت", en: "I don't understand", topic: "school",
      words: [{ text: "ما", roman: "ma" }, { text: "فهمت", roman: "fhimt" }],
    },
    {
      id: "iidi-kamaan-marra", text: "عيدي كمان مرة", roman: "‘iidi kamaan marra", say: "عيدي كَمان مَرّة", en: "Say it again (to a woman)",
      topic: "school", like: ["iid-kamaan-marra", "kamaan-marra"],
      words: [{ text: "عيدي", roman: "‘iidi" }, { text: "كمان", roman: "kamaan" }, { text: "مرة", roman: "marra" }],
      tip: "Please say it again, to a woman or a girl.",
    },
    {
      id: "iid-kamaan-marra", text: "عيد كمان مرة", roman: "‘iid kamaan marra", say: "عيد كَمان مَرّة", en: "Say it again (to a man)",
      topic: "school", like: ["iidi-kamaan-marra", "kamaan-marra"],
      words: [{ text: "عيد", roman: "‘iid" }, { text: "كمان", roman: "kamaan" }, { text: "مرة", roman: "marra" }],
      tip: "Please say it again, to a man or a boy.",
    },
    {
      id: "haada-saahbi", text: "هادا صاحبي", roman: "haada SaaHbi", say: "هادا صاحْبي", en: "This is my friend", topic: "school", like: ["saahbi"],
      words: [{ text: "هادا", roman: "haada" }, { text: "صاحبي", roman: "SaaHbi" }],
    },
  ],
  scenes: [
    {
      id: "u18-card-game", setup: "Jiddo explains a new game very fast. You are lost.", who: { name: "Jiddo" },
      reply: ["ma-fhimt"], alsoOk: ["iid-kamaan-marra", "kamaan-marra"],
    },
    {
      id: "u18-fast-teacher", setup: "Your teacher reads too fast. Ask her to read it again.", who: { name: "Teacher" },
      reply: ["iidi-kamaan-marra"], alsoOk: ["ma-fhimt", "kamaan-marra"],
    },
    { id: "u18-new-friend", setup: "Your friend Adam comes home with you. Mama hasn't met him.", who: { name: "Mama" }, reply: ["haada-saahbi"] },
    {
      id: "u18-break-time", setup: "At break time, your friend Yusuf runs up and asks:", who: { name: "Yusuf" },
      line: "biddak-tilab-mai", reply: ["yalla-nilab"], alsoOk: ["nilab", "ee", "aah", "yalla"],
    },
    { id: "u18-every-morning", setup: "Teta asks where you go every morning with your bag.", who: { name: "Teta" }, reply: ["madraseh"] },
    { id: "u18-broken-pencil", setup: "Your pencil broke in class. You need another one to write.", reply: ["alam"] },
    { id: "u18-teta-table", setup: "After school, Teta sees you writing at the table. She asks why.", who: { name: "Teta" }, reply: ["wazaayef"] },
  ],
};
