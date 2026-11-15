// code-trace — read the program and tap the square where Pogo will stop. No
// animation before the answer: the point is to run it in your head. A pin and
// a ghost Pogo mark the pick; the draft is String(square) (traceAnswer form),
// submitted by the shell's CHECK.
import { useState } from "react";
import type { TracePayload } from "../../../engine/code/types";
import { CODE } from "../../../strings/code";
import { useDraft, type WidgetProps } from "../exercises/shared";
import { HelpBar } from "./CodeBits";
import { CodeGridView } from "./CodeGridView";
import { codeSound } from "./codeSound";
import { ProgramTrack } from "./ProgramTrack";
import "./codeWidgets.css";

const S = CODE.exercise;

export function TraceExercise({ payload, disabled, onDraft }: WidgetProps<TracePayload>) {
  const { grid } = payload;
  const [pin, setPin] = useState<number | null>(null);
  useDraft(onDraft, pin === null ? null : String(pin));

  const tap = (sq: number) => {
    if (disabled || grid.walls.includes(sq)) return;
    codeSound.add();
    setPin(sq);
  };

  return (
    <div className="cw cw-trace" data-testid="code-trace-widget" data-phase="build">
      <ProgramTrack program={payload.program} mode="read" className="cw-read" />
      <HelpBar text={pin === null ? S.help.trace : S.help.traced} stars={0} got={0} />
      <CodeGridView
        grid={{ ...grid, goal: -1 }} pogo={{ at: grid.start, dir: null, hop: 0, bonk: false, mood: "idle" }}
        pin={pin} ghost={pin === null || pin === grid.start ? null : { at: pin, dir: null, hop: 0, bonk: false, mood: "idle" }}
        onSquare={tap} disabled={disabled}
      />
    </div>
  );
}
