import { useState } from "react";
import type { Question } from "../../engine/generators/types";
import { sfx } from "../../engine/feedback/audio";

interface Props {
  question: Question;
  disabled: boolean;
  onSubmit: (value: string) => void;
}

export function ClockSet({ question, disabled, onSubmit }: Props) {
  const step = (question.payload?.step as number) ?? 5;
  const [h, setH] = useState(12);
  const [m, setM] = useState(0);

  const minuteAngle = m * 6;
  const hourAngle = (h % 12) * 30 + m * 0.5;

  function bump(setter: (fn: (v: number) => number) => void, delta: number, mod: number, min = 0) {
    sfx.tap();
    setter((v) => {
      let next = (v - min + delta) % mod;
      if (next < 0) next += mod;
      return next + min;
    });
  }

  return (
    <div className="clock-input">
      <svg viewBox="0 0 100 100" className="clock-face">
        <circle cx="50" cy="50" r="46" fill="#0b1b3a" stroke="#ffb454" strokeWidth="3" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = ((i + 1) * 30 * Math.PI) / 180;
          return (
            <text key={i} x={50 + 38 * Math.sin(a)} y={54 - 38 * Math.cos(a)} textAnchor="middle" fontSize="9" fill="#eaf0ff" fontWeight="700">
              {i + 1}
            </text>
          );
        })}
        <line x1="50" y1="50" x2={50 + 20 * Math.sin((hourAngle * Math.PI) / 180)} y2={50 - 20 * Math.cos((hourAngle * Math.PI) / 180)} stroke="#ffb454" strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50 + 31 * Math.sin((minuteAngle * Math.PI) / 180)} y2={50 - 31 * Math.cos((minuteAngle * Math.PI) / 180)} stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="50" r="2.5" fill="#eaf0ff" />
      </svg>
      <div className="clock-controls">
        <div className="clock-ctl">
          <span className="ctl-label">hour</span>
          <button className="btn btn-secondary" disabled={disabled} onClick={() => bump(setH, -1, 12, 1)}>−</button>
          <button className="btn btn-secondary" disabled={disabled} onClick={() => bump(setH, 1, 12, 1)}>+</button>
        </div>
        <div className="clock-ctl">
          <span className="ctl-label">minutes</span>
          <button className="btn btn-secondary" disabled={disabled} onClick={() => bump(setM, -step, 60)}>−</button>
          <button className="btn btn-secondary" disabled={disabled} onClick={() => bump(setM, step, 60)}>+</button>
        </div>
        <button className="btn btn-primary" disabled={disabled} onClick={() => onSubmit(`${h}:${String(m).padStart(2, "0")}`)}>
          OK
        </button>
      </div>
    </div>
  );
}
