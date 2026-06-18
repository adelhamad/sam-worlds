// Star Ranger — touch controls overlay: a virtual thumb-stick (move) plus big
// JUMP and ZAP buttons. Touch-first (≥64px targets); pointer events also work
// with a mouse. Purely presentational — it just calls the callbacks.
import { useRef, useState } from "react";

interface Props {
  onMove: (x: number, y: number) => void;
  onJump: () => void;
  onFire: () => void;
  fireReady: boolean;
}

const STICK_R = 62;

export function Controls({ onMove, onJump, onFire, fireReady }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function place(e: React.PointerEvent) {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    if (len > STICK_R) { dx = (dx / len) * STICK_R; dy = (dy / len) * STICK_R; }
    setKnob({ x: dx, y: dy });
    onMove(dx / STICK_R, -dy / STICK_R);
  }

  function startStick(e: React.PointerEvent) {
    e.stopPropagation();
    activeId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    place(e);
  }

  function moveStick(e: React.PointerEvent) {
    if (activeId.current !== e.pointerId) return;
    place(e);
  }

  function endStick(e: React.PointerEvent) {
    if (activeId.current !== e.pointerId) return;
    activeId.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  }

  return (
    <div className="ranger-controls">
      <div
        ref={baseRef}
        className="ranger-stick"
        onPointerDown={startStick}
        onPointerMove={moveStick}
        onPointerUp={endStick}
        onPointerCancel={endStick}
      >
        <div className="ranger-stick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>

      <div className="ranger-buttons">
        <button
          className="ranger-btn ranger-jump"
          onPointerDown={(e) => { e.stopPropagation(); onJump(); }}
        >
          ⤴<small>JUMP</small>
        </button>
        <button
          className={`ranger-btn ranger-zap ${fireReady ? "ranger-zap-ready" : ""}`}
          onPointerDown={(e) => { e.stopPropagation(); onFire(); }}
        >
          ⚡<small>ZAP</small>
        </button>
      </div>
    </div>
  );
}
