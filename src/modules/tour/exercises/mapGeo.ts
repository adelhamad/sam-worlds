// Geometry helpers for the tour map and outlines. All coordinates live in the
// shared 360×180 world space of `Country.worldPath`.
import { COUNTRIES, COUNTRY_BY_CODE, type Country } from "../../../engine/generators/geography";

/** [x, y, w, h] */
export type View = [number, number, number, number];

const boxes = new Map<string, View>();

/** Bounding box of everything in a country's worldPath (islands included). */
export function worldBox(country: Country): View {
  const known = boxes.get(country.code);
  if (known) return known;
  const nums = country.worldPath.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    x0 = Math.min(x0, nums[i]);
    x1 = Math.max(x1, nums[i]);
    y0 = Math.min(y0, nums[i + 1]);
    y1 = Math.max(y1, nums[i + 1]);
  }
  const box: View = nums.length >= 2 ? [x0, y0, x1 - x0, y1 - y0] : [0, 0, 0, 0];
  boxes.set(country.code, box);
  return box;
}

function intersects(a: View, b: View): boolean {
  return a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
}

/** Every country with land inside the view. */
export function countriesInView(view: View): Country[] {
  return COUNTRIES.filter((country) => intersects(worldBox(country), view));
}

/**
 * Radius of the invisible tap helper drawn on a target, or 0 when the shape is
 * already a comfortable target. ~7.5% of the view width ≈ a 48px+ circle on a
 * 328px-wide phone map.
 */
export function hitRadius(country: Country, view: View): number {
  const want = view[2] * 0.075;
  const [, , w, h] = country.viewBox;
  return Math.min(w, h) < want * 2.4 ? want : 0;
}

/** A 4:3 view around one country with enough neighbours to place it. */
export function locatorView(code: string): View {
  const country = COUNTRY_BY_CODE.get(code);
  if (!country) return [0, 0, 240, 180];
  const [, , bw, bh] = country.viewBox;
  const w = Math.min(240, Math.max(bw * 2.4, bh * 2.4 * (4 / 3), 56));
  const h = w * 0.75;
  const x = Math.min(360 - w, Math.max(0, country.worldPoint[0] - w / 2));
  const y = Math.min(180 - h, Math.max(0, country.worldPoint[1] - h / 2));
  return [x, y, w, h];
}

interface Shape {
  d: string;
  viewBox: string;
}

const continents = new Map<string, Shape>();

/** A whole continent as one silhouette (main shapes only), for bucket icons. */
export function continentShape(continent: string): Shape | null {
  const known = continents.get(continent);
  if (known) return known;
  const members = COUNTRIES.filter((country) => country.continent === continent);
  if (members.length === 0) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const { viewBox: [x, y, w, h] } of members) {
    if (w > 300) continue; // wraps the date line
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x + w);
    y1 = Math.max(y1, y + h);
  }
  const size = Math.max(x1 - x0, y1 - y0);
  const shape: Shape = {
    d: members.map((country) => country.path).join(""),
    viewBox: `${x0 - (size - (x1 - x0)) / 2} ${y0 - (size - (y1 - y0)) / 2} ${size} ${size}`,
  };
  continents.set(continent, shape);
  return shape;
}
