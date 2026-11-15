// The opening demo of a Code Lab lesson, shown before the first question:
// teach by showing. Pogo says the idea, a small grid + program play on a loop
// with the active block lighting up, two short lines explain, and a big button
// skips ahead at once. In "sequence" the child can steer Pogo with arrows.
import type { CSSProperties } from "react";
import { CODE_INTROS } from "../../../content/code/intros";
import type { CodeIntroKey } from "../../../engine/code/types";
import { CODE } from "../../../strings/code";
import { PogoSay } from "../../../ui/tour/Pogo";
import { useCompact } from "../lesson/useCompact";
import { BlockPalette } from "./BlockPalette";
import { CodeGridView } from "./CodeGridView";
import { ProgramTrack, type ArrowMark } from "./ProgramTrack";
import { useMeetDemo } from "./useMeetDemo";
import { activeRef, starsLeft } from "./useRun";
import "../../../ui/tour/tour-base.css";
import "./codeWidgets.css";
import "./codeMeet.css";

const M = CODE.meet;

export interface CodeMeetProps {
  /** What to demonstrate (CodeParams.intro). */
  intro: CodeIntroKey;
  /** Called when the child taps the start button. */
  onStart: () => void;
}

export function CodeMeet({ intro, onStart }: CodeMeetProps) {
  const data = CODE_INTROS[intro] ?? CODE_INTROS.sequence;
  const compact = useCompact();
  const demo = useMeetDemo(data);
  const marks: Record<string, ArrowMark> | undefined = demo.turned && data.bug ? { [data.bug.key]: "fixed" } : undefined;
  const shuffle = demo.turned && data.bug ? { key: data.bug.key, n: 1 } : null;

  return (
    <div className={`tl-meet cd is-${intro}`} data-testid="code-meet" data-intro={intro}>
      <PogoSay mood={demo.won ? "happy" : "wave"} replayKey={demo.won ? demo.pogo.hop : 0} size={compact ? 84 : 116} text={data.title} />
      <div className="cd-stage">
        <CodeGridView
          grid={data.grid} pogo={demo.pogo} ghost={demo.ghost} pin={demo.pin} won={demo.won}
          stars={demo.toying ? data.grid.stars : starsLeft(data.grid, demo.run)}
          className="cd-grid"
        />
        <ProgramTrack
          program={demo.program} mode="read" active={demo.toying ? null : activeRef(demo.run)} marks={marks} shuffle={shuffle}
          className="cd-track"
        />
        {data.toy && (
          <>
            <p className={`cd-try ${demo.toying ? "is-done" : ""}`}>
              <span className="cd-try-dot" aria-hidden="true" />
              {M.tryIt}
            </p>
            <BlockPalette loops={[]} onArrow={demo.tap} onLoop={() => undefined} />
          </>
        )}
      </div>
      <ul className="cd-lines">
        {data.lines.map((line, i) => (
          <li key={line} style={{ "--i": i } as CSSProperties}>{line}</li>
        ))}
      </ul>
      <button type="button" className="tbtn tbtn-go tbtn-wide cd-start" onClick={onStart} data-testid="code-meet-start">
        {M.letsGo}
      </button>
    </div>
  );
}
