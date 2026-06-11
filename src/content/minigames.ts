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
  { id: "code", name: "Code Quest", icon: "🔮", sub: "Crack the secret code!", route: "/code" },
  { id: "maze", name: "Marble Maze", icon: "🌀", sub: "Tilt and roll!", route: "/maze" },
];
