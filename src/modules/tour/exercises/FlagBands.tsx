// A striped flag drawn as SVG bands — the paint canvas and the solved flag in
// the teach card. Unpainted bands look like dashed paper.
import { useId } from "react";
import { PAINT_COLOR_BY_ID } from "../../../engine/tour/paintFlags";
import { bandRects, FLAG_H, FLAG_W, type BandRect } from "./shared";

export interface Splash {
  x: number;
  y: number;
  /** Bumps on every stroke so the splash animation restarts. */
  n: number;
}

export interface FlagBandsProps {
  dir: "v" | "h";
  weights: number[];
  /** Colour id per band; null = not painted yet. */
  colors: (string | null)[];
  /** What each band looked like before its latest stroke (shown under the splash). */
  previous?: (string | null)[];
  splashes?: (Splash | null)[];
  onBand?: (index: number, x: number, y: number) => void;
  disabled?: boolean;
  bandLabel?: (n: number) => string;
  className?: string;
}

function hex(id: string | null | undefined): string | null {
  return id ? PAINT_COLOR_BY_ID.get(id)?.hex ?? null : null;
}

/** Radius that covers the whole band from the point where the brush landed. */
function reach(rect: BandRect, x: number, y: number): number {
  const dx = Math.max(x - rect.x, rect.x + rect.w - x);
  const dy = Math.max(y - rect.y, rect.y + rect.h - y);
  return Math.hypot(dx, dy) + 2;
}

export function FlagBands({
  dir, weights, colors, previous, splashes, onBand, disabled, bandLabel, className = "",
}: FlagBandsProps) {
  const uid = useId().replace(/:/g, "");
  const rects = bandRects(dir, weights);

  const tap = (index: number, event: React.MouseEvent<SVGGElement>) => {
    if (disabled || !onBand) return;
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    const rect = rects[index];
    // Keyboard "clicks" have no position: splash from the middle of the band.
    const x = box && event.clientX ? ((event.clientX - box.left) / box.width) * FLAG_W : rect.x + rect.w / 2;
    const y = box && event.clientY ? ((event.clientY - box.top) / box.height) * FLAG_H : rect.y + rect.h / 2;
    onBand(index, x, y);
  };

  return (
    <svg className={`tx-flag ${onBand ? "is-canvas" : ""} ${className}`} viewBox={`0 0 ${FLAG_W} ${FLAG_H}`}>
      <defs>
        <clipPath id={`${uid}-frame`}>
          <rect x="0" y="0" width={FLAG_W} height={FLAG_H} rx="11" />
        </clipPath>
        {rects.map((rect, i) => (
          <clipPath key={i} id={`${uid}-band-${i}`}>
            <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} />
          </clipPath>
        ))}
      </defs>
      <g clipPath={`url(#${uid}-frame)`}>
      {rects.map((rect, i) => {
        const splash = splashes?.[i] ?? null;
        const base = splash ? hex(previous?.[i]) : hex(colors[i]);
        const top = splash ? hex(colors[i]) : null;
        const interactive = Boolean(onBand);
        return (
          <g
            key={i}
            className={`tx-flag-band ${colors[i] ? "is-painted" : "is-blank"}`}
            clipPath={`url(#${uid}-band-${i})`}
            role={interactive ? "button" : undefined}
            tabIndex={interactive && !disabled ? 0 : undefined}
            aria-label={interactive ? bandLabel?.(i + 1) : undefined}
            data-testid={interactive ? `paint-band-${i}` : undefined}
            onClick={(event) => tap(i, event)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onBand?.(i, rect.x + rect.w / 2, rect.y + rect.h / 2);
            }}
          >
            <rect className="tx-flag-fill" x={rect.x} y={rect.y} width={rect.w} height={rect.h} style={base ? { fill: base } : undefined} />
            {splash && top && (
              <circle key={splash.n} className="tx-flag-splash" cx={splash.x} cy={splash.y} r={reach(rect, splash.x, splash.y)} fill={top} />
            )}
            {!colors[i] && (
              <rect className="tx-flag-paper" x={rect.x + 5} y={rect.y + 5} width={rect.w - 10} height={rect.h - 10} rx="8" />
            )}
          </g>
        );
      })}
      </g>
      <rect className="tx-flag-frame" x="1.5" y="1.5" width={FLAG_W - 3} height={FLAG_H - 3} rx="10" />
    </svg>
  );
}
