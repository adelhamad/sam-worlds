import type { HabitatCase } from "./detectiveTypes";
import { ADAPTATIONS } from "./examples";

// Qualitative teaching models, not reports of experiments or photographed events.
// helps:false means ONLY the named job is not useful in the supplied scene now.
// The inherited feature remains an adaptation; surroundings do not remake bodies.
type CaseDraft = Omit<HabitatCase, "source" | "explanation"> & {
  sourceId: string;
  lesson: string;
};

const cases: CaseDraft[] = [
  {
    id: "duck-paddling", subject: "Duck", photo: "duck", trait: "Skin between toes for pushing water",
    sourceId: "duck-feet",
    scenes: [
      { id: "pond", place: "Swimming across a pond", observation: "Model: The joined toes push against water and help the duck swim across.", helps: true },
      { id: "path", place: "Walking on a dry path", observation: "Model: There is no water to push. The duck can walk, but the water-pushing job is not used.", helps: false },
    ],
    lesson: "The skin helps with paddling in water. Walking uses the feet too, but it is a different job.",
  },
  {
    id: "stick-insect-hiding", subject: "Stick insect", photo: "stick-insect", trait: "A twig-shaped body for hiding among twigs",
    sourceId: "stick-insect-shape",
    scenes: [
      { id: "twigs", place: "Among similar brown twigs", observation: "Model: The brown twig-shaped body blends with the small branches around it.", helps: true },
      { id: "leaf", place: "On a broad plain green leaf", observation: "Model: The brown body stands out against the plain leaf. There are no matching twigs around it.", helps: false },
    ],
    lesson: "Looking like a twig helps with hiding when the background has matching twigs.",
  },
  {
    id: "dolphin-air", subject: "Dolphin", photo: "dolphin", trait: "A breathing hole for taking in air",
    sourceId: "dolphin-blowhole",
    scenes: [
      { id: "surface", place: "At the sea's surface", observation: "Model: The breathing hole is above water. The dolphin opens it and takes in air.", helps: true },
      { id: "underwater", place: "Below the sea's surface", observation: "Model: Water covers the closed breathing hole. The dolphin holds its breath; it cannot take in air here.", helps: false },
    ],
    lesson: "The hole takes in air at the surface, not underwater. The dolphin must return to the surface to breathe.",
  },
  {
    id: "giraffe-high-food", subject: "Giraffe", photo: "giraffe", trait: "A long neck for reaching high leaves",
    sourceId: "giraffe-neck",
    scenes: [
      { id: "leafy-tree", place: "Beside a tree with high leaves", observation: "Model: The giraffe's long neck reaches high leaves that it eats.", helps: true },
      { id: "bare-tree", place: "Beside a tree with bare high branches", observation: "Model: The neck reaches the branches, but there are no leaves there to eat. Reaching high brings no leafy food now.", helps: false },
    ],
    lesson: "Reaching high provides leafy food where high leaves are present. A long neck cannot supply missing leaves.",
  },
  {
    id: "hummingbird-flower-food", subject: "Hummingbird", photo: "hummingbird", trait: "A thin beak for reaching flower juice",
    sourceId: "hummingbird-bill",
    scenes: [
      { id: "full-flower", place: "At a flower holding sweet juice", observation: "Model: The beak fits into the flower. The bird's tongue reaches the sweet juice inside.", helps: true },
      { id: "empty-flower", place: "At a flower with no sweet juice left", observation: "Model: The beak still fits, but there is no sweet juice inside to get for food now.", helps: false },
    ],
    lesson: "The beak helps the bird reach food inside a flower when that food is there; the tongue takes up the juice.",
  },
  {
    id: "anteater-ant-food", subject: "Giant anteater", photo: "anteater", trait: "A sticky tongue for picking up ants",
    sourceId: "anteater-tongue",
    scenes: [
      { id: "ants", place: "At an opened nest with ants", observation: "Model: Ants stick to the long tongue. The anteater pulls them into its mouth for food.", helps: true },
      { id: "empty-nest", place: "At an empty old ant nest", observation: "Model: There are no ants in this nest. The sticky tongue cannot collect ant food here now.", helps: false },
    ],
    lesson: "The sticky tongue helps gather ants when ants are present. It cannot collect ants from an empty nest.",
  },
  {
    id: "woodpecker-wood", subject: "Woodpecker", photo: "woodpecker", trait: "A strong beak for chipping nest holes in wood",
    sourceId: "woodpecker-beak",
    scenes: [
      { id: "trunk", place: "On a tree trunk with soft dead wood", observation: "Model: The bird chips the wood with its beak. A hole can become a nest space.", helps: true },
      { id: "ground", place: "On open ground with no wood", observation: "Model: There is no wood to chip here. The beak cannot make a wooden nest hole in this spot.", helps: false },
    ],
    lesson: "The beak's wood-chipping job helps make a nest hole where there is suitable wood.",
  },
  {
    id: "dandelion-wind", subject: "Dandelion", photo: "dandelion", trait: "Fluffy seed tops for wind travel",
    sourceId: "dandelion-seeds",
    scenes: [
      { id: "breeze", place: "In a meadow with a breeze", observation: "Model: Moving air catches a loose seed's fluffy top and carries the seed away.", helps: true },
      { id: "still-air", place: "In the same meadow with still air", observation: "Model: No air is moving now. The fluffy top cannot carry a seed away on wind that is not blowing.", helps: false },
    ],
    lesson: "Fluffy tops help seeds travel when air moves. Still air does not provide that ride now.",
  },
  {
    id: "burdock-fur", subject: "Burdock", photo: "burdock", trait: "Seed hooks for riding on animal fur",
    sourceId: "burdock-burrs",
    scenes: [
      { id: "passing-animal", place: "Beside a furry animal brushing past", observation: "Model: Seed hooks catch the animal's fur. The animal carries the seeds away.", helps: true },
      { id: "no-animal", place: "At a field edge with no animals passing", observation: "Model: No fur touches the hooks. There is no animal ride for the seeds here now.", helps: false },
    ],
    lesson: "Hooks help seeds ride on fur when an animal brushes past. Hooks alone do not move seeds.",
  },
  {
    id: "coconut-water", subject: "Coconut palm", photo: "coconut", trait: "A thick outer husk around the seed for floating",
    sourceId: "coconut-husk",
    scenes: [
      { id: "sea", place: "In moving coastal water", observation: "Model: The coconut floats with its thick outer coat. Moving water can carry it away.", helps: true },
      { id: "dry-beach", place: "On dry sand above the water", observation: "Model: No water reaches this coconut now. Its outer coat cannot give it a floating ride on dry sand.", helps: false },
    ],
    lesson: "The outer coat helps the seed float where there is water. It may have other jobs on land too.",
  },
  {
    id: "lotus-rain", subject: "Lotus", photo: "lotus", trait: "A waxy leaf coat for shedding rain and dirt",
    sourceId: "lotus-leaves",
    scenes: [
      { id: "rain", place: "At a pond during rain", observation: "Model: Rain forms drops that roll off the waxy leaf, carrying loose dirt away.", helps: true },
      { id: "dry-weather", place: "At the pond with no water drops on the leaf", observation: "Model: The leaf is dry. No drops roll off, so washing dirt away with rain is not happening now.", helps: false },
    ],
    lesson: "The waxy coat helps rolling drops remove dirt when drops are present. It does not make rain.",
  },
  {
    id: "cactus-dry-spell", subject: "Saguaro cactus", photo: "saguaro", trait: "A thick stem for supplying stored water in dry times",
    sourceId: "saguaro-stem",
    scenes: [
      { id: "dry-soil", place: "In a desert during a dry spell", observation: "Model: The roots cannot get enough water from dry soil. Water stored in the stem helps the cactus keep living.", helps: true },
      { id: "wet-soil", place: "In the desert just after rain", observation: "Model: The roots get enough water from wet soil now. Extra water for a dry spell is not needed at this moment.", helps: false },
    ],
    lesson: "Stored water helps when roots cannot get enough. After rain, the cactus can refill its store for later dry times.",
  },
];

export const HABITAT_CASES: HabitatCase[] = cases.map(({ sourceId, lesson, ...entry }) => {
  const fact = ADAPTATIONS.find((adaptation) => adaptation.id === sourceId);
  if (!fact) throw new Error(`Missing habitat source: ${sourceId}`);
  return {
    ...entry,
    explanation: `${lesson} The body trait remains an adaptation in both scenes. The surroundings change whether this job helps now, not the body feature.`,
    source: fact.source,
  };
});
