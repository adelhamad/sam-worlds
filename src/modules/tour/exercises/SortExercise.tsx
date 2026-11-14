// sort — put each country card in its continent. Tap a card then a bucket (or
// drag it there). Draft = sortAnswer(buckets, placed) once every card is placed.
import { useState } from "react";
import { sortAnswer } from "../../../engine/tour/answers";
import { countryName } from "../../../engine/tour/countries";
import type { SortPayload } from "../../../engine/tour/types";
import { TOUR } from "../../../strings/tour";
import { Flag } from "../../../ui/tour/Flag";
import { ContinentIcon } from "./Outline";
import { tourSound, useDraft, useTimers, type WidgetProps } from "./shared";
import { useCardDrag } from "./useCardDrag";

export function SortExercise({ payload, disabled, onDraft }: WidgetProps<SortPayload>) {
  const { buckets, cards } = payload;
  /** card code → bucket name */
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [held, setHeld] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const later = useTimers();
  const allPlaced = cards.every((code) => placed[code]);
  useDraft(onDraft, allPlaced ? sortAnswer(buckets, placed) : null);

  const put = (code: string, bucket: string) => {
    if (disabled) return;
    tourSound.place();
    setPlaced((now) => ({ ...now, [code]: bucket }));
    setHeld(null);
  };
  const { start, wasDrag } = useCardDrag(put, !disabled);

  const tapCard = (code: string) => {
    if (wasDrag() || disabled) return;
    tourSound.pop();
    setHeld(held === code ? null : code);
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
  const takeBack = (code: string) => {
    if (disabled) return;
    tourSound.pop();
    setPlaced((now) => {
      const next = { ...now };
      delete next[code];
      return next;
    });
  };

  return (
    <div className={`tx tx-sort ${held ? "is-holding" : ""}`}>
      <div className={`tx-sort-buckets ${buckets.length >= 3 ? "is-narrow" : ""}`} style={{ "--cols": buckets.length } as React.CSSProperties}>
        {buckets.map((bucket) => (
          <div
            key={bucket}
            className="tx-sort-bucket"
            role="button"
            tabIndex={disabled ? -1 : 0}
            data-bucket={bucket}
            data-testid={`sort-bucket-${bucket}`}
            onClick={() => tapBucket(bucket)}
            onKeyDown={(event) => {
              if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) tapBucket(bucket);
            }}
          >
            <div className="tx-sort-label">
              <ContinentIcon continent={bucket} size={34} />
              <span>{bucket}</span>
            </div>
            <div className="tx-sort-drop">
              {cards.filter((code) => placed[code] === bucket).map((code) => (
                <button
                  key={code}
                  type="button"
                  className="ttile tx-sort-chip"
                  disabled={disabled}
                  data-testid={`sort-placed-${code}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    // With a card in hand the whole bucket is a drop zone, chips included.
                    if (held) put(held, bucket);
                    else takeBack(code);
                  }}
                >
                  <Flag code={code} size={26} />
                  <span>{countryName(code)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className={`tx-help ${allPlaced ? "is-hidden" : ""}`}>{TOUR.exercise.sortHelp}</p>
      <div className={`tx-sort-tray ${hint ? "is-hint" : ""}`}>
        {cards.map((code) => {
          const gone = Boolean(placed[code]);
          return (
            <button
              key={code}
              type="button"
              className={`ttile tx-sort-card ${gone ? "is-placed" : ""} ${held === code ? "is-selected" : ""}`}
              disabled={disabled || gone}
              aria-hidden={gone}
              aria-pressed={held === code}
              data-testid={`sort-card-${code}`}
              onPointerDown={(event) => start(event, code)}
              onClick={() => tapCard(code)}
            >
              <Flag code={code} size={30} />
              <span>{countryName(code)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
