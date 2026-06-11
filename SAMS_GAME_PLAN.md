# Project Plan: "Sam's Worlds" — A Personalized Learning Game (Complete A→Z Spec)

**Audience for this document:** Claude Code implementing the project.
**Owner:** Adel Hamad. Internal/family use only — no unit tests required, no analytics, no accounts.
**Player:** Sam, age 7. Gifted in mathematics, reads and plays piano notation, strong affinity for patterns, structure, and logical systems. Enjoys revisiting familiar material (comfort through repetition). Gets bored quickly when challenges are too easy or rewards feel fake.

**Scope of this document:** the ENTIRE game, A to Z — all worlds, all systems, all content depth. The phases in §10 are build order, not scope cuts. Everything described here is part of the final product.

---

## 1. Vision & Non-Negotiable Principles

Build an installable web game (PWA) that replaces low-value screen time by being genuinely more satisfying than it — through **competence, identity, and ownership**, not slot-machine mechanics.

### Design principles (apply to every feature)

1. **Competence loop is the engine.** Challenge slightly above current level → feedback within ~2 seconds → visible permanent progress → next system to figure out. Difficulty adapts (§5.4).
2. **Identity over points.** The game world belongs to Sam. His name appears in the title screen, save slot, dialogue, base, and achievements ("Captain Sam", "Sam's Observatory"). NPCs reference his past achievements.
3. **Ownership and persistence.** Everything Sam earns becomes a visible, permanent object in his world. Nothing is ever lost, decayed, or taken away. No losing streaks, no countdown pressure.
4. **Pattern recognition is the shared language** across all worlds (math, music, logic, science). Mechanics rhyme across worlds so skills transfer.
5. **Deep content, never "done in 5 minutes."** Every world has a long progression ladder (50+ stages) AND parameterized question generators, so no stage ever runs out of fresh questions (§4).
6. **Clean session endings.** Every mission ends with a celebration and a teased next goal (cliffhanger), then a natural stopping point. No autoplay-style chaining.
7. **Bounded surprise only.** Occasional rare finds (a comet, a golden note) are allowed; max one per session, cosmetic value. The core economy is deterministic: effort → reward, always.
8. **Repetition is a feature.** Completed stages remain replayable forever; replays generate NEW questions at the same difficulty and pay 25% currency (never zero).
9. **Theme flexibility.** Space is the wrapper theme but not the core. Themes/skins/names are configuration, not architecture.

### Anti-goals (do not build)
- No ads, real-money anything, external links, chat, login, or network analytics.
- No daily-streak punishment, FOMO timers, energy systems, or loot boxes.
- No text-heavy instructions. Teach by demonstration, icons, audio cues, one-line prompts (max ~8 simple words per line).

---

## 2. Tech Stack (decided)

| Layer | Choice | Notes |
|---|---|---|
| Build | Vite + React 18 + TypeScript | strict mode |
| PWA | `vite-plugin-pwa` | offline-first, installable, custom "S" emblem icon |
| Game canvas | PixiJS v8 mounted inside React | gameplay scenes |
| UI layer | React + CSS | hub, menus, shop, trophy room |
| State | Zustand | single store, slices per system |
| Persistence | IndexedDB via Dexie | autosave on EVERY meaningful action |
| Audio | Web Audio API (+ Tone.js if useful) | piano tones, feedback; fully offline |
| Routing | React Router (hash router fine) | hub → world → stage |
| Testing | Manual only (internal project) | keep engine logic pure anyway for easy debugging |

**Hard requirements**
- 100% offline after first load. No runtime network calls.
- Touch-first (tablet primary), mouse supported. Min touch target 48px.
- Cold start to playable < 3s on a mid-range tablet.
- Kill the browser mid-puzzle → reopen → exact restore.

---

## 3. Information Architecture

```
App
├── Boot/Title screen           "SAM'S WORLDS" — his name IS the logo
├── Hub (Sam's Base)            persistent home world
│   ├── World portals           one per world (locked/unlocked in sequence)
│   ├── Trophy Room             badges as physical objects on shelves
│   ├── Workshop (Shop)         spend currency on base/avatar upgrades
│   ├── Music Sandbox           free-play piano with unlocked melodies
│   └── Mission Board           current cliffhanger + suggested next mission
├── Worlds (9 total, see §6)
│   └── World map (stage ladder) → Stage (Pixi puzzle scene) → Celebration → map
└── Parent Corner (gear icon, long-press 3s)
    └── progress per skill, difficulty pins, sound toggles, data export/reset
```

---

## 4. Content Depth Model — THE most important section

