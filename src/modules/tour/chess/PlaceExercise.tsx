// chess-place — put the tray pieces on their home squares of White's back
// row. Carry a piece from the tray to a free square (and back, or on to another
// square), or tap a tray piece then a square; tap a piece you placed to send it
// back. Draft = placeAnswer(row) once the tray is empty.
import { useRef, useState } from "react";
import { placeAnswer } from "../../../engine/chess/judge";
import type { PlacePayload } from "../../../engine/chess/types";
import { CHESS } from "../../../strings/chess";
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import { usePieceDrag } from "../../../ui/chess/usePieceDrag";
import { useDraft, useTimers, type WidgetProps } from "../exercises/shared";
import { chessSound } from "./chessSound";
import { HomeRow } from "./HomeRow";

const S = CHESS.exercise;

export function PlaceExercise({ payload, disabled, onDraft }: WidgetProps<PlacePayload>) {
  const { row: start, tray } = payload;
  /** Square index → index of the tray piece the child put there. */
  const [placed, setPlaced] = useState<Array<number | null>>(() => start.map(() => null));
  const [held, setHeld] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const later = useTimers();

  const waiting = tray.map((_, i) => i).filter((i) => !placed.includes(i));
  const row = start.map((type, i) => {
    const mine = placed[i];
    return type ?? (mine === null ? null : tray[mine]);
  });
  useDraft(onDraft, waiting.length === 0 ? placeAnswer(row) : null);

  // When every piece left in the tray is the same kind there is nothing to
  // choose: the next one is already "in hand".
  const sameKind = waiting.length > 0 && waiting.every((i) => tray[i] === tray[waiting[0]]);
  const picked = held !== null && waiting.includes(held) ? held : null;
  const inHand = picked ?? (sameKind ? waiting[0] : null);

  // Drag and drop: ids are "tray-<i>" / "home-<square>", targets `data-drop`.
  const root = useRef<HTMLDivElement>(null);
  const carry = (id: string, dest: string) => {
    const [from, at] = id.split("-");
    const piece = from === "tray" ? Number(at) : placed[Number(at)];
    const to = dest === "tray" ? -1 : Number(dest.split("-")[1]);
    if (piece === null) return;
    chessSound.place();
    setPlaced(placed.map((mine, i) => {
      if (i === to) return piece;
      return mine === piece ? null : mine; // it left where it was
    }));
    setHeld(null);
  };
  const drag = usePieceDrag<string>({
    enabled: !disabled,
    target: "data-drop",
    // a free home square — or, for a piece already on the row, the tray
    accepts: (el, id) => Boolean(root.current?.contains(el))
      && (el.getAttribute("data-drop") === "tray" ? id.startsWith("home") : el.hasAttribute("data-free")),
    onDrop: (id, el) => carry(id, el.getAttribute("data-drop") ?? ""),
  });
  const pressSquare = (event: React.PointerEvent<HTMLButtonElement>, index: number) => {
    if (placed[index] !== null) drag.start(event, `home-${index}`, event.currentTarget.querySelector<HTMLElement>(".cx-home-piece"));
  };

  const tapTray = (index: number) => {
    if (disabled || drag.clickHandled(`tray-${index}`, "drag")) return;
    chessSound.pick();
    setHeld(picked === index ? null : index);
  };

  const tapSquare = (index: number) => {
    if (disabled || start[index] !== null || drag.clickHandled(`home-${index}`, "drag")) return;
    if (placed[index] !== null) {
      chessSound.pick();
      setPlaced(placed.map((mine, i) => (i === index ? null : mine)));
      return;
    }
    if (inHand === null) {
      // Nothing in hand yet: wiggle the tray to show where to start.
      setHint(true);
      later(() => setHint(false), 500);
      return;
    }
    chessSound.place();
    setPlaced(placed.map((mine, i) => (i === index ? inHand : mine)));
    setHeld(null);
  };

  return (
    <div className="cx cx-place" data-testid="chess-place" ref={root}>
      <p className="cx-help">{waiting.length === 0 ? S.placeBack : S.placeHelp}</p>
      <HomeRow row={row} fixed={start.map((type) => type !== null)} ready={inHand !== null} onSquare={tapSquare} onPress={pressSquare} disabled={disabled} />
      <div className={`cx-tray ${hint ? "is-hint" : ""}`} data-drop="tray">
        {tray.map((type, i) => {
          const gone = !waiting.includes(i);
          return (
            <button
              key={i} type="button" className={`ttile cx-tray-piece ${gone ? "is-placed" : ""} ${inHand === i ? "is-selected" : ""}`}
              disabled={disabled || gone} aria-hidden={gone} aria-pressed={inHand === i}
              aria-label={S.trayPiece(CHESS.piece[type])} data-testid={`tray-${i}`}
              onPointerDown={(event) => drag.start(event, `tray-${i}`, event.currentTarget)} onClick={() => tapTray(i)}
            >
              <ChessPiece type={type} fit />
            </button>
          );
        })}
      </div>
    </div>
  );
}
