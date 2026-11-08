import type { DetectiveCard } from "./detectiveTypes";
import { ADAPTATIONS } from "./examples";

const INHERITANCE = "https://www.nextgenscience.org/pe/3-ls3-1-heredity-inheritance-and-variation-traits";
const ENVIRONMENT = "https://www.nextgenscience.org/pe/3-ls3-2-heredity-inheritance-and-variation-traits";
const ADAPTATION = "https://evolution.berkeley.edu/evolution-101/mechanisms-the-processes-of-evolution/adaptation/";
const BODY = "https://www.nextgenscience.org/pe/1-ls1-1-molecules-organisms-structures-and-processes";

// Pictures identify subjects, not events, objects, or every named body detail.
// NGSS references support the principles in the illustrative family/change cases;
// these cases are supplied evidence, not claims of studies of the photographed subjects.
// "Unknown" means the supplied clues do not establish an inherited helpful feature.
// Learned behavior can be called a trait more broadly; this collection is BODY traits.
const helpful: [id: string, photo: string, title: string, clue: string][] = [
  ["duck-feet", "duck", "Skin between a duck's toes", "Families of ducks have skin joining their toes. It helps them push water when swimming."],
  ["beaver-teeth", "beaver", "A beaver's big front teeth", "Families of beavers have big front teeth. They help beavers bite through wood for food and building."],
  ["tortoise-shell", "tortoise", "A tortoise's hard shell", "Families of tortoises have hard shells. A shell helps protect the body from bites."],
  ["saguaro-stem", "saguaro", "A cactus's thick stem", "Families of saguaro cactuses have thick stems. These stems store water that helps the plants live through dry times."],
  ["stick-insect-shape", "stick-insect", "A twig-shaped body", "Families of stick insects have twig-shaped bodies. This shape helps them hide from hunters among small branches."],
  ["dolphin-blowhole", "dolphin", "A dolphin's breathing hole", "Families of dolphins have breathing holes on their heads. These holes let them breathe air at the water's surface."],
  ["giraffe-neck", "giraffe", "A giraffe's long neck", "Families of giraffes have long necks. Their necks help them reach leaves high in trees for food."],
  ["woodpecker-beak", "woodpecker", "A woodpecker's strong beak", "Families of woodpeckers have strong pointed beaks. Their beaks help them chip wood to reach food and make nest holes."],
  ["hummingbird-bill", "hummingbird", "A hummingbird's thin beak", "Families of hummingbirds have long thin beaks. These help them reach sweet juice inside flowers for food."],
  ["anteater-tongue", "anteater", "An anteater's sticky tongue", "Families of giant anteaters have long sticky tongues. Their tongues help them pick up ants inside nests for food."],
  ["whale-baleen", "whale", "Filters in a whale's mouth", "Families of humpback whales have filters in their mouths. These help catch small animals from water for food."],
  ["eagle-beak", "eagle", "An eagle's curved beak", "Families of bald eagles have curved sharp beaks. Their beaks help them tear meat into pieces they can eat."],
  ["camel-feet", "camel", "A camel's wide feet", "Families of camels have wide feet with soft pads. These help them walk across loose sand without sinking deeply."],
  ["porcupine-quills", "porcupine", "A porcupine's sharp spikes", "Families of porcupines grow sharp spikes. These help protect them by pricking animals that get too close."],
  ["octopus-suckers", "octopus", "Suckers on an octopus's arms", "Families of giant Pacific octopuses have suckers on their arms. These help them hold slippery food."],
  ["chameleon-tail", "chameleon", "A chameleon's gripping tail", "Families of veiled chameleons have gripping tails. Their tails help them hold branches while climbing."],
  ["dandelion-seeds", "dandelion", "Fluffy tops on seeds", "Families of dandelions grow seeds with fluffy tops. These help wind carry seeds to new growing places."],
  ["burdock-burrs", "burdock", "Hooks around burdock seeds", "Families of burdock plants grow hooks around their seeds. These help seeds travel to new places on passing animals' fur."],
  ["coconut-husk", "coconut", "A coconut's thick outer coat", "Families of coconut palms grow seeds with thick outer coats. These help the seeds float to new places on water."],
  ["lotus-leaves", "lotus", "A lotus leaf's waxy coat", "Families of lotus plants grow leaves with waxy coats. These help rain roll dirt off the leaves."],
];

