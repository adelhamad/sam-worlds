// Unit 14 — Body and Clothes: head, eyes, hands, a tummy that hurts, and the
// morning rush: wash your hands, get dressed, put your shoes on — "HaaDer!".
import { iconRef } from "../../iconNames";
import type { LangUnitPack } from "../../langCourse";

export const U14: LangUnitPack = {
  unit: {
    name: "Body and Clothes",
    icon: iconRef("shirt"),
    hue: "#8b5cf6",
    blurb: "Head to toe, and getting dressed.",
    souvenir: { icon: iconRef("shoe"), name: "Tiny Shoe" },
    lessons: [
      { name: "My Body", kind: "words", teach: ["raas", "ein", "timm", "iid", "ijr"] },
      { name: "My Clothes", kind: "words", teach: ["amiis", "bantaloon", "kundara", "haader"] },
      {
        name: "Get Ready!", kind: "talk",
        teach: ["batni-byoojani", "ghassil-iideik", "ilbas-tyaabak", "ilbas-il-kundara"],
        scenes: ["u14-pyjamas", "u14-car-keys", "u14-sweets", "u14-sticky-hands", "u14-jiddo-eye", "u14-bare-feet"],
      },
      {
        name: "Waaw and Yaa", kind: "letters", letters: ["و", "ي"], spell: ["iid", "ein", "bantaloon"],
        mission: "When Mama or Baba ask you to do something today, answer: HaaDer!",
      },
    ],
  },
  phrases: [
    { id: "raas", text: "راس", roman: "raas", en: "Head", topic: "body", tip: "raas is your head. Head hurts? raasi byooja‘ni." },
    { id: "ein", text: "عين", roman: "‘ein", say: "عَين", en: "Eye", topic: "body", tip: "‘ein is an eye. Two eyes: ‘einein." },
    {
      id: "timm", text: "تمّ", roman: "timm", say: "تِمّ", en: "Mouth", topic: "body",
      tip: "timm is your mouth. Some families say tumm.",
    },
    { id: "iid", text: "إيد", roman: "iid", en: "Hand", art: "hand", topic: "body", tip: "iid is a hand. Two hands: iidein." },
    { id: "ijr", text: "إجر", roman: "ijr", say: "إِجِر", en: "Foot, leg", topic: "body", tip: "ijr is a foot or a leg. Some families say rijl." },
    {
      id: "amiis", text: "قميص", roman: "’amiiS", say: "أَميص", en: "Shirt", art: "shirt", topic: "clothes",
      tip: "’amiiS is a shirt. A top is often a kanzeh or bloozeh.",
    },
    { id: "bantaloon", text: "بنطلون", roman: "banTaloon", say: "بَنْطَلون", en: "Trousers", topic: "clothes", tip: "banTaloon means trousers, or pants." },
    {
      id: "kundara", text: "كندرة", roman: "kundara", say: "كُنْدَرة", en: "Shoes", art: "shoe", topic: "clothes",
      tip: "kundara means shoes. In Lebanon many say SabbaaT.",
    },
    {
      id: "haader", text: "حاضر", roman: "HaaDer", say: "حاضِر", en: "Okay, right away!", topic: "polite",
      tip: "Say it when Mama or Baba ask you something. A girl says HaaDra.",
    },
    {
      id: "batni-byoojani", text: "بطني بيوجعني", roman: "baTni byooja‘ni", say: "بَطْني بْيوجَعْني", en: "My tummy hurts", topic: "body",
      words: [{ text: "بطني", roman: "baTni" }, { text: "بيوجعني", roman: "byooja‘ni" }],
      tip: "My tummy hurts. Swap baTni for raasi: my head hurts.",
    },
    {
      id: "ghassil-iideik", text: "غسّل إيديك", roman: "ghassil iideik", say: "غَسِّل إيدَيك", en: "Wash your hands", topic: "body",
      words: [{ text: "غسّل", roman: "ghassil" }, { text: "إيديك", roman: "iideik" }],
      tip: "Wash your hands! To a girl: ghassli iideiki.",
    },
    {
      id: "ilbas-tyaabak", text: "البس تيابك", roman: "ilbas tyaabak", say: "إِلْبَس تْيابَك", en: "Get dressed", topic: "clothes",
      words: [{ text: "البس", roman: "ilbas" }, { text: "تيابك", roman: "tyaabak" }],
      tip: "Get dressed! Some families say ilbas awaa‘iik.",
    },
    {
      id: "ilbas-il-kundara", text: "البس الكندرة", roman: "ilbas il-kundara", say: "إِلْبَس الكُنْدَرة", en: "Put on your shoes", topic: "clothes",
      words: [{ text: "البس", roman: "ilbas" }, { text: "الكندرة", roman: "il-kundara" }],
    },
  ],
  scenes: [
    {
      id: "u14-pyjamas", setup: "School morning. You are still in pyjamas. Mama calls:", who: { name: "Mama" },
      line: "ilbas-tyaabak", reply: ["haader"], alsoOk: ["ee", "aah"],
    },
    { id: "u14-car-keys", setup: "Baba waits at the door with the car keys.", who: { name: "Baba" }, line: "ilbas-il-kundara", reply: ["haader"], alsoOk: ["ee", "aah", "yalla"] },
    { id: "u14-sweets", setup: "You ate too many sweets. Your tummy feels funny. Tell Mama.", who: { name: "Mama" }, reply: ["batni-byoojani"], alsoOk: ["taabaan", "mariid"] },
    { id: "u14-sticky-hands", setup: "Your little cousin has sticky hands. Lunch is ready.", reply: ["ghassil-iideik"] },
    { id: "u14-jiddo-eye", setup: "Jiddo points at his eye. Say what it is.", who: { name: "Jiddo" }, reply: ["ein"] },
    {
      id: "u14-bare-feet", setup: "Your little brother wants to go out with bare feet!",
      reply: ["ilbas-il-kundara"], alsoOk: ["kundara", "la"],
    },
  ],
};
