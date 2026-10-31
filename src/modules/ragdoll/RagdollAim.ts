import * as THREE from 'three';

interface Active<T> { hit: T; id: number; x: number; y: number; start: THREE.Vector3; vector: THREE.Vector3; arrow: THREE.ArrowHelper }

export class RagdollAim<T> {
  private active?: Active<T>;
  constructor(private scene: THREE.Scene, private groundPoint: (event: PointerEvent) => THREE.Vector3 | null) {}

  get activeId() { return this.active?.id; }

  begin(hit: T, event: PointerEvent, position: THREE.Vector3): boolean {
    const start = this.groundPoint(event); if (!start) return false;
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, -1).normalize(),
      new THREE.Vector3(position.x, 0.2, position.z), 0.01, 0xffb92f, 0.34, 0.22);
    arrow.visible = false; this.scene.add(arrow);
    this.active = { hit, id: event.pointerId, x: event.clientX, y: event.clientY, start, vector: new THREE.Vector3(), arrow };
    return true;
  }

  update(event: PointerEvent) {
    const aim = this.active; if (!aim || aim.id !== event.pointerId) return;
    const end = this.groundPoint(event); if (!end) return;
    aim.vector.subVectors(end, aim.start).setY(0);
    aim.arrow.visible = Math.hypot(event.clientX - aim.x, event.clientY - aim.y) > 12;
    if (aim.vector.lengthSq() > 0.001) {
      aim.arrow.setDirection(aim.vector.clone().normalize());
      aim.arrow.setLength(THREE.MathUtils.clamp(aim.vector.length(), 0.45, 3.5), 0.38, 0.25);
    }
  }

  finish(event: PointerEvent) {
    const aim = this.active; if (!aim || aim.id !== event.pointerId) return;
    this.update(event);
    const dragged = Math.hypot(event.clientX - aim.x, event.clientY - aim.y) > 12;
    const direction = dragged && aim.vector.lengthSq() > 0.001 ? aim.vector.clone().normalize() : undefined;
    const power = dragged ? THREE.MathUtils.clamp(aim.vector.length() * 0.5, 0.7, 1.8) : 1;
    this.clear();
    return { hit: aim.hit, direction, power };
  }

  clear() {
    if (!this.active) return;
    const { arrow } = this.active;
    this.scene.remove(arrow);
    arrow.line.geometry.dispose(); arrow.cone.geometry.dispose();
    (arrow.line.material as THREE.Material).dispose(); (arrow.cone.material as THREE.Material).dispose();
    this.active = undefined;
  }
}
