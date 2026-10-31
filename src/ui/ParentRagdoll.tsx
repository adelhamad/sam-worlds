import { useEffect, useState } from 'react';
import { useGame } from '../state/store';
import { STR } from '../strings/en';
import { RagdollIcon } from '../modules/ragdoll/RagdollIcon';
import { recentPlaytestRuns, type PlaytestRun } from '../modules/ragdoll/RagdollPlaytest';
import './ParentRagdoll.css';

const copy = STR.ragdoll;
const timeLabel = (ms: number) => ms < 60_000 ? `${Math.max(1, Math.round(ms / 1000))}s` : `${Math.round(ms / 60_000)}m`;
const stageTitle = (run: PlaytestRun) => run.mode === 'free' ? copy.freePlay : copy.showStages[run.stage ?? -1]?.title ?? 'Unknown stage';
const resultLabel = (run: PlaytestRun) => {
  if (run.mode === 'free') return run.firstAction ? `Used ${run.firstAction}` : 'No action recorded';
  if (run.cleared) return `Cleared in ${timeLabel(run.clearMs ?? 0)}`;
  if (run.step) return `Completed ${run.step} of ${copy.showStages[run.stage ?? -1]?.steps.length ?? '?'} goals`;
  return run.firstAction ? 'Stopped before first goal' : 'No action recorded';
};
const summaryLine = (run: PlaytestRun) => {
  const firstAction = run.firstActionMs === undefined ? '' : ' — first action ' + timeLabel(run.firstActionMs);
  return `${new Date(run.at).toLocaleString()} — ${stageTitle(run)} — ${resultLabel(run)}${firstAction}`;
};

function ActivityList({ runs, error }: { runs: PlaytestRun[]; error: boolean }) {
  if (error) return <p>Activity could not be loaded on this device.</p>;
  if (runs.length === 0) return <p>No Ragdoll Quest sessions recorded yet.</p>;
  return <ol className="ragdoll-parent-runs">{runs.map(run => <li key={run.id}><strong>{stageTitle(run)}</strong><span>{new Date(run.at).toLocaleString()}</span><span>{resultLabel(run)}</span>{run.firstActionMs !== undefined && <span>First action in {timeLabel(run.firstActionMs)}</span>}{run.durationMs !== undefined && <span>Open for {timeLabel(run.durationMs)}</span>}</li>)}</ol>;
}

export function ParentRagdoll() {
  const completed = useGame(s => s.ragdollShowsCompleted);
  const reset = useGame(s => s.resetRagdollShows);
  const [confirm, setConfirm] = useState(false);
  const [runs, setRuns] = useState<PlaytestRun[]>([]);
  const [activityError, setActivityError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    void recentPlaytestRuns().then(result => { if (live) setRuns(result); })
      .catch(() => { if (live) setActivityError(true); });
    return () => { live = false; };
  }, [completed]);

  async function copySummary() {
    const lines = [`${copy.parentTitle}: ${completed.length}/${copy.showStages.length} stages marked`, ...runs.map(summaryLine)];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
    } catch { setCopied(false); }
  }

  return (
    <section className="panel parent-block ragdoll-parent">
      <h2 className="ragdoll-parent-heading"><img src="/ragdoll/fruit-friends.png" alt="" />{copy.parentTitle} ({completed.length}/{copy.showStages.length})</h2>
      <p className="dim">{copy.parentDescription}</p>
      <div className="ragdoll-parent-stages" aria-label="Stage marks">
        {copy.showStages.map((stage, index) => <span className={completed.includes(index) ? 'is-complete' : ''} key={stage.title}><span className="ragdoll-parent-mark">{completed.includes(index) ? <RagdollIcon name="check" size={15} /> : index + 1}</span>{stage.title}</span>)}
      </div>
      {confirm ? <div className="parent-row">
        <button className="btn btn-secondary" onClick={() => setConfirm(false)}>{copy.parentCancel}</button>
        <button className="btn btn-danger" onClick={() => { reset(); setConfirm(false); }}>{copy.parentConfirm}</button>
      </div> : <button className="btn btn-secondary" onClick={() => setConfirm(true)}>{copy.parentReset}</button>}
      <div className="ragdoll-parent-activity">
        <div className="ragdoll-parent-activity-heading"><h3>{copy.parentActivityTitle}</h3>{runs.length > 0 && <button className="btn btn-secondary btn-compact" onClick={() => void copySummary()}>{copied ? 'Copied' : 'Copy summary'}</button>}</div>
        <p className="dim">{copy.parentActivityDescription}</p>
        <ActivityList runs={runs} error={activityError} />
      </div>
    </section>
  );
}
