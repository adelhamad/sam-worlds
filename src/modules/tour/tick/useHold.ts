// Press-and-hold repeat for the − / + buttons: one step on press, then after a
// short pause it repeats, a little faster the longer the finger stays down.
// The click that follows a press is swallowed (no double step); a click with
// no press before it (keyboard, `el.click()`) steps once.
import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const FIRST_DELAY = 420;
const REPEAT = 150;
const FASTEST = 70;

export interface HoldHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onClick: () => void;
  onContextMenu: (event: { preventDefault: () => void }) => void;
}

export function useHold(action: () => void, enabled: boolean): HoldHandlers {
  const act = useRef(action);
  useEffect(() => {
    act.current = action;
  });
  const timer = useRef<number | null>(null);
  const pressed = useRef(false);
  const clear = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => clear, [clear]);
  useEffect(() => {
    if (!enabled) clear();
  }, [enabled, clear]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!enabled || (event.pointerType === "mouse" && event.button !== 0)) return;
    pressed.current = true;
    act.current();
    clear();
    let wait = REPEAT;
    const again = () => {
      act.current();
      wait = Math.max(FASTEST, wait * 0.88);
      timer.current = window.setTimeout(again, wait);
    };
    timer.current = window.setTimeout(again, FIRST_DELAY);
  };
  const release = () => clear();
  const leave = () => {
    clear();
    pressed.current = false;
  };
  const onClick = () => {
    if (pressed.current) {
      pressed.current = false;
      return;
    }
    if (enabled) act.current();
  };
  return {
    onPointerDown,
    onPointerUp: release,
    onPointerLeave: leave,
    onPointerCancel: leave,
    onClick,
    onContextMenu: (event) => event.preventDefault(),
  };
}
