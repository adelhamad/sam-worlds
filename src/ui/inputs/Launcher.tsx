import { useRef, useState } from "react";
import type { Question } from "../../engine/generators/types";
import { rangeForAngle } from "../../engine/generators/builder";
import { sfx } from "../../engine/feedback/audio";

interface Props {
  question: Question;
  disabled: boolean;
  onSubmit: (value: string) => void;
}

export function Launcher({ question, disabled, onSubmit }: Props) {
  const target = (question.payload?.target as number) ?? 70;
  const tolerance = (question.payload?.tolerance as number) ?? 8;
  const [angle, setAngle] = useState(45);
  const [ball, setBall] = useState<{ x: number; y: number } | null>(null);
  const raf = useRef(0);

  function fire() {
    sfx.tap();
    const range = rangeForAngle(angle);
    const apex = 8 + 40 * Math.sin((angle * Math.PI) / 180) ** 2;
    const start = performance.now();
    const dur = 800;
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setBall({ x: 6 + (range * 0.88 * t), y: 52 - apex * 4 * t * (1 - t) });
      if (t < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        setBall(null);
        onSubmit(Math.abs(range - target) <= tolerance ? "hit" : "miss");
      }
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(animate);
  }

  const barrelA = (angle * Math.PI) / 180;

  return (
    <div className="launcher-input">
      <svg viewBox="0 0 100 56" className="launch-scene">
        <rect x="0" y="52" width="100" height="4" fill="#24407a" />
        {/* target zone */}
        <rect x={6 + target * 0.88 - tolerance * 0.88} y="49" width={tolerance * 1.76} height="3" fill="#22d3ee" opacity="0.35" />
        <text x={6 + target * 0.88} y="47" textAnchor="middle" fontSize="6">🎯</text>
        {/* cannon */}
        <line x1="6" y1="52" x2={6 + 9 * Math.cos(barrelA)} y2={52 - 9 * Math.sin(barrelA)} stroke="#9fb0d8" strokeWidth="3" strokeLinecap="round" />
        <text x="4" y="55" fontSize="6">🧨</text>
        {ball && <circle cx={ball.x} cy={ball.y} r="1.8" fill="#ffb454" />}
      </svg>
      <div className="input-actions">
        <span className="angle-readout">{angle}°</span>
        <button className="btn btn-secondary" disabled={disabled || angle <= 15} onClick={() => { sfx.tap(); setAngle((a) => a - 5); }}>
          −5°
        </button>
        <button className="btn btn-secondary" disabled={disabled || angle >= 75} onClick={() => { sfx.tap(); setAngle((a) => a + 5); }}>
          +5°
        </button>
        <button className="btn btn-primary" disabled={disabled || ball !== null} onClick={fire}>
          💥 FIRE
        </button>
      </div>
    </div>
  );
}