const adaptations: DetectiveCard[] = helpful.map(([id, photo, title, clue]) => {
  const fact = ADAPTATIONS.find((entry) => entry.id === id);
  if (!fact) throw new Error(`Missing adaptation source: ${id}`);
  return {
    id, photo, title, clue, collection: "adaptation", origin: "parents",
    explanation: `This body feature is a trait and also an adaptation. It comes from parents and helps the ${fact.organism} ${fact.job} in ${fact.place}.`,
    source: fact.source,
  };
});

const familyFeatures: [id: string, photo: string, title: string, clue: string][] = [
  ["kitten-stripes", "kitten", "A kitten's striped fur", "This kitten's striped coat comes from its parents. We have no clue about how these stripes help it live."],
  ["puppy-ears", "puppy", "A puppy's floppy ears", "This puppy's floppy ear shape comes from its parents. The clues tell us nothing about a helpful job for that shape."],
  ["oak-leaf-edges", "oak", "Rounded edges on oak leaves", "This oak's rounded leaf edges come from its parents. No clue tells us how the rounded edges help it live."],
  ["maple-seed-wings", "maple", "Papery wings on maple seeds", "This maple grows winged seeds like its parents. We have not been given clues about what the wings do."],
  ["robin-feathers", "robin", "A robin's breast color", "This robin's orange-red breast color comes from its parents. We have no clue about a helpful job for this color."],
  ["rabbit-ears", "rabbit", "A rabbit's long ears", "This rabbit's long ear shape comes from its parents. We have no clue yet about how that shape helps."],
  ["zebra-stripes", "zebra", "A zebra's striped coat", "This zebra's striped coat comes from its parents. The clues do not tell us how the stripes help it live."],
  ["spider-legs", "garden-spider", "A spider's eight legs", "This spider grew eight legs like its parents. No clue compares how having eight legs helps it live."],
  ["dog-white-coat", "dog", "A dog's white fur", "This dog's white coat color comes from its parents. We have no clue that this color helps it live."],
  ["horse-brown-coat", "horse", "A horse's brown coat", "This horse's brown coat color comes from its parents. We have no clue about a helpful job for this color."],
  ["rose-red-petals", "rose", "A rose's red petals", "This rose's red petal color comes from its parents. No clue tells us whether this color helps the plant make seeds."],
  ["daisy-white-petals", "flower", "A daisy's white petals", "This daisy's white petal color comes from its parents. No clue tells us whether this color helps the plant live or make seeds."],
  ["sunflower-yellow-petals", "sunflower", "A sunflower's yellow petals", "This sunflower's yellow petal color comes from its parents. We have no clue about a helpful job for this color."],
  ["parrot-red-feathers", "parrot", "A parrot's red feathers", "This parrot's red feather color comes from its parents. We have no clue about how that color helps it live."],
  ["bean-pod-shape", "bean", "A bean plant's long pods", "This bean plant's long pod shape comes from its parents. No clue tells us how that shape helps the plant."],
  ["cabbage-wrinkled-leaves", "cabbage", "A cabbage's wrinkled leaves", "This cabbage's wrinkled leaf surface comes from its parents. No clue tells us how the wrinkles help the plant live."],
];

const inheritedUnknown: DetectiveCard[] = familyFeatures.map(([id, photo, title, clue]) => ({
  id, photo, title, clue, collection: "unknown", origin: "parents",
  explanation: "This is an inherited body trait. We have not shown that it is an adaptation. Scientists need clues about its history and how it helps living things survive or have young.",
  source: INHERITANCE,
}));

// Eight practiced skills and eight bodily changes adapted from OBSERVATIONS.
const practiced: [id: string, photo: string, title: string, clue: string][] = [
  ["learned-dog-sit", "dog", "Sitting when asked", "A dog learns to sit when someone says a new word. Lessons teach it what the word means."],
  ["learned-dog-fetch", "dog", "Fetching a named toy", "A dog learns a toy's name during lessons. Then it brings that toy when asked."],
  ["learned-parrot", "parrot", "Saying hello after listening", "A parrot learns to say hello after hearing people say it many times."],
  ["learned-horse", "horse", "Following a new signal", "A horse follows a new signal after lessons. Someone taught it what that signal means."],
  ["learned-reading", "child", "Reading a new word", "A child reads a new word after lessons and practice."],
  ["learned-piano", "child", "Playing a piano tune", "A child practices a piano tune. Practice helps the child play the tune."],
  ["learned-bike", "child", "Riding a bike", "A child learns to balance on a bike through lessons and practice."],
  ["learned-swimming", "child", "Learning a swimming move", "A child learns a new swimming move during lessons. The child practices that move."],
];

