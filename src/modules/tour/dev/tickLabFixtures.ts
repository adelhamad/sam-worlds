// Hand-written Tick Tock questions for the DEV bench (/tour/lab/tick): one
// read and one set puzzle for every step (60, 30, 15, 5, 1) plus "later"
// variants, so the widgets can be checked whatever the planner returns.
import { addMinutes, jumpWords, timeKey, timeWords } from "../../../engine/tick/clock";
import type { Question } from "../../../engine/generators/types";
import type { ClockTime, TickPayload, TickStep } from "../../../engine/tick/types";

function lab(id: string, prompt: string, answer: string, payload: TickPayload): Question {
  return {
    id: `lab-${id}`, prompt, answer, choices: [], hint: "", inputMode: "tour", repeatable: true,
    dedupeKey: `lab:${id}`, payload: payload as unknown as Record<string, unknown>,
  };
}

const t = (hour: number, minute: number): ClockTime => ({ hour, minute });

function read(step: TickStep, shown: ClockTime, jump = 0): Question {
  const task = jump > 0 ? "later-read" : "read";
  const prompt = jump > 0 ? `What time is it ${jumpWords(jump)} later?` : "What time is it?";
  return lab(`${task}-${step}-${timeKey(shown)}`, prompt, timeKey(addMinutes(shown, jump)), { tour: "tick-read", task, step, shown, jump });
}

function set(step: TickStep, target: ClockTime, start: ClockTime, words = true): Question {
  const say = words ? timeWords(target) : timeKey(target);
  return lab(`set-${step}-${timeKey(target)}`, `Set the clock to ${say}`, timeKey(target), {
    tour: "tick-set", task: "set", step, say, target, start, jump: 0,
  });
}

function laterSet(step: TickStep, start: ClockTime, jump: number): Question {
  const target = addMinutes(start, jump);
  return lab(`later-set-${step}-${timeKey(start)}-${jump}`, `Move the clock ${jumpWords(jump)} later`, timeKey(target), {
    tour: "tick-set", task: "later-set", step, say: `${jumpWords(jump)} later`, target, start, jump,
  });
}

export const LAB_EXTRAS: Question[] = [
  read(60, t(11, 0)),
  read(30, t(12, 30)),
  read(15, t(9, 45)),
  read(5, t(10, 25)),
  read(1, t(1, 17)),
  read(60, t(12, 0), 60),
  read(15, t(3, 30), 45),
  read(5, t(11, 40), 90),
  set(60, t(7, 0), t(12, 0)),
  set(30, t(11, 30), t(3, 0)),
  set(15, t(2, 45), t(12, 0)),
  set(5, t(10, 35), t(6, 0), false),
  set(1, t(4, 52), t(4, 0), false),
  laterSet(30, t(5, 30), 60),
  laterSet(5, t(11, 50), 25),
];
