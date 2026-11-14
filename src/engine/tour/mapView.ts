// Camera for the tap-the-map exercise. World space is equirectangular 360×180
// (x = lon + 180, y = 90 − lat) — the space `country.worldPath` is drawn in.
import { COUNTRIES } from "../generators/geography";
import type { GenContext } from "../generators/types";
import type { RNG } from "../rng";
import { clamp } from "./pool";

const WORLD_W = 360;
const WORLD_H = 180;
/** Smallest country (bbox side, world units) that is still a 48px target on a phone. */
const MIN_SPAN = 3.4;
const MIN_VIEW = 28;
const MAX_VIEW = 100;
const ASPECT = 0.75;
/** How far the camera may drift off-centre, as a share of the view size. */
const DRIFT = 0.22;
const MIN_TARGETS = 3;
const MAX_TARGETS = 10;

interface Box {
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  span: number;
  /** False for antimeridian countries whose box is wrapped past the map edge. */
  onMap: boolean;
}

const BOXES = new Map<string, Box>(COUNTRIES.map((country) => {
  const [x, y, w, h] = country.viewBox;
  const onMap = x >= 0 && y >= 0 && x + w <= WORLD_W && y + h <= WORLD_H;
  return [country.code, { code: country.code, x, y, w, h, cx: x + w / 2, cy: y + h / 2, span: Math.max(w, h), onMap }];
}));

export interface MapView {
  /** SVG viewBox [x, y, w, h] in world space. */
  view: [number, number, number, number];
  /** Tappable country codes inside the view, A→Z (includes the target). */
  targets: string[];
}

const round = (value: number) => Math.round(value * 100) / 100;

function viewSize(box: Box): { w: number; h: number } {
  const w = round(clamp(4 * box.span, MIN_VIEW, MAX_VIEW));
  return { w, h: round(w * ASPECT) };
}

/** A view of the given size around `box`, pushed off-centre by (dx, dy) ∈ [−1, 1]². */
function placeView(box: Box, size: { w: number; h: number }, dx: number, dy: number): MapView["view"] {
  // The whole target box stays in view and the view stays on the map.
  const x = clamp(box.cx - size.w / 2 + dx * DRIFT * size.w, Math.max(0, box.x + box.w - size.w), Math.min(WORLD_W - size.w, box.x));
  const y = clamp(box.cy - size.h / 2 + dy * DRIFT * size.h, Math.max(0, box.y + box.h - size.h), Math.min(WORLD_H - size.h, box.y));
  return [round(x), round(y), size.w, size.h];
}

function targetsIn(view: MapView["view"], target: Box, cap: number): string[] {
  const [x, y, w, h] = view;
  const others = [...BOXES.values()]
    .filter((box) => box.code !== target.code && box.onMap && box.span >= w / 9)
    .filter((box) => box.cx >= x && box.cx <= x + w && box.cy >= y && box.cy <= y + h)
    .sort((a, b) => Math.hypot(a.cx - target.cx, a.cy - target.cy) - Math.hypot(b.cx - target.cx, b.cy - target.cy))
    .slice(0, cap - 1);
  return [target.code, ...others.map((box) => box.code)].sort();
}

function usableBox(code: string): Box | null {
  const box = BOXES.get(code);
  if (!box?.onMap || box.span < MIN_SPAN) return null;
  const size = viewSize(box);
  return box.w <= size.w && box.h <= size.h ? box : null;
}

const eligibility = new Map<string, boolean>();

/** Can this country be the answer of a map exercise? */
export function mapEligible(code: string): boolean {
  if (!eligibility.has(code)) {
    const box = usableBox(code);
    eligibility.set(code, !!box && targetsIn(placeView(box, viewSize(box), 0, 0), box, MAX_TARGETS).length >= MIN_TARGETS);
  }
  return eligibility.get(code) ?? false;
}

/**
 * A zoomed view holding the whole country plus tappable neighbours. The camera
 * drifts off-centre at random so the answer is never simply "the middle one".
 * Null when the country is not map-eligible.
 */
export function mapView(code: string, rng: RNG, ctx: GenContext): MapView | null {
  const box = usableBox(code);
  if (!box || !mapEligible(code)) return null;
  const size = viewSize(box);
  const cap = ctx.easier ? 6 : MAX_TARGETS;
  for (let attempt = 0; attempt < 6; attempt++) {
    const view = placeView(box, size, rng() * 2 - 1, rng() * 2 - 1);
    const targets = targetsIn(view, box, cap);
    if (targets.length >= MIN_TARGETS) return { view, targets };
  }
  const view = placeView(box, size, 0, 0);
  return { view, targets: targetsIn(view, box, cap) };
}
