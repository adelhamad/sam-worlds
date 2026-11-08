import { readFileSync } from "node:fs";
import { ADAPTATIONS, OBSERVATIONS } from "../src/content/traits/examples";
import { CONCEPTS } from "../src/content/traits/concepts";
import { TRAIT_PHOTOS } from "../src/content/traits/photoCatalog";
import { ADAPTATION_PICTURES, CONCEPT_PICTURES, OBSERVATION_PICTURES } from "../src/content/traits/pictureMap";
import type { TraitPhoto } from "../src/content/traits/photoTypes";
import type { Question } from "../src/engine/generators/types";

function nonblank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function cleanLicense(photo: TraitPhoto): boolean {
  const license = photo.license.trim();
  const combined = `${license} ${photo.licenseUrl}`;
  if (/(?:\bNC\b|\bND\b|non[- ]?commercial|no[- ]?derivatives)/i.test(combined)) return false;
  return /^(?:public domain\b|PD\b|CC0\b|CC BY(?:-SA)? \d+(?:\.\d+)?(?:$|\s))/i.test(license);
}

function checkLocalFile(id: string, photo: TraitPhoto, failures: string[]): void {
  const label = `traits photo ${id}`;
  // Only bundled WebPs, never remote URLs, traversal, query strings or fragments.
  if (!/^\/images\/traits\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.webp$/.test(photo.src)) {
    failures.push(`${label}: src must be a local /images/traits/ WebP`);
    return;
  }
  try {
    const bytes = readFileSync(new URL(`../public${photo.src}`, import.meta.url));
    if (bytes.length < 100 || bytes.length >= 500_000) failures.push(`${label}: WebP must be 100–499999 bytes`);
    if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
      failures.push(`${label}: missing RIFF/WEBP header`);
    }
  } catch (error) {
    failures.push(`${label}: cannot read public${photo.src}: ${String(error)}`);
  }
}

function checkPhoto(id: string, photo: TraitPhoto, failures: string[]): void {
  const label = `traits photo ${id}`;
  if (![id, photo.src, photo.credit, photo.license, photo.sourceUrl, photo.licenseUrl, photo.alt, photo.label].every(nonblank)) {
    failures.push(`${label}: blank photo metadata`);
    return;
  }
  if (!validUrl(photo.sourceUrl) || !validUrl(photo.licenseUrl)) failures.push(`${label}: invalid attribution URLs`);
  if (!cleanLicense(photo)) failures.push(`${label}: license must clearly be PD, CC0, CC BY or CC BY-SA (no NC/ND)`);
  checkLocalFile(id, photo, failures);
}

function checkMap(name: string, rows: { id: string }[], mapping: Record<string, string | string[]>, failures: string[]): void {
  const authoredIds = new Set(rows.map((row) => row.id));
  for (const id of Object.keys(mapping)) {
    if (!authoredIds.has(id)) failures.push(`traits ${name}/${id}: picture map has no authored subject`);
  }
  for (const { id } of rows) {
    const value = mapping[id];
    const keys = Array.isArray(value) ? value : [value];
    if (!keys.length || !keys.every(nonblank)) failures.push(`traits ${name}/${id}: missing stable picture mapping`);
    for (const key of keys) {
      if (!Object.hasOwn(TRAIT_PHOTOS, key)) failures.push(`traits ${name}/${id}: unresolved photo ${key}`);
    }
  }
}

/** Validate the complete catalog, including entries not drawn by a sampled seed. */
export function auditTraitsMedia(): string[] {
  const failures: string[] = [];
  if (Object.keys(TRAIT_PHOTOS).length !== 73) failures.push("traits photos: expected all 73 catalog entries");
  for (const [id, photo] of Object.entries(TRAIT_PHOTOS)) checkPhoto(id, photo, failures);
  for (const [folder, count] of [["", 6], ["animals/", 28], ["plants/", 16], ["examples/", 23]] as const) {
    const actual = Object.values(TRAIT_PHOTOS).filter((photo) => {
      const relative = photo.src.slice("/images/traits/".length);
      return folder ? relative.startsWith(folder) : !relative.includes("/");
    }).length;
    if (actual !== count) failures.push(`traits photos ${folder || "core"}: expected ${count}, got ${actual}`);
  }
  checkMap("adaptations", ADAPTATIONS, ADAPTATION_PICTURES, failures);
  checkMap("observations", OBSERVATIONS, OBSERVATION_PICTURES, failures);
  checkMap("concepts", CONCEPTS, CONCEPT_PICTURES, failures);
  return failures;
}

/** Independent oracle: authored token/maps and the subjects of EVERY shown option.
 * Do not call the generator's withTraitPictures helper to derive expectations. */
function expectedPictures(token: string, question: Question, label: string, failures: string[]): Set<string> {
  const [mode, id, otherId] = token.split(":");
  const expected = new Set<string>();
  if (mode === "origin") {
    for (const choice of question.choices) {
      const subjects = OBSERVATIONS.filter((item) => item.example === choice);
      if (subjects.length !== 1) failures.push(`${label}: option does not identify one authored observation: ${choice}`);
      for (const subject of subjects) expected.add(OBSERVATION_PICTURES[subject.id]);
    }
  } else if (mode === "concept") {
    for (const key of CONCEPT_PICTURES[id] ?? []) expected.add(key);
  } else {
    expected.add(ADAPTATION_PICTURES[id]);
    if (mode === "pair") expected.add(ADAPTATION_PICTURES[otherId]);
  }
  if (!expected.size || [...expected].some((key) => !nonblank(key))) failures.push(`${label}: incomplete expected picture mapping`);
  return expected;
}

export function checkTraitsMedia(question: Question, token: string, label: string, failures: string[]): void {
  const ids = question.payload?.traitPictureIds;
  if (!Array.isArray(ids) || !ids.length || !ids.every(nonblank)) {
    failures.push(`${label}: payload.traitPictureIds must be a nonempty string[]`);
    return;
  }
  for (const id of ids) {
    if (!Object.hasOwn(TRAIT_PHOTOS, id)) failures.push(`${label}: unresolved question photo ${id}`);
  }
  const expected = expectedPictures(token, question, label, failures);
  const actual = new Set(ids);
  if (actual.size !== expected.size || [...expected].some((id) => !actual.has(id))) {
    failures.push(`${label}: expected neutral subject photos ${JSON.stringify([...expected])}, got ${JSON.stringify(ids)}`);
  }
  if (["spot", "job", "feature"].includes(token.split(":")[0]) && ids.length !== 1) {
    failures.push(`${label}: single-subject matching needs exactly one photo`);
  }
}
