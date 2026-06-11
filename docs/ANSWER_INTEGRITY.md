# Answer Integrity & Anti-Guessing — Global Rule

> **Scope: this applies to EVERY game/world in Sam's Worlds, current and future.**
> It is a core engine rule, not a per-game feature. No question flow may bypass it.
> Psychological basis: a child guesses when guessing is cheaper than thinking. We never
> punish guessing — we make it structurally useless and make thinking the highest-yield,
> fastest path through the game.

## The 5 rules (mandatory in all games)

1. **Regenerate on miss (non-negotiable).**
   A wrong answer immediately discards that question and generates a NEW question at the
   same difficulty (new values, same skill, fresh distractors). Brute-force elimination
   must never converge on the right answer. Questions therefore come from parameterized
   generators, never fixed lists.

2. **Constructed answers by default.**
   Prefer inputs the child must BUILD: number pad entry, dragging quantities, setting
   clock hands, placing a note on the staff, wiring a gate, ordering a sequence.
   Multiple choice is allowed only where the question type truly requires it
   (e.g., fact/picture matching) — and even then, rule 1 applies.

3. **Scaffold ladder on misses (teach, don't retry-spam).**
   - 1st miss: answer input locks for 2–3 seconds while a visual hint animates
     (number line, object grouping, staff-line highlight). Then a fresh question.
   - 2nd miss on the same skill: play a short worked example, then a fresh similar question.
   - Never display "wrong" or "fail." Tone: "Almost — look at this."

4. **Accuracy-weighted payout.**
   - First-try correct = 100% currency.
   - Correct after hint = 40%.
   - Stage stars derive from FIRST-TRY accuracy only.
   - "Perfect Run" (all first-try) = bonus + unique fanfare.
   - Completion always pays something; accuracy just pays more. Nothing is ever deducted.

5. **Guess-pattern detection = signal, not misbehavior.**
   If ≥3 wrong answers arrive each under ~2 seconds:
   - Interpret: too hard (gave up reasoning) or too easy (bored/farming).
   - Respond: lower difficulty + inject one easy confidence win, OR raise difficulty /
     switch mechanic. Companion may say one warm line ("Take your time, Captain —
     the Forge isn't going anywhere."). Log the event for Parent Corner. No penalty.

## Acceptance checks (manual)

- Tapping options randomly as fast as possible NEVER completes a question by elimination.
- A wrong answer always produces a different question within 3 seconds.
- A first-try-correct run visibly and audibly pays more than a guessy run.
- Three rapid wrong answers trigger a difficulty adjustment + one companion line, no penalty.
- The word "wrong" / "fail" appears nowhere in player-facing strings.
