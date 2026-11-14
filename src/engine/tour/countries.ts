// Small country lookups shared by the tour planner and widgets.
import { COUNTRY_BY_CODE } from "../generators/geography";

export function countryName(code: string): string {
  return COUNTRY_BY_CODE.get(code)?.name ?? code;
}

export function continentOf(code: string): string {
  return COUNTRY_BY_CODE.get(code)?.continent ?? "";
}