Hand-authoring thousands of questions is not the approach. Instead:

### 4.1 Stages + Generators
- Each world is a **ladder of 50–60 stages** (visible as a winding path on the world map).
- A stage is NOT a fixed set of 3–4 questions. A stage = `{ skill, difficultyParams, questionCount, mechanic, payout }`.
- Each stage session draws `questionCount` (typically 8–12) **freshly generated questions** from a parameterized generator. Replaying a stage produces different questions every time.
- Result: 9 worlds × ~55 stages × 8–12 generated questions, infinitely replayable. Months of content, no repetition fatigue.

### 4.2 Generator library (`/src/engine/generators/`)
Pure functions: `generate(params, rng) → { prompt, answerSpec, distractors, hints }`. Required generators:
- `arithmetic` (add/sub/mul/div; digit counts, carrying, missing-operand, chains)
- `numberSequence` (arithmetic/geometric/alternating patterns, find-next/find-missing)
- `logicGrid` (4×4 → 6×6 Sudoku/KenKen-style boards, generated with unique solutions)
- `logicGates` (random circuits from AND/OR/NOT/XOR with target outputs)
- `noteReading` (staff positions, treble then bass; intervals; key ranges as params)
- `rhythm` (note-duration sequences to tap)
- `clock` (analog↔digital matching, elapsed-time problems)
- `cipher` (Caesar shift, number substitution; alphabet subset as difficulty)
- `sequenceCommands` (robot maze instruction sequences; maze size/turns as difficulty)
- `trajectory` (angle/power physics shots; tolerance as difficulty)
- `colorMix` (target hue from primaries; steps as difficulty)
- `mapMatch` / `factMatch` (content-pack driven: planets, geography, geology, life cycles, inventions)
- `structureBuild` (bridge/tower part budgets vs. simulated load)

### 4.3 Stage definition format
JSON per world in `/src/content/<world>/stages.json` — no level logic in components:
```json
{ "id": "nf-23", "name": "The Carry Gate", "generator": "arithmetic",
  "params": { "op": "add", "digits": [2,2], "carrying": true, "missingOperand": false },
  "questions": 10, "mechanic": "gate-run", "payout": { "starDust": 30 }, "stars": {...} }
```
Authoring 50–60 such rows per world is fast; Claude Code should generate the full ladders following the band descriptions in §6 and tune numbers later.

---

## 5. Core Engine Systems

### 5.1 Save system (`/src/engine/save`)
Dexie schema: `profile`, `economy`, `progress` (per stage: best stars, attempts, current in-progress question set + answers), `inventory`, `badges`, `settings`, `skillRatings`, `eventLog`. Single `saveAction(event)` API, debounced ≤500ms, versioned with migrations. On boot: "Welcome back, Captain Sam" + current cliffhanger + one big Continue button restoring the exact scene.

### 5.2 Economy (`/src/engine/economy`)
- **Star Dust** (math/science/logic) and **Melody Shards** (music/pattern). Names/icons in `theme.config.ts`.
- Deterministic payouts from stage data. Replays pay 25%.
- Rare-find events: ≤1/session, cosmetic.
- Workshop catalog: 40+ purchasable items across the full game — base rooms, furniture, lights, pets/companions, avatar outfits, ship parts, piano skins, melody packs. Every purchase visibly appears in the hub permanently.

### 5.3 Progression & badges (`/src/engine/progress`)
- Stage stars (1–3) based on accuracy, not speed. Stars invite replay; they never block progress.
- World milestones every 10 stages → a **badge trophy** with name and date ("Circuit Master — Sam, June 2026") placed physically in the Trophy Room.
- World completion → a large monument piece added to the hub exterior.

### 5.4 Adaptive difficulty (`/src/engine/difficulty`)
- Per-skill rating (one per generator family), Elo-like: success nudges params up within the stage band; two consecutive misses trigger a gentler variant + a visual hint. Never the word "fail" — "Almost! Try again."
- Skill ratings carry across worlds (note-reading skill in Melody Engine seeds pattern stages elsewhere).
- Parent Corner can pin per-skill ranges.

### 5.5 Missions & cliffhangers (`/src/engine/missions`)
Story pointer per world: every ~5 stages advances a tiny narrative beat; each session ends by teasing the next beat ("The signal from the Crystal Caves is incomplete…"). Shown on the welcome-back screen.

### 5.6 Personalization (`/src/engine/persona`)
`persona.config.ts`: name, avatar, theme skin, language. Every player-facing string pulls from string tables (`/src/strings/`), name-aware. Architecture supports an Arabic/English toggle (RTL-ready CSS) — ship English first unless Adel says otherwise.

