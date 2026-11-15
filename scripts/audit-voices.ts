// Voices audit: (1) the voice ranking over fixture voice lists (an iPad-like
// French list with novelty voices, an Arabic list, novelty-only, empty, a
// chosen voice that is gone); (2) the recorded-clip key scheme round-trips for
// every phrase and letter of every language course, with no collisions, and
// every card a lesson can speak maps to a clip the studio lists; (3) the
// strings of Parent Section → Voices and of the child's speaking practice
// (LANG.meet.speak) are emoji-free and never say "wrong"/"fail"/"bad".
// Run alone (`bun scripts/audit-voices.ts`) or through audit-questions.ts.
import { LANG_SEEDS } from "../src/content/langCourses";
import { cardClipKey, clipKey, parseClipKey } from "../src/engine/feedback/clipKeys";
import { isNovelty, pickVoice, rankVoices, voiceQuality, type VoiceInfo } from "../src/engine/feedback/voiceRank";
import { letterCard, phraseCard } from "../src/engine/lang/cards";
import { LANG } from "../src/strings/lang";
import { VOICES } from "../src/strings/voices";
import { studioGroups } from "../src/ui/voices/studioData";

const v = (name: string, lang: string, voiceURI = name, localService = true): VoiceInfo => ({ name, lang, voiceURI, localService });

const IPAD_FR: VoiceInfo[] = [
  v("Eddy (French (France))", "fr-FR", "com.apple.eloquence.fr-FR.Eddy"),
  v("Grandma (French (France))", "fr-FR", "com.apple.eloquence.fr-FR.Grandma"),
  v("Thomas", "fr-FR", "com.apple.voice.compact.fr-FR.Thomas"),
  v("Amélie (Enhanced)", "fr-CA", "com.apple.voice.enhanced.fr-CA.Amelie"),
  v("Flo (French (Canada))", "fr-CA", "com.apple.eloquence.fr-CA.Flo"),
  v("Google français", "fr-FR", "Google français", false),
  v("Samantha", "en-US", "com.apple.voice.compact.en-US.Samantha"),
];
const PREMIUM_FR: VoiceInfo[] = [
  v("Amélie (Enhanced)", "fr-CA", "com.apple.voice.enhanced.fr-CA.Amelie"),
  v("Audrey", "fr-FR", "com.apple.voice.premium.fr-FR.Audrey"),
  v("Marie", "fr_FR", "com.apple.voice.compact.fr-FR.Marie"),
];
const ARABIC: VoiceInfo[] = [
  v("Majed", "ar-001", "com.apple.voice.compact.ar-001.Maged"),
  v("Tarik", "ar-SA", "com.apple.voice.compact.ar-SA.Tarik"),
  v("Laila (Enhanced)", "ar-SA", "com.apple.voice.enhanced.ar-SA.Laila"),
  v("Microsoft Hamed", "ar-EG", "Microsoft Hamed - Arabic (Egypt)", false),
  v("Amira", "ar-AE", "com.apple.voice.compact.ar-AE.Amira"),
  v("Thomas", "fr-FR"),
];
const NOVELTY_ONLY: VoiceInfo[] = [v("Grandma (French (France))", "fr-FR"), v("Eddy (French (France))", "fr-FR"), v("Zarvox", "fr-FR")];

function expectNames(label: string, got: VoiceInfo[], want: string[], failures: string[]): void {
  const names = got.map((voice) => voice.name);
  if (JSON.stringify(names) !== JSON.stringify(want)) failures.push(`${label}: ranked ${JSON.stringify(names)}, expected ${JSON.stringify(want)}`);
}

