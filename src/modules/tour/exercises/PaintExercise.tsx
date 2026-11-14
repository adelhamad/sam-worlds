// paint — choose a paint pot, tap the flag's bands. Draft = paintAnswer(colors)
// once every band has paint on it.
import { useState } from "react";
import { paintAnswer } from "../../../engine/tour/answers";
import { PAINT_COLOR_BY_ID } from "../../../engine/tour/paintFlags";
import type { PaintPayload } from "../../../engine/tour/types";
import { TOUR } from "../../../strings/tour";
import { Flag } from "../../../ui/tour/Flag";
import { FlagBands, type Splash } from "./FlagBands";
import { tourSound, useDraft, useTimers, type WidgetProps } from "./shared";

interface Canvas {
  colors: (string | null)[];
  previous: (string | null)[];
  splashes: (Splash | null)[];
  strokes: number;
}

export function PaintExercise({ payload, disabled, onDraft }: WidgetProps<PaintPayload>) {
  const bands = payload.weights.length;
  const [pot, setPot] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<Canvas>(() => ({
    colors: Array<string | null>(bands).fill(null),
    previous: Array<string | null>(bands).fill(null),
    splashes: Array<Splash | null>(bands).fill(null),
    strokes: 0,
  }));
  const [hint, setHint] = useState(false);
  const later = useTimers();
  const done = canvas.colors.every(Boolean);
  useDraft(onDraft, done ? paintAnswer(canvas.colors as string[]) : null);

  const paint = (index: number, x: number, y: number) => {
    if (disabled) return;
    if (!pot) {
      // No paint on the brush yet: wiggle the pots.
      setHint(true);
      later(() => setHint(false), 500);
      return;
    }
    if (canvas.colors[index] === pot) return;
    tourSound.place();
    setCanvas((now) => {
      const strokes = now.strokes + 1;
      const swap = <T,>(list: T[], value: T) => list.map((item, i) => (i === index ? value : item));
      return {
        colors: swap(now.colors, pot),
        previous: swap(now.previous, now.colors[index]),
        splashes: swap(now.splashes, { x, y, n: strokes }),
        strokes,
      };
    });
  };

  return (
    <div className="tx tx-paint">
      {payload.peek && (
        <div className="tx-paint-peek">
          <Flag code={payload.code} size={44} />
          <span>{TOUR.exercise.copyIt}</span>
        </div>
      )}
      <FlagBands
        dir={payload.dir}
        weights={payload.weights}
        colors={canvas.colors}
        previous={canvas.previous}
        splashes={canvas.splashes}
        disabled={disabled}
        bandLabel={TOUR.exercise.paintBand}
        onBand={paint}
        className={pot ? "has-paint" : ""}
      />
      <p className={`tx-help ${canvas.strokes > 0 ? "is-hidden" : ""}`}>{TOUR.exercise.paintHelp}</p>
      <div
        className={`tx-paint-pots ${hint ? "is-hint" : ""}`}
        style={{ "--cols": payload.palette.length <= 6 ? payload.palette.length : Math.ceil(payload.palette.length / 2) } as React.CSSProperties}
      >
        {payload.palette.map((id) => {
          const color = PAINT_COLOR_BY_ID.get(id);
          if (!color) return null;
          return (
            <button
              key={id}
              type="button"
              className={`tx-pot ${pot === id ? "is-selected" : ""}`}
              style={{ "--paint": color.hex } as React.CSSProperties}
              aria-label={TOUR.exercise.paintPot(color.name)}
              aria-pressed={pot === id}
              disabled={disabled}
              data-testid={`paint-pot-${id}`}
              onClick={() => {
                tourSound.pop();
                setPot(id);
              }}
            >
              <span className="tx-pot-paint" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
