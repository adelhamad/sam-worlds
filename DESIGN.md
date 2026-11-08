# Trait Safari visual-system record

## Scope and decision

This record covers the detective board, guided discovery, and case review.
The user delegated design decisions; implementation follows that delegation,
without claiming separate user approval or completed usability validation.
Keep the established navy/amber identity and shared navigation/rewards.

## Established patterns

- **Color and type:** existing `--night`, `--night-deep`, `--amber`, `--cyan`,
  `--text`, and `--text-dim` tokens. Amber marks headings and selection; cyan
  outlines focus/destinations. Clear headings, short instructions, and 17px board
  text establish hierarchy without relying on color alone.
- **Touch and keyboard:** native buttons, at least 48px-high board targets,
  visible focus, explicit labels, and `aria-pressed` states. Tap a photo clue,
  then its destination; dragging is not required.
- **Nested collections:** a labeled trait-family fieldset contains adaptation,
  unknown-help, and changed-during-life destinations. Objects/practiced skills
  sit outside this body-trait family. Text makes inclusion explicit.
- **Photo cards:** local photos, meaningful alt text, feature names, and evidence.
  Cards remain selectable after placement; several can share a destination.
  Listen controls accompany clues where speech is supported.
- **Model tabs:** tab-shaped scene buttons form a native button group with
  pressed states and controlled panels, not an ARIA tablist. Keep the same photo
  and feature, label models clearly, and announce changed observations politely.
- **Stamps:** Trait and Adaptation are independent toggles in a labeled fieldset,
  allowing both. Four evidence placements and stamps share one deliberate Check
  action; selection alone earns no credit.
- **Feedback:** inline status announcements explain selection and placement.
  Case review explains evidence and wrong placements, then offers Next.
  Feedback is unscored; committed progression precedes correct review.

## Layout and accessibility

Use normal page flow and scrolling: instructions, models/claim, clue tray,
destinations, stamps, then actions. Responsive grids collapse to one column on
small screens; controls and text wrap instead of clipping. Keep feedback and
actions reachable without fixed-height boards. Honor reduced motion and retain
text alongside visual states; speech and photo recognition are not essential.
Browser, keyboard, contrast, and narrow-viewport verification remain required;
this record does not assert QA results.
