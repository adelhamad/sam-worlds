// Idiom Island — common sayings & idioms, and what they REALLY mean (figurative
// vs literal language). Matching both ways, finish-the-saying, and apply-to-a-
// situation. All "choices" mode; regenerate-on-miss still applies.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [saying, what it really means]
const IDIOMS: Array<[string, string]> = [
  ["It's raining cats and dogs", "it is raining very hard"],
  ["A piece of cake", "something very easy"],
  ["Break a leg", "good luck!"],
  ["Under the weather", "feeling a little sick"],
  ["Spill the beans", "tell a secret"],
  ["Butterflies in your stomach", "feeling nervous"],
  ["A bookworm", "someone who loves reading"],
  ["Hold your horses", "wait and be patient"],
  ["Hit the hay", "go to sleep"],
  ["Once in a blue moon", "very rarely, almost never"],
  ["Cool as a cucumber", "very calm and relaxed"],
  ["When pigs fly", "something that will never happen"],
  ["A couch potato", "someone who sits around all day"],
  ["Easy peasy", "super duper easy"],
  ["Give me a hand", "help me"],
  ["Hit the books", "study hard"],
  ["A sweet tooth", "a love of sugary treats"],
  ["In hot water", "in trouble"],
  ["Cost an arm and a leg", "very expensive"],
  ["Out of the blue", "as a sudden surprise"],
  ["Two peas in a pod", "two people who are very alike"],
  ["A frog in your throat", "a scratchy voice you can't talk with"],
  ["The apple of my eye", "someone you love very much"],
  ["All ears", "listening very carefully"],
  ["A green thumb", "being great at growing plants"],
  ["A night owl", "someone who stays up late"],
  ["A copycat", "someone who copies others"],
  ["Pull your leg", "tease you with a joke"],
  ["Head in the clouds", "daydreaming and not paying attention"],
  ["Zip your lips", "stay quiet"],
  ["A bull in a china shop", "someone very clumsy"],
  ["Down to earth", "friendly and sensible"],
  ["Bite the bullet", "do something hard and be brave"],
  ["The early bird gets the worm", "starting early helps you do well"],
];

// [sentence with a blank, last word, wrong words]
const FINISH: Array<[string, string, string[]]> = [
  ["It's raining cats and ___!", "dogs", ["frogs", "birds", "cars"]],
  ["This puzzle is a piece of ___.", "cake", ["pie", "bread", "candy"]],
  ["Hold your ___ and wait!", "horses", ["hands", "cows", "ponies"]],
  ["That will happen when pigs ___.", "fly", ["sing", "dance", "swim"]],
  ["She is as cool as a ___.", "cucumber", ["carrot", "pickle", "tomato"]],
  ["We see it once in a blue ___.", "moon", ["sky", "star", "sun"]],
  ["They are two peas in a ___.", "pod", ["pot", "box", "bag"]],
  ["He stays up late — a real night ___.", "owl", ["cat", "bird", "fox"]],
  ["Stop being a couch ___!", "potato", ["pillow", "tomato", "carrot"]],
  ["I'm all ___ — tell me everything!", "ears", ["eyes", "hands", "feet"]],
  ["You're the apple of my ___.", "eye", ["ear", "hand", "heart"]],
  ["Let's hit the ___ and go to sleep.", "hay", ["bed", "books", "road"]],
];

// [situation, the saying that fits, wrong sayings]
const SITUATION: Array<[string, string, string[]]> = [
  ["Sam is nervous before his big show. We say he has…", "butterflies in his stomach", ["a green thumb", "a sweet tooth", "a frog in his throat"]],
  ["This homework is SUPER easy! We say it's…", "a piece of cake", ["raining cats and dogs", "in hot water", "a couch potato"]],
  ["It is pouring rain outside! We say it's…", "raining cats and dogs", ["a piece of cake", "once in a blue moon", "easy peasy"]],
  ["Grandma is amazing at growing flowers. She has…", "a green thumb", ["a sweet tooth", "a frog in her throat", "her head in the clouds"]],
  ["Mia reads books all day long. She is…", "a bookworm", ["a night owl", "a couch potato", "a copycat"]],
  ["Dad wants you to wait patiently. He says…", "Hold your horses!", ["Break a leg!", "Spill the beans!", "Hit the hay!"]],
  ["Leo always copies what others do. He is…", "a copycat", ["a bookworm", "a night owl", "a green thumb"]],
  ["That toy was very, very expensive. It cost…", "an arm and a leg", ["a piece of cake", "a blue moon", "a sweet tooth"]],
  ["Before a play we wish the actors luck by saying…", "Break a leg!", ["Hit the hay!", "Spill the beans!", "Hold your horses!"]],
  ["Ben loves candy and sweets. He has…", "a sweet tooth", ["a green thumb", "a frog in his throat", "his head in the clouds"]],
  ["Please keep the surprise a secret — don't…", "spill the beans", ["break a leg", "hit the books", "hold your horses"]],
  ["It's late and you're tired. Time to…", "hit the hay", ["spill the beans", "pull my leg", "bite the bullet"]],
];

export interface IdiomParams {
  types: Array<"meaning" | "pick" | "finish" | "situation">;
}

let qid = 0;
const id = () => `idm${++qid}`;

export function generateIdioms(params: IdiomParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "pick":
      return genPick(rng);
    case "finish":
      return genFinish(rng);
    case "situation":
      return genSituation(rng);
    default:
      return genMeaning(rng);
  }
}

function genMeaning(rng: RNG): Question {
  const [saying, meaning] = pick(rng, IDIOMS);
  const wrong = shuffle(rng, IDIOMS.filter((p) => p[1] !== meaning)).slice(0, 3);
  return {
    id: id(),
    prompt: `What does this saying really mean?  “${saying}”`,
    answer: meaning,
    choices: shuffle(rng, [meaning, ...wrong.map(([, m]) => m)]),
    hint: "It's not about the real words — picture how someone would use it.",
    inputMode: "choices",
    dedupeKey: `meaning-${saying}`,
  };
}

function genPick(rng: RNG): Question {
  const [saying, meaning] = pick(rng, IDIOMS);
  const wrong = shuffle(rng, IDIOMS.filter((p) => p[0] !== saying)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which saying means “${meaning}”?`,
    answer: saying,
    choices: shuffle(rng, [saying, ...wrong.map(([s]) => s)]),
    hint: "Think about the saying people really use for that.",
    inputMode: "choices",
    dedupeKey: `pick-${saying}`,
  };
}

function genFinish(rng: RNG): Question {
  const [clue, word, wrong] = pick(rng, FINISH);
  return {
    id: id(),
    prompt: `Finish the saying:  ${clue}`,
    answer: word,
    choices: shuffle(rng, [word, ...wrong]),
    hint: "Sayings always end the same way — which word fits?",
    inputMode: "choices",
    dedupeKey: `finish-${clue}`,
  };
}

function genSituation(rng: RNG): Question {
  const [scene, saying, wrong] = pick(rng, SITUATION);
  return {
    id: id(),
    prompt: scene,
    answer: saying,
    choices: shuffle(rng, [saying, ...wrong]),
    hint: "Which saying matches what's happening?",
    inputMode: "choices",
    dedupeKey: `situation-${scene}`,
  };
}
