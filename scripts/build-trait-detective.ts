import { readFile, writeFile } from "node:fs/promises";
import { buildDetectiveStages } from "../src/content/traits/detectiveCurriculum";

// The archive must exist before replacing the live manifest.
const archive = new URL("../src/content/traits/legacyStages.json", import.meta.url);
const output = new URL("../src/content/traits/stages.json", import.meta.url);
const legacy = JSON.parse(await readFile(archive, "utf8"));
const stages = buildDetectiveStages(legacy);
const tokens = stages.flatMap((stage) => stage.params.items);
if (tokens.length !== 660 || new Set(tokens).size !== 660) {
  throw new Error("Expected 660 unique semantic detective tasks");
}
const counts = Object.fromEntries(["notice", "sort", "origins", "compare", "connect"]
  .map((mode) => [mode, tokens.filter((token) => token.startsWith(`${mode}.`)).length]));
if (counts.compare !== 66 || counts.connect !== 20) throw new Error("Missing habitat pairs or evidence cases");
await writeFile(output, `${JSON.stringify(stages, null, 2)}\n`);
console.log(`Built ${stages.length} stages with ${tokens.length} unique detective tasks.`);
console.log(counts);
