import { DETECTIVE_CARDS } from "../../content/traits/detectiveCards";
import { HABITAT_CASES } from "../../content/traits/habitatCases";
import { DETECTIVE_TASKS } from "../../content/traits/detectiveCurriculum";
import { detectiveAnswer, type DetectiveBoard, type DetectiveMode, type DetectiveZone } from "../../content/traits/detectiveTypes";
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const cardsById = new Map(DETECTIVE_CARDS.map((card) => [card.id, card]));
const habitatsById = new Map(HABITAT_CASES.map((habitat) => [habitat.id, habitat]));
const COPY: Record<DetectiveMode, { title: string; instruction: string; reminder: string; hint: string; zones: DetectiveZone[] }> = {
  notice: {
    title: "Which clues describe body traits?",
    instruction: "Put each card in Body trait or Outside body traits.",
    reminder: "Look for a part or feature of the body. Tools and practiced skills belong outside this body-trait group.",
    hint: "Read one clue at a time. Is it about the body, something learned, or something used?",
    zones: [
      { id: "trait", title: "Body trait", description: "A part or feature of a living thing's body" },
      { id: "outside", title: "Outside body traits", description: "A tool, object, or practiced skill" },
    ],
  },
  sort: {
    title: "Where does each clue fit in the trait family?",
    instruction: "Sort each card. All three places inside the trait family hold body traits.",
    reminder: "Adaptations are passed from parents. They were shaped over many generations to help living things survive or have young. Our known cases come from reviewed science records. Help alone is not proof.",
    hint: "Check what the clue actually shows. Is there a body trait? Is inherited help shown? Bins can hold more than one card.",
    zones: [
      { id: "unknown", title: "Help not known", description: "Body trait, but the clue does not show a helpful job", group: "traits" },
      { id: "adaptation", title: "Adaptation", description: "Known inherited trait with a helpful job.", group: "traits" },
      { id: "changed", title: "Changed during life", description: "A body trait, not an inherited adaptation.", group: "traits" },
      { id: "outside", title: "Outside body traits", description: "Objects and practiced skills" },
    ],
  },
  origins: {
    title: "Where did this feature or skill come from?",
    instruction: "Use each clue to sort by parents, practice, or a change during life.",
    reminder: "Inherited traits come from parents. Skills can be practiced. A body feature can also change during life.",
    hint: "Look for the part of the clue that tells how it began. You do not have to fill every place.",
    zones: [
      { id: "parents", title: "From parents", description: "An inherited body trait" },
      { id: "practice", title: "From practice", description: "A skill learned by trying" },
      { id: "change", title: "Changed during life", description: "A body feature changed after birth" },
    ],
  },
  compare: {
    title: "What happens when the scene changes?",
    instruction: "Read all four scene cards. Sort each by whether the trait helps with the specific job shown.",
    reminder: "The trait stays the same. Its job can be useful in one scene and not needed in another. Not used here does not mean harmful.",
    hint: "Compare the scenes for one living thing. What job is needed in each place?",
    zones: [
      { id: "helps", title: "Helps with this job", description: "The scene shows the trait doing its helpful job" },
      { id: "not-used", title: "Job not happening here", description: "This scene does not show this helpful job" },
    ],
  },
  connect: {
    title: "Which labels do these clues support?",
    instruction: "Sort the four clues. Then choose Trait, Adaptation, or both. A place can be empty.",
    reminder: "Adaptations are passed from parents. They were shaped over many generations to help living things survive or have young. These cases use reviewed science records. A helpful job alone does not prove that history.",
    hint: "Ask what each clue supports. Looking at a feature is different from knowing its family history or helpful job.",
    zones: [
      { id: "parents", title: "Passed from parents", description: "Evidence that the body feature is inherited" },
      { id: "help", title: "Helps survival or young", description: "Evidence of a job that helps it live or have young" },
      { id: "not-enough", title: "Not enough on its own", description: "Does not show inheritance or a helpful job" },
    ],
  },
};

