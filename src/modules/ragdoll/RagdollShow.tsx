import { STR } from '../../strings/en';
import { challengeActions, type ChallengeAction, type ChallengeProgress } from './RagdollChallenges';

const copy = STR.ragdoll;
interface Props {
  progress: ChallengeProgress;
  completed: number[];
  mode: 'show' | 'free';
  menuOpen: boolean;
  cheer: string;
  onAction: (action: ChallengeAction) => void;
  onStage: (index: number) => void;
  onFree: () => void;
  onMenuClose: () => void;
}
export function RagdollShow({ progress, completed, mode, menuOpen, cheer, onAction, onStage, onFree, onMenuClose }: Props) {
  const stage = copy.showStages[progress.stage];
  const action = challengeActions[progress.stage][progress.step];
  const actionLabel = action === 'glasses' ? copy.glasses : copy[action];
  function stepClass(index: number) {
    if (index < progress.step || progress.complete) return 'done';
    if (index === progress.step) return 'current';
    return '';
  }
  return (
    <>
      {mode === 'show' && !menuOpen && (
        <aside className={`ragdoll-show-panel ${progress.complete ? 'is-complete' : ''}`} aria-live="polite">
          <div className="ragdoll-show-count">{copy.stageOf(progress.stage + 1, copy.showStages.length)} {completed.includes(progress.stage) && '★'}</div>
          <h2>{stage.title}</h2>
          <p className="ragdoll-show-subtitle">{stage.subtitle}</p>
          <div className="ragdoll-show-steps" aria-label={copy.stepOf(progress.step + 1, stage.steps.length)}>
            {stage.steps.map((step, index) => <span key={step} className={stepClass(index)} />)}
          </div>
          {progress.complete ? (
            <>
              <p className="ragdoll-show-prompt">{progress.stage === copy.showStages.length - 1 ? copy.showFinished : cheer}</p>
              <div className="ragdoll-show-actions">
                <button type="button" className="ragdoll-show-primary" onClick={() => onStage((progress.stage + 1) % copy.showStages.length)}>{copy.showNext} →</button>
                <button type="button" onClick={() => onStage(progress.stage)}>{copy.showAgain}</button>
              </div>
            </>
          ) : (
            <>
              <p className="ragdoll-show-prompt">{stage.steps[progress.step]}</p>
              <button type="button" className="ragdoll-show-primary" onClick={() => onAction(action)}>{actionLabel} →</button>
              {progress.stage === 5 && progress.step === 1 && <small className="ragdoll-show-tip">{copy.rescueHint}</small>}
              {progress.count > 0 && <small>{progress.count} / 2</small>}
            </>
          )}
        </aside>
      )}
      {cheer && !menuOpen && !progress.complete && <div className="ragdoll-show-cheer" role="status">✦ {cheer}</div>}
      {menuOpen && (
        <div className="ragdoll-show-menu-backdrop">
          <section className="ragdoll-show-menu" role="dialog" aria-modal="true" aria-label={copy.showMenu}>
            <div className="ragdoll-show-menu-head">
              <div><h2>{copy.show}</h2><p>{copy.showIntro}</p></div>
              <button type="button" onClick={onMenuClose} aria-label={copy.close}>×</button>
            </div>
            <div className="ragdoll-show-list">
              {copy.showStages.map((item, index) => (
                <button type="button" key={item.title} onClick={() => onStage(index)} className={mode === 'show' && progress.stage === index ? 'is-current' : ''}>
                  <strong>{completed.includes(index) ? '★' : `${index + 1}.`} {item.title}</strong><span>{item.subtitle}</span>
                </button>
              ))}
            </div>
            <button type="button" className="ragdoll-show-free" onClick={onFree}>{copy.freePlay} →</button>
          </section>
        </div>
      )}
    </>
  );
}
