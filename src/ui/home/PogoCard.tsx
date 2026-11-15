// The hero of the home: Pogo says one true, warm line and offers ONE big button
// that always does the most useful thing next (see nextAction.ts).
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import type { MotivatorLine } from "../../engine/quests/motivator";
import { HOME } from "../../strings/home";
import { pogoVoice } from "../../engine/feedback/pogoVoice";
import { TOUR } from "../../strings/tour";
import { CourseEmblem } from "../tour/CourseEmblem";
import { Pogo, PogoTap } from "../tour/Pogo";
import { usePogoPoke } from "../tour/usePogoPoke";
import { Glyph, Icon } from "../icons/Icon";
import { useMedia } from "./hooks";
import { ChestArt } from "./QuestChest";
import type { NextAction } from "./nextAction";

const T = HOME.home;

function labels(action: NextAction): { main: string; sub: string | null } {
  const lesson = action.lesson?.name ?? "";
  if (action.kind === "chest") return { main: T.openChest, sub: action.course ? T.chestIn(action.course.title) : null };
  if (action.kind === "universe") return { main: T.exploreUniverse, sub: null };
  if (action.kind === "start" && action.course) return { main: T.startCourse(action.course.title), sub: lesson };
  return { main: T.continueLesson(lesson), sub: action.course?.title ?? action.worldName };
}

function GoArt({ action }: { action: NextAction }) {
  if (action.kind === "chest") return <span className="home-go-chest"><ChestArt open={false} /></span>;
  if (action.course) return <CourseEmblem course={action.course} size={52} />;
  if (action.worldIcon) return <span className="home-go-glyph"><Glyph value={action.worldIcon} size="1em" /></span>;
  return <span className="home-go-glyph"><Icon name="planet" size="1em" /></span>;
}

export interface PogoCardProps {
  action: NextAction;
  line: MotivatorLine;
  /** Changes when something wonderful happened on the home (quest chest). */
  celebrate: number;
}

/** Tapping Pogo on the home card: a giggle (the first tap also wakes the audio). */
const giggle = () => {
  unlockAudio();
  pogoVoice.giggle();
};

export function PogoCard({ action, line, celebrate }: PogoCardProps) {
  const navigate = useNavigate();
  const wide = useMedia("(min-width: 700px)");
  // Pogo "talks" while the line pops in, then holds the line's mood.
  const [spoken, setSpoken] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setSpoken(line.text), 1700);
    return () => clearTimeout(t);
  }, [line.text]);
  // A celebration (quest chest) makes Pogo go "wow" for a moment.
  const [wowDone, setWowDone] = useState(0);
  useEffect(() => {
    if (!celebrate) return undefined;
    const t = setTimeout(() => setWowDone(celebrate), 2600);
    return () => clearTimeout(t);
  }, [celebrate]);
  let mood: MotivatorLine["mood"] | undefined = spoken === line.text ? line.mood : undefined;
  if (celebrate > 0 && wowDone !== celebrate) mood = "wow";
  const { main, sub } = labels(action);
  const poke = usePogoPoke(giggle);

  return (
    // Pogo + bubble + button share one grid (pogo-say-right gives the bubble its tail):
    // phone — the button spans the card under them; wider — it sits under the bubble.
    <section className="home-card home-hero pogo-say-right home-rise" style={{ "--i": 1 } as React.CSSProperties}>
      <span className="home-hero-glow" aria-hidden="true" />
      <PogoTap className="home-hero-pogo" poke={poke} label={TOUR.tapPogo}>
        <Pogo mood={poke.mood ?? mood ?? "talk"} size={wide ? 172 : 124} replayKey={celebrate || undefined} />
      </PogoTap>
      <div key={line.text} className="pogo-bubble home-hero-bubble">
        <span className="pogo-bubble-text">{line.text}</span>
      </div>
      <button
        type="button"
        className={`tbtn tbtn-go home-go is-${action.kind}`}
        data-testid="home-go"
        onClick={() => {
          unlockAudio();
          sfx.tap();
          navigate(action.route);
        }}
      >
        <span className="home-go-art" aria-hidden="true"><GoArt action={action} /></span>
        <span className="home-go-text">
          <span className="home-go-main">{main}</span>
          {sub && <span className="home-go-sub">{sub}</span>}
        </span>
        <span className="home-go-arrow" aria-hidden="true"><Icon name="play" size="1em" mono /></span>
      </button>
    </section>
  );
}
