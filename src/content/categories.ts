// Subject categories for the hub's filter chips. Every world id maps to one
// category so the 71-world grid stays navigable.
export interface Category {
  key: string;
  label: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { key: "all", label: "All", icon: "🌌" },
  { key: "math", label: "Math", icon: "🔢" },
  { key: "reading", label: "Reading", icon: "🔤" },
  { key: "science", label: "Science", icon: "🔬" },
  { key: "world", label: "World", icon: "🌍" },
  { key: "life", label: "Life", icon: "💡" },
  { key: "creative", label: "Creative", icon: "🎨" },
];

export const WORLD_CATEGORY: Record<string, string> = {
  // math
  numberforge: "math", time: "math", algebra: "math", placevalue: "math", money: "math",
  shapes: "math", measure: "math", primes: "math", binary: "math", fractions: "math",
  calendar: "math", patterns: "math", compare: "math", data: "math", roman: "math", ordinals: "math",
  // reading
  cipher: "reading", arabic: "reading", wordwizard: "reading", affix: "reading", grammar: "reading",
  prepositions: "reading", phonics: "reading", idioms: "reading", synonyms: "reading",
  punctuation: "reading", story: "reading", compounds: "reading",
  // science
  living: "science", body: "science", physics: "science", chemistry: "science", elements: "science",
  space: "science", dinos: "science", weather: "science", animals: "science", ocean: "science",
  garden: "science", bugs: "science", machines: "science", rocks: "science", habitats: "science", birds: "science",
  // world / geography
  atlas: "world", flags: "world", directions: "world", cultures: "world", transport: "world", landforms: "world",
  // life skills
  feelings: "life", manners: "life", safety: "life", helpers: "life", green: "life", nutrition: "life",
  moneysmarts: "life", town: "life", chef: "life", thennow: "life", family: "life", pets: "life",
  // creative / play
  melody: "creative", logic: "creative", robot: "creative", builder: "creative", craft: "creative",
  colors: "creative", instruments: "creative", riddles: "creative", sports: "creative",
};

export function categoryOf(worldId: string): string {
  return WORLD_CATEGORY[worldId] ?? "creative";
}
