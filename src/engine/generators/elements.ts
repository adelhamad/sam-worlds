// Element Lab — real chemistry knowledge for a curious kid: element symbols,
// what molecules are, atom structure (nucleus / proton / electron / neutron),
// metals vs non-metals, and the gases around us. Content-pack style, all
// matching questions (anti-guessing rule 1 still regenerates on a miss).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

interface Element {
  sym: string;
  name: string;
}
const ELEMENTS: Element[] = [
  { sym: "H", name: "Hydrogen" }, { sym: "O", name: "Oxygen" }, { sym: "C", name: "Carbon" },
  { sym: "N", name: "Nitrogen" }, { sym: "He", name: "Helium" }, { sym: "Fe", name: "Iron" },
  { sym: "Au", name: "Gold" }, { sym: "Ag", name: "Silver" }, { sym: "Na", name: "Sodium" },
  { sym: "Cl", name: "Chlorine" }, { sym: "Ca", name: "Calcium" }, { sym: "K", name: "Potassium" },
  { sym: "Cu", name: "Copper" }, { sym: "Zn", name: "Zinc" }, { sym: "Ne", name: "Neon" },
  { sym: "Mg", name: "Magnesium" }, { sym: "Al", name: "Aluminium" }, { sym: "Pb", name: "Lead" },
  { sym: "Sn", name: "Tin" }, { sym: "Hg", name: "Mercury" }, { sym: "Si", name: "Silicon" },
  { sym: "U", name: "Uranium" },
];

interface Molecule {
  f: string;
  name: string;
}
const MOLECULES: Molecule[] = [
  { f: "H₂O", name: "water" }, { f: "CO₂", name: "carbon dioxide" }, { f: "O₂", name: "oxygen" },
  { f: "NaCl", name: "salt" }, { f: "CH₄", name: "methane" }, { f: "N₂", name: "nitrogen" },
  { f: "H₂", name: "hydrogen" }, { f: "CO", name: "carbon monoxide" },
];

interface Fact {
  q: string;
  a: string;
  opts: string[];
  key: string;
}
const ATOM_FACTS: Fact[] = [
  { q: "What is the center of an atom called?", a: "nucleus", opts: ["nucleus", "electron", "molecule", "proton"], key: "atom-center" },
  { q: "Which atom part has a NEGATIVE charge?", a: "electron", opts: ["electron", "proton", "neutron", "nucleus"], key: "atom-neg" },
  { q: "Which atom part has a POSITIVE charge?", a: "proton", opts: ["proton", "electron", "neutron", "atom"], key: "atom-pos" },
  { q: "Which atom part has NO charge?", a: "neutron", opts: ["neutron", "proton", "electron", "nucleus"], key: "atom-neutral" },
  { q: "What is the smallest building block of matter?", a: "atom", opts: ["atom", "rock", "cell", "molecule"], key: "atom-small" },
  { q: "Two or more atoms joined make a ___?", a: "molecule", opts: ["molecule", "proton", "crystal", "metal"], key: "atom-mol" },
  { q: "Electrons whizz around the ___?", a: "nucleus", opts: ["nucleus", "neutron", "molecule", "atom"], key: "atom-orbit" },
  { q: "An atom that loses or gains electrons becomes an ___?", a: "ion", opts: ["ion", "atom", "molecule", "metal"], key: "atom-ion" },
  { q: "Protons and neutrons are found in the ___?", a: "nucleus", opts: ["nucleus", "shell", "electron", "orbit"], key: "atom-protons" },
];
const CHEM_FACTS: Fact[] = [
  { q: "Which gas do we breathe IN to live?", a: "oxygen", opts: ["oxygen", "carbon dioxide", "helium", "hydrogen"], key: "f-in" },
  { q: "Which gas do we breathe OUT?", a: "carbon dioxide", opts: ["carbon dioxide", "oxygen", "nitrogen", "neon"], key: "f-out" },
  { q: "Which gas makes balloons float?", a: "helium", opts: ["helium", "oxygen", "neon", "argon"], key: "f-balloon" },
  { q: "Is iron a metal or non-metal?", a: "metal", opts: ["metal", "non-metal"], key: "f-iron" },
  { q: "Is oxygen a metal or non-metal?", a: "non-metal", opts: ["metal", "non-metal"], key: "f-oxy" },
  { q: "What is the hardest natural material?", a: "diamond", opts: ["diamond", "gold", "iron", "glass"], key: "f-hard" },
  { q: "Which metal is LIQUID at room temperature?", a: "mercury", opts: ["mercury", "iron", "gold", "copper"], key: "f-merc" },
  { q: "What gas do plants take IN?", a: "carbon dioxide", opts: ["carbon dioxide", "oxygen", "helium", "hydrogen"], key: "f-plantin" },
  { q: "What gas do plants give OUT?", a: "oxygen", opts: ["oxygen", "carbon dioxide", "nitrogen", "neon"], key: "f-plantout" },
  { q: "Most of the air we breathe is ___?", a: "nitrogen", opts: ["nitrogen", "oxygen", "carbon dioxide", "helium"], key: "f-air" },
  { q: "Rust forms when iron meets water and ___?", a: "oxygen", opts: ["oxygen", "helium", "carbon", "salt"], key: "f-rust" },
  { q: "Which is a noble (un-reactive) gas?", a: "helium", opts: ["helium", "oxygen", "iron", "sodium"], key: "f-noble" },
  { q: "Which element do diamonds and pencils share?", a: "carbon", opts: ["carbon", "iron", "silver", "calcium"], key: "f-carbon" },
  { q: "Which element is in your bones and teeth?", a: "calcium", opts: ["calcium", "gold", "neon", "lead"], key: "f-calcium" },
];

