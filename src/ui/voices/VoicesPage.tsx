// Parent Section → Voices (/parent/voices, behind the same parent password):
// for every language course, the device voice and the parent's own recordings.
import { useState } from "react";
import { Link } from "react-router-dom";
import { LANG_SEEDS } from "../../content/langCourses";
import { VOICES } from "../../strings/voices";
import { Icon } from "../icons/Icon";
import { ParentGate } from "../ParentGate";
import { ClipStudio } from "./ClipStudio";
import { DeviceVoice } from "./DeviceVoice";
import { useStudio } from "./useStudio";
import "./voices.css";

function Voices() {
  const [courseId, setCourseId] = useState(LANG_SEEDS[0]?.id ?? "");
  const seed = LANG_SEEDS.find((item) => item.id === courseId) ?? LANG_SEEDS[0];
  const studio = useStudio();
  if (!seed) return null;

  const choose = (id: string) => {
    if (studio.active) studio.stop();
    studio.setProblem(null);
    setCourseId(id);
  };

  return (
    <div className="screen parent-screen vx-page" data-testid="voices-page">
      <header className="hub-header">
        <Link to="/parent" className="btn btn-secondary" aria-label={VOICES.back}>
          <Icon name="back" size={22} mono /> {VOICES.back}
        </Link>
        <h1>{VOICES.title}</h1>
        <span />
      </header>

      <div className="vx-tabs" role="tablist">
        {LANG_SEEDS.map((item) => (
          <button
            key={item.id} type="button" role="tab" aria-selected={item.id === seed.id}
            className={`btn ${item.id === seed.id ? "btn-primary" : "btn-secondary"} vx-tab`}
            onClick={() => choose(item.id)} data-testid={`vx-tab-${item.lang}`}
          >
            {item.title}
          </button>
        ))}
      </div>

      <section className="panel parent-block vx-why">
        {VOICES.why[seed.lang].map((line) => <p key={line}>{line}</p>)}
      </section>

      <DeviceVoice key={`device-${seed.id}`} seed={seed} />
      <ClipStudio key={`studio-${seed.id}`} seed={seed} studio={studio} />
    </div>
  );
}

export function VoicesPage() {
  return (
    <ParentGate title={VOICES.title} back="/parent" backLabel={VOICES.back}>
      <Voices />
    </ParentGate>
  );
}
