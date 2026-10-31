import { useState } from 'react';
import { useGame } from '../state/store';
import { STR } from '../strings/en';

export function ParentRagdoll() {
  const completed = useGame(s => s.ragdollShowsCompleted);
  const reset = useGame(s => s.resetRagdollShows);
  const [confirm, setConfirm] = useState(false);
  const copy = STR.ragdoll;
  return (
    <section className="panel parent-block">
      <h2>★ {copy.parentTitle} ({completed.length}/{copy.showStages.length})</h2>
      <p className="dim">{copy.parentDescription}</p>
      <div className="parent-row" style={{ flexWrap: 'wrap' }}>
        {copy.showStages.map((stage, index) => <span key={stage.title}>{completed.includes(index) ? '★' : '☆'} {stage.title}</span>)}
      </div>
      {confirm ? <div className="parent-row">
        <button className="btn btn-secondary" onClick={() => setConfirm(false)}>{copy.parentCancel}</button>
        <button className="btn btn-danger" onClick={() => { reset(); setConfirm(false); }}>{copy.parentConfirm}</button>
      </div> : <button className="btn btn-secondary" onClick={() => setConfirm(true)}>{copy.parentReset}</button>}
    </section>
  );
}
