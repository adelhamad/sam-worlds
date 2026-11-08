# Trait Safari: Grade 2 content review

## Teaching contract

- A **trait** is a feature of a living thing. Traits can reflect inheritance,
  surroundings, or both; this world starts with observable body features.
- An **adaptation is also a trait**, not its opposite: an inherited trait that
  helps survival or reproduction in particular surroundings.
- Learned responses come from experience. Injuries, grooming, mud, and growing
  conditions do not create new inherited adaptations through need or practice.
- Young can resemble their parents without being exact copies. Avoid human
  appearance predictions, simplistic genetics, and value judgments about traits.
- A feature's appearance alone does not prove its adaptive function. Helpful
  traits do not guarantee survival, and help depends on the surroundings.

This is introductory structure/function work for a seven-year-old, not a claim
of alignment with a particular school's curriculum. Detailed natural-selection
mechanisms and genetics are intentionally out of scope.

## Activities and freshness

The 55 chapters progress from noticing body traits, to inheritance/learning/body
changes, to checking the trait/adaptation relationship, to feature/function
matching. Later chapters construct two trait–job matches with four cards.
The requested first organism makes the order explicit; the two jobs and traits
must differ. Reversing a pair is not counted as a new question.

Each chapter asks six questions from its own authored pool. Foundation pools
contain at least twelve tasks; two-organism pools contain sixteen. Seeded draws,
semantic deduplication, replacement on a miss, scoring, and saves use the shared
engine. Gentler matching reduces the choice count; gentler constructed matching
adds a concrete first-pair hint. Solved explanations support the shared worked
example scaffold. Read-aloud includes the prompt and answer cards.

These are finite, reviewed facts—not an unlimited supply of new science.
Previously seen tasks stay excluded across chapters and replays, just like the
rest of the app. Once a pool is exhausted, the shared engine shortens/skips it;
it must not manufacture freshness by changing punctuation or option order.
Existing stage IDs, badge IDs, and database versions are unchanged.

## Science sources

Individual feature/function examples carry source URLs in
`src/content/traits/examples.ts`. Definitions and misconception checks draw on:

- [NHGRI: Trait](https://www.genome.gov/genetics-glossary/Trait)
- [UC Berkeley: Adaptation](https://evolution.berkeley.edu/evolution-101/mechanisms-the-processes-of-evolution/adaptation/)
- [UC Berkeley: K–2 teaching pitfalls](https://evolution.berkeley.edu/teach-evolution/teaching-guides/teaching-guides-k-2/avoid-common-teaching-pitfalls/)
- [UC Berkeley: Evolution misconceptions](https://evolution.berkeley.edu/teach-evolution/misconceptions-about-evolution/)
- [NGSS 1-LS1-1: Structure/function foundation](https://www.nextgenscience.org/pe/1-ls1-1-molecules-organisms-structures-and-processes)
- [NGSS 3-LS3-1: Later inheritance/variation progression](https://www.nextgenscience.org/pe/3-ls3-1-heredity-inheritance-and-variation-traits)

## Pictures, not emoji clues

The map field guide uses a real turtle photograph and a nested trait/adaptation
diagram. Six real organism photographs are bundled locally; question pictures
are supplementary, and every task is explicit in text. No science answer
depends on recognizing an emoji. Existing shared reward/navigation symbols are
unchanged.

Image generation was unavailable in the implementation session: the model
catalog returned no image models and no image API key was configured. The
alternative is verified Wikimedia Commons photographs, not simulated generated
assets. `src/content/traits/images.ts` records photographer, original URL,
license, license URL, alt text, and resize/conversion changes. The field guide's
photo credits include those details without adding outbound navigation to the
child's game. Source/provenance sidecars travel with the WebP copies.

WebP is included in the PWA precache so the pictures work offline. No new runtime
network dependency, account, analytics, or persisted feature state was added.
Parent controls remain registry-driven, including enable/hide and progress
editing for the new world.

## Verification

`bun run check` runs lint, the existing all-world question audit plus
`scripts/audit-traits.ts`, TypeScript, and the production/PWA build. The stricter
traits audit checks every authored answer, sources and IDs, paired-card
uniqueness, complete sequential chapter sessions, and fresh normal/gentler
replacements after excluding the initial session. It also checks solved
explanations through the shared answer helper.

To regenerate unreleased chapter data after a deliberate content review:
`bun scripts/build-traits-stages.ts`. Review the output; do not reorder released
IDs or casually regenerate progression referenced by saves.

### Implementation verification, 2026-11-08

- `bun run check` passed: 88 worlds, 48,400 seeded sessions, 302,730 questions,
  plus TypeScript and the production/PWA build. The existing audit still reports
  2,833 exhausted and 131 shortened **legacy** levels; every new Safari chapter
  fills its six-question session in the strict sequential audit.
- Safari-specific audit passed for 55 chapters and 808 distinct authored tasks,
  including normal/gentler replacements and all authored answers.
- Real browser checks exercised fresh questions and locked input after a miss,
  a repeated-miss solved explanation, exact question restore after reload,
  completion and sequential unlock, and constructed four-card submission.
  A run with misses paid 16 Star Dust; a first-try run at the same base payout
  paid 22 and showed Perfect Run.
- Parent Section displayed visibility, access, and progress controls. A parent
  lock remained enforced after reloading the world route.
- Desktop (1280px) and phone (390px) screenshots were reviewed independently.
  The reviewer's speaker-target finding was corrected and scored resolved:
  the measured target is 48×48px; phone scroll width equals viewport width.
- With network access blocked in the browser, an uncached probe failed while
  all six local photographs returned HTTP 200 through the service worker.
- All six image provenance checks passed. No new runtime image service is used.
