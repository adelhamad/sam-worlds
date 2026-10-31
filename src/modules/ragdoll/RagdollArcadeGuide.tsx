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
  const label = action === 'kick' ? 'HIT HERE' : 'DROP HERE';
  const sourceLabel = action === 'kick' ? 'TAP BALL' : 'DRAG THIS';
  const sourceLabelX = Math.max(58, Math.min(width - 58, from.x));
  const sourceLabelY = from.y + 81 < height - 12 ? from.y + 81 : from.y - 47;
  const targetLabelX = Math.max(58, Math.min(width - 58, to.x));
  const targetLabelY = Math.max(20, to.y - 38);
  return <svg className="ragdoll-arcade-guide" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    <defs><marker id="ragdoll-guide-tip" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 0 L 12 6 L 0 12 Z" fill="#ffba38" stroke="#fff" strokeWidth="1" /></marker></defs>
    <path d={arc} className="ragdoll-guide-outline" />
    <path d={arc} className="ragdoll-guide-path" markerEnd="url(#ragdoll-guide-tip)" />
    <circle cx={from.x} cy={from.y} r="24" className="ragdoll-guide-source" />
    <circle cx={to.x} cy={to.y} r="31" className="ragdoll-guide-target" />
    <circle cx={to.x} cy={to.y} r="7" className="ragdoll-guide-target-core" />
    {action === 'kick' ? <image className="ragdoll-guide-tap-hand" href="/ragdoll/touch-hand.svg" x={from.x - 14} y={from.y - 8} width="51" height="62" /> : <>
      <g className="ragdoll-guide-drag-hand"><animateMotion path={arc} dur="2.4s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;.18;.8;1" calcMode="linear" /><image href="/ragdoll/touch-hand.svg" x="-14" y="-8" width="51" height="62" /></g>
      <image className="ragdoll-guide-static-hand" href="/ragdoll/touch-hand.svg" x={from.x - 14} y={from.y - 8} width="51" height="62" />
    </>}
    <text x={sourceLabelX} y={sourceLabelY} className="ragdoll-guide-label ragdoll-guide-source-label" textAnchor="middle">{sourceLabel}</text>
    <text x={targetLabelX} y={targetLabelY} className="ragdoll-guide-label" textAnchor="middle">{label}</text>
  </svg>;
}
