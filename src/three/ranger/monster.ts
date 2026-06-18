// Star Ranger — the foes you battle: chunky blocky "Number Golems" with an
// emoji face and glowing eyes. Pure mesh factory; the scene owns HP, motion,
// flinch and defeat. You damage one by zapping the crystal with the right
// answer floating above its head.
import * as THREE from "three";
import { faceTexture, shadowBlob } from "./world";

const part = (w: number, h: number, d: number, color: number, emissive = 0x000000) =>
  new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true, emissive, emissiveIntensity: emissive ? 0.5 : 0 }),
  );

export interface MonsterParts {
  group: THREE.Group;
  /** Coloured meshes that flash white/red on a flinch. */
  skin: THREE.Mesh[];
  face: THREE.Sprite;
  /** Top of the head in local space — crystals float above this. */
  headTop: number;
}

/** Build a golem: blocky body + head with an emoji face, stubby limbs, horns
 * for the boss. `scale` makes the boss loom larger. */
export function makeMonster(face: string, color: number, scale = 1, boss = false): MonsterParts {
  const g = new THREE.Group();
  const skin: THREE.Mesh[] = [];
  const add = (m: THREE.Mesh) => { skin.push(m); g.add(m); };

  const body = part(1.7, 1.6, 1.3, color);
  body.position.y = 1.5;
  add(body);
  const head = part(1.5, 1.3, 1.2, color);
  head.position.y = 2.95;
  add(head);
  // glowing eyes
  for (const dx of [-0.34, 0.34]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8),
      new THREE.MeshBasicMaterial({ color: boss ? 0xff4d4d : 0xffe27a }),
    );
    eye.position.set(dx, 3.05, 0.62);
    g.add(eye);
  }
  const faceSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: faceTexture(face), transparent: true, depthTest: false }));
  faceSprite.scale.setScalar(1.3);
  faceSprite.position.set(0, 2.9, 0.66);
  faceSprite.renderOrder = 6;
  g.add(faceSprite);
  // arms
  for (const dx of [-1.15, 1.15]) {
    const arm = part(0.5, 1.2, 0.5, color);
    arm.position.set(dx, 1.55, 0);
    add(arm);
  }
  // feet
  for (const dx of [-0.5, 0.5]) {
    const foot = part(0.6, 0.55, 0.8, color);
    foot.position.set(dx, 0.3, 0.1);
    add(foot);
  }
  if (boss) {
    for (const dx of [-0.5, 0.5]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 6), new THREE.MeshStandardMaterial({ color: 0xfff0c0, flatShading: true }));
      horn.position.set(dx, 3.8, 0);
      g.add(horn);
    }
  }
  g.add(shadowBlob(1.2 * scale));
  g.scale.setScalar(scale);
  return { group: g, skin, face: faceSprite, headTop: 3.8 };
}
