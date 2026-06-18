import { useState } from "react";
import { useGame } from "../state/store";
import { petProgress, PET_STAGES } from "../engine/pet/pet";

/** Cosmo companion controls (CLAUDE.md rule 2: persisted state needs view/edit/reset). */
export function PetControls() {
  const petName = useGame((s) => s.petName);
  const petXp = useGame((s) => s.petXp);
  const setPetXp = useGame((s) => s.setPetXp);
  const resetPet = useGame((s) => s.resetPet);
  const [xpInput, setXpInput] = useState(String(petXp));

  const prog = petProgress(petXp);
  const last = PET_STAGES[PET_STAGES.length - 1];

  return (
    <section className="panel parent-block">
      <h2>🐉 Cosmo (companion)</h2>
      <p className="dim">
        {petName
          ? `${petName} — ${prog.stage.emoji} ${prog.stage.label} · ${petXp} XP`
          : "Egg not hatched yet (Sam names it on the base)."}
      </p>
      <div className="parent-row">
        <span className="parent-world-name">Set XP (0–{last.xp}+)</span>
        <input
          className="parent-input parent-input-sm"
          type="number"
          min={0}
          value={xpInput}
          onChange={(e) => setXpInput(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setPetXp(Number(xpInput) || 0)}>
          Set
        </button>
      </div>
      <button className="btn btn-secondary" onClick={resetPet}>
        Reset companion (back to egg)
      </button>
    </section>
  );
}
