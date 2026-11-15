// kit-order — put the cards in order. Tap a card: it flies into the next free
// numbered spot; tap a placed card: it goes back. A placed card can also be
// dragged onto another spot (they swap) and a tray card onto any spot — but
// tapping alone is always enough. Draft = orderAnswer(ids) once every spot is full.
// Clock cards and picture-only cards use a STRIP: the numbered spots side by
// side, the cards as tiles below, so 5 clocks fit a phone without scrolling.
import { useRef, useState } from "react";
import { orderAnswer } from "../../../engine/kit/answers";
import type { KitOrderPayload } from "../../../engine/kit/types";
import { TOUR } from "../../../strings/tour";
import { tourSound, useDraft, type WidgetProps } from "../exercises/shared";
import { stripOf } from "./art";
import { KitCard } from "./KitCard";
import { useFlip, useKitDrag } from "./motion";

const TRAY = "tray";

/** Move card `id` to `target` ("tray" or a slot index); a slot's occupant swaps or returns. */
function moveCard(slots: (string | null)[], id: string, target: string): (string | null)[] {
  const next = [...slots];
  const from = next.indexOf(id);
  if (target === TRAY) {
    if (from >= 0) next[from] = null;
    return next;
  }
  const to = Number(target);
  if (!Number.isInteger(to) || to < 0 || to >= next.length || to === from) return slots;
  const occupant = next[to];
  next[to] = id;
  if (from >= 0) next[from] = occupant; // swap (or move into an empty spot)
  return next;
}

export function KitOrder({ payload, disabled, onDraft }: WidgetProps<KitOrderPayload>) {
  const { cards } = payload;
  const [slots, setSlots] = useState<(string | null)[]>(() => cards.map(() => null));
  const root = useRef<HTMLDivElement>(null);
  const capture = useFlip(root);
  const full = slots.every((id) => id !== null);
  useDraft(onDraft, full ? orderAnswer(slots as string[]) : null);
  const byId = new Map(cards.map((card) => [card.id, card]));
  const nextFree = slots.indexOf(null);
  const strip = stripOf(cards);
  const shape = strip ? "tile" : "chip";

  const update = (next: (string | null)[], sound: "place" | "pop") => {
    if (next === slots) return;
    capture();
    tourSound[sound]();
    setSlots(next);
  };
  const { start, wasDrag } = useKitDrag((id, target) => {
    if (!disabled) update(moveCard(slots, id, target), target === TRAY ? "pop" : "place");
  }, !disabled);

  const tapTray = (id: string) => {
    if (wasDrag() || disabled || nextFree < 0) return;
    update(moveCard(slots, id, String(nextFree)), "place");
  };
  const tapPlaced = (id: string) => {
    if (wasDrag() || disabled) return;
    update(moveCard(slots, id, TRAY), "pop");
  };

  return (
    <div className={`tx kx kx-order ${cards.length >= 5 ? "is-long" : ""} ${strip ? "is-strip" : ""}`} ref={root}>
      <ol className="kx-slots" style={{ "--n": cards.length } as React.CSSProperties}>
        {slots.map((id, n) => {
          const card = id ? byId.get(id) : undefined;
          return (
            <li
              key={n}
              className={`kx-slot ${card ? "is-full" : ""} ${n === nextFree ? "is-next" : ""}`}
              data-drop={n}
              data-testid={`kit-slot-${n}`}
              aria-label={TOUR.kit.slot(n + 1)}
            >
              <span className="kx-slot-num" aria-hidden="true">{n + 1}</span>
              <span className="kx-slot-well">
                {card && (
                  <KitCard
                    item={card}
                    shape={shape}
                    lines={2}
                    className="kx-placed"
                    data-flip={`c-${card.id}`}
                    data-testid={`kit-placed-${card.id}`}
                    disabled={disabled}
                    onPointerDown={(event) => start(event, card.id)}
                    onClick={() => tapPlaced(card.id)}
                  />
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p className={`kx-help ${full ? "is-hidden" : ""}`}>{TOUR.kit.orderHelp}</p>
      <div className="kx-tray" data-drop={TRAY} style={{ "--per-row": cards.length === 4 ? 2 : 3 } as React.CSSProperties}>
        {cards.map((card) => {
          const gone = slots.includes(card.id);
          return (
            <KitCard
              key={card.id}
              item={card}
              shape={shape}
              lines={2}
              className={`kx-tray-card ${gone ? "is-placed" : ""}`}
              data-flip={gone ? undefined : `c-${card.id}`}
              data-testid={`kit-card-${card.id}`}
              disabled={disabled || gone}
              aria-hidden={gone}
              onPointerDown={(event) => start(event, card.id)}
              onClick={() => tapTray(card.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
