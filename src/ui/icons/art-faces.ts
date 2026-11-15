// Icon art — feelings (sad, tired, sleepy, scared, sick) and people (mother,
// father, grandma, grandpa, baby, boy, girl) as small distinct faces.
import { C, INK, circ, ell, type IconArt, type Part } from "./geom";
import { MOUTH_DARK, SKIN } from "./art-kit";

/** The round face every feeling shares, plus its shaded side. */
function disc(fill: string, deep: string, cx = 16, cy = 16, r = 13): Part[] {
  return [
    { b: circ(cx, cy, r), f: fill },
    { a: `M${cx + 8.6} ${cy - 6.8}A${r - 2} ${r - 2} 0 0 1 ${cx - 3.4} ${cy + 10.6}A${r} ${r} 0 0 0 ${cx + 8.6} ${cy - 6.8}Z`, f: deep, o: 0.6 },
  ];
}

const FEEL: Record<string, IconArt> = {
  sad: [
    ...disc(C.gold, C.goldDeep),
    { d: ell(11.4, 15, 1.5, 2) },
    { d: ell(20.6, 15, 1.5, 2) },
    { i: "M8.2 12.6L13.8 10.2M23.8 12.6L18.2 10.2", w: 1.8 },
    { i: "M11.4 24Q16 19.6 20.6 24", w: 2 },
    { b: "M8.4 18.2Q10.8 21.4 10.8 22.8A2.4 2.4 0 0 1 6 22.8Q6 21.4 8.4 18.2Z", f: C.sky, w: 1.4 },
  ],
  tired: [
    ...disc(C.gold, C.goldDeep),
    { b: ell(11.2, 14.6, 3.2, 2.7), f: C.white, w: 1.4 },
    { b: ell(20.8, 14.6, 3.2, 2.7), f: C.white, w: 1.4 },
    { d: circ(11.2, 15.6, 1.2) },
    { d: circ(20.8, 15.6, 1.2) },
    { b: "M8 14.8A3.2 2.8 0 0 1 14.4 14.8Z", f: C.goldDeep, w: 1.6 },
    { b: "M17.6 14.8A3.2 2.8 0 0 1 24 14.8Z", f: C.goldDeep, w: 1.6 },
    { i: "M8.4 19.4Q11.2 20.8 14 19.4M18 19.4Q20.8 20.8 23.6 19.4", w: 1.3, f: C.purpleDeep, m: false },
    { i: "M12.4 24.6Q16 22.6 19.6 24.6", w: 1.8 },
  ],
  sleepy: [
    ...disc(C.gold, C.goldDeep, 13.6, 18.4, 11.8),
    { i: "M8.2 16Q9.9 18.2 11.6 16M15.4 16Q17.1 18.2 18.8 16", w: 1.9 },
    { b: ell(14.2, 23.6, 2.6, 3.2), f: MOUTH_DARK, w: 1.6 },
    { i: "M19.6 5.4H25.4L19.6 11.4H25.6", w: 2.2, f: C.purpleDeep },
    { i: "M26.4 1.6H29.8L26.4 5.2H30", w: 1.8, f: C.purpleDeep },
  ],
  scared: [
    ...disc("#ffe9a8", C.gold),
    { b: circ(11, 13.4, 3.8), f: C.white, w: 1.6 },
    { b: circ(21, 13.4, 3.8), f: C.white, w: 1.6 },
    { d: circ(11, 14, 1.3) },
    { d: circ(21, 14, 1.3) },
    { i: "M7 7.8Q10.4 5.8 14.2 7.4M25 7.8Q21.6 5.8 17.8 7.4", w: 1.8 },
    { b: "M10.8 21Q16 17.4 21.2 21Q20.4 27 16 27Q11.6 27 10.8 21Z", f: MOUTH_DARK, w: 1.8 },
    { b: "M26.6 8Q28.4 10.4 28.4 11.6A1.9 1.9 0 0 1 24.8 11.6Q24.8 10.4 26.6 8Z", f: C.sky, w: 1.3 },
  ],
  sick: [
    ...disc("#b8e68a", "#7fc66a"),
    { i: "M8.6 12.6L13.6 16.6M13.6 12.6L8.6 16.6M18.4 12.6L23.4 16.6M23.4 12.6L18.4 16.6", w: 1.7 },
    { i: "M9.8 23Q11.8 20.8 13.8 23T17.8 23", w: 1.8 },
    { i: "M16.6 22.4L28.6 28.4", w: 4.8, f: INK, m: false },
    { i: "M16.6 22.4L28.6 28.4", w: 2.4, f: C.white },
    { i: "M16.4 22.3L19 23.6", w: 2.4, f: C.red },
  ],
};

