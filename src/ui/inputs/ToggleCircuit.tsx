import { useState } from "react";
import { evalNode, type Node } from "../../engine/generators/logicCircuit";
import type { Question } from "../../engine/generators/types";
import { sfx } from "../../engine/feedback/audio";

interface Props {
  question: Question;
  disabled: boolean;
  onSubmit: (value: string) => void;
}

function GateView({ node }: { node: Node }) {
  if ("in" in node) return <span className="gate-input">{node.in}</span>;
  return (
    <span className={`gate gate-${node.op.toLowerCase()}`}>
      <span className="gate-label">{node.op}</span>
      <span className="gate-kids">
        {node.kids.map((k, i) => (
          <GateView key={i} node={k} />
        ))}
      </span>
    </span>
  );
}

/**
 * Normal stages have NO live lamp preview — Sam must PREDICT the output,
 * then press POWER; a wrong prediction regenerates the circuit (rule 1).
 * Tutorial stages set payload.preview so the lamp reacts live while he learns.
 */
export function ToggleCircuit({ question, disabled, onSubmit }: Props) {
  const payload = question.payload ?? {};
  const tree = payload.tree as Node;
  const inputs = (payload.inputs as string[]) ?? ["A", "B"];
  const preview = Boolean(payload.preview);
  const [bits, setBits] = useState<Record<string, boolean>>(
    Object.fromEntries(inputs.map((n) => [n, false])),
  );

  const liveOut = preview && evalNode(tree, bits);

  function power() {
    const out = evalNode(tree, bits);
    onSubmit(out ? "1" : "0");
  }

  return (
    <div className="circuit-input">
      <div className="circuit-diagram">
        <GateView node={tree} />
        <span className="circuit-arrow">→</span>
        <span className={`circuit-lamp ${liveOut ? "lamp-on" : ""}`}>💡</span>
      </div>
      <div className="switch-row">
        {inputs.map((n) => (
          <button
            key={n}
            className={`btn switch ${bits[n] ? "switch-on" : ""}`}
            disabled={disabled}
            onClick={() => {
              sfx.tap();
              setBits((b) => ({ ...b, [n]: !b[n] }));
            }}
          >
            {n}: {bits[n] ? "ON" : "OFF"}
          </button>
        ))}
      </div>
      <div className="input-actions">
        <button className="btn btn-primary" disabled={disabled} onClick={power}>
          ⚡ POWER
        </button>
      </div>
    </div>
  );
}
