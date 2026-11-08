# Saved-session and completion browser QA

Tested 2026-11-08 against the production preview at `http://localhost:4194`, using the isolated `agent-browser` session `detective-legacy`.

## Audio

Speech synthesis was cancelled immediately on the mute request. Existing media elements were muted/paused, then the test profile's existing IndexedDB settings were updated to `soundOn: false` and `musicOn: false` and reloaded before further interactions. Both settings were still false in the final persistence read. No read-aloud controls were exercised.

## Legacy exact resume — PASS (generated fixture)

- Generated six real legacy `choices` questions with `generateTraits`, legacy stage-01 items, seeded RNG `4194`, and no detective pedagogy flag. Seeded only test session data into the existing `sams-worlds` IndexedDB `session` store.
- Fixture had `stageId: traits-01`, `index: 2`, `correctCount: 2`, no misses, and copy version 3. Reload resumed at **3 of 6**, displaying Dolphin and the legacy four-choice interface rather than detective sorting.
- A deep comparison of the entire persisted session row against the generated fixture returned **true** after reload. The current key was `traits:spot:dolphin-blowhole`; the answer was `a breathing hole on its head`. Visible choices retained the fixture order: `a long breathing tube`, `a breathing hole on its head`, `food filters in its mouth`, `gills`.
- This verifies the generated legacy-format fixture, not an independently collected historical user save or older copy-version migration.

## Wrong answer after legacy resume / fresh miss pool — PASS

- Clicked the actual wrong UI answer **a long breathing tube**.
- The persisted current question changed from `traits:spot:dolphin-blowhole` to **`traits:spot:walrus-tusks`**, still `inputMode: choices`, still copy version 3, with no detective payload. Walrus is in the original stage-01 legacy pool and was absent from the six fixture questions.
- The UI displayed Walrus with four legacy answers: `a long gripping tail`, `long gripping claws`, `long teeth sticking out`, `feet with hard hoofs`.
- Index and correct count stayed at 2; `firstTryMisses: 1`, `missStreak: 1`, `attemptMissed: true`, and `proveLeft: 2` were persisted. Thus the real submit path produced a fresh legacy replacement rather than a detective question.

## Full current six-question completion — PASS

Cleared the test legacy session and reloaded stage 01 to let the app generate a fresh detective notice session (seed `1889991383`). Baseline economy was 0 dust and progress was empty. Read saved question solutions as the test oracle; used actual browser clicks to select each of the 18 cards, place it in a zone, submit, and continue through feedback. No answer/store methods were called directly.

The six cases were:

1. Shorter claws, shorter hair, umbrella.
2. Scar, hummingbird beak, glasses.
3. Bent stem, burdock hooks, reading.
4. Sitting when asked, collar, tortoise shell.
5. Hat, raincoat, twig-shaped body.
6. Dandelion seeds, eagle beak, horse blanket.

All six displayed **You found the evidence!**. After question 5, the persisted index/correct count were both 5 with zero first-try misses. After question 6, the session row was removed, the economy was **22 dust**, and stage-01 progress was `{ attempts: 1, bestStars: 3, completed: true }`. Clicking **See my stars** showed **Gate cleared!**, three stars, **Perfect Run!**, and **+22**.

Automation observations: immediate reads can precede the 300 ms debounced session write, so final assertions waited for persisted changes. One question-4 submit was too early for the 1200 ms think-first gate; the placements stayed present, and a later real submit succeeded without a miss.

## Reload after payout / duplicate reward — PASS

Reloaded the completed stage URL after viewing the result. Economy remained **22**, progress remained one attempt / three stars / completed, and the event log contained exactly one `stage.complete` event: `{ stageId: "traits-01", stars: 3, payout: 22, firstTime: true, perfect: true }`.

Reload started a new unsolved replay at index 0 / correct count 0 (seed `1675968605`); it did not restore the result screen or grant another payout. This verifies normal post-result reload, not an immediate browser termination inside the persistence debounce window.
