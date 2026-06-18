// Star Ranger — the hero avatar and the floating companion robot "Pip".
// A blocky third-person character with swinging arms/legs. The scene owns
// world position, facing (group.rotation.y) and jump height; the Player only
// animates its own limbs given whether it's currently moving.
import * as THREE from "three";
import { shadowBlob } from "./world";

const skin = (c: number, opts: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...opts });

/** A limb that pivots from its top (hip/shoulder) so it swings naturally. */
function makeLimb(w: number, len: number, color: number, x: number): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(x, 0, 0);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, len, w), skin(color));
  mesh.position.y = -len / 2;
  pivot.add(mesh);
  return pivot;
}

export class Player {
  readonly group = new THREE.Group();
  readonly shadow: THREE.Mesh;
  private legL: THREE.Group;
  private legR: THREE.Group;
  private armL: THREE.Group;
  private armR: THREE.Group;
  private body: THREE.Group;
  private phase = 0;

  constructor() {
    this.body = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.55), skin(0x2f7bd6));
    torso.position.y = 1.15;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.65), skin(0xffd9a8));
    head.position.y = 1.95;
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.22, 0.08),
      skin(0x16263d, { emissive: 0x33e0ff, emissiveIntensity: 0.6 }),
    );
    visor.position.set(0, 2.0, 0.34);
    const hat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.9), skin(0xc1452f));
    hat.position.y = 2.35;

    this.legL = makeLimb(0.3, 0.95, 0x274b7a, -0.22);
    this.legR = makeLimb(0.3, 0.95, 0x274b7a, 0.22);
    this.legL.position.y = 0.95;
    this.legR.position.y = 0.95;
    this.armL = makeLimb(0.26, 0.85, 0x2f7bd6, -0.55);
    this.armR = makeLimb(0.26, 0.85, 0x2f7bd6, 0.55);
    this.armL.position.y = 1.55;
    this.armR.position.y = 1.55;
    // a chunky blaster on the right hand
    const blaster = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.24, 0.7),
      skin(0x3a4250, { metalness: 0.5, roughness: 0.3, emissive: 0x114b5a, emissiveIntensity: 0.4 }),
    );
    blaster.position.set(0, -0.8, 0.25);
    this.armR.add(blaster);

    this.body.add(torso, head, visor, hat, this.armL, this.armR);
    this.shadow = shadowBlob(0.6);
    this.group.add(this.shadow, this.legL, this.legR, this.body);
  }

  /** Swing limbs while moving; settle to a calm idle otherwise. */
  step(dt: number, moving: boolean, t: number): void {
    const target = moving ? 9 : 0;
    this.phase += dt * (4 + target);
    const swing = moving ? Math.sin(this.phase * 1.6) * 0.7 : 0;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.armL.rotation.x = -swing * 0.8;
    // keep the blaster arm forward to aim
    this.armR.rotation.x = -0.5 + Math.sin(t / 600) * 0.04;
    this.body.position.y = moving ? Math.abs(Math.sin(this.phase * 1.6)) * 0.08 : Math.sin(t / 700) * 0.04;
  }

  /** Muzzle world position for spawning a bolt. */
  muzzle(): THREE.Vector3 {
    const v = new THREE.Vector3(0.55, 0.75, 0.6);
    return this.group.localToWorld(v);
  }
}

/** Pip — a friendly hovering robot that gives quests and bobs alongside Sam. */
export function makeCompanion(): THREE.Group {
  const g = new THREE.Group();
  const ballMat = new THREE.MeshStandardMaterial({ color: 0xffce54, emissive: 0x6b4f12, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.3 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), ballMat);
  const eye = new THREE.Mesh(
    new THREE.CircleGeometry(0.2, 18),
    new THREE.MeshBasicMaterial({ color: 0x16263d }),
  );
  eye.position.z = 0.47;
  const spark = new THREE.Mesh(
    new THREE.CircleGeometry(0.07, 12),
    new THREE.MeshBasicMaterial({ color: 0x6ff0ff }),
  );
  spark.position.set(0.07, 0.07, 0.5);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4), new THREE.MeshBasicMaterial({ color: 0xcdd3da }));
  antenna.position.y = 0.66;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff5f6d, emissive: 0xff5f6d, emissiveIntensity: 0.7 }));
  tip.position.y = 0.9;
  g.add(ball, eye, spark, antenna, tip);
  return g;
}
