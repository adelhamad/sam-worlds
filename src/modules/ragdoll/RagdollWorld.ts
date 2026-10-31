import * as THREE from 'three';
import { createStageThemes } from './RagdollThemes';

function material(color: number) { return new THREE.MeshStandardMaterial({ color, roughness: 0.95 }); }
export function decoratePlayground(scene: THREE.Scene) {
  const ground = material(0xb9d9bb);
  const rimMaterial = material(0x74c9af);
  const island = new THREE.Mesh(new THREE.CylinderGeometry(29, 30, 0.42, 64), ground);
  island.position.y = -0.21; island.receiveShadow = true; scene.add(island);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(29, 0.22, 8, 72), rimMaterial);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.015; scene.add(rim);
  for (let i = 0; i < 14; i++) {
    const angle = i * Math.PI * 2 / 14;
    const radius = 34 + (i % 3) * 2.7;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(4.8 + (i % 3), 16, 8),
      material([0x9bcdbd, 0xc6dba9, 0xaacddb, 0xd7c9e8][i % 4]));
    hill.scale.y = 0.45 + (i % 4) * 0.1;
    hill.position.set(Math.cos(angle) * radius, -1.1, Math.sin(angle) * radius);
    scene.add(hill);
  }
  const accentColors = [0xffcf94, 0xb4a6eb, 0x87d8cf, 0xffa9b0];
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI * 2 / 10 + 0.2;
    const x = Math.cos(angle) * 27.2, z = Math.sin(angle) * 27.2;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.6, 8), material(accentColors[i % 4]));
    base.position.set(x, 0.24, z); base.castShadow = true; scene.add(base);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 8), material(0xffffff));
    ball.position.set(x, 0.83, z); scene.add(ball);
  }
  for (let i = 0; i < 7; i++) {
    const cloud = new THREE.Group();
    for (const [x, y, z, radius] of [[-0.8, 0, 0, 0.85], [0, 0.24, 0, 1.1], [0.95, 0, 0, 0.78]] as const) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 }));
      puff.position.set(x, y, z); cloud.add(puff);
    }
    const a = i * 2.4;
    cloud.position.set(Math.cos(a) * (22 + i % 3 * 5), 8 + i % 3 * 2.5, Math.sin(a) * (24 + i % 2 * 6));
    cloud.scale.setScalar(0.7 + i % 3 * 0.35); scene.add(cloud);
  }
  return createStageThemes(scene, ground, rimMaterial);
}

export function makePlacementGhost(kind: string): THREE.Group {
  const ghost = new THREE.Group();
  const paint = (color: number) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.48, depthWrite: false });
  const box = (w: number, h: number, d: number, color: number, x: number, y: number, z = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paint(color));
    mesh.position.set(x, y, z); ghost.add(mesh);
  };
  if (kind === 'crate') {
    box(1.2, 1.2, 1.2, 0xd99d62, 0, 0.6);
  } else if (kind === 'spikes') {
    box(1.4, 0.18, 1.4, 0x9266c1, 0, 0.09);
    for (const x of [-0.4, 0, 0.4]) for (const z of [-0.4, 0, 0.4]) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 5), paint(0x9266c1));
      cone.position.set(x, 0.38, z); ghost.add(cone);
    }
  } else if (kind === 'ball') {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 8), paint(0xffa349));
    ball.position.y = 0.7; ghost.add(ball);
  } else if (kind === 'fan') {
    box(0.9, 0.18, 0.7, 0x3585a9, 0, 0.12);
    box(0.15, 1.2, 0.2, 0x4aabc5, 0, 0.72);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.11, 8, 20), paint(0x267799));
    ring.position.y = 1.07; ghost.add(ring);
  } else if (kind === 'bumper' || kind === 'launchpad') {
    const radius = kind === 'bumper' ? 0.65 : 0.95;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.3, 16), paint(kind === 'bumper' ? 0xf87783 : 0x4689dd));
    pad.position.y = 0.17; ghost.add(pad);
  } else {
    const shirt = ({ classic: 0x596cf2, red: 0xeb555b, green: 0x36b878, yellow: 0xffc444, pineapple: 0x4daaa0, watermelon: 0xf2638b } as Record<string, number>)[kind] ?? 0x596cf2;
    let head = 0xf1b881;
    if (kind === 'pineapple') head = 0xffca42;
    if (kind === 'watermelon') head = 0x65ba69;
    box(0.68, 0.86, 0.36, shirt, 0, 1.95);
    box(0.22, 0.9, 0.23, shirt, -0.53, 1.85);
    box(0.22, 0.9, 0.23, shirt, 0.53, 1.85);
    box(0.25, 1.0, 0.25, head, -0.2, 0.93);
    box(0.25, 1.0, 0.25, head, 0.2, 0.93);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), paint(head));
    face.position.y = 2.72; ghost.add(face);
    if (kind === 'pineapple') {
      for (const x of [-0.14, 0, 0.14]) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 4), paint(0x2e9c55));
        leaf.position.set(x, 3.14, 0); ghost.add(leaf);
      }
    }
  }
  return ghost;
}
