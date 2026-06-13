// Coin Quest — Grade 1–2 money (US Common Core 2.MD.8): coin values, counting
// mixed coins, comparing amounts, making an amount, simple change, and dollars
// & cents to $1+. Amounts are typed on the number pad (in cents); "which coin /
// which is more" are true matching questions.
import { pick, randInt, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const COINS = [
  { name: "penny", plural: "pennies", value: 1 },
  { name: "nickel", plural: "nickels", value: 5 },
  { name: "dime", plural: "dimes", value: 10 },
  { name: "quarter", plural: "quarters", value: 25 },
];
const byValue = (v: number) => COINS.find((c) => c.value === v)!;

export type MoneyType =
  | "coinValue" // "How many cents is a dime?"  / "Which coin is 25¢?"
  | "countSame" // "3 dimes = ? ¢"
  | "countMixed" // "2 dimes and 3 pennies = ? ¢"
  | "compare" // "Which is more: 2 dimes or 1 quarter?"
  | "make" // "How many nickels make 20¢?"
  | "change" // "Pay 50¢ for a 35¢ toy. Change?"
  | "dollars"; // "$1 = ? ¢"  / "4 quarters = ? ¢"

export interface MoneyParams {
  types: MoneyType[];
  /** Which coins are in play (values). Defaults to all four. */
  coins?: number[];
  /** Largest cent total to aim for. */
  max?: number;
}

let qid = 0;
const id = () => `mo${++qid}`;
const cents = (n: number) => `${n}¢`;
const countWord = (n: number, c: (typeof COINS)[number]) => `${n} ${n === 1 ? c.name : c.plural}`;

export function generateMoney(params: MoneyParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const coins = (params.coins ?? [1, 5, 10, 25]).map(byValue);
  const max = params.max ?? 60;
  switch (type) {
    case "countSame":
      return genCountSame(rng, coins, max);
    case "countMixed":
      return genCountMixed(rng, coins, max, ctx);
    case "compare":
      return genCompare(rng, coins, max);
    case "make":
      return genMake(rng, coins);
    case "change":
      return genChange(rng, ctx);
    case "dollars":
      return genDollars(rng);
    default:
      return genCoinValue(rng, coins);
  }
}

/** "How many cents is a dime?"  or  "Which coin is worth 25¢?" */
function genCoinValue(rng: RNG, coins: (typeof COINS)[number][]): Question {
  const coin = pick(rng, coins);
  if (rng() < 0.5) {
    return {
      id: id(),
      prompt: `How many cents\nis a ${coin.name}?`,
      answer: String(coin.value),
      choices: [],
      hint: `A ${coin.name} is worth ${cents(coin.value)}.`,
      dedupeKey: `cv-${coin.value}`,
    };
  }
  return {
    id: id(),
    prompt: `Which coin is\nworth ${cents(coin.value)}?`,
    answer: coin.name,
    choices: shuffle(rng, COINS.map((c) => c.name)),
    inputMode: "choices",
    hint: `Penny 1¢, nickel 5¢, dime 10¢, quarter 25¢.`,
    dedupeKey: `wc-${coin.value}`,
  };
}

/** "3 dimes = ? ¢" — count coins of one kind. */
function genCountSame(rng: RNG, coins: (typeof COINS)[number][], max: number): Question {
  const coin = pick(rng, coins);
  const n = randInt(rng, 2, Math.max(2, Math.min(6, Math.floor(max / coin.value))));
  const total = n * coin.value;
  return {
    id: id(),
    prompt: `${countWord(n, coin)}\n= ? ¢`,
    answer: String(total),
    choices: [],
    hint: `Skip-count by ${coin.value}: ${coin.value}, ${coin.value * 2}…`,
    dedupeKey: `cs-${coin.value}-${n}`,
  };
}

/** "2 dimes and 3 pennies = ? ¢" — count a mixed handful. */
function genCountMixed(rng: RNG, coins: (typeof COINS)[number][], max: number, ctx: GenContext): Question {
  const pool = coins.length >= 2 ? coins : COINS;
  // Bigger coin first so totals stay tidy; pick counts that fit under max.
  const [a, b] = shuffle(rng, pool).slice(0, 2).sort((x, y) => y.value - x.value);
  const na = randInt(rng, 1, 3);
  let nb = randInt(rng, 1, ctx.easier ? 3 : 4);
  while (na * a.value + nb * b.value > max && nb > 1) nb--;
  const total = na * a.value + nb * b.value;
  return {
    id: id(),
    prompt: `${countWord(na, a)} and\n${countWord(nb, b)} = ? ¢`,
    answer: String(total),
    choices: [],
    hint: `Add the ${a.plural} first (${na * a.value}¢), then count on the ${b.plural}.`,
    dedupeKey: `cm-${a.value}${na}-${b.value}${nb}`,
  };
}

/** "Which is more: 2 dimes or 1 quarter?" */
function genCompare(rng: RNG, coins: (typeof COINS)[number][], max: number): Question {
  const a = makeHandful(rng, coins, max);
  let b = makeHandful(rng, coins, max);
  let guard = 0;
  while (b.total === a.total && guard++ < 8) b = makeHandful(rng, coins, max);
  const more = a.total >= b.total ? a : b;
  return {
    id: id(),
    prompt: `Which is more?\n${a.label}  or  ${b.label}`,
    answer: more.label,
    choices: shuffle(rng, [a.label, b.label]),
    inputMode: "choices",
    hint: `${a.label} is ${cents(a.total)}, ${b.label} is ${cents(b.total)}.`,
    dedupeKey: `mc-${a.label}-${b.label}`,
  };
}

function makeHandful(rng: RNG, coins: (typeof COINS)[number][], max: number): { label: string; total: number } {
  const coin = pick(rng, coins);
  const n = randInt(rng, 1, Math.max(1, Math.min(5, Math.floor(max / coin.value))));
  return { label: countWord(n, coin), total: n * coin.value };
}

/** "How many nickels make 20¢?" */
function genMake(rng: RNG, coins: (typeof COINS)[number][]): Question {
  const coin = pick(rng, coins.filter((c) => c.value > 1));
  const n = randInt(rng, 2, 6);
  const total = n * coin.value;
  return {
    id: id(),
    prompt: `How many ${coin.plural}\nmake ${cents(total)}?`,
    answer: String(n),
    choices: [],
    hint: `Count by ${coin.value} up to ${total}.`,
    dedupeKey: `mk-${coin.value}-${n}`,
  };
}

/** "You pay 50¢ for a 35¢ toy. Change?" */
function genChange(rng: RNG, ctx: GenContext): Question {
  const paid = ctx.easier ? pick(rng, [10, 20, 50]) : pick(rng, [20, 25, 50, 100]);
  const cost = randInt(rng, 1, paid - 1);
  return {
    id: id(),
    prompt: `Toy costs ${cents(cost)}.\nYou pay ${cents(paid)}. Change?`,
    answer: String(paid - cost),
    choices: [],
    hint: `Change = ${paid} − ${cost}.`,
    dedupeKey: `ch-${paid}-${cost}`,
  };
}

/** Dollars & cents (Grade 2): "$1 = ? ¢", "4 quarters = ? ¢", "$1 and 30¢ = ? ¢". */
function genDollars(rng: RNG): Question {
  const kind = pick(rng, ["whole", "quarters", "andCents"]);
  if (kind === "quarters") {
    return {
      id: id(),
      prompt: `4 quarters\n= ? ¢`,
      answer: "100",
      choices: [],
      hint: `Each quarter is 25¢. 25, 50, 75, 100.`,
      dedupeKey: `dq`,
    };
  }
  if (kind === "andCents") {
    const extra = randInt(rng, 1, 9) * 5;
    return {
      id: id(),
      prompt: `1 dollar and ${cents(extra)}\n= ? ¢`,
      answer: String(100 + extra),
      choices: [],
      hint: `A dollar is 100¢. Add ${extra} more.`,
      dedupeKey: `dc-${extra}`,
    };
  }
  return {
    id: id(),
    prompt: `1 dollar\n= ? ¢`,
    answer: "100",
    choices: [],
    hint: `One dollar is the same as 100 cents.`,
    dedupeKey: `dw`,
  };
}
