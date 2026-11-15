// Names of the drawn icons (src/ui/icons). Content and engine code refer to an
// icon by NAME; the UI owns the artwork. The game does not use emoji for new
// course content — pick an icon from this list or use words alone.
// To add an icon: add its name here, then draw it in one of the
// src/ui/icons/art-*.ts files (the audit fails if a name has no artwork).
// Never rename or remove a name: saved trophies and content refer to them.
export const ICON_NAMES = [
  // rewards and status
  "dust", "flame", "gift", "chest", "trophy", "star", "crown", "medal", "check", "lock", "key", "tools",
  "ticket", "backpack", "question",
  // doing and thinking
  "book", "target", "bolt", "compass", "brain", "bug", "loop", "lens", "puzzle", "bulb", "flag", "map",
  "rocket", "planet", "globe", "clock", "calendar", "sun", "moon", "bell", "heart", "home", "play",
  "chat", "link", "footprints", "laptop", "abacus",
  // chrome
  "sound", "sound-off", "music", "gear", "more", "back", "close", "passport", "shelf",
  // everyday things for cards
  "tree", "flower", "apple", "car", "bike", "ball", "shoe", "cup", "bed", "bus", "school", "toothbrush",
  "plate", "shirt", "umbrella", "cloud", "rain", "snow", "fish", "cat", "dog", "bird", "robot",
  // places, animals and keepsakes (course units and souvenirs)
  "castle", "cactus", "lamp", "mountain", "parrot", "lantern", "dragon", "lion", "drum", "crystal", "shell", "pawn",
  // classic world planets (one picture per world on the home page)
  "anvil", "scales", "tower", "coin", "ruler", "lighthouse", "pizza", "beads", "croc", "chart", "columns",
  "podium", "butterfly", "dice", "set-square", "pencil",
  "volcano", "magnet", "flask", "atom", "dino", "weather", "gem", "turtle", "island", "pyramid", "telescope",
  "paw", "hourglass", "pin", "mosque", "letters",
  "smile", "tophat", "traffic-light", "firetruck", "recycle", "piggy", "shop", "pan", "family", "crowd",
  "bricks", "pickaxe", "palette", "wizard", "slide", "ear", "hand",
  // vocabulary pictures for the language courses: food and drink
  "bread", "cheese", "egg", "banana", "rice", "chicken", "milk", "yoghurt", "water", "juice", "cake", "icecream", "candy",
  // the house, bags and toys
  "door", "window", "chair", "table", "kitchen", "bath", "bag", "notebook", "teddy",
  // body, clothes, nature
  "palm", "foot", "head", "eye", "mouth", "trousers", "jacket", "horse", "sea", "wind", "hot", "cold",
  // feelings and people
  "sad", "tired", "sleepy", "scared", "sick", "mother", "father", "grandma", "grandpa", "baby", "boy", "girl", "kiss",
  // colours (paint blobs) and numbers (dot cards)
  "blob-red", "blob-blue", "blob-green", "blob-yellow", "blob-white", "blob-black",
  "dots-1", "dots-2", "dots-3", "dots-4", "dots-5", "dots-6", "dots-7", "dots-8", "dots-9", "dots-10",
  // shapes and arrows
  "circle", "square", "triangle", "diamond", "arrow-up", "arrow-right", "arrow-down", "arrow-left",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/**
 * Fields that used to hold an emoji (`CourseUnit.icon`, souvenirs, world icons,
 * trophies) may hold `icon:<name>` instead; `<Glyph>` draws either form.
 */
export type IconRef = `icon:${IconName}`;

export function iconRef(name: IconName): IconRef {
  return `icon:${name}`;
}

/** The icon name inside an `icon:<name>` reference, or null for plain text. */
export function iconNameOf(value: string): IconName | null {
  if (!value.startsWith("icon:")) return null;
  const name = value.slice(5) as IconName;
  return (ICON_NAMES as readonly string[]).includes(name) ? name : null;
}
