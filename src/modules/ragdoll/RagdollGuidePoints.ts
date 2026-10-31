import * as THREE from 'three';
import type { RagdollCharacter } from './RagdollCharacter';
import type { Prop } from './RagdollProps';
import { gateSwitch, gateHome, crateTower, crateGoal, landingGoal, fruitGoal, bumperGoal, safeGoal, fanTarget, windLane, windGoal, finalGoal } from './RagdollGoals';

export interface GuideWorld { from: THREE.Vector3; to: THREE.Vector3 }
export interface GuideScreen { width: number; height: number; from: { x: number; y: number }; to: { x: number; y: number } }

const propPoint = (prop?: Prop) => prop && new THREE.Vector3(prop.body.position.x, prop.body.position.y, prop.body.position.z);
const friendPoint = (character?: RagdollCharacter) => {
  const torso = character?.parts[0]?.body.position;
  return torso && new THREE.Vector3(torso.x, Math.max(1.2, torso.y), torso.z);
};
const friendGround = (character?: RagdollCharacter) => {
  const torso = character?.parts[0]?.body.position;
  return torso && new THREE.Vector3(torso.x, 0.25, torso.z);
};
const targetPoint = ([x, z]: readonly [number, number]) => new THREE.Vector3(x, 0.25, z);
const pair = (from?: THREE.Vector3, to?: THREE.Vector3): GuideWorld | undefined => from && to ? { from, to } : undefined;

function windGuide(step: number, props: Prop[], ball?: Prop): GuideWorld | undefined {
  let destination: readonly [number, number] = fanTarget;
  if (step === 1) destination = windLane;
  if (step === 2) destination = windGoal;
  return pair(step === 0 ? propPoint(props.find(prop => prop.kind === 'fan')) : propPoint(ball), targetPoint(destination));
}

export function guideWorld(stage: number, step: number, props: Prop[], characters: RagdollCharacter[], seen: ReadonlySet<Prop | RagdollCharacter>): GuideWorld | undefined {
  const ball = props.find(prop => prop.kind === 'ball');
  if (stage === 0) return step === 0 ? pair(propPoint(ball), targetPoint(gateSwitch)) : pair(friendPoint(characters[0]), targetPoint(gateHome));
  if (stage === 1) return pair(propPoint(ball), targetPoint(step === 0 ? crateTower : crateGoal));
  if (stage === 2) return step === 0 ? pair(propPoint(props.find(prop => prop.kind === 'launchpad')), friendGround(characters[0])) : pair(friendPoint(characters[0]), targetPoint(landingGoal));
  if (stage === 3) {
    const friends = characters.filter(character => character.kind === 'pineapple' || character.kind === 'watermelon');
    if (step === 0) return pair(friendPoint(friends[0]), friendGround(friends[1]));
    return pair(friendPoint(friends.find(character => !seen.has(character))), targetPoint(fruitGoal));
  }
  if (stage === 4) return pair(propPoint(ball), step < 2 ? propPoint(props.find(prop => prop.kind === 'bumper' && !seen.has(prop))) : targetPoint(bumperGoal));
  if (stage === 5) return step === 0 ? pair(propPoint(props.find(prop => prop.kind === 'crate')), propPoint(props.find(prop => prop.kind === 'spikes'))) : pair(friendPoint(characters[0]), targetPoint(safeGoal));
  if (stage === 6) return windGuide(step, props, ball);
  if (stage === 7 && step === 0) return pair(propPoint(ball), targetPoint(finalGoal));
  return undefined;
}

export function guideToScreen(guide: GuideWorld | undefined, camera: THREE.Camera, width: number, height: number): GuideScreen | undefined {
  if (!guide) return undefined;
  const project = (point: THREE.Vector3) => {
    const p = point.clone().project(camera);
    return { x: THREE.MathUtils.clamp((p.x + 1) * width / 2, 25, width - 25),
      y: THREE.MathUtils.clamp((1 - p.y) * height / 2, 25, height - 25) };
  };
  return { width, height, from: project(guide.from), to: project(guide.to) };
}
