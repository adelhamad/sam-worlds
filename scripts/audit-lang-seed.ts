// Static checks of a language course as its authors wrote it — the rules of
// docs/LANGUAGES.md. Used by audit-lang.ts.
import type { LangCourseSeed, LangLessonSeed, LangUnitPack } from "../src/content/langCourse";
import type { Phrase, Scene } from "../src/engine/lang/types";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ARABIC = /[ء-ي]/;
const LATIN = /[A-Za-z]/;
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
const BANNED = /\b(wrong|fail|failed|stupid|bad)\b/i;
const MARKS = /[ً-ْٰـ]/g;

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const plain = (text: string) => text.replace(MARKS, "").replace(/[.!?؟,،;:"«»]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

function checkText(where: string, text: string, max: number, failures: string[]): void {
  if (EMOJI.test(text)) failures.push(`${where}: has an emoji — use words or an icon`);
  if (BANNED.test(text)) failures.push(`${where}: uses a banned word ("${text}")`);
  if (words(text) > max) failures.push(`${where}: too long (${words(text)} words, max ${max}): "${text}"`);
}

function checkArabic(where: string, phrase: Phrase, failures: string[]): void {
  if (!ARABIC.test(phrase.text) || LATIN.test(phrase.text)) failures.push(`${where}: text must be in Arabic letters ("${phrase.text}")`);
  if (!phrase.roman) failures.push(`${where}: Arabic phrases need "roman"`);
  else if (ARABIC.test(phrase.roman) || /\d/.test(phrase.roman)) failures.push(`${where}: roman must be Latin letters, no digits ("${phrase.roman}")`);
  if (phrase.say && !ARABIC.test(phrase.say)) failures.push(`${where}: "say" must be Arabic`);
  for (const word of phrase.words ?? []) if (!word.roman) failures.push(`${where}: word "${word.text}" needs roman`);
}

function checkFrench(where: string, phrase: Phrase, failures: string[]): void {
  if (ARABIC.test(phrase.text)) failures.push(`${where}: text must be French`);
  if (phrase.roman) failures.push(`${where}: French phrases have no "roman"`);
}

function checkPhrase(seed: LangCourseSeed, phrase: Phrase, failures: string[]): void {
  const where = `${seed.id} phrase "${phrase.id}"`;
  if (!KEBAB.test(phrase.id)) failures.push(`${where}: id must be kebab-case Latin`);
  if (seed.lang === "ar") checkArabic(where, phrase, failures);
  else checkFrench(where, phrase, failures);
  checkText(`${where} en`, phrase.en, 6, failures);
  if (phrase.tip) checkText(`${where} tip`, phrase.tip, 14, failures);
  const parts = phrase.words;
  if (!parts) return;
  const joined = parts.map((word) => word.text).join(" ");
  if (parts.length < 2 || parts.length > 6) failures.push(`${where}: "words" needs 2–6 words`);
  if (plain(joined) !== plain(phrase.text)) failures.push(`${where}: "words" do not spell the text ("${joined}" vs "${phrase.text}")`);
}

function checkLikes(seed: LangCourseSeed, all: Phrase[], byId: Map<string, Phrase>, failures: string[]): void {
  for (const phrase of all) {
    for (const id of phrase.like ?? []) {
      const other = byId.get(id);
      if (!other) failures.push(`${seed.id} phrase "${phrase.id}": like "${id}" does not exist`);
      else if (!other.like?.includes(phrase.id)) failures.push(`${seed.id} phrase "${phrase.id}": like "${id}" is not mutual — add "${phrase.id}" to its like`);
    }
  }
}

function checkTwins(seed: LangCourseSeed, all: Phrase[], failures: string[]): void {
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const [a, b] = [all[i], all[j]];
      const alike = a.like?.includes(b.id);
      // The same letters with other vowels (kiifak / kiifik) are fine as a "like" pair.
      if (plain(a.text) === plain(b.text) && (!alike || a.text === b.text)) failures.push(`${seed.id}: "${a.id}" and "${b.id}" are the same text`);
      else if (plain(a.en) === plain(b.en) && !alike) failures.push(`${seed.id}: "${a.id}" and "${b.id}" both mean "${a.en}" — list each in the other's "like" or word the meanings apart`);
    }
  }
}

function checkPhrases(seed: LangCourseSeed, failures: string[]): Map<string, Phrase> {
  const byId = new Map<string, Phrase>();
  const all = seed.packs.flatMap((pack) => pack.phrases);
  for (const phrase of all) {
    if (byId.has(phrase.id)) failures.push(`${seed.id} phrase "${phrase.id}": id used twice`);
    byId.set(phrase.id, phrase);
    checkPhrase(seed, phrase, failures);
  }
  checkLikes(seed, all, byId, failures);
  checkTwins(seed, all, failures);
  return byId;
}

