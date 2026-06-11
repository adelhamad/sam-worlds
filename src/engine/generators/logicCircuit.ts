// Logic Circuits — redstone-style wiring: flip the switches so the lamp glows.
// The widget evaluates the circuit live; pressing POWER submits the output.
import { pick, randInt, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

export type GateOp = "AND" | "OR" | "XOR" | "NOT";
export type Node = { op: GateOp; kids: Node[] } | { in: string };

export interface LogicParams {
  ops: GateOp[];
  inputs: number; // 1..3
  depth: number; // 0 = plain wire (tutorial), 1..3 gates
  /** Tutorial mode: the widget shows the lamp reacting live. */
  preview?: boolean;
}

let qid = 0;

export function evalNode(node: Node, bits: Record<string, boolean>): boolean {
  if ("in" in node) return bits[node.in];
  const vals = node.kids.map((k) => evalNode(k, bits));
  switch (node.op) {
    case "AND":
      return vals.every(Boolean);
    case "OR":
      return vals.some(Boolean);
    case "XOR":
      return vals.filter(Boolean).length === 1;
    case "NOT":
      return !vals[0];
  }
}

function allAssignments(names: string[]): Record<string, boolean>[] {
  const out: Record<string, boolean>[] = [];
  for (let m = 0; m < 1 << names.length; m++) {
    const bits: Record<string, boolean> = {};
    names.forEach((n, i) => (bits[n] = Boolean(m & (1 << i))));
    out.push(bits);
  }
  return out;
}

function buildTree(ops: GateOp[], names: string[], depth: number, rng: RNG): Node {
  if (depth <= 0) return { in: pick(rng, names) };
  const op = pick(rng, ops);
  if (op === "NOT") return { op, kids: [buildTree(ops, names, depth - 1, rng)] };
  return {
    op,
    kids: [buildTree(ops, names, depth - 1, rng), buildTree(ops, names, depth - 1, rng)],
  };
}

export function generateLogicCircuit(params: LogicParams, rng: RNG, ctx: GenContext): Question {
  const inputCount = ctx.easier ? Math.min(2, params.inputs) : params.inputs;
  const names = ["A", "B", "C"].slice(0, Math.max(1, inputCount));
  const depth = ctx.easier ? Math.min(1, params.depth) : params.depth;

  // depth 0 tutorial: the lamp is wired straight to one switch
  if (depth === 0) {
    return {
      id: `lc${++qid}`,
      prompt: "The lamp is wired to switch A. Make it glow!",
      answer: "1",
      choices: [],
      hint: "Flip A and watch the lamp.",
      inputMode: "toggle",
      payload: { tree: { in: "A" }, inputs: ["A"], preview: true },
    };
  }

  for (let tries = 0; tries < 60; tries++) {
    const tree = buildTree(params.ops, names, depth, rng);
    const used = new Set<string>();
    collectInputs(tree, used);
    if (used.size < names.length) continue;
    const sats = allAssignments(names).filter((bits) => evalNode(tree, bits));
    // must be solvable but not trivial (some flips matter)
    if (sats.length === 0 || sats.length === 1 << names.length) continue;
    const example = sats[randInt(rng, 0, sats.length - 1)];
    const firstName = names[0];
    return {
      id: `lc${++qid}`,
      prompt: "Wire it like redstone — make the lamp glow!",
      answer: "1",
      choices: [],
      hint: `Try ${firstName} ${example[firstName] ? "ON" : "OFF"} first…`,
      inputMode: "toggle",
      payload: { tree, inputs: names, preview: Boolean(params.preview) },
    };
  }
  // safe fallback: A AND B
  return {
    id: `lc${++qid}`,
    prompt: "Wire it like redstone — make the lamp glow!",
    answer: "1",
    choices: [],
    hint: "Both switches ON.",
    inputMode: "toggle",
    payload: { tree: { op: "AND", kids: [{ in: "A" }, { in: "B" }] }, inputs: ["A", "B"] },
  };
}

function collectInputs(node: Node, out: Set<string>): void {
  if ("in" in node) {
    out.add(node.in);
    return;
  }
  node.kids.forEach((k) => collectInputs(k, out));
}
