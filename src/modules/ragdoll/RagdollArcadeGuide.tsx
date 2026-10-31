import { useEffect, useState, type RefObject } from 'react';
import { challengeActions, type ChallengeProgress } from './RagdollChallenges';
import type { RagdollScene } from './RagdollScene';
import type { GuideScreen } from './RagdollGuidePoints';
import './RagdollArcadeGuide.css';

interface Props { sceneRef: RefObject<RagdollScene>; progress: ChallengeProgress; active: boolean }

export function RagdollArcadeGuide({ sceneRef, progress, active }: Props) {
  const [guide, setGuide] = useState<GuideScreen>();

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = 0;
    const update = (now: number) => {
      if (now - last > 90) { setGuide(sceneRef.current?.getGuide(progress.step)); last = now; }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => { cancelAnimationFrame(frame); setGuide(undefined); };
  }, [active, progress.stage, progress.step, sceneRef]);

  if (!active || !guide) return null;
  const { from, to, width, height } = guide;
  const arc = `M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 43} ${to.x} ${to.y}`;
  const action = challengeActions[progress.stage][progress.step];
  const label = action === 'kick' ? 'AIM HERE' : 'DROP HERE';
  return <svg className="ragdoll-arcade-guide" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    <defs><marker id="ragdoll-guide-tip" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 0 L 12 6 L 0 12 Z" fill="#ffba38" stroke="#fff" strokeWidth="1" /></marker></defs>
    <path d={arc} className="ragdoll-guide-outline" />
    <path d={arc} className="ragdoll-guide-path" markerEnd="url(#ragdoll-guide-tip)" />
    <circle cx={from.x} cy={from.y} r="24" className="ragdoll-guide-source" />
    <circle cx={to.x} cy={to.y} r="31" className="ragdoll-guide-target" />
    <circle cx={to.x} cy={to.y} r="7" className="ragdoll-guide-target-core" />
    <text x={to.x} y={to.y - 38} className="ragdoll-guide-label" textAnchor="middle">{label}</text>
  </svg>;
}
