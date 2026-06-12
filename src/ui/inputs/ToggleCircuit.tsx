import { useState } from "react";
import { evalNode, type Node } from "../../engine/generators/logicCircuit";
import type { Question } from "../../engine/generators/types";
import { sfx } from "../../engine/feedback/audio";
import { CircuitDiagram } from "./CircuitDiagram";

interface Props {
  question: Question;
  disabled: boolean;
  onSubmit: (value: string) => void;
}

/**
 * Normal stages have NO live lamp preview — Sam must PREDICT the output,
 * then press POWER; a wrong prediction regenerates the circuit (rule 1).
 * Tutorial stages set payload.preview so the lamp reacts live while he learns.
 * payload.start presets switches (e.g. "the lamp starts lit — turn it off"),
 * payload.locked marks stuck switches that cannot be flipped.
 */
export function ToggleCircuit({ question, disabled, onSubmit }: Props) {
  const payload = question.payload ?? {};
  const tree = payload.tree as Node;
  const inputs = (payload.inputs as string[]) ?? ["A", "B"];
  const preview = Boolean(payload.preview);
  const start = (payload.start as Record<string, boolean>) ?? {};
  const locked = (payload.locked as Record<string, boolean>) ?? {};
  const [bits, setBits] = useState<Record<string, boolean>>(
    Object.fromEntries(inputs.map((n) => [n, locked[n] ?? start[n] ?? false])),
  );

  const liveOut = preview && evalNode(tree, bits);

  function power() {
    const out = evalNode(tree, bits);
    onSubmit(out ? "1" : "0");
  }

  return (
    <div className="circuit-input">
      <CircuitDiagram tree={tree} lamp={liveOut ? "on" : "off"} />
      <div className="switch-row">
        {inputs.map((n) => {
          const stuck = n in locked;
          return (
            <button
              key={n}
              className={`btn switch ${bits[n] ? "switch-on" : ""} ${stuck ? "switch-locked" : ""}`}
              disabled={disabled || stuck}
              onClick={() => {
                sfx.tap();
                setBits((b) => ({ ...b, [n]: !b[n] }));
              }}
            >
              {stuck && "🔒 "}
              {n}: {bits[n] ? "ON" : "OFF"}
            </button>
          );
        })}
      </div>
      <div className="input-actions">
        <button className="btn btn-primary" disabled={disabled} onClick={power}>
          ⚡ POWER
        </button>
      </div>
    </div>
  );
}
