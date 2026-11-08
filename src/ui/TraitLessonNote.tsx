import { ADAPTATION_PICTURES } from "../content/traits/pictureMap";
import { TRAIT_PHOTOS } from "../content/traits/photoCatalog";
import { traitLessonExample } from "../engine/generators/traitLesson";
import type { Question } from "../engine/generators/types";
import { speak } from "../engine/feedback/speech";
import { STR } from "../strings/en";
import "./traits.css";

export function TraitLessonNote({ items, question }: { items?: string[]; question: Question }) {
  if (!items || !question.dedupeKey?.startsWith("traits:")) return null;
  const example = traitLessonExample(items, question);
  const text = STR.traits;
  const photo = example && TRAIT_PHOTOS[ADAPTATION_PICTURES[example.id]];
  const trait = example && text.lessonTrait(example.organism, example.trait);
  const adaptation = example && text.lessonAdaptation(example.job);
  const speech = [text.lessonTitle, text.lessonTraitDefinition, text.lessonAdaptationDefinition,
    text.lessonExample, trait, text.lessonAlsoAdaptation, adaptation, text.guideReminder].filter(Boolean).join(" ");
  return <>
    <section className="trait-lesson-note" aria-labelledby="trait-lesson-title">
      <div className="trait-lesson-heading">
        <h2 id="trait-lesson-title">{text.lessonTitle}</h2>
        <button className="speak-btn" aria-label={text.guideListen} onClick={() => speak(speech)}>🔊</button>
      </div>
      <p className="trait-lesson-definitions">{text.lessonTraitDefinition} {text.lessonAdaptationDefinition}</p>
      {example && photo && <div className="trait-lesson-example">
        <figure>
          <img src={photo.src} alt={photo.alt} width="96" height="80" />
          <figcaption>{text.lessonExample}: {photo.label}</figcaption>
        </figure>
        <dl>
          <div><dt>{text.traitLabel}</dt><dd>{trait}</dd></div>
          <div><dt>{text.lessonAlsoAdaptation}</dt><dd>{adaptation}</dd></div>
        </dl>
      </div>}
      <p className="trait-lesson-reminder">{text.guideReminder}</p>
    </section>
    <p className="trait-lesson-your-turn">{text.lessonYourTurn}</p>
  </>;
}
