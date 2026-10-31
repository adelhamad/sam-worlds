import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export type CharacterKind = 'classic' | 'red' | 'green' | 'yellow' | 'pineapple' | 'watermelon';
export type PartName = 'torso' | 'head' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';
export interface RagdollPart { body: CANNON.Body; mesh: THREE.Group; name: PartName }
export interface RagdollCharacter {
  kind: CharacterKind;
  parts: RagdollPart[];
  constraints: CANNON.Constraint[];
  glasses?: THREE.Group;
  defeated: boolean;
}

const skins: Record<CharacterKind, { shirt: number; limbs: number; head: number }> = {
  classic: { shirt: 0x596cf2, limbs: 0xf1b881, head: 0xf1b881 },
  red: { shirt: 0xeb555b, limbs: 0xe87b76, head: 0xf3ba91 },
  green: { shirt: 0x36b878, limbs: 0x77c994, head: 0xf1bc89 },
  yellow: { shirt: 0xffc444, limbs: 0xf6d779, head: 0xf4bf8b },
  pineapple: { shirt: 0x4daaa0, limbs: 0xe4b766, head: 0xffca42 },
  watermelon: { shirt: 0xf2638b, limbs: 0x96c96c, head: 0x65ba69 },
};
const mat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.78 });
function box(w: number, h: number, d: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function sphere(r: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), material);
  mesh.castShadow = true;
  return mesh;
}
function face(head: THREE.Group, fruit: boolean) {
  const eye = mat(0x26313f);
  for (const x of [-0.12, 0.12]) {
    const e = sphere(0.045, eye); e.position.set(x, 0.055, 0.322); head.add(e);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.016, 5, 12, Math.PI), mat(0x974b42));
  smile.rotation.z = Math.PI; smile.position.set(0, -0.09, 0.329); head.add(smile);
  if (fruit) {
    for (const x of [-0.22, 0.22]) {
      const cheek = sphere(0.045, mat(0xf79b85)); cheek.position.set(x, -0.095, 0.291); head.add(cheek);
    }
  }
}
function fruitDecor(head: THREE.Group, kind: CharacterKind) {
  if (kind === 'pineapple') {
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 4), mat(i % 2 ? 0x258d50 : 0x36aa5b));
      leaf.position.set((i - 2) * 0.10, 0.43 + (i % 2) * 0.07, 0);
      leaf.rotation.z = (i - 2) * -0.17; head.add(leaf);
    }
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.32, 0.46, 8), mat(0xffcc48));
    crown.position.y = 0.02; head.add(crown);
    for (const x of [-0.2, 0, 0.2]) for (const y of [-0.13, 0.1]) {
      const mark = box(0.025, 0.11, 0.015, mat(0xd99627));
      mark.position.set(x, y, 0.352); mark.rotation.z = 0.5; head.add(mark);
    }
  }
  if (kind === 'watermelon') {
    for (let i = 0; i < 5; i++) {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.322, 0.016, 4, 24, Math.PI), mat(0x258f52));
      stripe.rotation.y = (i - 2) * 0.28; stripe.rotation.x = Math.PI / 2;
      head.add(stripe);
    }
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.05, 8), mat(0x2d9853));
    top.position.y = 0.33; head.add(top);
  }
}
function part(world: CANNON.World, name: PartName, x: number, y: number, z: number, size: [number, number, number], color: number, density = 1) {
  const [w, h, d] = size;
  const body = new CANNON.Body({ mass: density, shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)), material: new CANNON.Material('toy') });
  body.position.set(x, y, z); body.linearDamping = 0.24; body.angularDamping = 0.65;
  body.sleepSpeedLimit = 0.13; body.sleepTimeLimit = 1.4;
  world.addBody(body);
  const mesh = new THREE.Group(); mesh.add(box(w, h, d, mat(color)));
  return { body, mesh, name } satisfies RagdollPart;
}
function joint(world: CANNON.World, a: RagdollPart, b: RagdollPart, pa: [number, number, number], pb: [number, number, number]) {
  const c = new CANNON.PointToPointConstraint(a.body, new CANNON.Vec3(...pa), b.body, new CANNON.Vec3(...pb), 2e4);
  c.collideConnected = false; world.addConstraint(c); return c;
}
export function createCharacter(world: CANNON.World, scene: THREE.Scene, kind: CharacterKind, x: number, z: number): RagdollCharacter {
  const s = skins[kind]; const parts: RagdollPart[] = [];
  const add = (name: PartName, dx: number, dy: number, size: [number, number, number], color: number, mass = 1) => {
    const p = part(world, name, x + dx, dy, z, size, color, mass); parts.push(p); scene.add(p.mesh); return p;
  };
  const torso = add('torso', 0, 1.96, [0.68, 0.86, 0.36], s.shirt, 2.2);
  const head = add('head', 0, 2.75, [0.61, 0.61, 0.61], s.head, 0.72);
  // A rounded shell and face keep the head identifiable while it tumbles.
  head.mesh.children[0].visible = false;
  head.mesh.add(sphere(0.33, mat(s.head)));
  face(head.mesh, kind === 'pineapple' || kind === 'watermelon'); fruitDecor(head.mesh, kind);
  const leftUpper = add('leftArm', -0.54, 2.12, [0.24, 0.53, 0.25], s.shirt, 0.36);
  const leftLower = add('leftArm', -0.54, 1.60, [0.20, 0.49, 0.22], s.limbs, 0.28);
  const rightUpper = add('rightArm', 0.54, 2.12, [0.24, 0.53, 0.25], s.shirt, 0.36);
  const rightLower = add('rightArm', 0.54, 1.60, [0.20, 0.49, 0.22], s.limbs, 0.28);
  const leftThigh = add('leftLeg', -0.19, 1.23, [0.27, 0.55, 0.29], s.limbs, 0.64);
  const leftShin = add('leftLeg', -0.19, 0.65, [0.24, 0.53, 0.26], s.limbs, 0.53);
  const rightThigh = add('rightLeg', 0.19, 1.23, [0.27, 0.55, 0.29], s.limbs, 0.64);
  const rightShin = add('rightLeg', 0.19, 0.65, [0.24, 0.53, 0.26], s.limbs, 0.53);
  for (const p of [leftLower, rightLower]) {
    const hand = sphere(0.13, mat(s.head)); hand.position.y = -0.26; p.mesh.add(hand);
  }
  for (const p of [leftShin, rightShin]) {
    const foot = box(0.28, 0.17, 0.44, mat(0x35405d)); foot.position.set(0, -0.27, 0.10); p.mesh.add(foot);
  }
  const constraints = [
    joint(world, torso, head, [0, 0.48, 0], [0, -0.32, 0]),
    joint(world, torso, leftUpper, [-0.38, 0.31, 0], [0.04, 0.25, 0]),
    joint(world, leftUpper, leftLower, [0, -0.27, 0], [0, 0.25, 0]),
    joint(world, torso, rightUpper, [0.38, 0.31, 0], [-0.04, 0.25, 0]),
    joint(world, rightUpper, rightLower, [0, -0.27, 0], [0, 0.25, 0]),
    joint(world, torso, leftThigh, [-0.19, -0.43, 0], [0, 0.28, 0]),
    joint(world, leftThigh, leftShin, [0, -0.28, 0], [0, 0.27, 0]),
    joint(world, torso, rightThigh, [0.19, -0.43, 0], [0, 0.28, 0]),
    joint(world, rightThigh, rightShin, [0, -0.28, 0], [0, 0.27, 0]),
  ];
  return { kind, parts, constraints, defeated: false };
}
export function setGlasses(character: RagdollCharacter, enabled: boolean) {
  const head = character.parts.find(p => p.name === 'head')!;
  if (character.glasses) { head.mesh.remove(character.glasses); character.glasses = undefined; }
  if (!enabled) return;
  const group = new THREE.Group(); const frame = mat(0x29334e);
  for (const x of [-0.14, 0.14]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.025, 6, 16), frame);
    ring.position.set(x, 0.055, 0.337); group.add(ring);
  }
  const bridge = box(0.08, 0.025, 0.025, frame); bridge.position.set(0, 0.055, 0.34); group.add(bridge);
  head.mesh.add(group); character.glasses = group;
}
export function removeCharacter(world: CANNON.World, scene: THREE.Scene, character: RagdollCharacter) {
  character.constraints.forEach(c => world.removeConstraint(c));
  character.parts.forEach(p => { world.removeBody(p.body); scene.remove(p.mesh); p.mesh.traverse(o => {
    if (o instanceof THREE.Mesh) { o.geometry.dispose(); const materials = Array.isArray(o.material) ? o.material : [o.material]; materials.forEach(m => m.dispose()); }
  }); });
}

/** Keep visible joints together when a held limb outruns the iterative solver. */
export function stabilizeCharacter(character: RagdollCharacter, held?: CANNON.Body) {
  for (let pass = 0; pass < 4; pass++) for (const constraint of character.constraints) {
    const joint = constraint as CANNON.PointToPointConstraint;
    const a = joint.bodyA, b = joint.bodyB;
    const pa = a.pointToWorldFrame(joint.pivotA), pb = b.pointToWorldFrame(joint.pivotB);
    const delta = pb.vsub(pa);
    const distance = delta.length();
    if (distance < 0.075) continue;
    let weightA = b.mass / (a.mass + b.mass);
    if (held === a) weightA = 0;
    else if (held === b) weightA = 1;
    const amount = (distance - 0.04) / distance * 0.8;
    a.position.vadd(delta.scale(amount * weightA), a.position);
    b.position.vsub(delta.scale(amount * (1 - weightA)), b.position);
    a.aabbNeedsUpdate = true; b.aabbNeedsUpdate = true;
    a.wakeUp(); b.wakeUp();
  }
}
