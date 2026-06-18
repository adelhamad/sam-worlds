// The Workshop sells Daddy Rewards: REAL-WORLD coupons Sam earns with Star
// Dust and shows to Daddy. Buyable again and again.
export interface ShopItem {
  id: string;
  name: string;
  icon: string;
  cost: number;
  blurb: string;
  kind: "coupon";
  /** Coupon text: "Tell Daddy: I earned <reward>!" */
  reward: string;
}

// Ordered by cost (cheapest first) so the Workshop reads as a ladder of goals.
// NOTE: never rename an existing id — coupons in saves reference it.
export const CATALOG: ShopItem[] = [
  { id: "story", kind: "coupon", name: "Extra Story", icon: "📖", cost: 900, blurb: "An extra bedtime story!", reward: "an extra bedtime story" },
  { id: "youtube15", kind: "coupon", name: "YouTube Break", icon: "📺", cost: 1000, blurb: "15 minutes of YouTube!", reward: "15 minutes of YouTube" },
  { id: "boardgame", kind: "coupon", name: "Game with Daddy", icon: "🎲", cost: 1100, blurb: "Play a board game with Daddy!", reward: "a board game with Daddy" },
  { id: "roblox20", kind: "coupon", name: "Roblox Pass", icon: "🎮", cost: 1200, blurb: "20 minutes of Roblox!", reward: "20 minutes of Roblox" },
  { id: "dinnerpick", kind: "coupon", name: "Dinner Picker", icon: "🍽️", cost: 1300, blurb: "You pick tonight's dinner!", reward: "to pick tonight's dinner" },
  { id: "staylate", kind: "coupon", name: "Night Owl Pass", icon: "🌙", cost: 1400, blurb: "Stay up 15 minutes later!", reward: "staying up 15 minutes later" },
  { id: "movie", kind: "coupon", name: "Movie Night Pick", icon: "🎬", cost: 1500, blurb: "Choose the family movie!", reward: "to pick the family movie" },
  { id: "fries", kind: "coupon", name: "French Fries Treat", icon: "🍟", cost: 1600, blurb: "A serving of french fries!", reward: "french fries" },
  { id: "bake", kind: "coupon", name: "Bake Together", icon: "🧁", cost: 1700, blurb: "Bake treats with Daddy!", reward: "baking treats with Daddy" },
  { id: "park", kind: "coupon", name: "Park Trip", icon: "🛝", cost: 1800, blurb: "A trip to the park!", reward: "a trip to the park" },
  { id: "icecream", kind: "coupon", name: "Ice Cream Trip", icon: "🍦", cost: 2000, blurb: "A trip for ice cream!", reward: "an ice cream trip" },
  { id: "pizza", kind: "coupon", name: "Pizza Night", icon: "🍕", cost: 2200, blurb: "A pizza night!", reward: "a pizza night" },
  { id: "roblox45", kind: "coupon", name: "Roblox Pass XL", icon: "🕹️", cost: 2400, blurb: "45 minutes of Roblox!", reward: "45 minutes of Roblox" },
  { id: "swim", kind: "coupon", name: "Swimming Trip", icon: "🏊", cost: 2600, blurb: "A swimming trip!", reward: "a swimming trip" },
  { id: "toy", kind: "coupon", name: "Buy Me a Gift", icon: "🧸", cost: 3000, blurb: "Ask Daddy to buy you a gift!", reward: "Daddy to buy you a gift" },
  { id: "zoo", kind: "coupon", name: "Zoo Adventure", icon: "🦁", cost: 3500, blurb: "A trip to the zoo!", reward: "a trip to the zoo" },
  { id: "lego", kind: "coupon", name: "LEGO Set", icon: "🧱", cost: 4200, blurb: "Ask Daddy for a LEGO set!", reward: "a LEGO set" },
];

export function itemById(id: string): ShopItem | undefined {
  return CATALOG.find((i) => i.id === id);
}
