import { COUNTRIES, COUNTRY_BY_CODE } from "../engine/generators/geography";
import { STR } from "../strings/en";

const WORLD_OUTLINES = COUNTRIES.map((country) => country.worldPath).join("");

interface Props {
  code: string;
  style?: "outline" | "pin" | "world";
  miniature?: boolean;
}

export function GeoMap({ code, style = "outline", miniature = false }: Props) {
  const country = COUNTRY_BY_CODE.get(code);
  if (!country) return null;
  const world = style === "world";
  const [x, y, w, h] = world ? [0, 0, 360, 180] : country.viewBox;
  const pin = country.capitalPoint;
  const center = [country.viewBox[0] + country.viewBox[2] / 2, country.viewBox[1] + country.viewBox[3] / 2];
  let point: number[] | null = center;
  if (style === "pin") point = pin;
  else if (world) point = country.worldPoint;
  const radius = world ? 3.5 : Math.max(w, h) * 0.035;
  const labels = STR.geo.chartLabels;
  const tags = STR.geo.chartTags;
  return (
    <div className={`geo-chart ${world ? "geo-world" : "geo-outline"} ${miniature ? "geo-mini" : ""}`}>
      <svg viewBox={`${x} ${y} ${w} ${h}`} role="img" aria-label={miniature ? labels.outline : labels[style]}>
        {world && (
          <>
            <path className="geo-graticule" d="M0 45H360M0 90H360M0 135H360M90 0V180M180 0V180M270 0V180" />
            <path className="geo-land" d={WORLD_OUTLINES} />
          </>
        )}
        <path className="geo-country" d={world ? country.worldPath : country.path} />
        {(style === "pin" || world) && point && (
          <>
            <circle className="geo-pin-halo" cx={point[0]} cy={point[1]} r={radius * 2.5} />
            <circle className="geo-pin" cx={point[0]} cy={point[1]} r={radius} />
          </>
        )}
      </svg>
      {world && (
        <svg className="geo-world-inset" viewBox={country.viewBox.join(" ")} aria-hidden="true">
          <path className="geo-country" d={country.path} />
        </svg>
      )}
      {!miniature && <span className="geo-chart-tag">{tags[style]}</span>}
    </div>
  );
}
