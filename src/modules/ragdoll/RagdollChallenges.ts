import type { SceneEvent } from './RagdollScene';

export type ChallengeAction = 'kick' | 'grab' | 'move' | 'party';
export interface ChallengeProgress { stage: number; step: number; complete: boolean }
export interface ChallengeResult { progress: ChallengeProgress; advanced: boolean; finishedStage: boolean }

export const challengeActions: ChallengeAction[][] = [
  ['kick', 'grab'],
  ['kick', 'kick'],
  ['move', 'grab'],
  ['grab', 'grab', 'grab'],
  ['kick', 'kick', 'kick'],
  ['move', 'grab'],
  ['move', 'kick', 'kick'],
  ['kick', 'party'],
];

const checks: Array<Array<(event: SceneEvent) => boolean>> = [
  [e => e.type === 'gateOpen', e => e.type === 'rescue'],
  [e => e.type === 'crateCrash', e => e.type === 'goal'],
  [e => e.type === 'bounce', e => e.type === 'landed'],
  [e => e.type === 'friendsMeet', e => e.type === 'fruitHome', e => e.type === 'fruitHome'],
  [e => e.type === 'bumperHit', e => e.type === 'bumperHit', e => e.type === 'goal'],
  [e => e.type === 'bridgeReady', e => e.type === 'rescue'],
  [e => e.type === 'fanReady', e => e.type === 'windBoost', e => e.type === 'goal'],
  [e => e.type === 'goal', e => e.type === 'party'],
];

export function firstStep(stage: number): ChallengeProgress {
  return { stage, step: 0, complete: false };
}

export function advanceChallenge(progress: ChallengeProgress, event: SceneEvent): ChallengeResult {
  if (progress.complete || !checks[progress.stage]?.[progress.step]?.(event))
    return { progress, advanced: false, finishedStage: false };
  const finishedStage = progress.step === checks[progress.stage].length - 1;
  return {
    progress: finishedStage ? { ...progress, complete: true } : { ...progress, step: progress.step + 1 },
    advanced: true,
    finishedStage,
  };
}
