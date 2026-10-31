import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export type ObjectKind = 'crate' | 'spikes' | 'ball' | 'bumper' | 'launchpad' | 'fan';
export interface Prop { kind: ObjectKind; body: CANNON.Body; mesh: THREE.Group; lastTrigger: number; covered?: boolean }

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
function makeCrate(mesh: THREE.Group, color?: number): CANNON.Shape {
  mesh.add(box(1.2, 1.2, 1.2, color ?? 0xd99d62));
  const stripeColor = color ? new THREE.Color(color).multiplyScalar(0.72).getHex() : 0xb97640;
  for (const dx of [-0.45, 0.45]) {
    const stripe = box(0.09, 1.22, 1.23, stripeColor);
    stripe.position.x = dx; mesh.add(stripe);
  }
  for (const dy of [-0.48, 0.48]) {
    const band = box(1.2, 0.07, 0.04, stripeColor);
    band.position.set(0, dy, 0.61); mesh.add(band);
  }
  return new CANNON.Box(new CANNON.Vec3(0.6, 0.6, 0.6));
}
function makeFan(mesh: THREE.Group): CANNON.Shape {
  const base = box(0.92, 0.18, 0.7, 0x3585a9); base.position.y = -0.73; mesh.add(base);
  const pole = cylinder(0.09, 0.13, 1.25, 0x4aabc5); pole.position.y = -0.07; mesh.add(pole);
  const cage = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.1, 9, 32), paint(0x267799));
  cage.position.set(0, 0.22, -0.12); mesh.add(cage);
  const blades = new THREE.Group(); blades.name = 'fan-blades'; blades.position.set(0, 0.22, -0.17);
  for (let i = 0; i < 4; i++) {
    const blade = box(0.2, 0.56, 0.07, 0x89e8f2);
    blade.position.y = 0.25;
    const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; arm.add(blade); blades.add(arm);
  }
  blades.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), paint(0xffd569)));
  mesh.add(blades);
  for (let i = 1; i <= 3; i++) {
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.42, 3),
      new THREE.MeshBasicMaterial({ color: 0x66ddec, transparent: true, opacity: 0.66 }));
    arrow.rotation.x = -Math.PI / 2; arrow.position.set(0, -0.75, -0.76 * i); mesh.add(arrow);
  }
  return new CANNON.Box(new CANNON.Vec3(0.45, 0.78, 0.3));
}

export function createProp(world: CANNON.World, scene: THREE.Scene, kind: ObjectKind, x: number, y: number, z: number, dynamic = false, color?: number): Prop {
  const mesh = new THREE.Group();
  let shape: CANNON.Shape;
  let mass = 0;
  if (kind === 'crate') {
    shape = makeCrate(mesh, color);
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
  } else if (kind === 'fan') {
    shape = makeFan(mesh);
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