const EYES: Part[] = [{ d: ell(12.8, 15.2, 1.2, 1.7) }, { d: ell(19.2, 15.2, 1.2, 1.7) }];
const SMILE: Part = { i: "M13.2 19.6Q16 22 18.8 19.6", w: 1.6 };
const CHEEKS: Part[] = [{ a: circ(9.8, 18.6, 1.9), f: C.pink, o: 0.7 }, { a: circ(22.2, 18.6, 1.9), f: C.pink, o: 0.7 }];
const SHOULDERS = (fill: string): Part => ({ b: "M4.4 30.4Q4.4 24 16 24Q27.6 24 27.6 30.4Z", f: fill });
const HEAD: Part = { b: ell(16, 14.6, 8.8, 9.4), f: SKIN };
const EARS: Part[] = [{ b: circ(7.4, 15.4, 1.9), f: SKIN, w: 1.6 }, { b: circ(24.6, 15.4, 1.9), f: SKIN, w: 1.6 }];
const SHINE: Part = { s: "M9.4 10Q10.4 7.6 13 6.6", w: 1.6 };

const PEOPLE: Record<string, IconArt> = {
  mother: [
    SHOULDERS(C.pink),
    { b: "M6.2 15Q6 3.6 16 3.6Q26 3.6 25.8 15V24.6Q25.8 27 23.4 27H21.4V20H10.6V27H8.6Q6.2 27 6.2 24.6Z", f: "#7a4524" },
    HEAD,
    { b: "M7.4 13.8Q8 5.8 16 5.8Q24 5.8 24.6 13.8Q22 9.6 16.6 10Q11 10.2 7.4 13.8Z", f: "#7a4524", w: 1.6 },
    ...EYES, SMILE, ...CHEEKS,
    { b: circ(22.2, 8, 2.2), f: C.red, w: 1.4 },
    { d: circ(22.2, 8, 0.8), f: C.gold },
  ],
  father: [
    SHOULDERS(C.blue),
    ...EARS, HEAD,
    { b: "M7 12.8Q6.8 4.6 16 4.4Q25.2 4.6 25 12.8Q22.6 8.2 16 8.4Q9.4 8.2 7 12.8Z", f: "#3b2a24", w: 1.8 },
    ...EYES,
    { b: "M11.6 19.4Q13.8 17.4 16 18.6Q18.2 17.4 20.4 19.4Q18 21.2 16 20.2Q14 21.2 11.6 19.4Z", f: "#3b2a24", w: 1.4 },
    { i: "M14.4 22.4Q16 23.6 17.6 22.4", w: 1.5 },
    SHINE,
  ],
  grandma: [
    SHOULDERS(C.purple),
    { b: circ(16, 4.6, 3.6), f: "#dfe3ee", w: 1.8 },
    ...EARS, HEAD,
    { b: "M6.8 14.6Q5.8 5.6 16 5.6Q26.2 5.6 25.2 14.6Q22.8 9.8 16 10Q9.2 9.8 6.8 14.6Z", f: "#dfe3ee", w: 1.8 },
    { i: circ(12.6, 15.4, 3), w: 1.5 },
    { i: circ(19.4, 15.4, 3), w: 1.5 },
    { i: "M15.6 15.2H16.4", w: 1.5 },
    { d: circ(12.6, 15.4, 0.9) },
    { d: circ(19.4, 15.4, 0.9) },
    { i: "M13.4 20.6Q16 22.8 18.6 20.6", w: 1.6 },
    ...CHEEKS,
  ],
  grandpa: [
    SHOULDERS(C.greenDeep),
    { b: "M7 17.4Q3.6 13.2 6.6 9.2Q8.4 12 9.4 14Z", f: "#dfe3ee", w: 1.6 },
    { b: "M25 17.4Q28.4 13.2 25.4 9.2Q23.6 12 22.6 14Z", f: "#dfe3ee", w: 1.6 },
    HEAD,
    { i: "M9.6 11.8Q10.4 8.4 13.4 6.8", w: 1.6, f: C.white, m: false },
    { i: circ(12.6, 15.4, 3), w: 1.5 },
    { i: circ(19.4, 15.4, 3), w: 1.5 },
    { i: "M15.6 15.2H16.4", w: 1.5 },
    { d: circ(12.6, 15.4, 0.9) },
    { d: circ(19.4, 15.4, 0.9) },
    { i: "M10.4 11.6L14.8 11M21.6 11.6L17.2 11", w: 1.8, f: "#aab0c4" },
    { b: "M10.6 19.6Q13.6 17.2 16 18.8Q18.4 17.2 21.4 19.6Q18.4 22.2 16 20.8Q13.6 22.2 10.6 19.6Z", f: "#dfe3ee", w: 1.4 },
  ],
  baby: [
    { b: "M7 30.4Q7 25.4 16 25.4Q25 25.4 25 30.4Z", f: C.gold },
    { b: ell(16, 14.6, 10.4, 10), f: SKIN },
    { i: "M16 5Q14 2.8 16.4 2.6Q18.8 2.8 17.6 5", w: 2, f: "#7a4524" },
    { d: ell(11.8, 15.4, 1.5, 2) },
    { d: ell(20.2, 15.4, 1.5, 2) },
    { a: circ(8.6, 19, 2.2), f: C.pink, o: 0.8 },
    { a: circ(23.4, 19, 2.2), f: C.pink, o: 0.8 },
    { b: ell(16, 21.2, 3.2, 2.2), f: C.sky, w: 1.5 },
    { d: circ(16, 21.2, 0.9), f: C.white },
  ],
  boy: [
    SHOULDERS(C.green),
    ...EARS, HEAD,
    { b: "M7 12.6Q6.2 4.8 12 4.4L13 6.4L16 4L19 6.4L20.4 4.4Q26 5 25 12.6Q23 9.4 16 9.8Q9.4 9.6 7 12.6Z", f: "#6b4423", w: 1.8 },
    ...EYES, SMILE, ...CHEEKS,
    SHINE,
  ],
  girl: [
    SHOULDERS(C.orange),
    { b: circ(5.6, 13.4, 3.4), f: "#3b2a24", w: 1.8 },
    { b: circ(26.4, 13.4, 3.4), f: "#3b2a24", w: 1.8 },
    HEAD,
    { b: "M7.2 13Q7.4 5 16 5Q24.6 5 24.8 13Q20.8 9.6 16 10.8Q11 9.6 7.2 13Z", f: "#3b2a24", w: 1.8 },
    { b: "M4 10.4L8.2 11.8L4.6 15.2Z", f: C.red, w: 1.4 },
    { b: "M28 10.4L23.8 11.8L27.4 15.2Z", f: C.red, w: 1.4 },
    ...EYES, SMILE, ...CHEEKS,
  ],
};

export const FACE_ART: Record<string, IconArt> = { ...FEEL, ...PEOPLE };
