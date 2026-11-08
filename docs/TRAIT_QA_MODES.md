# Trait modes — browser QA

Tested 2026-11-08 at `http://127.0.0.1:4194` using isolated agent-browser session `detective-modes`. Answers were submitted using actual clue, placement, and Check buttons. IndexedDB was read as an answer oracle; no progress or answers were injected.

| Check | Observed result |
| --- | --- |
| Notice, `traits-01` | **PASS:** trimmed fur → Body trait; learned parrot greeting and backpack → Outside body traits. “You found the evidence!” appeared. |
| Sort, `traits-09` | **PASS:** eagle beak → Also adaptations; puppy floppy ears → Need more clues; dog collar → Outside body traits. Correct feedback appeared. |
| Origins, `traits-23` | **PASS:** cactus stem and lotus waxy coat → From parents; trained sitting → From practice. Correct feedback appeared. |
| Compare, `traits-31` | **PASS:** dolphin at surface and lotus during rain → Helps with this job; submerged dolphin and dry lotus leaf → Job not happening here. Correct feedback appeared. |
| Compare exploration gate | **PASS:** after placing all four cards, Check remained disabled. Visiting dolphin's second scene alone kept it disabled; visiting lotus's second scene enabled Check. Initial scenes were already marked Explored. |
| Explicit next | **PASS:** correct and wrong answers showed a feedback screen with Next case; progression required clicking it. Wrong-answer Next was initially disabled, then became available while feedback remained visible. |
| Wrong-answer replacement | **PASS:** deliberately placed glasses in Body trait. Feedback identified the wrong placement and explained Outside body traits. Next case replaced glasses/scar/hummingbird with bowl/zebra/piano cards, retaining `2 of 6`. |
| Reload persistence | **PASS:** after the first correct notice answer and Next, reload retained `2 of 6` and the same glasses/scar/hummingbird question. Partial placements and feedback-screen reload were not tested. |

## Observation and coverage limits

- Stage-map buttons for 09/23/31 were locked on this fresh profile, but direct `#/play/traits-09`, `traits-23`, and `traits-31` navigation successfully opened those stages. If stage locks must prevent direct access, this is a route-guard gap. Later-mode tests used those routes, not earned unlock progression.
- Parent controls and offline behavior were not tested. No audible read-aloud checks were performed.
- On the mute request, speech synthesis was canceled and any audio/video paused/muted; settings were saved as `soundOn=false` and `musicOn=false`. Reload verification returned both false, `speechSynthesis.speaking=false`, and no audio/video elements. Remaining compare interactions were performed muted.
