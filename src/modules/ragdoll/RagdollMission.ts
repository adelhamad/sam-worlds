import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { RagdollCharacter } from './RagdollCharacter';
import type { Prop } from './RagdollProps';
import type { SceneEvent } from './RagdollScene';

type Emit = (event: SceneEvent) => void;
interface Marker { group: THREE.Group; ring: THREE.Mesh; material: THREE.MeshBasicMaterial }
const ballGoals: ReadonlyArray<readonly [number, number]> = [[-2.2, -1.7], [-3, -1.2], [-2.5, -3.2]];
const crateGoal: readonly [number, number] = [0, -3];
const landingGoal: readonly [number, number] = [-2.5, -1.5];
const fruitGoal: readonly [number, number] = [-2, -2];
const bumperGoal: readonly [number, number] = [-2.5, -3.4];
const safeGoal: readonly [number, number] = [1.6, 0];

function makeMarker(scene: THREE.Scene, x: number, z: number, color: number, radius = 1.05): Marker {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
  const fill = new THREE.Mesh(new THREE.CircleGeometry(radius, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide }));
  fill.rotation.x = -Math.PI / 2; fill.position.y = 0.025; group.add(fill);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.11, 10, 48), material);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.075; group.add(ring);
  group.position.set(x, 0, z); scene.add(group);
  return { group, ring, material };
}

export class RagdollMission {
  private stage = -1;
  private goalIndex = 0;
  private markers: Marker[] = [];
  private goalMarker?: Marker;
  private landingMarker?: Marker;
  private safeMarker?: Marker;
  private meetMarker?: Marker;
  private homeMarker?: Marker;
  private fruitFriends: RagdollCharacter[] = [];
  private seen = new Set<Prop | RagdollCharacter>();
  private crateStart = new Map<Prop, CANNON.Vec3>();
  private padStart?: CANNON.Vec3;
  private armed = false;
  private done = false;
  private goalUnlocked = false;
  private bounced = false;
  private bridgeReady = false;
  private friendsMet = false;

  constructor(private scene: THREE.Scene, private emit: Emit) {}

