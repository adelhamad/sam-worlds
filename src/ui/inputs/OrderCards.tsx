import { useState } from "react";
import type { Question } from "../../engine/generators/types";
import { sfx } from "../../engine/feedback/audio";

interface Props {
  question: Question;
  disabled: boolean;
  onSubmit: (value: string) => void;
}

export function OrderCards({ question, disabled, onSubmit }: Props) {
  const items = (question.payload?.items as string[]) ?? [];
  const arrow = (question.payload?.arrow as string) ?? "→";
  const [picked, setPicked] = useState<number[]>([]);

  return (
    <div className="order-input">
      <div className="order-sequence">
        {picked.length ? picked.map((i) => items[i]).join(` ${arrow} `) : "Tap the cards in order…"}
      </div>
      <div className="order-cards">
        {items.map((item, i) => (
          <button
            key={i}
            className="btn order-card"
            disabled={disabled || picked.includes(i)}
            onClick={() => {
              sfx.tap();
              setPicked((p) => [...p, i]);
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="input-actions">
        <button className="btn btn-secondary" disabled={disabled || !picked.length} onClick={() => setPicked((p) => p.slice(0, -1))}>
          ⌫
        </button>
        <button
          className="btn btn-primary"
          disabled={disabled || picked.length !== items.length}
          onClick={() => {
            onSubmit(picked.map((i) => items[i]).join(` ${arrow} `));
            setPicked([]);
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