export type ElementType = "symbol" | "element" | "molecule" | "atom" | "fact";

export interface ElementParams {
  types: ElementType[];
}

let qid = 0;
const id = () => `el${++qid}`;

function genSymbol(rng: RNG): Question {
  const e = pick(rng, ELEMENTS);
  const wrong = shuffle(rng, ELEMENTS.filter((x) => x.sym !== e.sym)).slice(0, 3).map((x) => x.sym);
  return {
    id: id(),
    prompt: `What is the chemical symbol for ${e.name}?`,
    answer: e.sym,
    choices: shuffle(rng, [e.sym, ...wrong]),
    inputMode: "choices",
    hint: `Symbols come from the element's (often Latin) name.`,
    dedupeKey: `sym-${e.sym}`,
  };
}

function genElement(rng: RNG): Question {
  const e = pick(rng, ELEMENTS);
  const wrong = shuffle(rng, ELEMENTS.filter((x) => x.name !== e.name)).slice(0, 3).map((x) => x.name);
  return {
    id: id(),
    prompt: `Which element has the symbol ${e.sym}?`,
    answer: e.name,
    choices: shuffle(rng, [e.name, ...wrong]),
    inputMode: "choices",
    hint: `Match the symbol back to its element name.`,
    dedupeKey: `elem-${e.sym}`,
  };
}

function genMolecule(rng: RNG): Question {
  const m = pick(rng, MOLECULES);
  const wrong = shuffle(rng, MOLECULES.filter((x) => x.name !== m.name)).slice(0, 3).map((x) => x.name);
  return {
    id: id(),
    prompt: `What is ${m.f}?`,
    answer: m.name,
    choices: shuffle(rng, [m.name, ...wrong]),
    inputMode: "choices",
    hint: `Read the atoms: H is hydrogen, O is oxygen, C is carbon.`,
    dedupeKey: `mol-${m.f}`,
  };
}

function genFromFacts(pool: Fact[], rng: RNG): Question {
  const f = pick(rng, pool);
  return {
    id: id(),
    prompt: f.q,
    answer: f.a,
    choices: shuffle(rng, f.opts),
    inputMode: "choices",
    hint: `Think it through — you know this!`,
    dedupeKey: f.key,
  };
}

const GENERATORS: Record<ElementType, (rng: RNG) => Question> = {
  symbol: genSymbol,
  element: genElement,
  molecule: genMolecule,
  atom: (rng) => genFromFacts(ATOM_FACTS, rng),
  fact: (rng) => genFromFacts(CHEM_FACTS, rng),
};

export function generateElements(params: ElementParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  return (GENERATORS[type] ?? GENERATORS.fact)(rng);
}
