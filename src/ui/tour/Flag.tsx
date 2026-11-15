import { COUNTRY_BY_CODE } from "../../engine/generators/geography";
import "./flags.css";

// Real SVG flags (flag-icons, MIT) copied by scripts/copy-flags.ts, bundled offline.
const FLAG_URLS = import.meta.glob<string>("../../assets/flags/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});
const urlFor = (code: string): string | undefined => FLAG_URLS[`../../assets/flags/${code.toUpperCase()}.svg`];

/** A country's flag. `size` is the legacy emoji font size; the flag is `0.8 * size` tall, 4:3. */
export function Flag({ code, size = 48, className = "" }: { code: string; size?: number; className?: string }) {
  const country = COUNTRY_BY_CODE.get(code);
  const url = country ? urlFor(code) : undefined;
  if (!country || !url) return null;
  return (
    <span className={`tflag ${className}`} role="img" aria-label={`Flag of ${country.name}`} style={{ fontSize: size }}>
      <img className="tflag-img" src={url} alt="" decoding="async" draggable={false} />
    </span>
  );
}
