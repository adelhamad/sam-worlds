// Logic Circuits — redstone-style wiring in many shapes, so a stage never
// feels like the same question twice:
//   build it  → glow / dark / locked-switch (constructed toggles)
//   read it   → which setting / how many settings glow (deduction)
//   name it   → which gate / mystery gate from clues (true matching)
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

export type GateOp = "AND" | "OR" | "XOR" | "NOT";
export type Node = { op: GateOp; kids: Node[] } | { in: string };
export type LogicType = "tutorial" | "glow" | "dark" | "locked" | "setting" | "gateName" | "mystery" | "count";

export interface LogicParams {
  ops: GateOp[];
  inputs: number; // 1..3
  depth: number; // 0 = plain wire (tutorial), 1..4 gates
  /** Tutorial mode: the widget shows the lamp reacting live. */
  preview?: boolean;
  /** Question shapes this stage draws from (default: glow; depth 0 → tutorial). */
  types?: LogicType[];
}

type Bits = Record<string, boolean>;

let qid = 0;
const id = () => `lc${++qid}`;

export function evalNode(node: Node, bits: Bits): boolean {
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

function allAssignments(names: string[]): Bits[] {
  const out: Bits[] = [];
  for (let m = 0; m < 1 << names.length; m++) {
    const bits: Bits = {};
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

function collectInputs(node: Node, out: Set<string>): void {
  if ("in" in node) {
    out.add(node.in);
    return;
  }
  node.kids.forEach((k) => collectInputs(k, out));
}

const bitsKey = (names: string[], bits: Bits) => names.map((n) => (bits[n] ? 1 : 0)).join("");

/**
 * Canonical circuit key: AND(A,B) ≡ AND(B,A). Dedupe must be EXPERIENTIAL —
 * two puzzles with the same circuit and goal feel identical to the player
 * (start states don't change the solution), so they share one key.
 */
function keyOf(node: Node): string {
  if ("in" in node) return node.in;
  return `${node.op}(${node.kids.map(keyOf).sort().join(",")})`;
}
const labelOf = (names: string[], bits: Bits) => names.map((n) => `${n} ${bits[n] ? "ON" : "OFF"}`).join(" · ");

const GATE_DOES: Record<GateOp, string> = {
  AND: "glows only when BOTH sides are ON",
  OR: "glows when AT LEAST ONE side is ON",
  XOR: "glows when EXACTLY ONE side is ON",
  NOT: "flips the signal — ON becomes OFF",
};

/** Teach the top gate's rule instead of revealing a full solution. */
function topHint(tree: Node, wantOn: boolean): string {
  if ("in" in tree) return wantOn ? `Power must flow through ${tree.in}.` : `Cut the power at ${tree.in}.`;
  switch (tree.op) {
    case "AND":
      return wantOn ? "The last gate is AND — BOTH of its sides must be ON." : "The last gate is AND — turn one of its sides OFF.";
    case "OR":
      return wantOn ? "The last gate is OR — ONE side ON is enough." : "The last gate is OR — BOTH sides must be OFF.";
    case "XOR":
      return wantOn ? "The last gate is XOR — exactly ONE side may be ON." : "The last gate is XOR — make both sides MATCH.";
    case "NOT":
      return wantOn ? "NOT flips it — the part inside must be OFF." : "NOT flips it — the part inside must be ON.";
  }
}

interface Built {
  tree: Node;
  sats: Bits[];
  nonSats: Bits[];
}

/** Build a circuit that is solvable but not trivial, plus extra acceptance. */
function buildWhere(params: LogicParams, names: string[], depth: number, rng: RNG, ok: (b: Built) => boolean): Built | null {
  const notOnly = params.ops.length === 1 && params.ops[0] === "NOT";
  for (let tries = 0; tries < 80; tries++) {
    const tree = buildTree(params.ops, names, depth, rng);
    const used = new Set<string>();
    collectInputs(tree, used);
    if (!notOnly && used.size < names.length) continue;
    const all = allAssignments(names);
    const sats = all.filter((b) => evalNode(tree, b));
    if (sats.length === 0 || sats.length === all.length) continue;
    const built = { tree, sats, nonSats: all.filter((b) => !evalNode(tree, b)) };
    if (ok(built)) return built;
  }
  return null;
}

export function generateLogicCircuit(params: LogicParams, rng: RNG, ctx: GenContext): Question {
  const names = ["A", "B", "C"].slice(0, Math.max(1, ctx.easier ? Math.min(2, params.inputs) : params.inputs));
  const depth = Math.max(1, ctx.easier ? Math.min(1, params.depth) : params.depth);
  const types = params.types ?? (params.depth === 0 ? ["tutorial" as const] : ["glow" as const]);
  const type = ctx.easier ? types[0] : pick(rng, types);
  return genByType(type, params, rng, names, depth) ?? fallbackGlow(params, names);
}

function genByType(type: LogicType, params: LogicParams, rng: RNG, names: string[], depth: number): Question | null {
  switch (type) {
    case "tutorial":
      return genTutorial(rng, names);
    case "dark":
      return genDark(params, rng, names, depth);
    case "locked":
      return genLocked(params, rng, names, depth) ?? genGlow(params, rng, names, depth);
    case "setting":
      return genSetting(params, rng, names, depth) ?? genGlow(params, rng, names, depth);
    case "gateName":
      return genGateName(params, rng);
    case "mystery":
      return genMystery(params, rng) ?? genGateName(params, rng);
    case "count":
      return genCount(params, rng, names, depth) ?? genGlow(params, rng, names, depth);
    default:
      return genGlow(params, rng, names, depth);
  }
}

/** Two switches, ONE secret wire — find which switch matters. */
function genTutorial(rng: RNG, names: string[]): Question {
  const wired = pick(rng, names);
  const wantOn = rng() < 0.5;
  // glow: everything starts OFF; dark: the wired switch starts ON (lamp lit)
  const start: Bits = Object.fromEntries(names.map((n) => [n, !wantOn && n === wired]));
  return {
    id: id(),
    prompt: wantOn ? "Follow the wire — make the lamp GLOW! 💡" : "The lamp is ON — switch it OFF! ⚫",
    answer: wantOn ? "1" : "0",
    choices: [],
    hint: `Only ${wired} is wired to the lamp.`,
    inputMode: "toggle",
    dedupeKey: `tut-${wired}-${wantOn ? "on" : "off"}`,
    payload: { tree: { in: wired }, inputs: names, start, preview: true },
  };
}

function genGlow(params: LogicParams, rng: RNG, names: string[], depth: number): Question | null {
  const built = buildWhere(params, names, depth, rng, () => true);
  if (!built) return null;
  const start = pick(rng, built.nonSats);
  return {
    id: id(),
    prompt: "Set the switches — make the lamp GLOW! 💡",
    answer: "1",
    choices: [],
    hint: topHint(built.tree, true),
    inputMode: "toggle",
    dedupeKey: `glow-${keyOf(built.tree)}`,
    payload: { tree: built.tree, inputs: names, start, preview: Boolean(params.preview) },
  };
}

/** The lamp starts LIT — find a setting that turns it off. */
function genDark(params: LogicParams, rng: RNG, names: string[], depth: number): Question | null {
  const built = buildWhere(params, names, depth, rng, () => true);
  if (!built) return null;
  const start = pick(rng, built.sats);
  return {
    id: id(),
    prompt: "Too bright! Make the lamp go DARK. ⚫",
    answer: "0",
    choices: [],
    hint: topHint(built.tree, false),
    inputMode: "toggle",
    dedupeKey: `dark-${keyOf(built.tree)}`,
    payload: { tree: built.tree, inputs: names, start, preview: Boolean(params.preview) },
  };
}

/** One switch is stuck — solve around it (no brute-forcing every combo). */
function genLocked(params: LogicParams, rng: RNG, names: string[], depth: number): Question | null {
  if (names.length < 2) return null;
  for (let tries = 0; tries < 12; tries++) {
    const built = buildWhere(params, names, depth, rng, () => true);
    if (!built) return null;
    const lockName = pick(rng, names);
    const lockVal = rng() < 0.5;
    const sats = built.sats.filter((b) => b[lockName] === lockVal);
    const nonSats = built.nonSats.filter((b) => b[lockName] === lockVal);
    if (sats.length === 0 || nonSats.length === 0) continue; // solvable, not already solved
    const start = pick(rng, nonSats);
    return {
      id: id(),
      prompt: `Make it GLOW — but ${lockName} is STUCK ${lockVal ? "ON" : "OFF"}! 🔒`,
      answer: "1",
      choices: [],
      hint: topHint(built.tree, true),
      inputMode: "toggle",
      dedupeKey: `lock-${keyOf(built.tree)}-${lockName}${lockVal ? 1 : 0}`,
      payload: { tree: built.tree, inputs: names, start, locked: { [lockName]: lockVal }, preview: Boolean(params.preview) },
    };
  }
  return null;
}

/** Read the circuit: exactly one setting glows (or keeps dark) — find it. */
function genSetting(params: LogicParams, rng: RNG, names: string[], depth: number): Question | null {
  const built = buildWhere(params, names, depth, rng, (b) => b.sats.length === 1 || b.nonSats.length === 1);
  if (!built) return null;
  const glowMode = built.sats.length === 1;
  const answerBits = glowMode ? built.sats[0] : built.nonSats[0];
  const answerKey = bitsKey(names, answerBits);
  const others = shuffle(rng, allAssignments(names).filter((b) => bitsKey(names, b) !== answerKey)).slice(0, 3);
  return {
    id: id(),
    prompt: glowMode ? "Which setting makes the lamp glow?" : "Which setting keeps the lamp DARK?",
    answer: labelOf(names, answerBits),
    choices: shuffle(rng, [answerBits, ...others].map((b) => labelOf(names, b))),
    hint: "Test each setting in your head, gate by gate.",
    inputMode: "choices",
    dedupeKey: `set-${glowMode ? "g" : "d"}-${keyOf(built.tree)}`,
    payload: { tree: built.tree, inputs: names },
  };
}

/** Match gate name ↔ what it does. */
function genGateName(params: LogicParams, rng: RNG): Question | null {
  const opts = params.ops.length >= 2 ? params.ops : (["AND", "OR", "XOR", "NOT"] as GateOp[]);
  const op = pick(rng, opts);
  const wrongOps = shuffle(rng, opts.filter((o) => o !== op)).slice(0, 3);
  if (rng() < 0.5) {
    return {
      id: id(),
      prompt: `What does the ${op} gate do?`,
      answer: GATE_DOES[op],
      choices: shuffle(rng, [op, ...wrongOps].map((o) => GATE_DOES[o])),
      hint: `Picture a lamp behind an ${op} gate.`,
      inputMode: "choices",
      dedupeKey: `gname-r-${op}`,
    };
  }
  return {
    id: id(),
    prompt: `Which gate ${GATE_DOES[op]}?`,
    answer: op,
    choices: shuffle(rng, [op, ...wrongOps]),
    hint: "Say each gate's rule out loud.",
    inputMode: "choices",
    dedupeKey: `gname-f-${op}`,
  };
}

function gateOut(op: GateOp, bits: Bits): boolean {
  return evalNode({ op, kids: [{ in: "A" }, { in: "B" }] }, bits);
}

/** Deduce the hidden gate from observed input → lamp clues. */
function genMystery(params: LogicParams, rng: RNG): Question | null {
  const candidates = params.ops.filter((o) => o !== "NOT");
  if (candidates.length < 2) return null;
  const secret = pick(rng, candidates);
  const names = ["A", "B"];
  for (let tries = 0; tries < 30; tries++) {
    const rows = shuffle(rng, allAssignments(names)).slice(0, 2);
    const sig = (op: GateOp) => rows.map((b) => (gateOut(op, b) ? 1 : 0)).join("");
    if (candidates.some((o) => o !== secret && sig(o) === sig(secret))) continue;
    const clues = rows.map((b) => `${labelOf(names, b)} → ${gateOut(secret, b) ? "💡" : "⚫"}`).join("\n");
    return {
      id: id(),
      prompt: `A mystery gate hides in the box! 📦\n${clues}\nWhich gate is it?`,
      answer: secret,
      choices: shuffle(rng, [...candidates]),
      hint: "Check BOTH clues against each gate's rule.",
      inputMode: "choices",
      dedupeKey: `mys-${secret}-${rows.map((b) => bitsKey(names, b)).join(".")}`,
    };
  }
  return null;
}

/** Truth-table detective: the 4 ways are LISTED — check each, count glows. */
function genCount(params: LogicParams, rng: RNG, names: string[], depth: number): Question | null {
  const nm = names.slice(0, 2);
  const built = buildWhere(params, nm, Math.min(depth, 2), rng, () => true);
  if (!built) return null;
  const rows = allAssignments(nm);
  return {
    id: id(),
    prompt: "How many of these make the lamp glow? 🔍",
    answer: String(built.sats.length),
    choices: [],
    hint: "Check each line one at a time — count the glows.",
    dedupeKey: `cnt-${keyOf(built.tree)}`,
    payload: { tree: built.tree, inputs: nm, listRows: rows.map((b, i) => `${i + 1}.  ${labelOf(nm, b)}`) },
  };
}

function fallbackGlow(params: LogicParams, names: string[]): Question {
  const tree: Node = names.length < 2 ? { in: names[0] } : { op: "AND", kids: [{ in: "A" }, { in: "B" }] };
  return {
    id: id(),
    prompt: "Set the switches — make the lamp GLOW! 💡",
    answer: "1",
    choices: [],
    hint: names.length < 2 ? "Power must flow through A." : "Both switches ON.",
    inputMode: "toggle",
    payload: { tree, inputs: names, preview: Boolean(params.preview) },
  };
}