function connectEvidence(board: DetectiveBoard, id: string): string[] {
  const card = cardsById.get(id);
  if (!card || card.origin !== "parents" || !["adaptation", "unknown"].includes(card.collection)) {
    throw new Error(`Invalid evidence case: ${id}`);
  }
  const known = card.collection === "adaptation";
  const [family, ...job] = card.clue.split(/(?<=\.)\s+/);
  board.claim = { title: card.title, photo: card.photo, clue: card.clue };
  const evidence = [
    { suffix: "family", title: "Clue 1", clue: family, zone: "parents",
      why: "This clue connects the body feature with parents. It supports inheritance." },
    { suffix: "job", title: "Clue 2", clue: job.join(" "), zone: known ? "help" : "not-enough",
      why: known ? "This clue shows the helpful job in this reviewed adaptation case."
        : "No helpful job is supplied. That is missing evidence, not proof that the trait never helps." },
    { suffix: "visible", title: "Clue 3", clue: "A picture shows this body feature.", zone: "not-enough",
      why: "Appearance alone does not show how a feature is inherited or how it helps." },
    { suffix: "name", title: "Clue 4", clue: "Seeing a feature tells us what it looks like.", zone: "not-enough",
      why: "Describing a feature does not establish its family history or helpful job." },
  ];
  board.cards = evidence.map((item) => ({ id: `${id}-${item.suffix}`, title: item.title,
    photo: card.photo, clue: item.clue, explanation: item.why }));
  for (const item of evidence) board.solution[`${id}-${item.suffix}`] = item.zone;
  board.solution["stamp-trait"] = "yes";
  board.solution["stamp-adaptation"] = known ? "yes" : "no";
  board.takeaway = known
    ? "Choose Trait AND Adaptation for the same feature. It is a body trait, and this reviewed case identifies it as an inherited adaptation shaped over many generations for a helpful job. Adaptations belong inside the trait family."
    : "Choose Trait from these clues. Leave Adaptation unselected because we need more evidence about its helpful job and history. This does not mean it is not an adaptation.";
  return evidence.map((item) => `${item.title}: ${zoneTitle(board, item.zone)}. ${item.clue} ${item.why}`);
}

function buildBoard(token: string, rng: RNG): DetectiveBoard {
  const task = DETECTIVE_TASKS[token];
  if (!task) throw new Error(`Unknown trait detective task: ${token}`);
  const { title, instruction, reminder, zones } = COPY[task.mode];
  const board: DetectiveBoard = { mode: task.mode, title, instruction, reminder,
    zones: zones.map((zone) => ({ ...zone })), cards: [], solution: {}, explanation: "" };
  const reasons: string[] = [];
  if (task.mode === "connect") {
    reasons.push(...connectEvidence(board, task.ids[0]));
  } else if (task.mode === "compare") {
    board.habitats = task.ids.map((id) => {
      const habitat = habitatsById.get(id);
      if (!habitat) throw new Error(`Missing habitat: ${id}`);
      return habitat;
    });
    for (const habitat of board.habitats) {
      for (const scene of habitat.scenes) {
        const id = `${habitat.id}-${scene.id}`;
        board.cards.push({ id, title: `${habitat.subject}: ${scene.place}`, photo: habitat.photo,
          clue: `${habitat.trait}. ${scene.observation}`, explanation: scene.observation });
        board.solution[id] = scene.helps ? "helps" : "not-used";
        reasons.push(`${habitat.subject} in ${scene.place}: ${zoneTitle(board, board.solution[id])}. ${scene.observation}`);
      }
      reasons.push(habitat.explanation);
    }
  } else {
    for (const id of task.ids) {
      const card = cardsById.get(id);
      if (!card) throw new Error(`Missing detective card: ${id}`);
      board.cards.push({ id, title: card.title, photo: card.photo, clue: card.clue, explanation: card.explanation });
      const zone = placement(task.mode, card);
      board.solution[id] = zone;
      reasons.push(`${card.title}: ${zoneTitle(board, zone)}. ${card.explanation}`);
    }
  }
  board.cards = shuffle(rng, board.cards);
  board.takeaway ??= task.mode === "compare"
    ? "The place changed, not the body feature. These features are still traits AND adaptations in both places. A helpful job is not useful everywhere."
    : "Every adaptation is also a trait. Some body traits need more clues. A scar is a changed trait, not an inherited adaptation. Helpful objects are not body traits.";
  board.explanation = `${reasons.join("\n\n")}\n\n${board.takeaway}`;
  return board;
}

function zoneTitle(board: DetectiveBoard, id: string): string {
  return board.zones.find((zone) => zone.id === id)!.title;
}

function placement(mode: DetectiveMode, card: (typeof DETECTIVE_CARDS)[number]): string {
  if (mode === "notice") return card.collection === "outside" ? "outside" : "trait";
  if (mode === "sort") return card.collection;
  if (!card.origin) throw new Error(`Origin missing for ${card.id}`);
  return card.origin;
}

export function generateTraitDetective(params: { items: string[] }, rng: RNG, ctx: GenContext): Question {
  if (!params.items?.length) throw new Error("A detective stage needs tasks");
  const token = pick(rng, params.items);
  const board = buildBoard(token, rng);
  const prompt = ctx.easier ? "Read a clue. Find its place." : board.title;
  return { id: `traits-detective:${token}`, dedupeKey: `traits-detective:${token}`,
    prompt, inputMode: "trait-detective", choices: [], answer: detectiveAnswer(board.solution),
    hint: COPY[board.mode].hint,
    payload: { traitDetective: board, answerDisplay: board.explanation, workedExample: board.explanation,
      speechText: [prompt, board.instruction, board.reminder,
        ...(board.claim ? [`${board.claim.title}. ${board.claim.clue}`] : []),
        ...board.cards.map((card) => `${card.title}. ${card.clue}`)].join(" "), traitPedagogyVersion: 1 } };
}
