// Icon art — chrome (top-bar buttons, close, back, passport…). These are the
// icons most often shown `mono`, so each one also reads as a clean outline.
// 32×32 grid; see geom.ts for the part format.
import { C, circ, ell, rr, soft, type IconArt } from "./geom";

/** A chunky two-layer stroke: ink under-stroke + colour on top (mono: one line). */
function thick(d: string, fill: string, w = 5.2, mono = 3.6): IconArt {
  return [
    { i: d, w: w + 4.2, m: false },
    { i: d, w, f: fill, m: mono },
  ];
}

const SPEAKER = soft([[4.4, 12], [10, 12], [17.4, 5.6], [17.4, 26.4], [10, 20], [4.4, 20]], 1.4);

/** Gear outline: `n` square-ish teeth. */
function gear(cx: number, cy: number, R: number, r: number, n = 8): string {
  const step = 360 / n;
  const at = (deg: number, rad: number) => {
    const a = (deg * Math.PI) / 180;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad] as const;
  };
  const points = Array.from({ length: n }, (_, k) => {
    const a = k * step - 90;
    return [at(a - step * 0.2, R), at(a + step * 0.2, R), at(a + step * 0.32, r), at(a + step * 0.68, r)];
  }).flat();
  return soft(points, 1);
}

export const CHROME_ART: Record<string, IconArt> = {
  close: thick("M9 9 L23 23 M23 9 L9 23", "#ffffff"),
  back: thick("M26 16H8.4M15.6 8.4L8 16L15.6 23.6", "#ffffff", 4.6, 3.4),
  more: [
    { b: circ(6.6, 16, 3.2), f: C.white, w: 2, m: "solid" },
    { b: circ(16, 16, 3.2), f: C.white, w: 2, m: "solid" },
    { b: circ(25.4, 16, 3.2), f: C.white, w: 2, m: "solid" },
  ],
  play: [
    { b: soft([[9, 4.6], [27.6, 16], [9, 27.4]], 3.2), f: C.green },
    { a: soft([[14, 16], [27.6, 16], [9, 27.4], [9, 22]], 1.4), f: C.greenDeep, o: 0.55 },
    { s: "M12.2 10.6V15.4", w: 2 },
  ],
  sound: [
    { b: SPEAKER, f: C.cloud },
    { a: rr(5.8, 13.4, 3.4, 5.2, 1.2), f: C.steel },
    { i: "M21.2 11.6Q24 16 21.2 20.4M24.8 7.8Q30 16 24.8 24.2", w: 2.6, f: C.blue, m: 2.4 },
  ],
  "sound-off": [
    { b: SPEAKER, f: C.cloud },
    { a: rr(5.8, 13.4, 3.4, 5.2, 1.2), f: C.steel },
    { i: "M21.4 12.2L28.6 19.8M28.6 12.2L21.4 19.8", w: 2.8, f: C.red, m: 2.4 },
  ],
  music: [
    { i: "M12.6 23.4V8.6M26.4 20.4V5.6", w: 2.4 },
    { b: soft([[11.6, 7.8], [27.4, 4.4], [27.4, 9.8], [11.6, 13.2]], 1), f: C.purple, w: 2, m: "solid" },
    { b: ell(8.8, 23.8, 4.4, 3.4), f: C.purple, m: "solid" },
    { b: ell(22.6, 20.8, 4.4, 3.4), f: C.purple, m: "solid" },
    { s: "M6.6 22.6Q7.4 21.4 9 21.2", w: 1.4 },
  ],
  gear: [
    { b: gear(16, 16, 13.6, 10.2), f: C.steel },
    { a: "M24 9.6A10 10 0 0 1 9.6 24A8.6 8.6 0 0 0 24 9.6Z", f: C.steelDeep, o: 0.55 },
    { b: circ(16, 16, 4.2), f: C.cloud },
    { s: "M8.6 12.6Q9.6 10 12 8.8", w: 1.8 },
  ],
  passport: [
    { b: rr(6, 3.4, 20.4, 25.6, 3.2), f: C.blueDeep },
    { a: rr(6.8, 4.4, 3, 23.6, 1.4), f: "#2c5bb8" },
    { i: circ(17, 14, 5.2), w: 1.8, f: C.gold, m: 1.8 },
    { i: "M11.8 14H22.2M17 8.8Q13.8 14 17 19.2Q20.2 14 17 8.8", w: 1.4, f: C.gold, m: 1.4 },
    { a: rr(12.4, 22.4, 9.2, 2.2, 1.1), f: C.gold },
  ],
  shelf: [
    { b: rr(6, 8.6, 4.8, 12.4, 1.2), f: C.blue, w: 1.8 },
    { b: rr(11.2, 10.8, 4.6, 10.2, 1.2), f: C.green, w: 1.8 },
    { b: circ(22.4, 16.4, 4.6), f: C.gold, w: 1.8 },
    { i: "M7 25V28.6M25 25V28.6", w: 2.6 },
    { b: rr(3, 20.4, 26, 4.6, 1.6), f: C.woodLight },
    { s: "M20.4 14.6Q21 13.2 22.4 13", w: 1.4 },
  ],
};
