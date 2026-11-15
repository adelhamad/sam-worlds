// kit-build — build the sentence from word tiles. Tiles are tracked by INDEX
// (the same word can appear twice). Tap a bank tile: it flies onto the line and
// leaves a dimmed placeholder, so nothing in the bank moves; tap a placed tile:
// it flies back. Draft = sentenceAnswer(placed words) once a tile is placed.
import { useRef, useState } from "react";
import { sentenceAnswer } from "../../../engine/kit/answers";
import type { KitBuildPayload } from "../../../engine/kit/types";
import { TOUR } from "../../../strings/tour";
import { tourSound, useDraft, type WidgetProps } from "../exercises/shared";
import { KitCard } from "./KitCard";
import { useFlip } from "./motion";

export function KitBuild({ payload, disabled, onDraft }: WidgetProps<KitBuildPayload>) {
  const { tiles } = payload;
  /** Indices into `tiles`, in the order they were placed. */
  const [placed, setPlaced] = useState<number[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const capture = useFlip(root);
  useDraft(onDraft, placed.length > 0 ? sentenceAnswer(placed.map((i) => tiles[i])) : null);
  const longest = tiles.reduce((max, word) => Math.max(max, [...word].length), 0);
  const dense = tiles.length >= 9 || longest > 9;

  const place = (i: number) => {
    if (disabled || placed.includes(i)) return;
    capture();
    tourSound.place();
    setPlaced([...placed, i]);
  };
  const unplace = (i: number) => {
    if (disabled) return;
    capture();
    tourSound.pop();
    setPlaced(placed.filter((tile) => tile !== i));
  };

  return (
    <div className={`tx kx kx-build ${dense ? "is-dense" : ""}`} ref={root}>
      {payload.hero && <KitCard item={payload.hero} shape="hero" small className="kx-hero" />}
      <div className={`kx-line ${placed.length === 0 ? "is-empty" : ""}`} data-testid="kit-line">
        {placed.map((i) => (
          <button
            key={i}
            type="button"
            className="ttile kx-word is-placed-word"
            data-flip={`w-${i}`}
            data-testid={`kit-line-${i}`}
            disabled={disabled}
            onClick={() => unplace(i)}
          >
            {tiles[i]}
          </button>
        ))}
      </div>
      <p className={`kx-help ${placed.length > 0 ? "is-hidden" : ""}`}>{TOUR.kit.buildHelp}</p>
      <div className="kx-bank">
        {tiles.map((word, i) => {
          const used = placed.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={`ttile kx-word ${used ? "is-used" : ""}`}
              data-flip={used ? undefined : `w-${i}`}
              data-testid={`kit-tile-${i}`}
              disabled={disabled || used}
              aria-hidden={used}
              onClick={() => place(i)}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
