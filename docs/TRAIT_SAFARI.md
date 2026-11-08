# Trait Safari: evidence through play

## User story and learning contract

As a young detective, I notice a feature, use clues to place it in a trait family,
compare its job in different places, and explain which labels the evidence supports.
The learning difference is reasoning about feature, inheritance, function, and
environment—not animal-name trivia or picture recognition.

One world makes inclusion explicit: **every adaptation is a trait; not every
trait is an adaptation**. Separate worlds could suggest competing categories.
Nested collections and selecting both labels teach the relationship. The opening
scope is **body traits**; behavior and physiology can also be traits/adaptations.
A practiced skill outside this body-trait collection does not mean behavior can
never be a trait.

An adaptation is an inherited trait shaped over many generations that helps
survival or reproduction. A useful effect alone does not establish that history;
known cases rely on reviewed science records. Individuals do not acquire inherited
adaptations because they need them. “Help not known” means missing evidence, not
“not an adaptation.” “Changed during life” is a separate group inside body traits:
a scar is a changed feature, not a new inherited adaptation. A helmet can help
without being a body trait.

This is a research-backed **design hypothesis** for Grade 1–2 foundations with
Grade 3 extensions. Child learning and transfer have not been tested for this
implementation. Completion and old stars are not certification of new mastery.

## Journey and activities

The map offers three guided, unscored cases: turtle shell, rabbit fur, and helmet.
The turtle explicitly asks for both trait and adaptation membership; rabbit fur
models missing evidence; the helmet separates useful objects from body traits.
Local corrective feedback precedes independent stage work.

| Activity | Child action | Authored tasks |
| --- | --- | ---: |
| Notice | Place three clues inside/outside body traits. | 168 |
| Sort | Place three cards in the nested trait family or outside it. | 239 |
| Origins | Distinguish parents, practice, and life changes using three clues. | 167 |
| Compare | Explore two scenes each for two organisms; classify four scene clues. | 66 |
| Connect | Select supported labels and classify four evidence cards. | 20 |
| **Total** | **Semantic tasks, not shuffle variants.** | **660** |

Chapters 1–8 introduce notice, 9–22 sort, 23–30 origins, 31–34 compare,
and 35 connect. Chapters 36–55 mix activities; compare returns from chapter 38
and connect from chapter 48 for later retrieval. Each chapter has 12 authored
tasks and retains its existing six-question session setting. Several cards can
share a destination; empty destinations are valid.

Connect provides two independent multi-select stamps: **Trait** and **Adaptation**.
The 20 cases comprise 12 known adaptations and eight inherited traits with
insufficient adaptation evidence. All four clues must be placed as inheritance,
helpful-job evidence, or insufficient evidence. Known cases require both stamps;
unknown cases support Trait alone without asserting “not an adaptation.”
Appearance and naming are insufficient evidence. This is constrained evidence
construction, not a measure of freely generated scientific explanation.

Compare uses all 66 unordered pairs of 12 habitat cases. Scene controls keep the
feature constant and change context; every scene must be explored before Check.
These are labeled models, not measured survival results or invented numerical
experiments. “Job not happening here” means that job is not being used, not that
the feature is harmful. A known adaptation remains an adaptation when its job
is unnecessary in another place.

## Implementation contracts

- `src/content/traits/detectiveCurriculum.ts` deterministically builds live
  `stages.json`; canonical tokens sort subject IDs, so reversing cards is not new content.
- `detectiveCards.ts`, `habitatCases.ts`, and `detectiveTypes.ts` hold sourced
  clues, classifications, origins, scenes, boards, and solutions. Adaptation
  classification is separate from a habitat scene's `helps` flag.
- `src/engine/generators/traitDetective.ts` produces the `trait-detective`
  input mode and JSON-serializable `Question.payload.traitDetective` board.
  `detectiveAnswer` sorts placement keys into a stable answer, including stamps.
- `src/ui/inputs/TraitDetective.tsx` uses tap-select/tap-place and explicit Check.
  Exploration and rearrangement are not submitted mistakes.

## Feedback, persistence, and migration

`PlayStage.tsx` and `TraitDetectiveReview.tsx` show an unscored explanation of
the submitted case, including incorrect placements when available, then wait
for Next case (or completion). Correct scoring and progression are committed
**before** review appears, preventing reload from scoring that answer twice.
On a miss, the shared engine prepares a fresh replacement; review keeps it hidden
behind the discarded case's explanation until Next. Correction is not another
scored attempt at that discarded case.

