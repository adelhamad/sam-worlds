// kit-pairs — tap one card on each side to match them. Partners share an id.
// Self-submitting: a mismatch reports pairsMiss ~450 ms after the shake, a
// cleared board reports pairsAnswer after the last pop. A decoy simply stays.
// When one side is pictures only (clocks, icons), the board stacks: the
// pictures in a row on top, big enough to read, the words in a grid below.
import { useEffect, useRef, useState } from "react";
import { pairsAnswer, pairsMiss } from "../../../engine/kit/answers";
import type { KitItem, KitPairsPayload } from "../../../engine/kit/types";
import { TOUR } from "../../../strings/tour";
import { tourSound, useTimers, type WidgetProps } from "../exercises/shared";
import { KitCard } from "./KitCard";
import { groupFit } from "./fit";

type Side = "left" | "right";
interface Sel {
  side: Side;
  id: string;
}

const POP_MS = 380;

/** Every card of the side is a picture with no label. */
const picturesOnly = (items: KitItem[]) => items.length > 0 && items.every((item) => !item.label.trim() && item.art);

/** Pictures per row on a phone: one row up to 3, then 2 + 2, then rows of 3. */
const phoneRow = (count: number) => (count === 4 ? 2 : Math.min(count, 3));
const MISS_MS = 450;

export function KitPairs({ payload, disabled, onSubmit }: WidgetProps<KitPairsPayload>) {
  const [sel, setSel] = useState<Sel | null>(null);
  /** Matched ids: "right" while the pop plays, then "done". */
  const [matched, setMatched] = useState<Record<string, "right" | "done">>({});
  const [miss, setMiss] = useState<{ left: string; right: string } | null>(null);
  const [finished, setFinished] = useState(false);
  const later = useTimers();
  const submit = useRef(onSubmit);
  useEffect(() => {
    submit.current = onSubmit;
  });
  const leftIds = payload.left.map((item) => item.id);

  const resolve = (left: string, right: string) => {
    setSel(null);
    if (left !== right) {
      tourSound.nudge();
      setMiss({ left, right });
      later(() => {
        setMiss(null);
        submit.current(pairsMiss(left, right));
      }, MISS_MS);
      return;
    }
    tourSound.match();
    const next = { ...matched, [left]: "right" as const };
    setMatched(next);
    later(() => setMatched((now) => ({ ...now, [left]: "done" })), POP_MS);
    if (leftIds.every((id) => next[id])) {
      setFinished(true);
      later(() => submit.current(pairsAnswer(leftIds)), POP_MS + 140);
    }
  };

  const tap = (side: Side, id: string) => {
    if (disabled || miss || finished || matched[id]) return;
    if (!sel || sel.side === side) {
      tourSound.pop();
      setSel(sel?.side === side && sel.id === id ? null : { side, id });
      return;
    }
    if (side === "left") resolve(id, sel.id);
    else resolve(sel.id, id);
  };

  const stateOf = (side: Side, id: string): string => {
    // `matched` holds left ids only, so a decoy on the right is never marked.
    if (matched[id]) return `is-${matched[id]}`;
    if (miss && miss[side] === id) return "is-miss";
    return sel?.side === side && sel.id === id ? "is-selected" : "";
  };

  const column = (side: Side, items: KitItem[], extra = "") => {
    const fit = groupFit(items.map((item) => item.label));
    return (
    <div className={`kx-pairs-col is-${side} ${extra}`}>
      {items.map((item) => {
        const state = stateOf(side, item.id);
        return (
          <KitCard
            key={item.id}
            item={item}
            shape={extra === "is-pictures" ? "tile" : "chip"}
            fit={fit}
            className={`kx-pair ${state}`}
            aria-pressed={state === "is-selected"}
            disabled={disabled || state === "is-right" || state === "is-done"}
            data-testid={`kit-${side}-${item.id}`}
            onClick={() => tap(side, item.id)}
          />
        );
      })}
    </div>
    );
  };

  const rows = Math.max(payload.left.length, payload.right.length);
  const pictureSide: Side | null = (picturesOnly(payload.left) && "left") || (picturesOnly(payload.right) && "right") || null;
  if (pictureSide) {
    const wordSide: Side = pictureSide === "left" ? "right" : "left";
    const pictures = payload[pictureSide];
    const style = { "--per-row": phoneRow(pictures.length), "--per-row-wide": Math.min(pictures.length, 5) } as React.CSSProperties;
    return (
      <div className="tx kx kx-pairs-wrap">
        <p className="kx-help">{TOUR.kit.pairsHelp}</p>
        <div className="kx-pairs is-stacked" style={style}>
          {column(pictureSide, pictures, "is-pictures")}
          {column(wordSide, payload[wordSide], "is-words")}
        </div>
      </div>
    );
  }
  return (
    <div className="tx kx kx-pairs-wrap">
      <p className="kx-help">{TOUR.kit.pairsHelp}</p>
      <div className={`kx-pairs ${rows >= 6 ? "is-dense" : ""}`} style={{ "--rows": rows } as React.CSSProperties}>
        {column("left", payload.left)}
        {column("right", payload.right)}
      </div>
    </div>
  );
}