### 5.7 Feedback juice (`/src/engine/feedback`)
Shared reward presentation: pentatonic chime + particle burst + counter tick-up within 2s, reused by every world. Bigger orchestrated celebration on stage complete, biggest on badge. Respect reduced-motion.

---

## 6. The Nine Worlds (full game, A→Z)

All 20 concepts from the original curriculum are covered, grouped into 9 worlds. Each world lists its **stage bands** — Claude Code expands each band into individual stage JSON rows (≈55 stages/world).

### World 1 — Number Forge (math) — LAUNCH
Mechanic: "gate runs" — answer to open doors/power machines.
- Stages 1–10: add/sub within 20, missing-operand intro
- 11–20: two-digit add/sub with carrying/borrowing; number sequences
- 21–30: multiplication tables 2–5 as repeated patterns; mixed chains
- 31–40: tables 6–9, simple division, two-step word-free problems (visual)
- 41–50: order of operations lite, larger sequences, mental-math speed runs (optional timer HE turns on)
- 51–55: boss stages mixing everything; "Forge Master" badge

### World 2 — Melody Engine (music) — LAUNCH
**NOT piano lessons.** Sam has already finished level 5 piano books — he reads both clefs and knows rhythm basics. No beginner note-drills, nothing that feels like a method book. This is a music *laboratory*: ear, patterns, harmony, and creation.
Mechanic: a machine that runs on music — feed it melodies, fix its harmonies, clone its patterns. On-screen keyboard always sounds real pitches.
- 1–10: melodic memory & ear puzzles — play back heard phrases, spot the wrong note in a known melody
- 11–20: interval recognition by ear + sight at speed; build triads to power machines
- 21–30: transposition puzzles — shift a melody to a new key to unlock doors; scale/mode patterns
- 31–40: harmony repair — choose chords under a melody; layered rhythm (polyrhythm lite)
- 41–50: improvisation grids — compose answer-phrases over a backing loop, the machine "responds"
- 51–55: full composition stages; every piece Sam makes is saved and playable in the Music Sandbox
- Phase 6 stretch: Web MIDI so his real keyboard works as input (high priority given his level).

### World 3 — Logic Circuits (logic gates → pre-coding) — LAUNCH
Mechanic: drag gates onto a board to make the target lamp/machine light up.
- 1–10: switches, wires, AND
- 11–20: OR, NOT, two-gate combos
- 21–30: XOR, three-gate circuits, truth-table matching
- 31–40: circuits powering base devices; find-the-broken-gate debugging
- 41–55: multi-output circuits, binary lite (counting with lamps), boss machines

### World 4 — Robot Valley (sequencing & coding)
Mechanic: program a robot with command blocks (forward/turn/repeat) to solve mazes.
- 1–15: linear sequences, growing mazes
- 16–30: repeat loops, collectibles on path
- 31–45: conditionals lite (if wall → turn), multi-robot puzzles
- 46–55: combine with Logic Circuits skills (robot reads gate outputs)

### World 5 — Time Keep (clocks & time)
Mechanic: a clockwork tower; set hands/digits to trigger events.
- 1–15: o'clock & half-past, analog↔digital matching
- 16–30: 5-minute precision, quarter past/to
- 31–45: elapsed time, day/week/month calendars as puzzles
- 46–55: timetable puzzles (catch the star-train), boss tower

### World 6 — Cipher Bay (cryptography & patterns)
Mechanic: decode messages to unlock chests and story beats.
- 1–15: number-substitution (A=1), picture ciphers
- 16–30: Caesar shifts, pattern keys
- 31–45: combined ciphers, invented symbol alphabets
- 46–55: messages that reveal the game's meta-story; "Code Breaker" badge

### World 7 — Builder's Reach (engineering, machines, architecture, physics)
Mechanic: physics sandbox puzzles (levers, pulleys, gears, ramps; bridge/tower building under load; trajectory launches).
- 1–15: levers & ramps, simple gear trains
- 16–30: pulleys, bridges with part budgets
- 31–45: towers vs. wind/weight, gear ratios
- 46–55: trajectory cannon stages (angle/velocity), grand machine boss

### World 8 — Living Planet (nature, earth science, environment)
Mechanic: interactive simulations + fact-collection codex ("scan data").
- 1–15: plant growth cycles, animal life cycles
- 16–30: simple ecosystems (food chains as graphs/patterns)
- 31–45: rock layers, volcano pressure mini-sim
- 46–55: ecosystem balance challenges; codex completion badge

