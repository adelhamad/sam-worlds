// Flags made only of plain bands — the ones a child can PAINT (a constructed
// answer about a flag, instead of picking it from four options). Emblem-free
// flags only, so the painted result is the real flag, not an approximation.

export interface PaintColor {
  id: string;
  name: string;
  hex: string;
}

export const PAINT_COLORS: PaintColor[] = [
  { id: "red", name: "Red", hex: "#e23d3d" },
  { id: "white", name: "White", hex: "#ffffff" },
  { id: "blue", name: "Blue", hex: "#1f55c4" },
  { id: "green", name: "Green", hex: "#1a9a52" },
  { id: "yellow", name: "Yellow", hex: "#ffd23f" },
  { id: "black", name: "Black", hex: "#1b1b1f" },
  { id: "orange", name: "Orange", hex: "#ff8a1f" },
  { id: "sky", name: "Sky blue", hex: "#58b8ee" },
];

export const PAINT_COLOR_BY_ID = new Map(PAINT_COLORS.map((color) => [color.id, color]));

export interface PaintFlag {
  /** "v" = bands side by side (left→right), "h" = stacked (top→bottom). */
  dir: "v" | "h";
  colors: string[];
  /** Relative band sizes; equal bands when omitted. */
  weights?: number[];
}

export const PAINT_FLAGS: Record<string, PaintFlag> = {
  // side-by-side bands
  FRA: { dir: "v", colors: ["blue", "white", "red"] },
  ITA: { dir: "v", colors: ["green", "white", "red"] },
  IRL: { dir: "v", colors: ["green", "white", "orange"] },
  BEL: { dir: "v", colors: ["black", "yellow", "red"] },
  ROU: { dir: "v", colors: ["blue", "yellow", "red"] },
  MLI: { dir: "v", colors: ["green", "yellow", "red"] },
  GIN: { dir: "v", colors: ["red", "yellow", "green"] },
  NGA: { dir: "v", colors: ["green", "white", "green"] },
  PER: { dir: "v", colors: ["red", "white", "red"] },
  // stacked bands
  DEU: { dir: "h", colors: ["black", "red", "yellow"] },
  HUN: { dir: "h", colors: ["red", "white", "green"] },
  BGR: { dir: "h", colors: ["white", "green", "red"] },
  EST: { dir: "h", colors: ["blue", "black", "white"] },
  LTU: { dir: "h", colors: ["yellow", "green", "red"] },
  AUT: { dir: "h", colors: ["red", "white", "red"] },
  LUX: { dir: "h", colors: ["red", "white", "sky"] },
  YEM: { dir: "h", colors: ["red", "white", "black"] },
  SLE: { dir: "h", colors: ["green", "white", "blue"] },
  GAB: { dir: "h", colors: ["green", "yellow", "blue"] },
  ARM: { dir: "h", colors: ["red", "blue", "orange"] },
  POL: { dir: "h", colors: ["white", "red"] },
  UKR: { dir: "h", colors: ["blue", "yellow"] },
  COL: { dir: "h", colors: ["yellow", "blue", "red"], weights: [2, 1, 1] },
  THA: { dir: "h", colors: ["red", "white", "blue", "white", "red"], weights: [1, 1, 2, 1, 1] },
  CRI: { dir: "h", colors: ["blue", "white", "red", "white", "blue"], weights: [1, 1, 2, 1, 1] },
};

export function paintWeights(flag: PaintFlag): number[] {
  return flag.weights ?? flag.colors.map(() => 1);
}
