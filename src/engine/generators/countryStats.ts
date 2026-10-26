import data from "../../content/geography/countryStats.json";
import { COUNTRY_BY_CODE, flagEmoji, type Country } from "./geography";

export interface CountryStats {
  code: string;
  landKm2: number;
  landYear: number;
  population: number;
  populationYear: number;
}

export interface RankedCountry {
  country: Country;
  stats: CountryStats;
}

export const STATS_BY_CODE = new Map<string, CountryStats>(data.stats.map((row) => [row.code, row]));
export const MAX_LAND_KM2 = Math.max(...data.stats.map((row) => row.landKm2));
export const MAX_POPULATION = Math.max(...data.stats.map((row) => row.population));

export function rankedCountry(code: string): RankedCountry {
  const country = COUNTRY_BY_CODE.get(code);
  const stats = STATS_BY_CODE.get(code);
  if (!country || !stats) throw new Error(`Missing country statistics for ${code}`);
  return { country, stats };
}

export function countryLabel(country: Country): string {
  return `${flagEmoji(country.iso2)} ${country.name}`;
}

function quantity(value: number): string {
  if (value >= 1_000_000_000) return `${Math.round(value / 100_000_000) / 10} billion`;
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10} million`;
  if (value >= 1_000) return `${Math.round(value / 100) / 10} thousand`;
  return `${Math.round(value * 10) / 10}`;
}

export function areaLabel(km2: number): string {
  return `${quantity(km2)} km²`;
}

export function populationLabel(people: number): string {
  return `${quantity(people)} people`;
}

export function sizeChoices(value: number, cap: number, format: (value: number) => string): string[] {
  const answer = format(value);
  const higher = value * 3 <= cap * 1.05 ? value * 3 : value / 2;
  const candidates = [answer, format(value / 10), format(value / 3), format(higher)];
  if (new Set(candidates).size !== candidates.length) throw new Error(`Ambiguous estimate for ${value}`);
  return candidates;
}
