// The real-life mission of a language lesson, shown on the lesson-complete
// screen: one thing to SAY to a real person today. Nothing is tracked — it is
// an invitation, and the grown-ups at home are the reward.
import { langParams } from "../../../content/langCourse";
import type { StageDef } from "../../../content/types";
import { LANG } from "../../../strings/lang";
import { Icon } from "../../../ui/icons/Icon";
import "./lang.css";

export function LangMission({ stage }: { stage: StageDef }) {
  if (stage.generator !== "lang") return null;
  const mission = langParams(stage).mission;
  if (!mission) return null;
  return (
    <section className="lx-mission" data-testid="lang-mission">
      <Icon name="chat" size={44} className="lx-mission-icon" />
      <div>
        <h3 className="lx-mission-title">{LANG.meet.mission}</h3>
        <p className="lx-mission-text">{mission}</p>
        <p className="lx-mission-note">{LANG.meet.missionNote}</p>
      </div>
    </section>
  );
}
