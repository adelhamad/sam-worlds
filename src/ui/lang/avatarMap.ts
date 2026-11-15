// Who a chat scene's `who.name` is, as a face. Both courses name people their
// own way (Teta, Jiddo, ‘Ammo… / Maman, Mamie, la maîtresse, Léa…), so the
// name is normalised (lowercase, no accents, no quote marks) and matched
// against a small ordered table. "Léa's dad": the part after 's decides the
// role; a grandparent before it makes the face an older one. Unknown given
// names become a friendly child; unknown descriptions with a grown-up word
// become a friendly grown-up. Generic faces (a boy, a friend…) take skin and
// hair tones from a hash of the name, so a name always gets the same face.

export type AvatarKind =
  | "teta" | "jiddo" | "granny" | "mama" | "baba" | "aunt" | "uncle"
  | "woman" | "man" | "adult" | "teacher" | "shopkeeper" | "baker"
  | "boy" | "girl" | "kid" | "baby" | "sam";

export interface AvatarTone {
  skin: string;
  hair: string;
  top: string;
  bg: string;
}

const SKINS = ["#f3c9a2", "#e6ac7e", "#d0956a", "#b5774d", "#8f5a38", "#f0bf98"];
const HAIRS = ["#2a1a12", "#4a2c1a", "#6b3f22", "#1c1a24", "#8a5a2b", "#3a2416"];
const TOPS = ["#ff8a5c", "#5fb4ff", "#7bd389", "#ffc94d", "#c48bff", "#ff7fae"];
const BGS = ["#ffe2b8", "#cfe8ff", "#d8f5c9", "#ffe9a8", "#eadbff", "#ffd8e6"];

/** Faces that are always the same person get fixed tones. */
const FIXED: Partial<Record<AvatarKind, AvatarTone>> = {
  teta: { skin: "#e3ae84", hair: "#b8b2c4", top: "#a65d93", bg: "#ffd9ec" },
  jiddo: { skin: "#c98d63", hair: "#d9dbe2", top: "#8f7f5f", bg: "#e9e3cf" },
  granny: { skin: "#f1c9a6", hair: "#eceaf2", top: "#9d86e0", bg: "#e6defc" },
  mama: { skin: "#e8b48c", hair: "#3b2116", top: "#ff8f6b", bg: "#ffe0cc" },
  baba: { skin: "#c68a5e", hair: "#1f1712", top: "#4f8fe8", bg: "#d2e6ff" },
  aunt: { skin: "#d9a074", hair: "#2a1a12", top: "#2fae9f", bg: "#cdf2ea" },
  uncle: { skin: "#b97a50", hair: "#24170f", top: "#62b56a", bg: "#dbf3cf" },
  teacher: { skin: "#ecb995", hair: "#7a4524", top: "#e0656f", bg: "#ffe3c4" },
  shopkeeper: { skin: "#c98a5c", hair: "#2a1a12", top: "#3f9a6b", bg: "#d6f1e1" },
  baker: { skin: "#f0c09a", hair: "#6b3f22", top: "#fbf6ec", bg: "#ffe7b3" },
  baby: { skin: "#f2c39c", hair: "#6b3f22", top: "#ffd166", bg: "#fff1c2" },
  sam: { skin: "#e8b48c", hair: "#5a3420", top: "#8b6cff", bg: "#ffe9a8" },
};

