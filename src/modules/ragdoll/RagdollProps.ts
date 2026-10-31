import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export type ObjectKind = 'crate' | 'spikes' | 'ball' | 'bumper' | 'launchpad';
export interface Prop { kind: ObjectKind; body: CANNON.Body; mesh: THREE.Group; lastTrigger: number }

function paint(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.04 });
}
function box(w: number, h: number, d: number, color: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paint(color));
  mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}
function cylinder(top: number, bottom: number, height: number, color: number) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 20), paint(color));
  mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}

export function createProp(world: CANNON.World, scene: THREE.Scene, kind: ObjectKind, x: number, y: number, z: number, dynamic = false): Prop {
  const mesh = new THREE.Group();
  let shape: CANNON.Shape;
  let mass = 0;
  if (kind === 'crate') {
    mesh.add(box(1.2, 1.2, 1.2, 0xd99d62));
    for (const dx of [-0.45, 0.45]) {
      const stripe = box(0.09, 1.22, 1.23, 0xb97640);
      stripe.position.x = dx; mesh.add(stripe);
    }
    shape = new CANNON.Box(new CANNON.Vec3(0.6, 0.6, 0.6));
    if (dynamic) mass = 0.85;
  } else if (kind === 'spikes') {
    mesh.add(box(1.4, 0.18, 1.4, 0xa8a4dd));
    for (const dx of [-0.43, 0, 0.43]) for (const dz of [-0.43, 0, 0.43]) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.56, 5), paint(0x9266c1));
      cone.position.set(dx, 0.36, dz); cone.castShadow = true; mesh.add(cone);
    }
    shape = new CANNON.Box(new CANNON.Vec3(0.7, 0.23, 0.7));
  } else if (kind === 'ball') {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 12), paint(0xffa349));
    ball.castShadow = true; ball.receiveShadow = true; mesh.add(ball);
    for (let i = 0; i < 4; i++) {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.485, 0.018, 5, 36), paint(i % 2 ? 0xffffff : 0x36bfc9));
      stripe.rotation.y = i * Math.PI / 4; mesh.add(stripe);
    }
    shape = new CANNON.Sphere(0.48); mass = 0.6;
  } else if (kind === 'bumper') {
    mesh.add(cylinder(0.54, 0.7, 0.34, 0xf87783));
    const top = cylinder(0.62, 0.62, 0.14, 0xffd76f); top.position.y = 0.23; mesh.add(top);
    shape = new CANNON.Cylinder(0.54, 0.7, 0.42, 16);
  } else {
    mesh.add(cylinder(0.9, 1.05, 0.22, 0x4689dd));
    const top = cylinder(0.76, 0.76, 0.07, 0x8ae9f7); top.position.y = 0.14; mesh.add(top);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.83, 0.08, 8, 32), paint(0xffd46e));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.18; mesh.add(ring);
    shape = new CANNON.Cylinder(0.9, 1.05, 0.25, 16);
  }
  mesh.position.set(x, y, z); scene.add(mesh);
  const body = new CANNON.Body({ mass, shape });
  body.position.set(x, y, z);
  body.linearDamping = mass ? 0.14 : 0;
  body.angularDamping = mass ? 0.12 : 0;
  world.addBody(body);
  return { kind, body, mesh, lastTrigger: 0 };
}
