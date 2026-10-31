import type { SceneEvent } from './RagdollScene';

export type ChallengeAction = 'kick' | 'grab' | 'characters' | 'objects' | 'glasses' | 'move' | 'delete' | 'party';
export interface ChallengeProgress { stage: number; step: number; count: number; complete: boolean }
export interface ChallengeResult { progress: ChallengeProgress; advanced: boolean; finishedStage: boolean }

export const challengeActions: ChallengeAction[][] = [
  ['kick', 'grab', 'characters'],
  ['kick', 'kick', 'objects'],
  ['kick', 'kick', 'characters'],
  ['glasses', 'characters', 'kick'],
  ['kick', 'kick', 'move'],
  ['kick', 'grab', 'delete'],
  ['characters', 'party', 'kick'],
];

export function firstStep(stage: number): ChallengeProgress {
  return { stage, step: 0, count: 0, complete: false };
}
function requiredCount(progress: ChallengeProgress) {
  return progress.stage === 3 && progress.step === 1 ? 2 : 1;
}
const checks: Array<Array<(event: SceneEvent) => boolean>> = [
  [e => e.type === 'kick' && !!e.character, e => e.type === 'release', e => e.type === 'spawn' && !!e.character],
  [e => e.type === 'kick' && !!e.character, e => e.type === 'impact' && e.kind === 'crate', e => e.type === 'spawn' && e.kind === 'ball'],
  [e => e.type === 'kick' && !!e.character, e => e.type === 'bounce', e => e.type === 'spawn' && (e.kind === 'pineapple' || e.kind === 'watermelon')],
  [e => e.type === 'glasses' && !!e.glasses, e => e.type === 'spawn' && !!e.character, e => e.type === 'collide'],
  [e => e.type === 'kick' && !!e.character, e => e.type === 'bump', e => e.type === 'move' && e.kind === 'bumper'],
  [e => e.type === 'kick' && !!e.character, e => e.type === 'grab' && !!e.airborne, e => e.type === 'delete' && e.kind === 'spikes'],
  [e => e.type === 'spawn' && (e.kind === 'pineapple' || e.kind === 'watermelon'), e => e.type === 'party', e => e.type === 'kick' && e.kind === 'ball'],
];
function matches(progress: ChallengeProgress, event: SceneEvent): boolean {
  return checks[progress.stage]?.[progress.step]?.(event) ?? false;
}
export function advanceChallenge(progress: ChallengeProgress, event: SceneEvent): ChallengeResult {
  if (progress.complete || !matches(progress, event)) return { progress, advanced: false, finishedStage: false };
  const count = progress.count + 1;
  if (count < requiredCount(progress)) return { progress: { ...progress, count }, advanced: false, finishedStage: false };
  if (progress.step === 2) return { progress: { ...progress, count, complete: true }, advanced: true, finishedStage: true };
  return { progress: { ...progress, step: progress.step + 1, count: 0 }, advanced: true, finishedStage: false };
}
