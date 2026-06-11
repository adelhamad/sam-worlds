import { persona } from "../../persona.config";

// Story pointer per world: a beat every ~10 stages; sessions end on a tease.
export interface StoryBeat {
  afterStage: number; // active once this many stages in the world are done
  text: string;
  tease: string;
}

const NUMBER_FORGE: StoryBeat[] = [
  { afterStage: 0, text: "The Number Forge is dark and silent.", tease: `Light the first gate, ${persona.title} ${persona.name}!` },
  { afterStage: 5, text: "The old machines hum back to life.", tease: "Something moves deeper in the Forge…" },
  { afterStage: 10, text: "A huge locked door appears!", tease: "It only opens for bigger numbers…" },
  { afterStage: 15, text: "Strange number patterns glow on the walls.", tease: "They look like… a message?" },
  { afterStage: 20, text: "Behind the Master Door: a hall of spinning gears!", tease: "The gears multiply everything they touch…" },
  { afterStage: 30, text: "The Pattern Gate opens with a deep rumble.", tease: "Something huge is running the engine core…" },
  { afterStage: 40, text: "The Engine Core! It splits numbers into pieces.", tease: "Equations guard the deepest vault…" },
  { afterStage: 50, text: "The vault is open. One door remains.", tease: "The Forge Master himself is waiting…" },
  { afterStage: 55, text: "The Forge sings! Its signal beams into space.", tease: "It sounds like music… follow it to the Melody Engine!" },
];

const WORLD_BEATS: Record<string, StoryBeat[]> = {
  numberforge: NUMBER_FORGE,
  melody: [
    { afterStage: 0, text: "A great engine that runs on music sits silent.", tease: "Play back its first echo…" },
    { afterStage: 10, text: "The engine hums along with you now.", tease: "It wants chords — real harmony…" },
    { afterStage: 20, text: "Pipes and strings join in, a whole orchestra!", tease: "Can you carry its tune to a new key?" },
    { afterStage: 32, text: "The Melody Engine sings on its own!", tease: "Its song powers the whole base now." },
  ],
  logic: [
    { afterStage: 0, text: "Dark lamps line the redstone halls.", tease: "One switch can wake them…" },
    { afterStage: 10, text: "Gates click and glow in sequence.", tease: "The deep circuits twist stranger…" },
    { afterStage: 20, text: "A vault door wired with XOR riddles!", tease: "Only a Circuit Master can crack it…" },
    { afterStage: 32, text: "Every lamp in the valley shines!", tease: "The grid feeds the whole base." },
  ],
  robot: [
    { afterStage: 0, text: "A little miner-bot blinks awake.", tease: "It needs YOUR program to move…" },
    { afterStage: 10, text: "The bot digs deeper than ever.", tease: "Diamonds glitter in twisty caves…" },
    { afterStage: 20, text: "Bedrock mazes block the way!", tease: "Only perfect programs get through…" },
    { afterStage: 32, text: "The bot found the Diamond Throne!", tease: "It beeps your name proudly." },
  ],
  time: [
    { afterStage: 0, text: "The great clock tower has stopped.", tease: "Set the hands and wake it…" },
    { afterStage: 10, text: "Bells ring across the valley again.", tease: "The star-train needs a timetable…" },
    { afterStage: 20, text: "Trains arrive exactly on time!", tease: "But the midnight ride is tricky…" },
    { afterStage: 32, text: "Time flows perfectly through the Keep!", tease: "You are the Keeper of Hours." },
  ],
  cipher: [
    { afterStage: 0, text: "Strange signals wash onto the bay.", tease: "The first code is simple… A=1." },
    { afterStage: 10, text: "The messages slide and shift!", tease: "Someone is hiding something big…" },
    { afterStage: 20, text: "Symbols now — a whole secret alphabet!", tease: "The final message names a place…" },
    { afterStage: 32, text: "The last code reveals: 'WELL DONE, CAPTAIN.'", tease: "Cipher Bay keeps no secrets from you." },
  ],
  builder: [
    { afterStage: 0, text: "Planks, levers and one rusty cannon.", tease: "Balance the first beam…" },
    { afterStage: 10, text: "The TNT cannon roars to life!", tease: "Targets appear across the canyon…" },
    { afterStage: 20, text: "Precision shots only from here on.", tease: "The grand machine needs a master…" },
    { afterStage: 32, text: "The grand machine stands complete!", tease: "Master Builder — that's you." },
  ],
  living: [
    { afterStage: 0, text: "A wild green planet, waiting to be understood.", tease: "Every life moves in circles…" },
    { afterStage: 10, text: "You can read the food chains now.", tease: "Who eats whom in the deep sea?" },
    { afterStage: 20, text: "Animals trust you with their secrets.", tease: "The codex is almost full…" },
    { afterStage: 32, text: "The Living Planet hums in balance!", tease: "Guardian of the wild — forever." },
  ],
  flags: [
    { afterStage: 0, text: "A hall of empty flagpoles waits.", tease: "Every land has its colors…" },
    { afterStage: 10, text: "Banners ripple above the base!", tease: "Some flags are nearly twins…" },
    { afterStage: 20, text: "Your sharp eyes catch every stripe.", tease: "The trickiest look-alikes remain…" },
    { afterStage: 32, text: "Every flag flies proudly!", tease: "The whole world salutes you, Captain." },
  ],
  atlas: [
    { afterStage: 0, text: "An empty atlas and a sky full of worlds.", tease: "Start with our own Sun…" },
    { afterStage: 10, text: "Planets mapped! Now the lands below.", tease: "Wonders hide on every continent…" },
    { afterStage: 20, text: "Colors, creatures, countries — all charted.", tease: "Only history's timeline remains…" },
    { afterStage: 32, text: "The Atlas is complete!", tease: "Every world remembers its Explorer." },
  ],
};

export function activeBeat(worldId: string, completedInWorld: number): StoryBeat {
  const beats = WORLD_BEATS[worldId] ?? WORLD_BEATS.numberforge;
  let beat = beats[0];
  for (const b of beats) {
    if (completedInWorld >= b.afterStage) beat = b;
  }
  return beat;
}

export function cliffhanger(worldId: string, completedInWorld: number): string {
  return activeBeat(worldId, completedInWorld).tease;
}
