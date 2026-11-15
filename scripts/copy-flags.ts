// Copies the flag-icons 4x3 SVGs for every country in countries.json to
// src/assets/flags/<ISO3>.svg. Run: bun scripts/copy-flags.ts
import { copyFileSync, existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const src = join(root, "node_modules/flag-icons/flags/4x3");
const out = join(root, "src/assets/flags");
const { countries } = JSON.parse(readFileSync(join(root, "src/content/geography/countries.json"), "utf8")) as {
  countries: { code: string; iso2: string; name: string }[];
};

const missing: string[] = [];
const sizes: [string, number][] = [];
for (const c of countries) {
  const from = join(src, `${c.iso2.toLowerCase()}.svg`);
  if (!existsSync(from)) {
    missing.push(`${c.code} (${c.iso2}) ${c.name}`);
    continue;
  }
  const to = join(out, `${c.code.toUpperCase()}.svg`);
  copyFileSync(from, to);
  sizes.push([`${c.code}.svg`, statSync(to).size]);
}
if (missing.length) {
  console.error(`MISSING flags for ${missing.length} countries:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
const total = sizes.reduce((a, [, s]) => a + s, 0);
console.log(`Copied ${sizes.length} flags, total ${total} bytes (${(total / 1024 / 1024).toFixed(2)} MB)`);
console.log("Largest 10:");
for (const [n, s] of sizes.sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${n} ${s}`);