/** Lowercase, accents and quote marks removed: "‘Ammo" → "ammo", "Léa" → "lea". */
export function normName(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[‘’`ʿʾ]/g, "'").toLowerCase().trim();
}

/** Ordered: the first match wins (mamie before mama, papi before papa). */
const ROLES: [RegExp, AvatarKind][] = [
  [/^(sam|you|me|moi)$/, "sam"],
  [/\b(baby|bebe)\b/, "baby"],
  [/\b(teta|tita|sitti|sitto)\b/, "teta"],
  [/\b(jiddo|jeddo|sido|papi|papy|grandpa|grandad|granddad|grandfather|grand-pere|pepe)\b/, "jiddo"],
  [/\b(mamie|mamy|granny|grandma|grandmother|grand-mere|nana|memee?)\b/, "granny"],
  [/\b(khaalto|khalto|khaltu|'?ammto|'?amto|amti|auntie|aunty|aunt|tante|tata|tatie)\b/, "aunt"],
  [/\b(khaalo|khalo|khalu|'?ammo|'?amo|uncle|oncle|tonton)\b/, "uncle"],
  [/\b(mama|maman|mum|mom|mummy|mommy|mother|mere|ummi|immi)\b/, "mama"],
  [/\b(baba|papa|dad|daddy|father|pere|abi|bayyi)\b/, "baba"],
  [/\b(teacher|maitresse|maitre|miss|mister|ustaaz|ustaz|ustaaze|mu'allim|mu'allme|mouallim|prof)\b/, "teacher"],
  [/\b(baker|boulanger|boulangere|farran)\b/, "baker"],
  [/\b(shopkeeper|shop|seller|vendor|vendeur|vendeuse|marchand|marchande|epicier|grocer|cashier|waiter|serveur)\b/, "shopkeeper"],
  [/\b(girl|fille|sister|soeur|cousine|copine|amie|ukhti|bint)\b/, "girl"],
  [/\b(boy|garcon|brother|frere|cousins?|copain|ikhwe|akhi|ibn)\b/, "boy"],
  [/\b(kid|child|enfant|friend|friends|ami|amis|sahbi)\b/, "kid"],
  [/\b(lady|woman|madame|mme|mrs)\b/, "woman"],
  [/\b(man|monsieur|mr|sir|driver|doctor|docteur|policeman)\b/, "man"],
  [/\b(neighbou?r|neighbou?rs|voisin|voisine|grown-up|adult)\b/, "adult"],
];

const GIRLS = new Set([
  "lea", "maya", "lina", "lena", "sara", "sarah", "nour", "noor", "zeina", "zaina", "layla", "leila", "yasmine", "yasmin", "salma",
  "hala", "rania", "dana", "jana", "tala", "rima", "mira", "chloe", "emma", "jade", "louise", "alice", "lou", "mila", "rose", "ines",
  "manon", "camille", "zoe", "clara", "anna", "julia", "lucie", "sofia", "sophie", "amira", "farah", "reem", "hiba", "noura",
]);
const BOYS = new Set([
  "hugo", "adam", "yusuf", "youssef", "yousef", "karim", "omar", "ali", "ziad", "sami", "rami", "tarek", "jad", "fadi", "hadi", "elias",
  "lucas", "leo", "louis", "gabriel", "nathan", "tom", "paul", "arthur", "jules", "theo", "noah", "ethan", "malik", "nabil", "majd",
]);

const OLD_OWNERS = /^(teta|tita|sitti|jiddo|jeddo|sido|mamie|papi|grandma|grandpa|granny)$/;
const OLD_MAN_OWNERS = /^(jiddo|jeddo|sido|papi|grandpa)$/;

function byRole(text: string): AvatarKind | null {
  return ROLES.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

/** A family member of someone else is not Sam's own Mama or Baba. */
function ofSomeone(owner: string, role: AvatarKind | null, rel: string): AvatarKind {
  if (OLD_OWNERS.test(owner)) {
    if (role === "girl" || /sister|wife/.test(rel)) return "granny";
    if (role === "boy" || /brother|husband/.test(rel)) return "jiddo";
    return OLD_MAN_OWNERS.test(owner) ? "jiddo" : "granny";
  }
  if (role === "mama") return "woman";
  if (role === "baba") return "man";
  return role ?? "adult";
}

/** The face for a scene's `who.name`. */
export function avatarKind(name: string | undefined): AvatarKind {
  const text = normName(name ?? "");
  if (!text) return "adult";
  const cut = text.indexOf("'s ");
  if (cut > 0) {
    const rel = text.slice(cut + 3).trim();
    return ofSomeone(text.slice(0, cut), byRole(rel), rel);
  }
  const role = byRole(text.replace(/^(la|le|l'|the|a|an|your|my|ton|ta|mon|ma)\s+/, ""));
  if (role) return role;
  const first = text.split(/\s+/)[0];
  if (GIRLS.has(first)) return "girl";
  if (BOYS.has(first)) return "boy";
  // A single unknown given name is most likely a friend: a child.
  return /\s/.test(text) ? "adult" : "kid";
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Colours for a face: fixed for family, hashed from the name for everyone else. */
export function avatarTone(kind: AvatarKind, name: string): AvatarTone {
  const fixed = FIXED[kind];
  if (fixed) return fixed;
  const h = hash(normName(name) || kind);
  return {
    skin: SKINS[h % SKINS.length],
    hair: HAIRS[(h >>> 4) % HAIRS.length],
    top: TOPS[(h >>> 8) % TOPS.length],
    bg: BGS[(h >>> 12) % BGS.length],
  };
}
