// The zoomed map used by the tap-the-map exercise and by the teach cards'
// locator. Pure SVG in the shared 360×180 world space; no labels, ever.
import { useMemo } from "react";
import { COUNTRY_BY_CODE, type Country } from "../../../engine/generators/geography";
import { LAND_PATH } from "../../../engine/tour/land";
import { countriesInView, hitRadius, type View } from "./mapGeo";

export interface TourMapProps {
  /** viewBox [x, y, w, h] — 4:3. */
  view: View;
  /** Tappable countries. */
  targets?: string[];
  /** The child's current pick: cyan + a dropped pin. */
  selected?: string | null;
  /** Teach view: the right country, lit green with a pulsing ring. */
  lit?: string | null;
  /** Teach view: the country that was tapped instead (amber). */
  ghost?: string | null;
  disabled?: boolean;
  onPick?: (code: string) => void;
  /** Accessible name for a tappable country (no country names — that's the answer). */
  spotLabel?: string;
  className?: string;
}

function gridLines(view: View): number[][] {
  const [x, y, w, h] = view;
  const step = w > 120 ? 30 : 10;
  const lines: number[][] = [];
  for (let gx = Math.ceil(x / step) * step; gx < x + w; gx += step) lines.push([gx, y, gx, y + h]);
  for (let gy = Math.ceil(y / step) * step; gy < y + h; gy += step) lines.push([x, gy, x + w, gy]);
  return lines;
}

function stateClass(code: string, props: TourMapProps): string {
  if (props.lit === code) return " is-lit";
  if (props.selected === code) return " is-selected";
  if (props.ghost === code) return " is-ghost";
  return "";
}

function Pin({ country, view }: { country: Country; view: View }) {
  const scale = view[2] * 0.042;
  return (
    <g transform={`translate(${country.worldPoint[0]} ${country.worldPoint[1]}) scale(${scale})`} pointerEvents="none">
      <ellipse className="tx-map-pin-shadow" cx="0" cy="0" rx="0.55" ry="0.2" />
      <g className="tx-map-pin">
        <path d="M0,0C-0.45,-0.75 -0.78,-1.1 -0.78,-1.62A0.78,0.78 0 1 1 0.78,-1.62C0.78,-1.1 0.45,-0.75 0,0Z" />
        <circle cx="0" cy="-1.62" r="0.3" />
      </g>
    </g>
  );
}

export function TourMap(props: TourMapProps) {
  const { view, targets = [], selected, lit, ghost, disabled, onPick, spotLabel, className = "" } = props;
  const [x, y, w, h] = view;
  // Keyed by value so a fresh-but-equal array from the parent doesn't redo the work.
  const viewKey = view.join(" ");
  const targetKey = targets.join(",");
  const { land, spots, helpers } = useMemo(() => {
    const box = viewKey.split(" ").map(Number) as View;
    const codes = targetKey ? targetKey.split(",") : [];
    const special = new Set([...codes, lit ?? "", ghost ?? ""]);
    const visible = countriesInView(box);
    return {
      land: visible.filter((country) => !special.has(country.code)),
      spots: visible.filter((country) => special.has(country.code)),
      // Biggest first so the smallest country's helper ends up on top.
      helpers: codes
        .flatMap((code) => COUNTRY_BY_CODE.get(code) ?? [])
        .map((country) => ({ country, r: hitRadius(country, box) }))
        .filter((item) => item.r > 0)
        .sort((a, b) => b.country.viewBox[2] * b.country.viewBox[3] - a.country.viewBox[2] * a.country.viewBox[3]),
    };
  }, [viewKey, targetKey, lit, ghost]);

  const isTarget = (code: string) => targets.includes(code) && Boolean(onPick);
  const pick = (code: string) => {
    if (!disabled && onPick) onPick(code);
  };
  const edge = h * 0.012;
  const pinned = selected ? COUNTRY_BY_CODE.get(selected) : undefined;
  const litCountry = lit ? COUNTRY_BY_CODE.get(lit) : undefined;

  return (
    <div className={`tx-map ${disabled ? "is-locked" : ""} ${className}`}>
      <svg viewBox={viewKey} preserveAspectRatio="xMidYMid slice">
        <rect className="tx-map-sea" x={x} y={y} width={w} height={h} />
        {gridLines(view).map(([x1, y1, x2, y2]) => (
          <line key={`${x1}-${y1}-${x2}`} className="tx-map-grid" x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
        {LAND_PATH && <path className="tx-map-backdrop" d={LAND_PATH} />}
        {land.map((country) => <path key={country.code} className="tx-map-land" d={country.worldPath} />)}
        <g transform={`translate(0 ${edge})`} pointerEvents="none">
          {spots.filter((country) => isTarget(country.code)).map((country) => (
            <path key={country.code} className="tx-map-edge" d={country.worldPath} />
          ))}
        </g>
        {spots.map((country) => (isTarget(country.code) ? (
          <path
            key={country.code}
            className={`tx-map-spot is-target${stateClass(country.code, props)}`}
            d={country.worldPath}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={spotLabel}
            aria-pressed={selected === country.code}
            data-testid={`map-${country.code}`}
            onClick={() => pick(country.code)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") pick(country.code);
            }}
          />
        ) : (
          <path key={country.code} className={`tx-map-spot${stateClass(country.code, props)}`} d={country.worldPath} />
        )))}
        {onPick && helpers.map(({ country, r }) => (
          <circle
            key={country.code}
            className="tx-map-helper"
            cx={country.worldPoint[0]}
            cy={country.worldPoint[1]}
            r={r}
            data-testid={`map-hit-${country.code}`}
            onClick={() => pick(country.code)}
          />
        ))}
        {litCountry && Math.max(litCountry.viewBox[2], litCountry.viewBox[3]) < w * 0.3 && (
          <circle className="tx-map-ring" cx={litCountry.worldPoint[0]} cy={litCountry.worldPoint[1]} r={w * 0.11} />
        )}
        {pinned && <Pin key={pinned.code} country={pinned} view={view} />}
      </svg>
    </div>
  );
}