interface Walk {
  seed: LangCourseSeed;
  byId: Map<string, Phrase>;
  taught: Set<string>;
  failures: string[];
}

const sceneRefs = (scene: Scene): string[] => [scene.line, ...scene.reply, ...(scene.alsoOk ?? [])].filter((id): id is string => Boolean(id));

function checkShape(where: string, lesson: LangLessonSeed, failures: string[]): void {
  const count = lesson.teach?.length ?? 0;
  if (lesson.name.length > 22) failures.push(`${where}: lesson name is too long`);
  if (lesson.kind === "words" && (count < 3 || count > 6)) failures.push(`${where}: a "words" lesson teaches 3–6 phrases`);
  if (lesson.kind === "talk" && !lesson.scenes?.length) failures.push(`${where}: a "talk" lesson needs scenes`);
  if (lesson.kind === "letters" && !lesson.letters?.length && !lesson.spell?.length) failures.push(`${where}: a "letters" lesson needs letters or words to spell`);
  if (lesson.mission) checkText(`${where} mission`, lesson.mission, 16, failures);
}

function checkLesson(walk: Walk, pack: LangUnitPack, lesson: LangLessonSeed): void {
  const { seed, taught, failures } = walk;
  const where = `${seed.id} / ${pack.unit.name} / ${lesson.name}`;
  checkShape(where, lesson, failures);
  const own = new Set(pack.phrases.map((phrase) => phrase.id));
  for (const id of lesson.teach ?? []) {
    if (!own.has(id)) failures.push(`${where}: teaches "${id}", which is not in this unit's phrases`);
    if (taught.has(id)) failures.push(`${where}: "${id}" is taught twice`);
    taught.add(id);
  }
  for (const id of lesson.scenes ?? []) {
    const scene = pack.scenes.find((item) => item.id === id);
    if (!scene) failures.push(`${where}: scene "${id}" is not in this unit's scenes`);
    for (const ref of scene ? sceneRefs(scene) : []) if (!taught.has(ref)) failures.push(`${where}: scene "${id}" uses "${ref}" before it is taught`);
  }
  for (const id of lesson.spell ?? []) {
    if (!taught.has(id)) failures.push(`${where}: spells "${id}" before it is taught`);
    else if (/\s/.test(walk.byId.get(id)?.text.trim() ?? "")) failures.push(`${where}: spell words must be single words ("${id}")`);
  }
  for (const char of lesson.letters ?? []) {
    if (!seed.letters?.some((letter) => letter.char === char)) failures.push(`${where}: letter "${char}" is not in the course alphabet`);
  }
}

function checkPack(walk: Walk, pack: LangUnitPack, sceneIds: Set<string>): void {
  const { seed, byId, failures } = walk;
  const unit = `${seed.id} / ${pack.unit.name}`;
  checkText(`${unit} blurb`, pack.unit.blurb, 8, failures);
  if (pack.unit.lessons.length < 3 || pack.unit.lessons.length > 6) failures.push(`${unit}: a unit has 3–6 lessons`);
  for (const scene of pack.scenes) {
    if (sceneIds.has(scene.id)) failures.push(`${unit}: scene id "${scene.id}" is used twice`);
    sceneIds.add(scene.id);
    checkText(`${unit} scene "${scene.id}"`, scene.setup, 14, failures);
    if (!scene.reply.length) failures.push(`${unit}: scene "${scene.id}" has no reply`);
    for (const ref of sceneRefs(scene)) if (!byId.has(ref)) failures.push(`${unit}: scene "${scene.id}" refers to unknown phrase "${ref}"`);
    if (!pack.unit.lessons.some((lesson) => lesson.scenes?.includes(scene.id))) failures.push(`${unit}: scene "${scene.id}" is never used in a lesson`);
  }
  for (const lesson of pack.unit.lessons) checkLesson(walk, pack, lesson);
  for (const phrase of pack.phrases) if (!walk.taught.has(phrase.id)) failures.push(`${unit}: phrase "${phrase.id}" is never taught`);
}

/** Every rule an author can break. Returns true when the seed is clean. */
export function checkSeed(seed: LangCourseSeed, failures: string[]): boolean {
  const before = failures.length;
  const walk: Walk = { seed, byId: checkPhrases(seed, failures), taught: new Set(), failures };
  const sceneIds = new Set<string>();
  for (const pack of seed.packs) checkPack(walk, pack, sceneIds);
  return failures.length === before;
}
