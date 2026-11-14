import { COUNTRY_BY_CODE, flagEmoji } from "../../engine/generators/geography";

/** A country's flag. One place to swap emoji for artwork later. */
export function Flag({ code, size = 48, className = "" }: { code: string; size?: number; className?: string }) {
  const country = COUNTRY_BY_CODE.get(code);
  if (!country) return null;
  return (
    <span className={`tflag ${className}`} role="img" aria-label={`Flag of ${country.name}`} style={{ fontSize: size }}>
      {flagEmoji(country.iso2)}
    </span>
  );
}
