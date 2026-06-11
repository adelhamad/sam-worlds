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

export const CATALOG: ShopItem[] = [
  { id: "youtube15", kind: "coupon", name: "YouTube Break", icon: "📺", cost: 250, blurb: "15 minutes of YouTube!", reward: "15 minutes of YouTube" },
  { id: "roblox20", kind: "coupon", name: "Roblox Pass", icon: "🎮", cost: 300, blurb: "20 minutes of Roblox!", reward: "20 minutes of Roblox" },
  { id: "staylate", kind: "coupon", name: "Night Owl Pass", icon: "🌙", cost: 350, blurb: "Stay up 15 minutes later!", reward: "staying up 15 minutes later" },
  { id: "fries", kind: "coupon", name: "French Fries Treat", icon: "🍟", cost: 400, blurb: "A serving of french fries!", reward: "french fries" },
  { id: "park", kind: "coupon", name: "Park Trip", icon: "🛝", cost: 450, blurb: "A trip to the park!", reward: "a trip to the park" },
  { id: "icecream", kind: "coupon", name: "Ice Cream Trip", icon: "🍦", cost: 500, blurb: "A trip for ice cream!", reward: "an ice cream trip" },
  { id: "roblox45", kind: "coupon", name: "Roblox Pass XL", icon: "🕹️", cost: 600, blurb: "45 minutes of Roblox!", reward: "45 minutes of Roblox" },
];

export function itemById(id: string): ShopItem | undefined {
  return CATALOG.find((i) => i.id === id);
}
