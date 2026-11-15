// Sam's home: learn with Pogo. Top to bottom — what to do next (Pogo's card),
// today's quests, every course on the shelf, Sam's things, and a calm door to
// the classic worlds. Styled with the course design system (`.tour`).
import { useCallback, useRef, useState } from "react";
import { TreasureVault } from "../TreasureVault";
import { Workshop } from "../Workshop";
import { Icon } from "../icons/Icon";
import "../tour/tour-base.css";
import { CourseShelf } from "./CourseShelf";
import { HomeTopBar } from "./HomeTopBar";
import { MyThings } from "./MyThings";
import { PogoCard } from "./PogoCard";
import { QuestCard } from "./QuestCard";
import { UniverseDoor } from "./UniverseDoor";
import { useDustFly, useHomeState, useNextUp, useQuestView, useShelfCourses } from "./hooks";
import "./home.css";
import "./home-parts.css";

export function Home() {
  const state = useHomeState();
  const courses = useShelfCourses(state);
  const quests = useQuestView();
  const { action, line } = useNextUp(state, courses, quests);
  const dustRef = useRef<HTMLSpanElement>(null);
  const { flights, landed, launch, land } = useDustFly(dustRef);
  const [celebrate, setCelebrate] = useState(0);
  const [panel, setPanel] = useState<"vault" | "shop" | null>(null);
  const onCelebrate = useCallback(() => setCelebrate((n) => n + 1), []);

  return (
    <div className="screen tour home">
      <div className="home-wrap">
        <HomeTopBar dustRef={dustRef} dustPop={landed} inFlight={flights.reduce((sum, flight) => sum + flight.amount, 0)} />
        <div className="home-top">
          <PogoCard action={action} line={line} celebrate={celebrate} />
          <QuestCard view={quests} onDust={launch} onCelebrate={onCelebrate} />
        </div>
        <CourseShelf courses={courses} progress={state.progress} tourChests={state.tourChests} />
        <MyThings onOpen={setPanel} />
        <UniverseDoor />
      </div>

      {flights.map((flight) => (
        <span key={flight.id} className="dust-flight" style={flight.style} onAnimationEnd={() => land(flight.id)} aria-hidden="true">
          +{flight.amount} <Icon name="dust" size="1em" />
        </span>
      ))}
      {panel === "shop" && <Workshop onClose={() => setPanel(null)} />}
      {panel === "vault" && <TreasureVault onClose={() => setPanel(null)} />}
    </div>
  );
}
