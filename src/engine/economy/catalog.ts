// The Workshop. Decorations appear permanently in the base scene; coupons are
// REAL-WORLD rewards Sam shows to Daddy (buyable again and again).
export interface ShopItem {
  id: string;
  name: string;
  icon: string;
  cost: number;
  blurb: string;
  kind: "deco" | "coupon";
  /** Coupon text: "Tell Daddy: I earned <reward>!" */
  reward?: string;
}

export const CATALOG: ShopItem[] = [
  // decorations
  { id: "lamp", kind: "deco", name: "Cozy Forge Lamp", icon: "🪔", cost: 40, blurb: "Warm light for the base" },
  { id: "plant", kind: "deco", name: "Star Fern", icon: "🪴", cost: 60, blurb: "It grows toward the stars" },
  { id: "poster", kind: "deco", name: "Rocket Poster", icon: "🚀", cost: 50, blurb: "For the wall of dreams" },
  { id: "rug", kind: "deco", name: "Nebula Rug", icon: "🟪", cost: 80, blurb: "Soft as a cloud of gas" },
  { id: "garden", kind: "deco", name: "Sun Garden", icon: "🌻", cost: 110, blurb: "Flowers in space? Yes!" },
  { id: "window", kind: "deco", name: "Comet Window", icon: "🌠", cost: 120, blurb: "Watch comets fly past" },
  { id: "starmap", kind: "deco", name: "Star Map", icon: "🗺️", cost: 130, blurb: "Chart your worlds" },
  { id: "bot", kind: "deco", name: "Mini Bot Buddy", icon: "🤖", cost: 150, blurb: "It beeps when you win" },
  { id: "disco", kind: "deco", name: "Disco Moon", icon: "🪩", cost: 160, blurb: "Party lighting, engaged" },
  { id: "aquarium", kind: "deco", name: "Space Aquarium", icon: "🐠", cost: 180, blurb: "Star-fish, literally" },
  { id: "telescope", kind: "deco", name: "Grand Telescope", icon: "🔭", cost: 200, blurb: "See the next world" },
  { id: "drumkit", kind: "deco", name: "Thunder Drums", icon: "🥁", cost: 220, blurb: "For victory solos" },
  // Daddy Rewards — real-world coupons
  { id: "roblox20", kind: "coupon", name: "Roblox Pass", icon: "🎮", cost: 300, blurb: "20 minutes of Roblox!", reward: "20 minutes of Roblox" },
  { id: "roblox45", kind: "coupon", name: "Roblox Pass XL", icon: "🕹️", cost: 600, blurb: "45 minutes of Roblox!", reward: "45 minutes of Roblox" },
  { id: "movie", kind: "coupon", name: "Movie Night Pick", icon: "🍿", cost: 450, blurb: "You choose movie night!", reward: "picking tonight's movie" },
  { id: "icecream", kind: "coupon", name: "Ice Cream Trip", icon: "🍦", cost: 500, blurb: "A trip for ice cream!", reward: "an ice cream trip" },
];

export function itemById(id: string): ShopItem | undefined {
  return CATALOG.find((i) => i.id === id);
}
