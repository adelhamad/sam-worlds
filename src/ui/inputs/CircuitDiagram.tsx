import type { Node } from "../../engine/generators/logicCircuit";

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

/** Circuit picture: gates feeding a lamp that is lit, dark, or a mystery. */
export function CircuitDiagram({ tree, lamp }: { tree: Node; lamp: "on" | "off" | "unknown" }) {
  return (
    <div className="circuit-diagram">
      <GateView node={tree} />
      <span className="circuit-arrow">→</span>
      <span className={`circuit-lamp ${lamp === "on" ? "lamp-on" : ""}`}>{lamp === "unknown" ? "❓" : "💡"}</span>
    </div>
  );
}
