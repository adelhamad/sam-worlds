import data from "../../content/geography/countries.json";
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext } from "./types";

export interface Country {
  code: string;
  iso2: string;
  name: string;
  capital: string;
  continent: string;
  path: string;
  worldPath: string;
  viewBox: number[];
  worldPoint: number[];
  capitalPoint: number[] | null;
}

export const COUNTRIES: Country[] = data.countries;
export const COUNTRY_BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]));

export function flagEmoji(iso2: string): string {
  return [...iso2.toUpperCase()].map((letter) =>
    String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65)).join("");
}

export interface GeographyParams { items: string[] }

export function pickFact(params: GeographyParams, rng: RNG): { country: Country; mode: string } {
  const [code, mode] = pick(rng, params.items).split(":");
  const country = COUNTRY_BY_CODE.get(code);
  if (!country) throw new Error(`Unknown geography country: ${code}`);
  return { country, mode };
}

export function otherCountries(country: Country, rng: RNG, ctx: GenContext, items: string[]): Country[] {
  const stageCodes = new Set(items.map((token) => token.split(":")[0]));
  const available = COUNTRIES.filter((item) => stageCodes.has(item.code) && item.code !== country.code);
  const pool = available.filter((item) =>
    (ctx.easier || ctx.difficulty < 0.3 ? item.continent !== country.continent : item.continent === country.continent));
  return shuffle(rng, pool.length >= 3 ? pool : available).slice(0, 3);
}
