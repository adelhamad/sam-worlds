// Manners Manor — etiquette, magic words, kindness, being a nice person.
// Situational matching: pick the polite / kind / right thing to do.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

type QA = [string, string, string[]];

// Magic words & polite phrases
const MAGIC: QA[] = [
  ["You want another cookie. What do you say?", "Please", ["Now!", "Give me one", "Cookie!"]],
  ["Grandma gives you a present. You say…", "Thank you", ["Whatever", "More!", "Is that all?"]],
  ["You bump into someone by accident. You say…", "Sorry", ["Move!", "Ha ha", "Your fault"]],
  ["You need to walk past some people. You say…", "Excuse me", ["Out of my way", "Move it", "Hey you"]],
  ["A friend helps you carry your bag. You say…", "Thank you", ["Finally", "About time", "Took you long"]],
  ["Someone says thank you to you. You reply…", "You're welcome", ["Obviously", "Duh", "Whatever"]],
  ["You want the salt at dinner. You say…", "Please pass the salt", ["Gimme the salt", "Salt — now!", "Throw it here"]],
  ["You want to ask the teacher something. You…", "raise your hand", ["shout it out", "stand on a chair", "whistle loudly"]],
  ["You sneeze loudly at the table. You say…", "Excuse me", ["So what?", "That was a big one!", "nothing at all"]],
  ["You answer the phone politely. You say…", "Hello, who's calling?", ["What do you want?", "Who's this?!", "Why are you calling?"]],
];

// What's the kind thing to do?
const KIND: QA[] = [
  ["Your friend fell down and is hurt. You…", "help them up and ask if they're okay", ["laugh at them", "walk away", "keep playing"]],
  ["A new kid has no one to play with. You…", "ask them to join you", ["ignore them", "point and stare", "tell them to go away"]],
  ["Your friend is sad. You…", "ask what's wrong and listen", ["tell them to stop", "make fun of them", "leave"]],
  ["You have one toy and a friend wants a turn. You…", "take turns and share", ["keep it all day", "hide it", "say no way"]],
  ["Someone shares their snack with you. You…", "say thank you and share back sometime", ["grab it all", "say it's gross", "ask for more"]],
  ["Your little brother drew you a picture. You…", "say thank you, it's lovely", ["say it's ugly", "throw it away", "ignore him"]],
  ["A classmate gets the answer wrong. You…", "be kind and encouraging", ["call them silly", "laugh out loud", "tell everyone"]],
  ["Grandpa is carrying heavy bags. You…", "offer to help", ["run ahead", "watch and wait", "ask for a treat"]],
  ["Your friend wins the game and you lose. You…", "say well done!", ["get angry and quit", "say they cheated", "knock over the board"]],
  ["Someone drops their books in the hall. You…", "help pick them up", ["step over them", "kick them away", "laugh"]],
];

// Table manners & everyday politeness
const TABLE: QA[] = [
  ["At the dinner table you should…", "chew with your mouth closed", ["talk with food in your mouth", "grab food off others' plates", "put feet on the table"]],
  ["Before eating you should…", "wash your hands", ["sneeze on the food", "pet the dog", "skip it"]],
  ["When you finish your meal you say…", "May I leave the table, please?", ["I'm done, bye!", "nothing, just run", "this was gross"]],
  ["When someone is talking, you should…", "listen and wait your turn", ["interrupt them", "talk louder", "walk off"]],
  ["You knock on a closed door and…", "wait to be invited in", ["barge straight in", "bang loudly", "open it slowly to peek"]],
  ["If you make a mess, you should…", "clean it up", ["leave it for others", "blame someone", "hide it"]],
  ["When you get a gift you don't love, you…", "still say thank you", ["say you hate it", "throw it down", "ask for money instead"]],
  ["Borrowing a friend's toy, you should…", "ask first and give it back", ["just take it", "keep it forever", "break it"]],
  ["When a grown-up greets you, you…", "look up and say hello", ["ignore them", "hide", "stick out your tongue"]],
  ["At the library you should…", "use a quiet voice", ["shout across the room", "run around", "rip the books"]],
];

export interface MannersParams {
  types: Array<"magic" | "kind" | "table">;
}

let qid = 0;
const id = () => `mn${++qid}`;

function qa(rng: RNG, prompt: string, answer: string, wrong: string[], hint: string, dedupe: string): Question {
  return {
    id: id(),
    prompt,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint,
    inputMode: "choices",
    dedupeKey: dedupe,
  };
}

export function generateManners(params: MannersParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "kind") {
    const [p, a, w] = pick(rng, KIND);
    return qa(rng, p, a, w, "What would a kind friend do?", `kind-${p}`);
  }
  if (type === "table") {
    const [p, a, w] = pick(rng, TABLE);
    return qa(rng, p, a, w, "Think about good manners.", `table-${p}`);
  }
  const [p, a, w] = pick(rng, MAGIC);
  return qa(rng, p, a, w, "Remember your magic words.", `magic-${p}`);
}