const learned: DetectiveCard[] = practiced.map(([id, photo, title, clue]) => ({
  id, photo, title, clue, collection: "outside", origin: "practice",
  explanation: "This is a learned skill, not an inherited body feature. It belongs outside our body-trait collection. Learning this skill does not make it an inherited body adaptation.",
  source: ADAPTATION,
}));

const changedFeatures: [id: string, photo: string, title: string, clue: string][] = [
  ["acquired-haircut", "child", "Shorter hair after a haircut", "A child has shorter hair after a haircut. Cutting changed the hair's length."],
  ["acquired-scrape", "child", "A scraped knee after a fall", "A child falls and scrapes a knee. The fall changed the skin."],
  ["acquired-scar", "child", "A scar after a cut heals", "A child has a scar where a cut healed. The mark appeared after the injury."],
  ["acquired-cat-grooming", "cat", "Shorter fur after a trim", "A cat has shorter fur after someone trims it. Cutting changed the fur's length."],
  ["acquired-dog-claws", "dog", "Shorter claws after a trim", "A dog has shorter claws after someone trims them. The trim changed their length."],
  ["acquired-leaf-hole", "cabbage", "Leaf holes after caterpillar bites", "A cabbage has holes in its leaves after caterpillars bite them. The bites changed the leaves."],
  ["acquired-tree-scar", "tree", "A scar where a branch broke", "A tree has a scar where a branch broke. The break left a mark on its trunk."],
  ["acquired-bent-stem", "sunflower", "A stem bent by wind", "A sunflower has a bent stem after strong wind. The wind changed the stem's shape."],
];

const changed: DetectiveCard[] = changedFeatures.map(([id, photo, title, clue]) => ({
  id, photo, title, clue, collection: "changed", origin: "change",
  explanation: "This changed body feature is a trait. This particular change happened during life; it is not an inherited adaptation. We would need different evidence for an inherited helpful feature.",
  source: ENVIRONMENT,
}));

// The named object is the sorting target. Portraits do not assert it is visible.
const objects: [id: string, photo: string, title: string, clue: string][] = [
  ["object-raincoat", "child", "A child's raincoat", "Think about a raincoat a child can put on and take off. It can keep rain off the child."],
  ["object-boots", "child", "A child's rain boots", "Think about rain boots a child can wear in puddles. The child takes them off afterward."],
  ["object-hat", "child", "A child's sun hat", "Think about a hat a child wears for shade. The child can take the hat off."],
  ["object-gloves", "child", "A child's gloves", "Think about gloves a child puts on in cold weather. The gloves can be taken off."],
  ["object-glasses", "child", "A child's glasses", "Think about glasses a child wears to see clearly. The child can take the glasses off."],
  ["object-backpack", "child", "A child's backpack", "Think about a backpack a child carries to school. The child can put it down."],
  ["object-umbrella", "child", "A child's umbrella", "Think about an umbrella a child holds in rain. The child can fold it and put it away."],
  ["object-bike-helmet", "child", "A child's bike helmet", "Think about a helmet a child wears while riding. The child can take the helmet off."],
  ["object-dog-collar", "dog", "A dog's collar", "Think about a collar someone puts around a dog's neck. The collar can be removed."],
  ["object-dog-bowl", "dog", "A dog's water bowl", "Think about a bowl holding water for a dog. Someone can pick up the bowl and move it."],
  ["object-horse-blanket", "horse", "A horse's blanket", "Think about a blanket someone puts on a horse. Someone can take the blanket off."],
  ["object-plant-pot", "houseplant", "A houseplant's pot", "Think about a pot holding a plant. A gardener can move the plant into another pot."],
];

const outsideObjects: DetectiveCard[] = objects.map(([id, photo, title, clue]) => ({
  id, photo, title, clue, collection: "outside",
  explanation: "The named object is not part of a living body, so it is outside our body-trait collection. An object can help without being a body trait or an inherited adaptation.",
  source: BODY,
}));

export const DETECTIVE_CARDS: DetectiveCard[] = [
  ...adaptations, ...inheritedUnknown, ...learned, ...changed, ...outsideObjects,
];
