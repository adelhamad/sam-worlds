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
  craft: [
    { afterStage: 0, text: "A blocky cavern echoes with pickaxe sounds.", tease: "Do you really know your mobs?" },
    { afterStage: 10, text: "Every mob's secret is in your head now!", tease: "The crafting grids hold patterns…" },
    { afterStage: 20, text: "You read crafting grids like a book!", tease: "What treasure does each mob drop…?" },
    { afterStage: 40, text: "From desert to Nether, you know every biome!", tease: "The deepest lore awaits…" },
    { afterStage: 55, text: "The cavern bows to a true crafter.", tease: "Netherite Master — you know it ALL!" },
  ],
  wordwizard: [
    { afterStage: 0, text: "A library of glowing words hums quietly.", tease: "Some words sound like twins…" },
    { afterStage: 10, text: "Scrambled letters tumble off the shelves!", tease: "Can you put them back in order?" },
    { afterStage: 30, text: "The longest words shimmer into view.", tease: "Only a true word-smith can spell these…" },
    { afterStage: 55, text: "Every word obeys your wand!", tease: "Master of Words — well read, Captain!" },
  ],
  body: [
    { afterStage: 0, text: "A giant friendly body model lights up.", tease: "What makes your heart go thump?" },
    { afterStage: 10, text: "Your five senses switch on one by one!", tease: "Deeper inside, the organs are working…" },
    { afterStage: 30, text: "You can trace food's whole journey now.", tease: "Healthy habits unlock the last doors…" },
    { afterStage: 55, text: "You understand the whole body!", tease: "Junior doctor no more — Body Master!" },
  ],
  feelings: [
    { afterStage: 0, text: "Friendly faces peek from the forest trees.", tease: "Can you tell happy from sad?" },
    { afterStage: 10, text: "The faces tell little stories now.", tease: "How would YOU feel in each one?" },
    { afterStage: 30, text: "When feelings get big, you stay calm.", tease: "Kindness opens the deepest paths…" },
    { afterStage: 55, text: "You read every heart in the forest!", tease: "Master of Hearts — kind and wise." },
  ],
  affix: [
    { afterStage: 0, text: "A workshop full of word-parts on hooks.", tease: "Snap a front-part onto a word…" },
    { afterStage: 10, text: "End-parts join the shelves too!", tease: "Each part changes the meaning…" },
    { afterStage: 30, text: "You can find the root hiding in any word.", tease: "Master builders snap it all together…" },
    { afterStage: 55, text: "Every word obeys your toolbox!", tease: "Master of Word Parts — well built!" },
  ],
  grammar: [
    { afterStage: 0, text: "Words float in the Grammar Galaxy, unsorted.", tease: "Which are naming words? Which are actions?" },
    { afterStage: 10, text: "Now the words multiply — one becomes many!", tease: "Some change in surprising ways…" },
    { afterStage: 30, text: "You can send words into the past!", tease: "Whole sentences await a grammar master…" },
    { afterStage: 55, text: "The galaxy reads perfectly!", tease: "Master of Grammar — beautifully said." },
  ],
  arabic: [
    { afterStage: 0, text: "A quiet garden where letters grow on trees.", tease: "The first letters are sprouting…" },
    { afterStage: 10, text: "The garden hums with new sounds!", tease: "Soon the letters will join into words…" },
    { afterStage: 20, text: "Words bloom — built letter by letter!", tease: "Arabic numbers hide among the flowers…" },
    { afterStage: 40, text: "You read the garden like a book.", tease: "The longest words wait at the gate…" },
    { afterStage: 55, text: "The whole garden reads with you!", tease: "ما شاء الله — Master of Letters!" },
  ],
  atlas: [
    { afterStage: 0, text: "An empty atlas and a sky full of worlds.", tease: "Start with our own Sun…" },
    { afterStage: 10, text: "Planets mapped! Now the lands below.", tease: "Wonders hide on every continent…" },
    { afterStage: 20, text: "Colors, creatures, countries — all charted.", tease: "Only history's timeline remains…" },
    { afterStage: 32, text: "The Atlas is complete!", tease: "Every world remembers its Explorer." },
  ],
  prepositions: [
    { afterStage: 0, text: "A playground where everything has its place.", tease: "Is the cat ON the box… or UNDER it?" },
    { afterStage: 10, text: "You can say exactly where anything is!", tease: "Now the sentences need you…" },
    { afterStage: 30, text: "Over, under, through — words bend for you.", tease: "The trickiest spots are still hidden…" },
    { afterStage: 55, text: "Every corner of the park is mapped!", tease: "Master of Places — perfectly put." },
  ],
  directions: [
    { afterStage: 0, text: "A foggy cove where travelers get lost.", tease: "Which way is LEFT again?" },
    { afterStage: 10, text: "You guide friends through every grid!", tease: "But which way is NORTH…?" },
    { afterStage: 30, text: "The old compass spins to life in your hand.", tease: "Storms twist and turn ahead…" },
    { afterStage: 55, text: "No one gets lost in the cove anymore!", tease: "Master Navigator — true north found." },
  ],
  physics: [
    { afterStage: 0, text: "A workshop of ramps, magnets and bathtubs.", tease: "Will it sink… or float?" },
    { afterStage: 10, text: "The magnet hums — it only loves iron!", tease: "Push or pull? The machines need force…" },
    { afterStage: 30, text: "You feel gravity tugging everything down.", tease: "Light and shadows play tricks upstairs…" },
    { afterStage: 55, text: "The whole lab tinkers to your tune!", tease: "Master Tinkerer — forces obey you." },
  ],
  chemistry: [
    { afterStage: 0, text: "Bubbling beakers line the potion shelves.", tease: "Solid, liquid… or gas?" },
    { afterStage: 10, text: "You melt and freeze like a pro!", tease: "Some powders vanish in water…" },
    { afterStage: 30, text: "Dissolving holds no secrets for you.", tease: "The fizzy mixtures wait for a master…" },
    { afterStage: 55, text: "The Potion Lab sparkles with your skill!", tease: "Master Chemist — safely, always." },
  ],
  algebra: [
    { afterStage: 0, text: "Boxes with hidden numbers ride the trains.", tease: "▢ + 3 = 7… what hides inside?" },
    { afterStage: 10, text: "No box can hide its number from you!", tease: "The fruit codes look trickier…" },
    { afterStage: 30, text: "Two-step codes crack under your pencil.", tease: "The times box multiplies the mystery…" },
    { afterStage: 55, text: "Every equation balances perfectly!", tease: "Master of Equations — x marks YOU." },
  ],
  primes: [
    { afterStage: 0, text: "A mountain of numbers towers ahead.", tease: "The lower slopes need your times tables…" },
    { afterStage: 10, text: "You climb the multiplication ridge!", tease: "Caves of division open higher up…" },
    { afterStage: 30, text: "Square stones pave the path now.", tease: "Strange lonely numbers guard the peak…" },
    { afterStage: 55, text: "You stand atop Prime Peaks!", tease: "Grandmaster of factors and primes." },
  ],
  binary: [
    { afterStage: 0, text: "A dark beacon waits for a code of 0s and 1s.", tease: "Light it with your first bits…" },
    { afterStage: 10, text: "The beacon flickers awake!", tease: "Now WRITE numbers in binary…" },
    { afterStage: 30, text: "You add and count in base two!", tease: "The signal grows stronger…" },
    { afterStage: 55, text: "The Beacon blazes across space!", tease: "You think like a computer now." },
  ],
  fractions: [
    { afterStage: 0, text: "A factory of pies and bars hums to life.", tease: "Read the very first slice…" },
    { afterStage: 10, text: "You take fractions of any number!", tease: "Twin fractions hide on the line…" },
    { afterStage: 30, text: "You add and simplify like a pro.", tease: "A bridge to decimals appears…" },
    { afterStage: 55, text: "Every slice obeys you!", tease: "Fraction Master — perfectly even." },
  ],
  elements: [
    { afterStage: 0, text: "A gleaming lab of bottled elements.", tease: "Learn the first symbols…" },
    { afterStage: 10, text: "You build molecules from atoms!", tease: "Peer INSIDE the atom itself…" },
    { afterStage: 30, text: "Protons, neutrons, electrons — all clear.", tease: "The gas experiments bubble away…" },
    { afterStage: 55, text: "The whole lab answers to you!", tease: "Master Chemist — safely brilliant." },
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