function checkRanking(failures: string[]): number {
  expectNames("iPad French", rankVoices(IPAD_FR, "fr"), [
    "Amélie (Enhanced)", "Thomas", "Google français", "Eddy (French (France))", "Grandma (French (France))", "Flo (French (Canada))",
  ], failures);
  expectNames("premium French", rankVoices(PREMIUM_FR, "fr"), ["Audrey", "Amélie (Enhanced)", "Marie"], failures);
  expectNames("Arabic", rankVoices(ARABIC, "ar"), ["Laila (Enhanced)", "Tarik", "Majed", "Amira", "Microsoft Hamed"], failures);
  expectNames("novelty only", rankVoices(NOVELTY_ONLY, "fr"), ["Eddy (French (France))", "Grandma (French (France))", "Zarvox"], failures);
  if (rankVoices([], "fr").length || pickVoice([], "ar") !== null) failures.push("empty list: expected no voice");
  if (rankVoices(IPAD_FR, "ar").length) failures.push("a French list must give no Arabic voice");
  if (pickVoice(IPAD_FR, "fr", "gone.voice.uri")?.name !== "Amélie (Enhanced)") failures.push("a chosen voice that is gone must fall back to the best one");
  if (pickVoice(IPAD_FR, "fr", "com.apple.voice.compact.fr-FR.Thomas")?.name !== "Thomas") failures.push("a chosen voice that is installed must win");
  if (pickVoice(IPAD_FR, "fr", "com.apple.eloquence.fr-FR.Eddy")?.name !== "Eddy (French (France))") failures.push("the parent may choose a novelty voice on purpose");
  if (!isNovelty(v("Bad News", "en-US")) || isNovelty(v("Thomas", "fr-FR"))) failures.push("novelty detection");
  if (!isNovelty(v("Somebody", "fr-FR", "com.apple.eloquence.fr-FR.Somebody"))) failures.push("an Eloquence voiceURI is novelty");
  if (voiceQuality(v("Amélie (Enhanced)", "fr-CA")) !== "enhanced" || voiceQuality(v("Audrey", "fr-FR", "x.premium.y")) !== "premium") failures.push("quality detection");
  return 13;
}

function checkKeys(failures: string[]): number {
  const all = new Set<string>();
  let count = 0;
  for (const seed of LANG_SEEDS) {
    const listed = new Set(studioGroups(seed).flatMap((group) => group.items.map((item) => item.key)));
    const phrases = seed.packs.flatMap((pack) => pack.phrases);
    const refs = [
      ...phrases.map((phrase) => ({ kind: "phrase" as const, id: phrase.id, card: phraseCard(phrase) })),
      ...(seed.letters ?? []).map((letter) => ({ kind: "letter" as const, id: letter.id, card: letterCard(letter) })),
    ];
    for (const ref of refs) {
      const key = clipKey(seed.lang, ref.kind, ref.id);
      const back = parseClipKey(key);
      if (!back || back.lang !== seed.lang || back.kind !== ref.kind || back.id !== ref.id) failures.push(`${seed.id}: key ${key} does not round-trip`);
      if (all.has(key)) failures.push(`${seed.id}: clip key ${key} is used twice`);
      all.add(key);
      if (cardClipKey(seed.lang, ref.card) !== key) failures.push(`${seed.id}: lesson card ${ref.id} looks up ${cardClipKey(seed.lang, ref.card)}, not ${key}`);
      if (!listed.has(key)) failures.push(`${seed.id}: ${key} cannot be recorded in the studio`);
      count += 1;
    }
    if (listed.size !== refs.length) failures.push(`${seed.id}: studio lists ${listed.size} clips for ${refs.length} phrases and letters`);
  }
  for (const bad of ["", "xx:hello", "ar:", "ar:letter:", "ar:a:b"]) if (parseClipKey(bad)) failures.push(`"${bad}" must not parse as a clip key`);
  return count;
}

const SAMPLE_ARGS: unknown[][] = [[3, 13], [1, "Arabic"], ["Unit 1"], ["2.4 s"]];

function texts(value: unknown, label: string, out: Array<[string, string]>, depth = 0): void {
  if (depth > 8) return;
  if (typeof value === "string") out.push([label, value]);
  else if (typeof value === "function") {
    for (const args of SAMPLE_ARGS) texts((value as (...a: unknown[]) => unknown)(...args), `${label}()`, out, depth + 1);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) texts(child, `${label}.${key}`, out, depth + 1);
  }
}

function checkStrings(failures: string[]): number {
  const out: Array<[string, string]> = [];
  texts(VOICES, "VOICES", out);
  texts(LANG.meet.speak, "LANG.meet.speak", out);
  for (const [label, text] of out) {
    if (/\p{Extended_Pictographic}/u.test(text)) failures.push(`emoji in ${label}: "${text}"`);
    if (/\b(wrong|fail|bad\b)/i.test(text)) failures.push(`${label} says "wrong"/"fail"/"bad": "${text}"`);
  }
  return out.length;
}

export function auditVoices(): string[] {
  const failures: string[] = [];
  const cases = checkRanking(failures);
  const keys = checkKeys(failures);
  const strings = checkStrings(failures);
  if (failures.length) console.error(`Voices audit: ${failures.length} failures`);
  else console.log(`Voices audit passed: ${cases} ranking checks, ${keys} clip keys round-trip, ${strings} strings clean`);
  return failures;
}

if (import.meta.main) {
  const failures = auditVoices();
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(failures.length ? 1 : 0);
}
