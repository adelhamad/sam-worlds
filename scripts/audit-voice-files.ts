// Voice-file audit: everything the language courses can say (voice-manifest.ts)
// has an mp3 under public/voice and an entry in voiceFiles.gen.json, the files
// are real audio of a sane size, and nothing is left over. Lessons must speak
// on a device with no voice for the language, so a phrase without a file fails
// `bun run check`. To build the missing files: scripts/build-voice-files.py
// (docs/LANGUAGES.md, "How it is spoken").
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { voiceFileKeys, voiceFileUrl } from "../src/engine/feedback/voiceFiles";
import { voiceManifest } from "./voice-manifest";

const ROOT = join(import.meta.dir, "..", "public");
const MIN_BYTES = 700;
const MAX_BYTES = 120_000;

export function auditVoiceFiles(): string[] {
  const failures: string[] = [];
  const items = voiceManifest();
  const wanted = new Set(items.map((item) => item.key));
  const files = new Set<string>();
  let bytes = 0;
  const missing: string[] = [];
  for (const item of items) {
    const url = voiceFileUrl(item.key);
    const path = url ? join(ROOT, url) : null;
    if (!path || !existsSync(path)) { missing.push(item.key); continue; }
    const size = statSync(path).size;
    bytes += size;
    files.add(path);
    if (size < MIN_BYTES || size > MAX_BYTES) failures.push(`voice file of "${item.key}" is ${size} bytes: not a sane clip`);
  }
  if (missing.length) {
    failures.push(`${missing.length} sayable things have no voice file (first: ${missing.slice(0, 5).join(", ")}). Run scripts/build-voice-files.py — see docs/LANGUAGES.md`);
  }
  const stale = voiceFileKeys().filter((key) => !wanted.has(key));
  if (stale.length) failures.push(`${stale.length} voice files belong to nothing sayable any more (first: ${stale.slice(0, 5).join(", ")}): rebuild the index`);
  for (const lang of existsSync(join(ROOT, "voice")) ? readdirSync(join(ROOT, "voice")) : []) {
    const folder = join(ROOT, "voice", lang);
    if (!statSync(folder).isDirectory()) continue;
    for (const name of readdirSync(folder)) {
      if (!files.has(join(folder, name))) failures.push(`public/voice/${lang}/${name} is not in the index`);
    }
  }
  const per = (lang: string) => items.filter((item) => item.lang === lang).length;
  console.log(`Voice files audit: ${items.length} sayable things (ar ${per("ar")}, fr ${per("fr")}), ${files.size} files, ${(bytes / 1e6).toFixed(1)} MB`);
  return failures;
}

if (import.meta.main) {
  const failures = auditVoiceFiles();
  for (const failure of failures.slice(0, 40)) console.error(`  ${failure}`);
  if (failures.length) {
    console.error(`${failures.length} voice-file audit failures`);
    process.exit(1);
  }
  console.log("Voice files audit passed");
}