No new persisted state or database version is introduced. Full questions and
committed progress remain saved through the shared session. **Partial placements,
stamp selections, scene exploration, guided discovery, and review are local UI
state and reset on reload**, like existing input widgets. Reload can skip a review
already shown and resume the committed next/replacement question. This limitation
means an unfinished board is not fully restored.

The 55 stage IDs, ordering, payout and skill fields, milestone identities, and
existing progress remain intact. Parent Section enable/hide/access and progress
controls continue through the unchanged world registry. Existing stars retain
their original progression meaning, not evidence of passing the new curriculum.

The original **808 legacy tasks** are archived in
`src/content/traits/legacyStages.json`. Existing current-copy legacy sessions
resume their saved question and choices rather than becoming detective questions;
older copy migrations retain their established behavior. `traitSessionParams`
recognizes the saved `traits:` dedupe token and supplies archived stage parameters
to `missTransition`, so even a legacy miss draws from its original pool.
Fresh detective questions use `traits-detective:` keys. This new namespace permits
genuinely new tasks without resetting seen history; finite pools still exhaust
under the shared freshness policy.

## Photographs and legal credits

Retain all 73 locally bundled reference photographs, WebP files, provenance
sidecars, and existing credits UI. `photoCatalog.ts` combines `images.ts`,
`photosAnimals.ts`, `photosPlants.ts`, and `photosExamples.ts`. Metadata includes
photographer, original URL, license and license URL, alt text, and resize/conversion
changes: 70 Commons photographs and three iNaturalist photographs. Reference
photos do not purport to show hypothetical injuries or scene outcomes. Text
provides the science clues. WebP remains included in PWA precaching, with no
runtime image-service dependency.

## Audit and verification instructions

Run `bun run check` for lint, all-world question audits, TypeScript, and the
production/PWA build. Review `scripts/audit-trait-detective.ts` and the
`audit-traits*.ts` scripts for curriculum/answers, legacy compatibility, language,
labels, resume behavior, and media provenance checks.

Regenerate live content with `bun scripts/build-trait-detective.ts`. It reads
the archive and should be idempotent: run twice and inspect `git diff` to confirm
the second run adds no changes. The old `bun scripts/build-traits-stages.ts`
(including `--refresh-copy`) now writes **only `legacyStages.json`**, not the live
detective manifest. Archive changes require deliberate compatibility review.

Browser QA should exercise all five activities, both stamp outcomes, misses and
Next, correct-answer reload without duplicate credit, legacy reload and miss,
partial-board reload, parent controls, keyboard/touch access, phone scrolling,
and offline photographs/credits. These are verification instructions, not claims
that commands or browser checks have passed for this revision.

## Research basis

See `reports/Teaching traits through discovery.md`; its three proposed investigation
strands are implemented here as five activities. Sources support the scientific
and instructional rationale, not app efficacy:

- [NGSS 1-LS1-1](https://www.nextgenscience.org/pe/1-ls1-1-molecules-organisms-structures-and-processes): structure/function foundations.
- [NGSS 3-LS4-3](https://www.nextgenscience.org/pe/3-ls4-3-biological-evolution-unity-and-diversity): evidence-based habitat arguments.
- [NGSS 3-LS3-2](https://www.nextgenscience.org/pe/3-ls3-2-heredity-inheritance-and-variation-traits): environmental influence on traits.
- [Berkeley: Adaptation](https://evolution.berkeley.edu/evolution-101/mechanisms-the-processes-of-evolution/adaptation/) and [qualifying as an adaptation](https://evolution.berkeley.edu/qualifying-as-an-adaptation/): inherited history and limits of appearance/benefit alone.
- [IES practice guide](https://ies.ed.gov/ncee/wwc/practiceguide/1): visual/verbal representations, explanatory questions, and retrieval.
- [Kelemen et al., 2014](https://pubmed.ncbi.nlm.nih.gov/24503874/): children aged 5–8 learned/generalized causal explanations in a picture-storybook study; this does not validate this touchscreen implementation.

Future child evaluation should separate reading/touch difficulty and adult help
from independent inclusion, causal reasoning, changed-context predictions, and
later unfamiliar-case retrieval. Neither a mastery threshold nor the specific
fresh-case-after-miss policy is validated here.
