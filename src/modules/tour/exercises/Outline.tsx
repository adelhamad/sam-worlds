// Country and continent silhouettes drawn from the shared geography data.
import { COUNTRY_BY_CODE } from "../../../engine/generators/geography";
import { continentShape } from "./mapGeo";

/** One country's shape on its own — a chunky "cut-out" with a darker edge. */
export function Outline({ code, size = 96, className = "" }: { code: string; size?: number; className?: string }) {
  const country = COUNTRY_BY_CODE.get(code);
  if (!country) return null;
  const [x, y, w, h] = country.viewBox;
  const edge = Math.max(w, h) * 0.035;
  return (
    <svg
      className={`tx-outline ${className}`}
      width={size}
      height={size}
      viewBox={`${x} ${y} ${w} ${h + edge}`}
      role="img"
      aria-label="Country shape"
    >
      <path className="tx-outline-edge" d={country.path} transform={`translate(0 ${edge})`} />
      <path className="tx-outline-face" d={country.path} />
    </svg>
  );
}

/** A small continent silhouette (bucket label icon). */
export function ContinentIcon({ continent, size = 36 }: { continent: string; size?: number }) {
  const shape = continentShape(continent);
  if (!shape) return null;
  return (
    <svg className="tx-continent" width={size} height={size} viewBox={shape.viewBox} aria-hidden="true">
      <path d={shape.d} />
    </svg>
  );
}
