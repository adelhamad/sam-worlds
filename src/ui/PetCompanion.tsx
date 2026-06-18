import { useEffect, useRef, useState } from "react";
import { useGame } from "../state/store";
import { STR } from "../strings/en";
import { sfx, unlockAudio } from "../engine/feedback/audio";
import { fullness, moodOf, petProgress, PET_STAGES } from "../engine/pet/pet";

/** Cosmo's home on the hub — the first emotional anchor Sam sees on open. */
export function PetCompanion() {
  const petName = useGame((s) => s.petName);
  if (petName === null) return <EggNaming />;
  return <GrownPet name={petName} />;
}

function EggNaming() {
  const namePet = useGame((s) => s.namePet);
  const [draft, setDraft] = useState("");
  return (
    <section className="panel pet-card pet-egg-card">
      <div className="pet-avatar pet-bob" aria-hidden>🥚</div>
      <div className="pet-body">
        <div className="pet-name">{STR.petEggTitle}</div>
        <div className="pet-mood">{STR.petEggSub}</div>
        <div className="pet-name-row">
          <input
            className="parent-input pet-name-input"
            placeholder={STR.petNamePlaceholder}
            value={draft}
            maxLength={14}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && namePet(draft)}
          />
          <button
            className={`btn ${draft.trim() ? "btn-primary" : "btn-disabled"}`}
            onClick={() => { unlockAudio(); sfx.tap(); namePet(draft); }}
          >
            {STR.petHatchBtn}
          </button>
        </div>
      </div>
    </section>
  );
}

function moodLine(name: string, fedAt: number): string {
  const mood = moodOf(fullness(fedAt, Date.now()));
  if (mood === "hungry") return STR.petHungry(name);
  if (mood === "peckish") return STR.petPeckish(name);
  return STR.petHappy(name);
}

function GrownPet({ name }: { name: string }) {
  const petXp = useGame((s) => s.petXp);
  const petFedAt = useGame((s) => s.petFedAt);
  const evolvedTo = useGame((s) => s.petEvolvedTo);
  const ack = useGame((s) => s.acknowledgeEvolve);
  const [tapLine, setTapLine] = useState(false);

  const prog = petProgress(petXp);
  const goal = prog.next ? STR.petToNext(prog.mealsToNext, prog.next.label) : STR.petMaxed(name);

  // Celebrate a fresh evolution, then clear the flag.
  useEffect(() => {
    if (evolvedTo === null) return;
    sfx.badge();
    const t = setTimeout(ack, 4200);
    return () => clearTimeout(t);
  }, [evolvedTo, ack]);

  function pet() {
    unlockAudio();
    sfx.tap();
    setTapLine(true);
    setTimeout(() => setTapLine(false), 1600);
  }

  const evolveLabel = evolvedTo !== null ? PET_STAGES[evolvedTo].label : "";
  return (
    <section className={`panel pet-card ${prog.stage.legendary ? "pet-legendary" : ""}`}>
      <button className="pet-avatar pet-bob" onClick={pet} aria-label={name}>
        {prog.stage.emoji}
      </button>
      <div className="pet-body">
        <div className="pet-name">{name} · <small>{prog.stage.label}</small></div>
        <div className="pet-mood">{tapLine ? STR.petTapLine(name) : moodLine(name, petFedAt)}</div>
        <div className="pet-bar">
          <div className="pet-bar-fill" style={{ width: `${Math.round(prog.pct * 100)}%` }} />
        </div>
        <div className="pet-goal">{goal}</div>
      </div>
      {evolvedTo !== null && (
        <button className="pet-evolve-burst" onClick={ack}>
          ✨ {STR.petEvolved(name, evolveLabel)} ✨
        </button>
      )}
    </section>
  );
}

/** Compact companion shown beside the questions during a stage: it nibbles on
 * every correct answer and shows the live "meals to evolve" goal — a small win
 * roughly every five seconds plus an always-visible target. */
export function StagePet({ correctCount }: { correctCount: number }) {
  const petName = useGame((s) => s.petName);
  const petXp = useGame((s) => s.petXp);
  const [eating, setEating] = useState(false);
  const seen = useRef(correctCount);

  useEffect(() => {
    if (correctCount > seen.current) {
      setEating(true);
      const t = setTimeout(() => setEating(false), 650);
      seen.current = correctCount;
      return () => clearTimeout(t);
    }
    seen.current = correctCount;
  }, [correctCount]);

  const prog = petProgress(petXp);
  const emoji = petName === null ? "🥚" : prog.stage.emoji;
  return (
    <div className="stage-pet">
      <span className={`stage-pet-avatar ${eating ? "pet-eat" : ""}`} aria-hidden>{emoji}</span>
      {eating && <span className="stage-pet-yum">+🍙</span>}
      {petName !== null && prog.next && (
        <span className="stage-pet-goal">{prog.mealsToNext} 🍙 → {prog.next.label}</span>
      )}
    </div>
  );
}