  clear() {
    this.stage = -1; this.goalIndex = 0; this.armed = false; this.done = false;
    this.goalUnlocked = false; this.bounced = false; this.bridgeReady = false; this.friendsMet = false;
    this.goalMarker = undefined; this.landingMarker = undefined; this.safeMarker = undefined;
    this.meetMarker = undefined; this.homeMarker = undefined;
    this.seen.clear(); this.crateStart.clear(); this.padStart = undefined; this.fruitFriends = [];
    for (const marker of this.markers) {
      this.scene.remove(marker.group);
      marker.group.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
        }
      });
    }
    this.markers = [];
  }

  start(stage: number, props: Prop[], characters: RagdollCharacter[]) {
    this.clear(); this.stage = stage;
    if (stage === 0) {
      this.goalMarker = makeMarker(this.scene, ...ballGoals[0], 0xffb936);
      this.markers.push(this.goalMarker); this.goalUnlocked = true;
    }
    if (stage === 1) {
      for (const crate of props.filter(prop => prop.kind === 'crate')) {
        this.crateStart.set(crate, crate.body.position.clone());
        this.markers.push(makeMarker(this.scene, crate.body.position.x, crate.body.position.z, 0xff796d, 0.78));
      }
      this.goalMarker = makeMarker(this.scene, ...crateGoal, 0xffb936);
      this.goalMarker.group.visible = false; this.markers.push(this.goalMarker);
    }
    if (stage === 2) {
      this.markers.push(makeMarker(this.scene, -1, 0.1, 0x45c9ec, 1.15));
      this.padStart = props.find(prop => prop.kind === 'launchpad')?.body.position.clone();
      this.landingMarker = makeMarker(this.scene, ...landingGoal, 0x43c98e, 1.8);
      this.landingMarker.group.visible = false; this.markers.push(this.landingMarker);
    }
    if (stage === 3) {
      this.fruitFriends = characters.filter(friend => this.isFruit(friend)).slice(0, 2);
      this.meetMarker = makeMarker(this.scene, 2.4, 0, 0xffb936, 1.2);
      this.homeMarker = makeMarker(this.scene, ...fruitGoal, 0x43c98e, 1.8);
      this.homeMarker.group.visible = false;
      this.markers.push(this.meetMarker, this.homeMarker);
    }
    if (stage === 4) {
      for (const bumper of props.filter(prop => prop.kind === 'bumper'))
        this.markers.push(makeMarker(this.scene, bumper.body.position.x, bumper.body.position.z, 0xff9a65, 0.9));
      this.goalMarker = makeMarker(this.scene, ...bumperGoal, 0xffb936);
      this.goalMarker.group.visible = false; this.markers.push(this.goalMarker);
    }
    if (stage === 5) {
      const spikes = props.find(prop => prop.kind === 'spikes');
      if (spikes) this.markers.push(makeMarker(this.scene, spikes.body.position.x, spikes.body.position.z, 0xff796d, 0.95));
      this.safeMarker = makeMarker(this.scene, ...safeGoal, 0x43c98e, 1.8);
      this.safeMarker.group.visible = false; this.markers.push(this.safeMarker);
    }
    if (stage === 6) {
      this.goalMarker = makeMarker(this.scene, -2.4, -2.2, 0xffb936);
      this.markers.push(this.goalMarker); this.goalUnlocked = true;
    }
  }

  arm() { this.armed = true; }

  tryDrop(character: RagdollCharacter, point: THREE.Vector3) {
    if (this.done) return;
    if (this.stage === 2 && this.bounced && this.inTarget(point, ...landingGoal)) {
      this.snapCharacter(character, ...landingGoal);
      this.done = true;
      this.emit({ type: 'landed', character: true, kind: character.kind });
    } else if (this.stage === 3 && !this.friendsMet && this.fruitFriends.includes(character)) {
      const other = this.fruitFriends.find(friend => friend !== character);
      const otherPos = other?.parts[0].body.position;
      if (!otherPos || !this.inTarget(point, otherPos.x, otherPos.z)) return;
      this.snapCharacter(character, otherPos.x - 0.8, otherPos.z);
      this.unlockFriends();
    } else if (this.stage === 3 && this.friendsMet && this.fruitFriends.includes(character) && !this.seen.has(character) && this.inTarget(point, ...fruitGoal)) {
      this.snapCharacter(character, ...fruitGoal);
      this.seen.add(character);
      this.emit({ type: 'fruitHome', character: true, kind: character.kind });
      if (this.seen.size >= 2) this.done = true;
    } else if (this.stage === 5 && this.bridgeReady && this.inTarget(point, ...safeGoal)) {
      this.snapCharacter(character, ...safeGoal);
      this.done = true;
      this.emit({ type: 'rescue', character: true, kind: character.kind });
    }
  }

  private inTarget(point: THREE.Vector3, x: number, z: number) {
    return Math.hypot(point.x - x, point.z - z) < 2;
  }

  private isFruit(character: RagdollCharacter) {
    return character.kind === 'pineapple' || character.kind === 'watermelon';
  }

  private snapCharacter(character: RagdollCharacter, x: number, z: number) {
    const torso = character.parts[0].body.position;
    const dx = x - torso.x, dz = z - torso.z;
    for (const part of character.parts) {
      part.body.position.x += dx; part.body.position.z += dz;
      part.body.velocity.setZero(); part.body.angularVelocity.setZero();
      part.body.aabbNeedsUpdate = true; part.body.wakeUp();
    }
  }

  private unlockFriends() {
    if (this.friendsMet) return;
    this.friendsMet = true;
    if (this.meetMarker) this.meetMarker.group.visible = false;
    if (this.homeMarker) this.homeMarker.group.visible = true;
    this.emit({ type: 'friendsMeet', character: true });
  }

  update(now: number, props: Prop[], characters: RagdollCharacter[]) {
    if (this.stage < 0 || this.done) return;
    if ([0, 1, 4, 6].includes(this.stage)) this.returnLostBall(props);
    for (const marker of this.markers) {
      const pulse = 1 + Math.sin(now * 0.004) * 0.075;
      marker.ring.scale.set(pulse, pulse, pulse);
      marker.material.opacity = 0.68 + (Math.sin(now * 0.004) + 1) * 0.14;
    }
    if (this.goalUnlocked) this.checkBallGoal(props);
    if (this.stage === 1 && this.armed) this.checkCrates();
    if (this.stage === 2 && !this.bounced) this.checkBounce(props, characters);
    if (this.stage === 2 && this.bounced) this.checkLanding(characters);
    if (this.stage === 3 && !this.friendsMet) this.checkFriendsMeet();
    if (this.stage === 3 && this.friendsMet) this.checkFruit();
    if (this.stage === 4 && !this.goalUnlocked) this.checkBumpers(props);
    if (this.stage === 5 && !this.bridgeReady) this.checkBridge(props);
    if (this.stage === 5 && this.bridgeReady) this.checkRescue(characters);
  }

  private checkBallGoal(props: Prop[]) {
    const ball = props.find(prop => prop.kind === 'ball');
    const marker = this.goalMarker;
    if (!ball || !marker) return;
    const dx = ball.body.position.x - marker.group.position.x;
    const dz = ball.body.position.z - marker.group.position.z;
    if (dx * dx + dz * dz > 1.05 * 1.05 || ball.body.position.y > 1.6) return;
    this.goalIndex++;
    this.emit({ type: 'goal', kind: 'ball' });
    if (this.stage === 0 && this.goalIndex < ballGoals.length) {
      marker.group.position.set(ballGoals[this.goalIndex][0], 0, ballGoals[this.goalIndex][1]);
      this.resetBall(ball);
    } else { marker.group.visible = false; this.done = true; }
  }

  private resetBall(ball: Prop) {
    ball.body.position.set(0, 0.7, 0.6);
    ball.body.velocity.setZero(); ball.body.angularVelocity.setZero(); ball.body.wakeUp();
  }

  private returnLostBall(props: Prop[]) {
    const ball = props.find(prop => prop.kind === 'ball');
    if (!ball) return;
    const position = ball.body.position;
    if (Math.abs(position.x) < 8 && Math.abs(position.z) < 8 && position.y > -1) return;
    this.resetBall(ball);
  }

  private checkCrates() {
    for (const [crate, start] of this.crateStart) {
      if (this.seen.has(crate)) continue;
      const body = crate.body;
      const moved = body.position.distanceTo(start) > 0.48;
      const tipped = body.quaternion.vmult(new CANNON.Vec3(0, 1, 0)).y < 0.72;
      if (!moved && !tipped) continue;
      this.seen.add(crate);
      this.emit({ type: 'crateDown', kind: 'crate' });
      if (this.seen.size === this.crateStart.size) {
        this.goalUnlocked = true;
        if (this.goalMarker) this.goalMarker.group.visible = true;
      }
    }
  }

  private checkBounce(props: Prop[], characters: RagdollCharacter[]) {
    const pad = props.find(prop => prop.kind === 'launchpad');
    const friend = characters[0];
    if (!pad || !friend || !this.padStart || pad.body.position.distanceTo(this.padStart) < 0.5) return;
    const pos = friend.parts[0].body.position;
    if (Math.hypot(pos.x - pad.body.position.x, pos.z - pad.body.position.z) > 1.5) return;
    if (performance.now() - pad.lastTrigger > 250)
      for (const part of friend.parts) { part.body.wakeUp(); part.body.applyImpulse(new CANNON.Vec3(0, 3.5, 0)); }
    this.bounced = true;
    this.markers[0].group.visible = false;
    if (this.landingMarker) this.landingMarker.group.visible = true;
    this.emit({ type: 'bounce', character: true, kind: friend.kind });
  }

  private checkLanding(characters: RagdollCharacter[]) {
    const pos = characters[0]?.parts[0]?.body.position;
    if (!pos || pos.y > 2.4 || Math.hypot(pos.x - landingGoal[0], pos.z - landingGoal[1]) > 2) return;
    this.done = true;
    this.emit({ type: 'landed', character: true });
  }

  private checkFruit() {
    for (const character of this.fruitFriends) {
      if (this.seen.has(character)) continue;
      const pos = character.parts[0].body.position;
      if (Math.hypot(pos.x - fruitGoal[0], pos.z - fruitGoal[1]) > 1.8) continue;
      this.seen.add(character);
      this.emit({ type: 'fruitHome', character: true, kind: character.kind });
      if (this.seen.size >= 2) this.done = true;
    }
  }

  private checkFriendsMeet() {
    const a = this.fruitFriends[0]?.parts[0].body.position;
    const b = this.fruitFriends[1]?.parts[0].body.position;
    if (a && b && Math.hypot(a.x - b.x, a.z - b.z) < 1.4 && Math.abs(a.y - b.y) < 1.4)
      this.unlockFriends();
  }

  private checkBridge(props: Prop[]) {
    const crate = props.find(prop => prop.kind === 'crate');
    const spikes = props.find(prop => prop.kind === 'spikes');
    if (!crate || !spikes || Math.hypot(crate.body.position.x - spikes.body.position.x, crate.body.position.z - spikes.body.position.z) > 1.8) return;
    spikes.covered = true;
    spikes.mesh.visible = false;
    this.bridgeReady = true;
    if (this.markers[0]) this.markers[0].group.visible = false;
    if (this.safeMarker) this.safeMarker.group.visible = true;
    this.emit({ type: 'bridgeReady', kind: 'crate' });
  }

  private checkBumpers(props: Prop[]) {
    const ball = props.find(prop => prop.kind === 'ball');
    if (!ball || ball.body.velocity.length() < 0.35) return;
    for (const bumper of props.filter(prop => prop.kind === 'bumper')) {
      if (this.seen.has(bumper)) continue;
      const dx = ball.body.position.x - bumper.body.position.x;
      const dz = ball.body.position.z - bumper.body.position.z;
      if (dx * dx + dz * dz > 1.4 * 1.4) continue;
      this.seen.add(bumper);
      this.emit({ type: 'bumperHit', kind: 'bumper' });
      if (this.seen.size >= 2) {
        this.goalUnlocked = true;
        if (this.goalMarker) this.goalMarker.group.visible = true;
        this.resetBall(ball);
      }
    }
  }

  private checkRescue(characters: RagdollCharacter[]) {
    const pos = characters[0]?.parts[0]?.body.position;
    if (!pos || pos.y > 2.4 || Math.hypot(pos.x - safeGoal[0], pos.z - safeGoal[1]) > 1.9) return;
    this.done = true;
    this.emit({ type: 'rescue', character: true });
  }
}
