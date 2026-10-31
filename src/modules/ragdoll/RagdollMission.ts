import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { RagdollCharacter } from './RagdollCharacter';
import type { Prop } from './RagdollProps';
import type { SceneEvent } from './RagdollScene';

type Emit = (event: SceneEvent) => void;
interface Marker { group: THREE.Group; ring: THREE.Mesh; material: THREE.MeshBasicMaterial }
const ballGoals: ReadonlyArray<readonly [number, number]> = [[-2.2, -1.7], [-3, -1.2], [-2.5, -3.2]];

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
  private seen = new Set<Prop | RagdollCharacter>();
  private crateStart = new Map<Prop, CANNON.Vec3>();
  private padStart?: CANNON.Vec3;
  private armed = false;
  private done = false;

  constructor(private scene: THREE.Scene, private emit: Emit) {}

  clear() {
    this.stage = -1; this.goalIndex = 0; this.armed = false; this.done = false;
    this.seen.clear(); this.crateStart.clear(); this.padStart = undefined;
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

  start(stage: number, props: Prop[]) {
    this.clear(); this.stage = stage;
    if (stage === 0) this.markers.push(makeMarker(this.scene, ...ballGoals[0], 0xffb936));
    if (stage === 1) for (const crate of props.filter(prop => prop.kind === 'crate')) {
      this.crateStart.set(crate, crate.body.position.clone());
      this.markers.push(makeMarker(this.scene, crate.body.position.x, crate.body.position.z, 0xff796d, 0.78));
    }
    if (stage === 2) {
      this.markers.push(makeMarker(this.scene, -1, 0.1, 0x45c9ec, 1.15));
      this.padStart = props.find(prop => prop.kind === 'launchpad')?.body.position.clone();
    }
    if (stage === 3) this.markers.push(makeMarker(this.scene, 0, 0, 0x43c98e, 1.8));
    if (stage === 4) for (const bumper of props.filter(prop => prop.kind === 'bumper'))
      this.markers.push(makeMarker(this.scene, bumper.body.position.x, bumper.body.position.z, 0xff9a65, 0.9));
    if (stage === 5) this.markers.push(makeMarker(this.scene, 0.8, -1.2, 0x43c98e, 1.8));
    if (stage === 6) this.markers.push(makeMarker(this.scene, -2.4, -2.2, 0xffb936));
  }

  arm() { this.armed = true; }

  update(now: number, props: Prop[], characters: RagdollCharacter[]) {
    if (this.stage < 0 || this.done) return;
    if ([0, 4, 6].includes(this.stage)) this.returnLostBall(props);
    for (const marker of this.markers) {
      const pulse = 1 + Math.sin(now * 0.004) * 0.075;
      marker.ring.scale.set(pulse, pulse, pulse);
      marker.material.opacity = 0.68 + (Math.sin(now * 0.004) + 1) * 0.14;
    }
    if (this.stage === 0 || (this.stage === 6 && this.goalIndex === 0)) this.checkBallGoal(props);
    if (this.stage === 1 && this.armed) this.checkCrates();
    if (this.stage === 2) this.checkBounce(props, characters);
    if (this.stage === 3) this.checkFruit(characters);
    if (this.stage === 4) this.checkBumpers(props);
    if (this.stage === 5) this.checkRescue(characters);
  }

  private checkBallGoal(props: Prop[]) {
    const ball = props.find(prop => prop.kind === 'ball');
    const marker = this.markers[0];
    if (!ball || !marker) return;
    const dx = ball.body.position.x - marker.group.position.x;
    const dz = ball.body.position.z - marker.group.position.z;
    if (dx * dx + dz * dz > 1.05 * 1.05 || ball.body.position.y > 1.6) return;
    this.goalIndex++;
    this.emit({ type: 'goal', kind: 'ball' });
    if (this.stage === 0 && this.goalIndex < ballGoals.length) {
      marker.group.position.set(ballGoals[this.goalIndex][0], 0, ballGoals[this.goalIndex][1]);
      ball.body.position.set(0, 0.7, 0.6); ball.body.velocity.setZero(); ball.body.angularVelocity.setZero();
      ball.body.wakeUp();
    } else { marker.group.visible = false; this.done = true; }
  }

  private returnLostBall(props: Prop[]) {
    const ball = props.find(prop => prop.kind === 'ball');
    if (!ball) return;
    const position = ball.body.position;
    if (Math.abs(position.x) < 8 && Math.abs(position.z) < 8 && position.y > -1) return;
    position.set(0, 0.7, 0.6);
    ball.body.velocity.setZero(); ball.body.angularVelocity.setZero(); ball.body.wakeUp();
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
      if (this.seen.size === this.crateStart.size) this.done = true;
    }
  }

  private checkBounce(props: Prop[], characters: RagdollCharacter[]) {
    const pad = props.find(prop => prop.kind === 'launchpad');
    const friend = characters[0];
    if (!pad || !friend || !this.padStart || pad.body.position.distanceTo(this.padStart) < 0.5) return;
    const pos = friend.parts[0].body.position;
    if (Math.hypot(pos.x - pad.body.position.x, pos.z - pad.body.position.z) > 1.5) return;
    for (const part of friend.parts) { part.body.wakeUp(); part.body.applyImpulse(new CANNON.Vec3(0, 3.5, 0)); }
    this.done = true;
    this.emit({ type: 'bounce', character: true, kind: friend.kind });
  }

  private checkFruit(characters: RagdollCharacter[]) {
    for (const character of characters) {
      if (this.seen.has(character)) continue;
      const pos = character.parts[0].body.position;
      if (Math.hypot(pos.x, pos.z) > 2.1) continue;
      this.seen.add(character);
      this.emit({ type: 'fruitHome', character: true, kind: character.kind });
      if (this.seen.size >= 2) this.done = true;
    }
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
      if (this.seen.size >= 2) this.done = true;
    }
  }

  private checkRescue(characters: RagdollCharacter[]) {
    const pos = characters[0]?.parts[0]?.body.position;
    if (!pos || pos.y > 2.4 || Math.hypot(pos.x - 0.8, pos.z + 1.2) > 1.9) return;
    this.done = true;
    this.emit({ type: 'rescue', character: true });
  }
}
