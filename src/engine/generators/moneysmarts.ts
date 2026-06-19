// Money Smarts — first ideas about money: needs vs wants, saving, spending,
// earning and giving. (Distinct from Coin Quest, which counts coins.)
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, thing, need|want]
const NEEDWANT: Array<[string, string, string]> = [
  ["🍎", "healthy food", "need"], ["💧", "clean water", "need"], ["🏠", "a home", "need"],
  ["👕", "clothes", "need"], ["💊", "medicine when sick", "need"], ["🛏️", "a bed to sleep", "need"],
  ["🧸", "a new toy", "want"], ["🍬", "candy", "want"], ["🎮", "a video game", "want"],
  ["🍦", "ice cream", "want"], ["🎈", "a balloon", "want"], ["⌚", "a fancy watch", "want"],
];

// [scenario, action, wrongs]
const ACTION: Array<[string, string, string[]]> = [
  ["You put coins in your piggy bank for later. You are…", "saving", ["spending", "wasting", "losing"]],
  ["You buy a toy with your money. You are…", "spending", ["saving", "earning", "giving"]],
  ["You do chores and get pocket money. You are…", "earning", ["spending", "borrowing", "wasting"]],
  ["You share some money with someone in need. You are…", "giving", ["spending", "saving", "earning"]],
  ["You want a big toy, so you save up little by little. That is…", "smart saving", ["wasting money", "borrowing too much", "spending it all"]],
];

// [question, answer, wrongs] — money facts
const FACT: Array<[string, string, string[]]> = [
  ["Most grown-ups get money by…", "working at a job", ["finding it on trees", "wishing for it", "doing nothing"]],
  ["A safe place to keep your money is a…", "bank", ["puddle", "trash can", "sandbox"]],
  ["If you spend all your money at once, you…", "have none left to save", ["get more for free", "earn extra", "keep it all"]],
  ["Before buying, a smart shopper asks…", "do I really need this?", ["how can I buy more?", "can I buy everything?", "who cares?"]],
  ["Saving a little each week helps you…", "afford something big later", ["lose your money", "spend faster", "waste it"]],
];

export interface MoneySmartsParams {
  types: Array<"needwant" | "action" | "fact">;
}

let qid = 0;
const id = () => `ms${++qid}`;

export function generateMoneySmarts(params: MoneySmartsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "action") {
    const [p, a, w] = pick(rng, ACTION);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Saving, spending, earning or giving?", inputMode: "choices", dedupeKey: `action-${p}` };
  }
  if (type === "fact") {
    const [p, a, w] = pick(rng, FACT);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think like a smart money saver.", inputMode: "choices", dedupeKey: `fact-${p}` };
  }
  const [emoji, thing, kind] = pick(rng, NEEDWANT);
  return {
    id: id(),
    prompt: `Is ${thing} a NEED or a WANT?`,
    answer: kind,
    choices: shuffle(rng, ["need", "want"]),
    hint: "A need keeps you healthy and safe. A want is just nice to have.",
    inputMode: "choices",
    dedupeKey: `needwant-${thing}`,
    payload: { bigSymbol: emoji },
  };
}
