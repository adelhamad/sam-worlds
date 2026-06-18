// Star Ranger — desktop keyboard support: WASD / arrows to move, Space to
// jump, J / Enter to zap. Touch players use the on-screen Controls instead.
import { useEffect, useRef } from "react";

interface Handlers {
  move: (x: number, y: number) => void;
  jump: () => void;
  fire: () => void;
}

const MOVE = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);

export function useKeyboard(active: boolean, handlers: Handlers): void {
  const ref = useRef(handlers);
  useEffect(() => { ref.current = handlers; });

  useEffect(() => {
    if (!active) return;
    const keys = new Set<string>();
    const apply = () => {
      const x = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
      const y = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
      ref.current.move(x, y);
    };
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === " ") { e.preventDefault(); ref.current.jump(); return; }
      if (k === "j" || k === "enter") { ref.current.fire(); return; }
      if (MOVE.has(k) && !keys.has(k)) { keys.add(k); apply(); e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keys.delete(k)) apply();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      ref.current.move(0, 0);
    };
  }, [active]);
}
