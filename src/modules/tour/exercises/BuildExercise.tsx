// build — spell the country's name from chunk tiles. Draft = buildAnswer(placed).
import { useLayoutEffect, useRef, useState } from "react";
import { buildAnswer } from "../../../engine/tour/answers";
import type { BuildPayload } from "../../../engine/tour/types";
import { Flag } from "../../../ui/tour/Flag";
import { Outline } from "./Outline";
import { reducedMotion, tourSound, useDraft, type WidgetProps } from "./shared";

/** A run of one placed tile's letters inside one word of the answer line. */
interface Seg {
  tile: number;
  /** Offset of this run inside the tile's text. */
  at: number;
  text: string;
  start: boolean;
  end: boolean;
}
interface WordRow {
  segs: Seg[];
  empty: number;
}

/** Pour the placed tiles' letters into the word slots; extra letters overflow into a last row. */
function pour(words: number[], placed: number[], tiles: string[]): WordRow[] {
  let p = 0;
  let offset = 0;
  const take = (room: number): Seg[] => {
    const segs: Seg[] = [];
    let left = room;
    while (left > 0 && p < placed.length) {
      const text = tiles[placed[p]];
      const n = Math.min(left, text.length - offset);
      segs.push({ tile: placed[p], at: offset, text: text.slice(offset, offset + n), start: offset === 0, end: offset + n === text.length });
      offset += n;
      left -= n;
      if (offset >= text.length) {
        p += 1;
        offset = 0;
      }
    }
    return segs;
  };
  const rows = words.map((size) => {
    const segs = take(size);
    return { segs, empty: size - segs.reduce((sum, seg) => sum + seg.text.length, 0) };
  });
  const extra = take(Infinity);
  return extra.length > 0 ? [...rows, { segs: extra, empty: 0 }] : rows;
}

/** How many letter cells one line must fit (drives the cell size). */
function lineUnits(words: number[]): number {
  const whole = words.reduce((sum, size) => sum + size, 0) + (words.length - 1) * 0.7;
  return whole <= 12 ? Math.max(whole, 5) : Math.max(...words, 7);
}

interface Flight {
  tile: number;
  to: "line" | "bank";
  from: DOMRect;
}

export function BuildExercise({ payload, disabled, onDraft }: WidgetProps<BuildPayload>) {
  const { tiles, words } = payload;
  /** Indices into `tiles`, in the order they were placed (duplicates are distinct tiles). */
  const [placed, setPlaced] = useState<number[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const flight = useRef<Flight | null>(null);
  useDraft(onDraft, placed.length > 0 ? buildAnswer(placed.map((i) => tiles[i])) : null);

  // FLIP: after the tile re-renders in its new home, fly it there from where it was.
  useLayoutEffect(() => {
    const move = flight.current;
    flight.current = null;
    if (!move || !root.current || reducedMotion()) return;
    const selector = move.to === "line" ? `[data-seg-tile="${move.tile}"]` : `[data-bank-tile="${move.tile}"]`;
    root.current.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const now = el.getBoundingClientRect();
      const dx = move.from.left + move.from.width / 2 - (now.left + now.width / 2);
      const dy = move.from.top + move.from.height / 2 - (now.top + now.height / 2);
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(1.06)`, zIndex: 3 },
          { transform: "translate(0, 0) scale(1)", zIndex: 3 },
        ],
        { duration: 240, easing: "cubic-bezier(0.2, 1.25, 0.4, 1)" },
      );
    });
  }, [placed]);

  const place = (tile: number, from: HTMLElement) => {
    if (disabled || placed.includes(tile)) return;
    tourSound.place();
    flight.current = { tile, to: "line", from: from.getBoundingClientRect() };
    setPlaced([...placed, tile]);
  };
  const unplace = (tile: number) => {
    if (disabled) return;
    const first = root.current?.querySelector<HTMLElement>(`[data-seg-tile="${tile}"]`);
    tourSound.pop();
    flight.current = first ? { tile, to: "bank", from: first.getBoundingClientRect() } : null;
    setPlaced(placed.filter((i) => i !== tile));
  };

  const rows = pour(words, placed, tiles);
  return (
    <div className="tx tx-build" ref={root}>
      <div className="tx-hero">
        {payload.from === "flag" ? <Flag code={payload.code} size={88} /> : <Outline code={payload.code} size={120} />}
      </div>
      <div className="tx-build-line" style={{ "--units": lineUnits(words) } as React.CSSProperties} data-testid="build-line">
        {rows.map((row, r) => (
          <div key={r} className={`tx-build-word ${r >= words.length ? "is-extra" : ""}`}>
            {row.segs.map((seg) => (
              <button
                key={`${seg.tile}-${seg.at}`}
                type="button"
                className={`tx-build-seg ${seg.start ? "is-start" : ""} ${seg.end ? "is-end" : ""}`}
                style={{ "--len": seg.text.length } as React.CSSProperties}
                data-seg-tile={seg.tile}
                data-testid={`build-placed-${seg.tile}`}
                disabled={disabled}
                onClick={() => unplace(seg.tile)}
              >
                {[...seg.text].map((letter, i) => (
                  <span key={i}>{letter}</span>
                ))}
              </button>
            ))}
            {Array.from({ length: row.empty }, (_, i) => <span key={`e${i}`} className="tx-build-cell" />)}
          </div>
        ))}
      </div>
      <div className="tx-build-bank">
        {tiles.map((text, i) => {
          const used = placed.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={`ttile tx-build-tile ${used ? "is-placed" : ""}`}
              data-bank-tile={i}
              data-testid={`build-tile-${i}`}
              disabled={disabled || used}
              aria-hidden={used}
              onClick={(event) => place(i, event.currentTarget)}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
