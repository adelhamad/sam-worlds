# Teaching traits through discovery: actionable learning design

## What should a seven-year-old understand?

### Takeaway
Teach a nested concept, not two competing labels: **an adaptation is also a trait**. The progression is notice a feature → compare its effects in a place → explain using evidence → apply the relationship to a new case.

### Cited Findings
- UC Berkeley defines an adaptation as a feature favored by natural selection for its current function; it can be anatomical, physiological, or behavioral. Not every trait is an adaptation. This is authoritative biology guidance, not an intervention trial. [UC Museum of Paleontology](https://evolution.berkeley.edu/evolution-101/mechanisms-the-processes-of-evolution/adaptation/)
- Grade-three NGSS expects an argument from evidence about how organisms fare in particular habitats, explicitly linking organism characteristics, needs, and habitat. This is a useful next-step target for age seven, not a claim that all seven-year-olds already meet it. [NGSS 3-LS4-3](https://www.nextgenscience.org/pe/3-ls4-3-biological-evolution-unity-and-diversity)
- Kelemen, Emmons, Seston Schillaci & Ganea (2014) studied ages 5–8 using a coherent picture-storybook explanation of natural selection. The published abstract reports learning, generalization, and three-month retention in Experiment 1; Experiment 2 replicated learning with a more nuanced explanation. It supports teaching causal relationships to this age, not the efficacy of a short app or sorting alone. [Primary study, DOI 10.1177/0956797613516009](https://pubmed.ncbi.nlm.nih.gov/24503874/)

### Inferences
- Recommended child copy: “A trait is a feature of a living thing.” Then: “An adaptation is a trait passed from parents to young that helps living things survive or have young in their home.” Add a short illustrated bridge: “Over many generations, helpful traits can become more common.” This is simplified teaching language; the adult/content model must retain selection history, not equate any helpful action with evolutionary adaptation.
- Keep **trait**, **helps here**, and **known adaptation** distinct in content data. A toy experiment can show a possible benefit; it cannot establish evolutionary history. Introduce known adaptations with a sourced fact card and use simulations to explore their function.
- Never use “trait OR adaptation” bins, “traits are looks; adaptations are actions,” or a permanent “useless trait” category. An animal's feature does not disappear when the child switches habitats. A feature being less useful somewhere does not erase its history as an adaptation elsewhere.
- Make observation/inference contrast explicit: “I see a leaf-shaped body” versus “Its shape helps it hide among leaves.” Animal naming is unnecessary.

### Gaps
- No study located directly tests this exact nested touchscreen curriculum at age seven. The microactivities and mastery rule below are design hypotheses, not validated effects. Kelemen's accessible indexed abstract was verified; full-text fetches were blocked, so no detailed procedure or effect-size claim is made here.

## Which three connected microactivities should the implementation use?

### Takeaway
Build one detective journey: **collect a trait → test what it does → make an evidence story**. Reuse the same small set of cases across activities before changing animals for transfer.

### Cited Findings
- A meta-analysis of 57 experiments found case comparisons generally improved learning over comparison conditions (reported d = .50); this spans varied ages and domains rather than establishing this application's effect. [Alfieri, Nokes-Malach & Schunn, 2013, DOI 10.1080/00461520.2013.775712](https://www.tandfonline.com/doi/abs/10.1080/00461520.2013.775712)
- The IES practice guide rates combining graphics and verbal descriptions, connecting concrete and abstract representations, and alternating worked examples with problems as moderate-evidence recommendations; explanatory questions receive a strong-evidence rating. [IES/WWC practice guide](https://ies.ed.gov/ncee/wwc/practiceguide/1)
- Leaf mimicry in insects is a documented adaptation for evading predators; the Berkeley page supplies a katydid example. This provides a coherent real case for a shape/background comparison. [UC Museum of Paleontology](https://evolution.berkeley.edu/evolution-101/mechanisms-the-processes-of-evolution/adaptation/)

### Inferences
1. **Trait collection: “Find a feature.”** Show one licensed photo with large selectable feature cards (e.g., body shape, leg shape), rather than tiny hotspots. Tap a card, then tap a large “Traits” collection to place it. Reveal a brief evidence card about leaf-shaped bodies hiding among leaves. Add its card to an **“Adaptations” pocket visibly inside “Traits”**; retain the outer trait membership. Ask the child to point to both collections containing that card. For a feature whose role has not been investigated, retain it in Traits with “We need more clues,” not “not an adaptation.” This tests inclusion without treating ignorance as negative evidence.
2. **Habitat lab: “What changes?”** Keep the same leaf-shaped insect model and switch only the background between leafy and plain. Child predicts where it is harder to see by placing an eye token, then taps “Look closely” to reveal a silhouette/outline comparison. Show both conditions side by side after the test; ask for the condition and visible evidence supporting the prediction. Keep sizes, insect pose, and lighting consistent. This is an explicitly labeled **model of hiding**, not measured predation or invented survival percentages. No speed-scored hunt, death animation, or body transformation. Follow with a contrast where the background changes but the trait does not: “The place changed. The body shape stayed the same.”
3. **Evidence story: “Show me why.”** Use tap-to-place picture tiles to build **feature → effect → place**, e.g., “leaf-shaped body → harder to see → among leaves.” Give the complete relationship in the teaching example, remove it for retrieval, and change tile positions and wording. Then supply a new photo/species and all necessary facts for a transfer case: use the same hiding principle, followed later by a different function (such as insulation) with separately verified biology. Ask “What clue helped you?” and offer an optional spoken explanation to a nearby adult. Do not auto-award understanding for tapping “I explained it.”
- Each activity needs a different reasoning action, not four answers dressed up as draggable cards. Offer several plausible tiles where their **combination** matters; do not score a prefilled one-route chain as explanation.
- Implementation envelope: offline packaged case data/photos/credits; React state for prediction → observation → explanation; local progress; bundled audio if used (browser voices are not reliably offline). Use tap-select/tap-place as the default, optional dragging, ≥48px controls, keyboard equivalents, visible focus and text+icon cues. One short instruction at a time. No timers, punishment, streak loss, or rewards for fast guessing.

### Gaps
- A deterministic visual model is illustrative evidence within the game, not an experiment establishing animal survival. A child pilot must check whether learners infer “the animal changed itself” or confuse “unknown function” with “not an adaptation.” Nested regions also need a comprehension check; spatial nesting alone may not communicate inclusion.

## What assessment and feedback demonstrate understanding rather than label memorization?

### Takeaway
Require a correct **relationship with evidence**, a changed-context prediction, and success on a fresh case. Record independent performance separately from coached completion.

### Cited Findings
- IES gives strong evidence to retrieval through re-exposure quizzes and moderate evidence to spacing; its recommendations do not require multiple-choice questions. It recommends questions that elicit explanations rather than mere factual repetition. [IES/WWC practice guide](https://ies.ed.gov/ncee/wwc/practiceguide/1)
- NGSS's performance expectation is constructing an argument **with evidence**, not identifying an animal or reciting a definition. [NGSS 3-LS4-3](https://www.nextgenscience.org/pe/3-ls4-3-biological-evolution-unity-and-diversity)
- The Kelemen study reports generalization to new cases, making transfer a relevant outcome beyond recall of the taught story. [Kelemen et al., 2014](https://pubmed.ncbi.nlm.nih.gov/24503874/)

### Inferences
Use this compact progression as both curriculum and acceptance checklist:

| Step | Observable evidence | What does not count |
|---|---|---|
| Notice | Selects a feature belonging to the organism, not its background | Knows the animal's name |
| Include | Keeps a known adaptation inside the broader trait collection; identifies membership in both | Chooses the word “adaptation” alone |
| Relate | Links a trait to an effect in the specified environment | Says “it helps” without how/where |
| Test | Predicts a changed-background effect and selects the relevant comparison observation | Repeats the last answer |
| Transfer | Builds a defensible chain on an unseen case supplied with enough facts | Replays a memorized species fact |
| Retain | Reconstructs the relationship on a later visit before hints | Completes immediately after the answer is shown |

- Suggested provisional criterion: independent success on two different cases for inclusion and causal linking, plus one changed-context prediction and one later fresh-case retrieval. Report these separate skills, not a single “adaptation expert” score. Threshold is a product decision pending child testing.
- Track first committed prediction, first committed explanation, help shown, case identity, and transfer/delayed status. Exploration taps and sandbox experiments are not wrong answers. Apply anti-guessing only after the child commits an assessed response.
- **Miss flow compatible with fresh-question-after-miss:** preserve the child's response, show the specific comparison and a concise causal correction, wait for “Next case,” then serve a different case testing the same concept. Do not let repeated tapping on the old choices earn credit. Later revisit the underlying concept with altered surface details; “fresh” must not mean abandoning the skill just missed.
- Example feedback: “Look at both places. The body is leaf-shaped in both. Among leaves, its shape is harder to spot. It is still a trait.” For an inclusion error: “Yes, it helps the animal. It is also a trait. Adaptations fit inside the trait group.” For a correct response: identify the evidence (“You used the leaf background as your clue”), rather than praise only correctness.
- Keep correction unscored and allow replay; reserve independent mastery credit for a subsequent fresh probe. An optional adult prompt (“Would this still help on a plain wall? Why?”) can reveal explanations richer than structured tiles, but the offline app must not pretend it evaluated speech.
- Pilot with a few children using two short pre/post probes and an unseen transfer case. Check conceptual answers separately from reading, touch accuracy, and adult help; a usability success alone is not learning evidence.

### Gaps
- No source found validates the required fresh-question-after-miss policy itself. It is an existing product constraint; pairing it with explanation and later retrieval is the recommended design inference. No evidence supports treating correct tile placement alone as equivalent to a freely generated scientific explanation.