### World 9 — Explorer's Atlas (space, geography, art, history) — content-pack driven
Mechanic: exploration + matching/puzzle stages from swappable JSON packs. Launch packs:
- **Solar System pack** (15 stages): planet scale/order, orbit sync, moon phases
- **World Map pack** (15 stages): continent stitching, landmarks, flags-lite
- **Color & Art pack** (15 stages): mix primaries to targets, art-style matching
- **Inventions Timeline pack** (10 stages): order breakthroughs, each unlocks a hub gadget
New packs can be added later by dropping a JSON file — this is the long-term expansion valve.

**Totals: ~500 stages, each with regenerating questions.** Worlds unlock in sequence but Worlds 1–3 are open from the start (let him follow interest).

---

## 7. Hub Features (full list)

- **Base building:** purchased rooms/items render in the hub; layout grows visibly with progress.
- **Trophy Room:** every badge as a dated physical object; tapping replays its celebration.
- **Music Sandbox:** free-play on-screen piano; unlocked melodies as guided play-along (falling-note mode) or free mode.
- **Mission Board:** active cliffhanger, suggested next stage, rare-find log.
- **Companion:** a small robot pet (bought in Workshop, upgradeable) that greets Sam by name and comments on achievements — the main "voice" of personalization.
- **Monument Garden:** exterior area where world-completion monuments appear.

## 8. Parent Corner (long-press gear, 3s)
- Per-skill progress charts (from `skillRatings` + `eventLog`), time-played overview.
- Difficulty pins per skill; sound/motion toggles; optional session-length gentle reminder ("Mission complete — good stopping point!") OFF by default.
- Export/import save (JSON file) for device migration; full reset (double-confirm).

## 9. Visual & Audio Direction
- **Mood:** wonder + craftsmanship — Sam's base as a cozy inventor's workshop floating in a beautiful night sky; warm amber interior vs. vast deep-blue exterior.
- **Accent discipline:** one signature electric-cyan used ONLY for rewards/interactives, so the eye learns "cyan = good."
- **Type:** rounded friendly display face for titles; high-legibility body; large sizes.
- **Signature:** "SAM'S WORLDS" title built from game objects (gears, notes, planets forming the letters); "S" emblem recurring on base, ship, icon.
- **Motion:** calm ambient idle in hub; one orchestrated burst per reward. Reduced-motion respected.
- **Audio:** pentatonic feedback chimes (can't sound wrong), distinct per-currency earn sounds, gentle hub ambient loop, real piano samples or quality synth for Melody Engine.

---

## 10. Build Phases (build order — full scope above is the target)

**Phase 1 — Core loop (the bet):** PWA shell + install icon; hub v1 with Sam's name; save/restore exact-state; World 1 stages 1–20 with generators + adaptive difficulty; Star Dust + Workshop (6 items); feedback juice; mission board.
*Exit test: install on the tablet, say nothing, watch for a week — does he reopen it unprompted?*

**Phase 2 — Music & ownership:** World 2 stages 1–20 + Music Sandbox; Melody Shards; Trophy Room + first badges; companion robot v1; avatar basics.

**Phase 3 — Logic & depth:** World 3 full ladder; extend Worlds 1–2 to full 55 stages; Workshop expanded to ~20 items; welcome-back cliffhanger cinematics.

**Phase 4 — Worlds 4–6:** Robot Valley, Time Keep, Cipher Bay full ladders; Parent Corner; Monument Garden.

**Phase 5 — Worlds 7–9:** Builder's Reach physics, Living Planet sims, Explorer's Atlas + 4 launch content packs; Workshop to 40+ items.

**Phase 6 — Polish & stretch:** performance pass (<3s cold start), Web MIDI piano input, Arabic toggle if wanted, new Atlas packs based on what Sam loves.

---

## 11. Conventions for Claude Code
- Repo `sams-worlds/`; structure: `src/engine/`, `src/modules/<world>/`, `src/content/`, `src/hub/`, `src/ui/`, `src/pixi/`, `src/strings/`.
- TypeScript strict; engine logic as pure functions (easy manual debugging; no test suite required).
- No level logic in components — stages are data (§4.3), mechanics are reusable scene types.
- Every feature must serve a principle in §1; if it doesn't, cut it.
- Build Phase 1 as one vertical playable slice before broadening.

## 12. Open Questions for Adel
1. Primary device and screen size? (tablet assumed)
2. English-only or Arabic/English toggle from the start?
3. Is a real piano/keyboard near the device? (affects MIDI priority)
4. Any characters/colors Sam already loves to seed the skin?
