// The hub minigames — listed here so the Parent Section can gate them.
export interface MinigameDef {
  id: string;
  name: string;
  icon: string;
  sub: string;
  route: string;
}

export const MINIGAMES: MinigameDef[] = [
  { id: "catch", name: "Comet Catch", icon: "🌠", sub: "Tilt to fly!", route: "/catch" },
  { id: "rush", name: "Number Rush", icon: "🏃", sub: "Run, solve, score!", route: "/rush" },
  { id: "surf", name: "Word Surfer", icon: "🏄", sub: "Spell in 3D!", route: "/surf" },
  { id: "critter", name: "Critter Current", icon: "🦉", sub: "Pop the right critters!", route: "/critter" },
  { id: "cube", name: "Cube Coach", icon: "🧊", sub: "Scramble & solve!", route: "/cube" },
  { id: "jump", name: "Jump Jam", icon: "🤸", sub: "Move for real!", route: "/jump" },
  { id: "calc", name: "Calculator", icon: "🧮", sub: "Crunch any number!", route: "/calc" },
  { id: "blaster", name: "Asteroid Arena", icon: "🚀", sub: "Blast the right numbers!", route: "/blaster" },
  { id: "pulse", name: "Pulse Pads", icon: "🟣", sub: "Watch & echo the glow!", route: "/pulse" },
  { id: "ranger", name: "Star Ranger", icon: "🤠", sub: "Roam & zap in 3D!", route: "/ranger" },
  { id: "racer", name: "Turbo Tracks", icon: "🏎️", sub: "Race & solve in 3D!", route: "/racer" },
];
