import { Link } from 'react-router-dom';
import { STR } from '../../strings/en';
import { challengeActions, type ChallengeAction, type ChallengeProgress } from './RagdollChallenges';
import { RagdollIcon } from './RagdollIcon';

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
  onMenuOpen: () => void;
}
export function RagdollShow({ progress, completed, mode, menuOpen, cheer, onAction, onStage, onFree, onMenuClose, onMenuOpen }: Props) {
  const stage = copy.showStages[progress.stage];
  const action = challengeActions[progress.stage][progress.step];
  const recommended = copy.showStages.findIndex((_, index) => !completed.includes(index));
  let actionIcon: 'party' | 'grab' | 'kick' | 'move' = 'kick';
  if (action === 'party') actionIcon = 'party';
  if (action === 'grab') actionIcon = 'grab';
  if (action === 'move') actionIcon = 'move';
  const stepClass = (index: number) => {
    if (index < progress.step || progress.complete) return 'done';
    if (index === progress.step) return 'current';
    return '';
  };
  return <>
    {mode === 'show' && !menuOpen && <aside className={`ragdoll-show-panel ${progress.complete ? 'is-complete' : ''}`} aria-live="polite">
      {progress.complete && <img className="ragdoll-complete-art" src="/ragdoll/fruit-friends.png" alt="Pineapple and Watermelon friends celebrating" />}
      <div className="ragdoll-show-count">{copy.stageOf(progress.stage + 1, copy.showStages.length)} {progress.complete && <RagdollIcon name="check" size={17} />}</div>
      <h2>{stage.title}</h2><p className="ragdoll-show-subtitle">{stage.subtitle}</p>
      <div className="ragdoll-show-steps" aria-label={copy.stepOf(Math.min(progress.step + 1, stage.steps.length), stage.steps.length)}>
        {stage.steps.map((step, index) => <span key={step} className={stepClass(index)} />)}
      </div>
      {progress.complete ? <>
        <p className="ragdoll-show-prompt">{progress.stage === copy.showStages.length - 1 ? copy.showFinished : cheer || 'Stage cleared!'}</p>
        <div className="ragdoll-show-actions">
          <button type="button" className="ragdoll-show-primary" onClick={() => progress.stage === copy.showStages.length - 1 ? onMenuOpen() : onStage(progress.stage + 1)}>{progress.stage === copy.showStages.length - 1 ? copy.showChoose : copy.showNext}<RagdollIcon name="arrow" size={18} /></button>
          <button type="button" onClick={() => onStage(progress.stage)}>{copy.showAgain}</button>
        </div>
      </> : <>
        <p className="ragdoll-show-prompt">{stage.steps[progress.step]}</p>
        <p className="ragdoll-show-tip">{stage.tip}</p>
        <div className="ragdoll-show-actions">
          <button type="button" className="ragdoll-show-primary" onClick={() => onAction(action)}><RagdollIcon name={actionIcon} size={17} />{action === 'party' ? copy.party : `Use ${copy[action]}`}</button>
          <button type="button" onClick={() => onStage(progress.stage)}>{copy.showAgain}</button>
        </div>
      </>}
    </aside>}
    {cheer && !menuOpen && !progress.complete && <div className="ragdoll-show-cheer" role="status">{cheer}</div>}
    {menuOpen && <div className="ragdoll-show-menu-backdrop">
      <section className="ragdoll-show-menu" role="dialog" aria-modal="true" aria-label={copy.showMenu}>
        <div className="ragdoll-map-head">
          <Link to="/hub" className="ragdoll-map-base">Base</Link>
          <div className="ragdoll-map-title"><span>{copy.kicker}</span><h2>{copy.show}</h2><p>{copy.showIntro}</p></div>
          <button type="button" className="ragdoll-map-close" onClick={onMenuClose} aria-label={copy.showClose}><RagdollIcon name="close" /></button>
        </div>
        <div className="ragdoll-map-art" aria-hidden="true" />
        <div className="ragdoll-show-list">
          {copy.showStages.map((item, index) => <button type="button" key={item.title} onClick={() => onStage(index)} className={`ragdoll-stage-card ${mode === 'show' && progress.stage === index ? 'is-current' : ''} ${index === recommended ? 'is-next' : ''}`}>
            <span className="ragdoll-stage-card-art" style={{ backgroundPosition: `${(index % 4) * 30}% ${Math.floor(index / 4) * 68}%` }} aria-hidden="true" />
            <span className="ragdoll-stage-card-number">{completed.includes(index) ? <RagdollIcon name="check" size={17} /> : String(index + 1).padStart(2, '0')}</span>
            <strong>{item.title}</strong><span className="ragdoll-stage-card-goal">{item.subtitle}</span>
          </button>)}
          <button type="button" className="ragdoll-stage-card ragdoll-stage-free" onClick={onFree}>
            <img src="/ragdoll/fruit-friends.png" alt="" /><strong>{copy.freePlay}</strong><span className="ragdoll-stage-card-goal">Build anything and make your own fun.</span>
          </button>
        </div>
      </section>
    </div>}
  </>;
}
