// kit-sort — drop each card into its group. Tap a card, then a group (or drag
// it there); tap a placed chip to send it back. The tray closes up as cards
// leave (they glide), so a full group never pushes the screen into a scroll.
// Draft = sortAnswer(bucketIds, placed) once every card is placed.
import { useRef, useState } from "react";
import { sortAnswer } from "../../../engine/kit/answers";
import type { KitSortPayload } from "../../../engine/kit/types";
import { TOUR } from "../../../strings/tour";
import { tourSound, useDraft, useTimers, type WidgetProps } from "../exercises/shared";
import { KitCard } from "./KitCard";
import { useFlip, useKitDrag } from "./motion";

const TRAY = "tray";

export function KitSort({ payload, disabled, onDraft }: WidgetProps<KitSortPayload>) {
  const { buckets, cards } = payload;
  /** card id → bucket id */
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [held, setHeld] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const later = useTimers();
  const root = useRef<HTMLDivElement>(null);
  const capture = useFlip(root);
  const allPlaced = cards.every((card) => placed[card.id]);
  const bucketIds = buckets.map((bucket) => bucket.id);
  useDraft(onDraft, allPlaced ? sortAnswer(bucketIds, placed) : null);

  const put = (id: string, target: string) => {
    if (disabled) return;
    if (target !== TRAY && !bucketIds.includes(target)) return;
    capture();
    tourSound[target === TRAY ? "pop" : "place"]();
    setPlaced((now) => {
      const next = { ...now };
      if (target === TRAY) delete next[id];
      else next[id] = target;
      return next;
    });
    setHeld(null);
  };
  const { start, wasDrag } = useKitDrag(put, !disabled);

  const tapCard = (id: string) => {
    if (wasDrag() || disabled) return;
    tourSound.pop();
    setHeld(held === id ? null : id);
  };
  const tapBucket = (bucket: string) => {
    if (disabled) return;
    if (held) {
      put(held, bucket);
      return;
    }
    if (allPlaced) return;
    // Nothing in hand yet: wiggle the tray to show where to start.
    setHint(true);
    later(() => setHint(false), 500);
  };
  const tapChip = (id: string, bucket: string) => {
    if (wasDrag() || disabled) return;
    // With a card in hand the whole group is a drop zone, chips included.
    if (held) put(held, bucket);
    else put(id, TRAY);
  };

  const narrow = buckets.length >= 3;
  const waiting = cards.filter((card) => !placed[card.id]);
  return (
    <div className={`tx kx kx-sort ${held ? "is-holding" : ""}`} ref={root}>
      <div className={`kx-buckets ${narrow ? "is-narrow" : ""}`} style={{ "--cols": buckets.length } as React.CSSProperties}>
        {buckets.map((bucket) => (
          <div
            key={bucket.id}
            className="kx-bucket"
            role="button"
            tabIndex={disabled ? -1 : 0}
            data-drop={bucket.id}
            data-testid={`kit-bucket-${bucket.id}`}
            onClick={() => tapBucket(bucket.id)}
            onKeyDown={(event) => {
              if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) tapBucket(bucket.id);
            }}
          >
            <KitCard item={bucket} shape="chip" still className="kx-bucket-head" />
            <div className="kx-bucket-drop">
              {cards.filter((card) => placed[card.id] === bucket.id).map((card) => (
                <KitCard
                  key={card.id}
                  item={card}
                  shape="chip"
                  lines={2}
                  className="kx-chip"
                  data-flip={`c-${card.id}`}
                  data-testid={`kit-placed-${card.id}`}
                  disabled={disabled}
                  onPointerDown={(event) => start(event, card.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    tapChip(card.id, bucket.id);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* The tray closes up as it empties, so the line may go too: room for a full group. */}
      {!allPlaced && <p className="kx-help">{TOUR.kit.sortHelp}</p>}
      <div className={`kx-sort-tray ${hint ? "is-hint" : ""} ${waiting.length === 0 ? "is-empty" : ""}`} data-drop={TRAY}>
        {waiting.map((card) => (
          <KitCard
            key={card.id}
            item={card}
            shape="chip"
            lines={2}
            className={`kx-sort-card ${held === card.id ? "is-selected" : ""}`}
            data-flip={`c-${card.id}`}
            data-testid={`kit-card-${card.id}`}
            disabled={disabled}
            aria-pressed={held === card.id}
            onPointerDown={(event) => start(event, card.id)}
            onClick={() => tapCard(card.id)}
          />
        ))}
      </div>
    </div>
  );
}
