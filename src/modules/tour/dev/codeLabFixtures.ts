// Hand-written Code Lab questions for the DEV bench (/tour/lab/code): the
// variants the planner may not produce for a given seed — a 6×6 grid with
// many rocks, a trace with a loop, a bug inside a loop, a 9-block star run,
// a loop puzzle with the live preview on.
import { CODE_DONE, traceAnswer } from "../../../engine/code/judge";
import type { CodeBlock, CodeGrid, CodePayload } from "../../../engine/code/types";
import type { Question } from "../../../engine/generators/types";
import { CODE } from "../../../strings/code";

const E = CODE.engine;

function lab(id: string, prompt: string, answer: string, payload: CodePayload): Question {
  return {
    id: `lab-${id}`, prompt, answer, choices: [], hint: "", inputMode: "tour", repeatable: true,
    dedupeKey: `lab:${id}`, payload: payload as unknown as Record<string, unknown>,
  };
}

const rocky: CodeGrid = { size: 6, start: 30, goal: 5, walls: [24, 25, 18, 13, 8, 2, 16, 22, 34, 11], stars: [] };
const loopTraceGrid: CodeGrid = { size: 5, start: 20, goal: -1, walls: [6, 23], stars: [] };
const loopTrace: CodeBlock[] = ["E", { times: 3, body: ["N", "E"] }];
const stairs5: CodeGrid = { size: 5, start: 20, goal: 4, walls: [10, 22], stars: [] };
const starry5: CodeGrid = { size: 5, start: 20, goal: 19, walls: [11, 12, 17], stars: [10, 8] };

export const LAB_EXTRAS: Question[] = [
  lab("rocky", E.run, CODE_DONE, {
    tour: "code-run", task: "run", grid: rocky, maxBlocks: 10, loops: [], preview: false,
    solution: ["E", "E", "N", "N", "N", "E", "N", "N", "E", "E"],
  }),
  lab("loop-trace", E.trace, traceAnswer(loopTraceGrid, loopTrace), {
    tour: "code-trace", task: "loop-trace", grid: loopTraceGrid, program: loopTrace, solution: loopTrace,
  }),
  lab("loop-debug", E.debug, CODE_DONE, {
    tour: "code-debug", task: "debug", grid: stairs5, edits: 1,
    program: [{ times: 4, body: ["N", "W"] }], solution: [{ times: 4, body: ["N", "E"] }],
  }),
  lab("stars9", E.stars, CODE_DONE, {
    tour: "code-run", task: "stars", grid: starry5, maxBlocks: 9, loops: [], preview: false,
    solution: ["N", "N", "N", "E", "E", "E", "S", "S", "E"],
  }),
  lab("loop-preview", E.loop, CODE_DONE, {
    tour: "code-run", task: "loop", grid: stairs5, maxBlocks: 2, loops: [2, 3, 4], preview: true,
    solution: [{ times: 4, body: ["N", "E"] }],
  }),
];
