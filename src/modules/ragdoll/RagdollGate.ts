import * as THREE from 'three';
import * as CANNON from 'cannon-es';

function beam(width: number, height: number, depth: number, color: number, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.12 }));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function dispose(group: THREE.Group) {
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
  });
}

export class RagdollGate {
  private frame = new THREE.Group();
  private door = new THREE.Group();
  private body = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(0.18, 1.25, 1.38)) });
  private openedAt?: number;

  constructor(private scene: THREE.Scene, private world: CANNON.World) {
    this.frame.position.set(1.35, 0, -1.2);
    this.door.position.copy(this.frame.position);
    for (const z of [-1.65, 1.65]) this.frame.add(beam(0.55, 3.1, 0.55, 0x3a94a8, 0, 1.55, z));
    this.frame.add(beam(0.7, 0.55, 3.7, 0xffce66, 0, 3.05, 0));
    this.frame.add(beam(0.76, 0.1, 3.9, 0x287e91, 0, 3.36, 0));
    for (const z of [-1.05, -0.35, 0.35, 1.05]) this.door.add(beam(0.18, 2.5, 0.18, 0x6dcdd1, 0, 1.25, z));
    for (const y of [0.55, 1.95]) this.door.add(beam(0.23, 0.18, 2.62, 0x247f9e, 0, y, 0));
    this.body.position.set(1.35, 1.25, -1.2);
    this.world.addBody(this.body);
    this.scene.add(this.frame, this.door);
  }

  get isOpen() { return this.openedAt !== undefined; }

  open() {
    if (this.isOpen) return;
    this.openedAt = performance.now();
    this.world.removeBody(this.body);
  }

  update(now: number) {
    if (this.openedAt === undefined) return;
    this.door.position.y = Math.min(3.3, (now - this.openedAt) * 0.007);
  }

  dispose() {
    if (!this.isOpen) this.world.removeBody(this.body);
    this.scene.remove(this.frame, this.door);
    dispose(this.frame);
    dispose(this.door);
  }
}
