import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createCharacter, removeCharacter, setGlasses, stabilizeCharacter, type CharacterKind, type RagdollCharacter, type RagdollPart } from './RagdollCharacter';
import { RagdollSound } from './RagdollSound';
import { decoratePlayground, makePlacementGhost } from './RagdollWorld';
export type { CharacterKind } from './RagdollCharacter';
export type ObjectKind = 'crate' | 'spikes';
export type RagdollTool = 'grab' | 'kick' | 'move' | 'delete' | 'place-character' | 'place-object';
export interface SceneEvent { type: 'select' | 'spawn' | 'kick' | 'impact' | 'defeat' | 'delete'; character?: boolean; glasses?: boolean; kind?: string }
interface Prop { kind: ObjectKind; body: CANNON.Body; mesh: THREE.Group }
interface Hit { character?: RagdollCharacter; part?: RagdollPart; prop?: Prop; point: THREE.Vector3 }

const geometry = (w: number, h: number, d: number, color: number) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.78 }));
  mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
};
function disposeGroup(group: THREE.Object3D) {
  group.traverse(o => { if (o instanceof THREE.Mesh) {
    o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
  } });
}

export class RagdollScene {
  private scene = new THREE.Scene();
  private world = new CANNON.World({ gravity: new CANNON.Vec3(0, -15, 0) });
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
  private renderer: THREE.WebGLRenderer;
  private raycaster = new THREE.Raycaster();
  private ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private characters: RagdollCharacter[] = [];
  private props: Prop[] = [];
  private selected?: RagdollCharacter;
  private tool: RagdollTool = 'grab';
  private kind: CharacterKind = 'classic';
  private objectKind: ObjectKind = 'crate';
  private paused = false;
  private disposed = false;
  private angle = 0.65;
  private elevation = 0.50;
  private distance = 13;
  private target = new THREE.Vector3(0, 1, 0);
  private lastFrame = performance.now();
  private frame = 0;
  private resizeObserver: ResizeObserver;
  private meshTargets = new Map<THREE.Object3D, Hit>();
  private pointer = new Map<number, { x: number; y: number }>();
  private orbitPointer?: number;
  private pinchDistance?: number;
  private drag?: { hit: Hit; plane: THREE.Plane; target: THREE.Vector3; control?: CANNON.Body; constraint?: CANNON.Constraint };
  private placementGhost?: THREE.Group;
  private stars: { mesh: THREE.Mesh; velocity: THREE.Vector3; time: number }[] = [];
  private sound = new RagdollSound();
  private lastImpact = 0;

  constructor(private container: HTMLElement, private onEvent?: (event: SceneEvent) => void) {
    this.scene.background = new THREE.Color(0xaee4ff);
    this.scene.fog = new THREE.Fog(0xaee4ff, 24, 60);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.width = '100%'; this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block'; this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);
    this.world.allowSleep = true; (this.world.solver as CANNON.GSSolver).iterations = 24;
    this.world.defaultContactMaterial.friction = 0.65;
    this.world.defaultContactMaterial.restitution = 0.12;
    const floor = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0); this.world.addBody(floor);
    const grid = new THREE.GridHelper(64, 64, 0xc6c9bd, 0xd3d8c8);
    grid.position.y = 0.005;
    for (const lineMaterial of Array.isArray(grid.material) ? grid.material : [grid.material]) {
      lineMaterial.transparent = true; lineMaterial.opacity = 0.25;
    }
    this.scene.add(grid); decoratePlayground(this.scene);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x88a8b5, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 3.2);
    sun.position.set(-6, 12, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -22; sun.shadow.camera.right = 22;
    sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22;
    this.scene.add(sun);
    this.spawnCharacter('classic', 0, 0, false);
    this.updateCamera(); this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(container);
    this.renderer.domElement.addEventListener('pointerdown', this.pointerDown);
    this.renderer.domElement.addEventListener('pointermove', this.pointerMove);
    this.renderer.domElement.addEventListener('pointerup', this.pointerUp);
    this.renderer.domElement.addEventListener('pointercancel', this.pointerUp);
    this.renderer.domElement.addEventListener('wheel', this.wheel, { passive: false });
    this.renderer.domElement.addEventListener('contextmenu', this.contextMenu);
    this.frame = requestAnimationFrame(this.animate);
  }

  setTool(tool: RagdollTool) { this.tool = tool; this.endDrag(); this.showGhost(); }
  setCharacter(kind: CharacterKind) { this.kind = kind; this.setTool('place-character'); }
  setObject(kind: ObjectKind) { this.objectKind = kind; this.setTool('place-object'); }
  setPaused(paused: boolean) { this.paused = paused; }
  setMuted(muted: boolean) { this.sound.muted = muted; }
  toggleGlasses() {
    if (!this.selected) return;
    setGlasses(this.selected, !this.selected.glasses);
    this.onEvent?.({ type: 'select', character: true, glasses: !!this.selected.glasses, kind: this.selected.kind });
  }
  reset() {
    this.endDrag();
    for (const c of this.characters) {
      for (const p of c.parts) this.meshTargets.delete(p.mesh);
      removeCharacter(this.world, this.scene, c);
    }
    for (const p of this.props) this.removeProp(p);
    this.characters = []; this.props = []; this.selected = undefined;
    for (const star of this.stars) { this.scene.remove(star.mesh); disposeGroup(star.mesh); }
    this.stars = [];
    this.spawnCharacter('classic', 0, 0, false);
    this.onEvent?.({ type: 'select', character: false });
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame); this.endDrag(); this.resizeObserver.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.pointerDown);
    canvas.removeEventListener('pointermove', this.pointerMove);
    canvas.removeEventListener('pointerup', this.pointerUp);
    canvas.removeEventListener('pointercancel', this.pointerUp);
    canvas.removeEventListener('wheel', this.wheel);
    canvas.removeEventListener('contextmenu', this.contextMenu);
    for (const c of this.characters) removeCharacter(this.world, this.scene, c);
    for (const p of this.props) this.removeProp(p);
    this.characters = []; this.props = []; this.meshTargets.clear();
    for (const star of this.stars) { this.scene.remove(star.mesh); disposeGroup(star.mesh); }
    this.stars = []; this.clearGhost(); this.sound.dispose();
    this.scene.traverse(o => { if (o instanceof THREE.Mesh) {
      o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    } });
    this.renderer.dispose(); canvas.remove();
  }
  private resize() {
    const w = Math.max(1, this.container.clientWidth), h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h, false);
  }
  private updateCamera() {
    const ce = Math.cos(this.elevation);
    this.camera.position.set(this.target.x + this.distance * Math.sin(this.angle) * ce,
      Math.max(1.5, this.target.y + this.distance * Math.sin(this.elevation)),
      this.target.z + this.distance * Math.cos(this.angle) * ce);
    this.camera.lookAt(this.target);
  }
  private ray(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1), this.camera);
    return this.raycaster.ray;
  }
  private groundPoint(event: PointerEvent) {
    return this.ray(event).intersectPlane(this.ground, new THREE.Vector3());
  }
  private hit(event: PointerEvent): Hit | undefined {
    this.ray(event);
    const targets = [...this.meshTargets.keys()];
    const intersections = this.raycaster.intersectObjects(targets, true);
    for (const intersection of intersections) {
      let node: THREE.Object3D | null = intersection.object;
      while (node) {
        const target = this.meshTargets.get(node);
        if (target) return { ...target, point: intersection.point };
        node = node.parent;
      }
    }
    return undefined;
  }
  private spawnCharacter(kind: CharacterKind, x: number, z: number, sound = true) {
    const c = createCharacter(this.world, this.scene, kind, x, z); this.characters.push(c);
    for (const p of c.parts) this.meshTargets.set(p.mesh, { character: c, part: p, point: new THREE.Vector3() });
    if (sound) { this.sound.play('spawn'); this.onEvent?.({ type: 'spawn', character: true, kind }); }
    return c;
  }
  private spawnProp(kind: ObjectKind, x: number, y: number, z: number) {
    const group = new THREE.Group();
    if (kind === 'crate') {
      group.add(geometry(1.2, 1.2, 1.2, 0xd99d62));
      for (const dx of [-0.45, 0.45]) {
        const stripe = geometry(0.09, 1.22, 1.23, 0xb97640); stripe.position.x = dx; group.add(stripe);
      }
    } else {
      group.add(geometry(1.4, 0.18, 1.4, 0xa8a4dd));
      for (const dx of [-0.43, 0, 0.43]) for (const dz of [-0.43, 0, 0.43]) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.56, 5),
          new THREE.MeshStandardMaterial({ color: 0x9266c1, roughness: 0.7 }));
        cone.position.set(dx, 0.36, dz); cone.castShadow = true; group.add(cone);
      }
    }
    group.position.set(x, y, z); this.scene.add(group);
    const ext = kind === 'crate' ? new CANNON.Vec3(0.6, 0.6, 0.6) : new CANNON.Vec3(0.7, 0.23, 0.7);
    const body = new CANNON.Body({ mass: 0, shape: new CANNON.Box(ext) });
    body.position.set(x, y + (kind === 'spikes' ? 0.16 : 0), z);
    this.world.addBody(body);
    const prop = { kind, body, mesh: group }; this.props.push(prop);
    this.meshTargets.set(group, { prop, point: new THREE.Vector3() });
    this.sound.play('spawn'); this.onEvent?.({ type: 'spawn', kind }); return prop;
  }
  private removeProp(prop: Prop) {
    this.world.removeBody(prop.body); this.scene.remove(prop.mesh); this.meshTargets.delete(prop.mesh); disposeGroup(prop.mesh);
  }
  private removeHit(hit: Hit) {
    if (hit.character) {
      this.characters = this.characters.filter(c => c !== hit.character);
      for (const p of hit.character.parts) this.meshTargets.delete(p.mesh);
      removeCharacter(this.world, this.scene, hit.character);
      if (this.selected === hit.character) { this.selected = undefined; this.onEvent?.({ type: 'select', character: false }); }
    } else if (hit.prop) { this.props = this.props.filter(p => p !== hit.prop); this.removeProp(hit.prop); }
    this.onEvent?.({ type: 'delete' });
  }
  private select(hit?: Hit) {
    this.selected = hit?.character;
    this.onEvent?.({ type: 'select', character: !!hit?.character, glasses: !!hit?.character?.glasses, kind: hit?.character?.kind });
  }
  private kick(hit: Hit) {
    if (!hit.character || !hit.part) return;
    const direction = new THREE.Vector3().subVectors(hit.point, this.camera.position).setY(0).normalize();
    if (direction.lengthSq() < 0.01) direction.set(0, 0, -1);
    for (const p of hit.character.parts) {
      p.body.wakeUp();
      p.body.applyImpulse(new CANNON.Vec3(direction.x * 1.8, 2.4, direction.z * 1.8));
    }
    const offset = hit.point.clone().sub(new THREE.Vector3(hit.part.body.position.x, hit.part.body.position.y, hit.part.body.position.z));
    hit.part.body.applyImpulse(new CANNON.Vec3(direction.x * 7, 8, direction.z * 7),
      new CANNON.Vec3(offset.x, offset.y, offset.z));
    this.sound.play('kick'); this.onEvent?.({ type: 'kick', character: true, kind: hit.character.kind });
  }
  private beginDrag(hit: Hit, event: PointerEvent) {
    const normal = new THREE.Vector3().subVectors(this.camera.position, this.target).normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, hit.point);
    const target = hit.point.clone(); this.drag = { hit, plane, target };
    if (!hit.part) return;
    const control = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
    control.position.set(target.x, target.y, target.z); this.world.addBody(control);
    const local = hit.part.body.pointToLocalFrame(new CANNON.Vec3(target.x, target.y, target.z));
    const constraint = new CANNON.PointToPointConstraint(hit.part.body, local, control, new CANNON.Vec3(), 300);
    constraint.collideConnected = false; this.world.addConstraint(constraint);
    this.drag.control = control; this.drag.constraint = constraint;
    this.renderer.domElement.setPointerCapture(event.pointerId);
  }
  private endDrag() {
    if (!this.drag) return;
    if (this.drag.constraint) this.world.removeConstraint(this.drag.constraint);
    if (this.drag.control) this.world.removeBody(this.drag.control);
    this.drag = undefined;
  }
  private place(event: PointerEvent) {
    const point = this.groundPoint(event); if (!point) return;
    const x = THREE.MathUtils.clamp(point.x, -27, 27), z = THREE.MathUtils.clamp(point.z, -27, 27);
    if (this.tool === 'place-character') this.select({ character: this.spawnCharacter(this.kind, x, z), point });
    else {
      let y = this.objectKind === 'crate' ? 0.6 : 0.05;
      if (this.objectKind === 'crate') {
        const under = this.props.filter(p => p.kind === 'crate' && Math.abs(p.mesh.position.x - x) < 0.52 && Math.abs(p.mesh.position.z - z) < 0.52);
        if (under.length) y = Math.max(...under.map(p => p.mesh.position.y)) + 1.2;
      }
      this.spawnProp(this.objectKind, x, y, z);
    }
    if (this.placementGhost) this.placementGhost.visible = false;
  }
  private pointerDown = (event: PointerEvent) => {
    event.preventDefault(); this.pointer.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointer.size > 1) {
      const points = [...this.pointer.values()];
      this.pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      this.orbitPointer = event.pointerId; this.renderer.domElement.setPointerCapture(event.pointerId); this.endDrag(); return;
    }
    if (event.button === 2 || event.shiftKey) {
      this.orbitPointer = event.pointerId; this.renderer.domElement.setPointerCapture(event.pointerId); return;
    }
    if (event.button !== 0) return;
    if (this.paused) {
      this.orbitPointer = event.pointerId; this.renderer.domElement.setPointerCapture(event.pointerId); return;
    }
    if (this.tool === 'place-character' || this.tool === 'place-object') { this.place(event); return; }
    const hit = this.hit(event);
    if (!hit) { this.orbitPointer = event.pointerId; this.renderer.domElement.setPointerCapture(event.pointerId); return; }
    if (this.tool === 'delete') {
      if (hit) this.removeHit(hit);
      return;
    }
    this.select(hit);
    if (!hit) return;
    if (this.tool === 'kick') this.kick(hit);
    if (this.tool === 'grab' || this.tool === 'move') this.beginDrag(hit, event);
  };
  private pointerMove = (event: PointerEvent) => {
    const old = this.pointer.get(event.pointerId);
    if (old) this.pointer.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointer.size > 1) {
      const points = [...this.pointer.values()];
      const nextDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      if (this.pinchDistance && nextDistance > 10) {
        this.distance = THREE.MathUtils.clamp(this.distance * this.pinchDistance / nextDistance, 4, 34);
        this.updateCamera();
      }
      this.pinchDistance = nextDistance;
      return;
    }
    if (this.orbitPointer === event.pointerId && old) {
      this.angle -= (event.clientX - old.x) * 0.006;
      this.elevation = THREE.MathUtils.clamp(this.elevation + (event.clientY - old.y) * 0.005, 0.13, 1.35);
      this.updateCamera(); return;
    }
    if (this.drag) {
      const point = this.ray(event).intersectPlane(this.drag.plane, new THREE.Vector3());
      if (point) this.drag.target.copy(point).clamp(new THREE.Vector3(-28, 0.12, -28), new THREE.Vector3(28, 14, 28));
    } else if (this.placementGhost) {
      const point = this.groundPoint(event);
      if (point) {
        this.placementGhost.position.set(point.x, 0, point.z);
        this.placementGhost.visible = true;
      }
    }
  };
  private pointerUp = (event: PointerEvent) => {
    this.pointer.delete(event.pointerId);
    if (this.pointer.size < 2) this.pinchDistance = undefined;
    if (this.orbitPointer === event.pointerId) this.orbitPointer = undefined;
    if (this.drag) this.endDrag();
    if (this.renderer.domElement.hasPointerCapture(event.pointerId)) this.renderer.domElement.releasePointerCapture(event.pointerId);
  };
  private wheel = (event: WheelEvent) => {
    event.preventDefault(); this.distance = THREE.MathUtils.clamp(this.distance * Math.exp(event.deltaY * 0.001), 4, 34); this.updateCamera();
  };
  private contextMenu = (event: MouseEvent) => event.preventDefault();
  private clearGhost() { if (this.placementGhost) { this.scene.remove(this.placementGhost); disposeGroup(this.placementGhost); this.placementGhost = undefined; } }
  private showGhost() {
    this.clearGhost(); if (this.tool !== 'place-character' && this.tool !== 'place-object') return;
    const ghost = makePlacementGhost(this.tool === 'place-character' ? this.kind : this.objectKind);
    ghost.visible = false; this.scene.add(ghost); this.placementGhost = ghost;
  }
  private animate = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05); this.lastFrame = now;
    if (!this.paused) {
      if (this.drag?.control) {
        const p = this.drag.control.position, t = this.drag.target;
        const dx = t.x - p.x, dy = t.y - p.y, dz = t.z - p.z;
        const distance = Math.hypot(dx, dy, dz);
        const rate = Math.min(1, (dt * 12) / Math.max(distance, 0.001));
        p.x += dx * rate; p.y += dy * rate; p.z += dz * rate;
        // Kinematic bodies integrate velocity in Cannon; the position was advanced above.
        this.drag.control.velocity.setZero();
      }
      if (this.drag?.hit.prop) {
        const p = this.drag.hit.prop;
        p.mesh.position.set(this.drag.target.x, p.mesh.position.y, this.drag.target.z);
        p.body.position.set(p.mesh.position.x, p.mesh.position.y + (p.kind === 'spikes' ? 0.16 : 0), p.mesh.position.z);
        p.body.aabbNeedsUpdate = true;
      }
      this.world.step(1 / 60, dt, 3);
      for (const c of this.characters) stabilizeCharacter(c, this.drag?.hit.character === c ? this.drag.hit.part?.body : undefined);
      this.sync(); this.checkCollisions(); this.animateStars(dt);
    }
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.animate);
  };
  private sync() {
    for (const c of this.characters) for (const p of c.parts) {
      const b = p.body;
      // Bad solver states cannot send toys beyond the visible playground.
      if (!Number.isFinite(b.position.x + b.position.y + b.position.z)) { b.position.set(0, 3, 0); b.velocity.setZero(); }
      const speed = b.velocity.length(); if (speed > 24) b.velocity.scale(24 / speed, b.velocity);
      p.mesh.position.set(b.position.x, b.position.y, b.position.z);
      p.mesh.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
    }
  }
  private checkCollisions() {
    for (const c of this.characters) for (const p of c.parts) {
      const b = p.body;
      for (const prop of this.props) {
        const dx = Math.abs(b.position.x - prop.body.position.x), dz = Math.abs(b.position.z - prop.body.position.z);
        if (dx > (prop.kind === 'crate' ? 0.95 : 0.85) || dz > (prop.kind === 'crate' ? 0.95 : 0.85)) continue;
        const dy = Math.abs(b.position.y - prop.body.position.y);
        if (prop.kind === 'spikes' && !c.defeated && dy < 0.62) this.defeat(c);
        else if (prop.kind === 'crate' && dy < 1.1 && b.velocity.length() > 2.5 && performance.now() - this.lastImpact > 200) {
          this.lastImpact = performance.now(); this.sound.play('impact'); this.onEvent?.({ type: 'impact' });
        }
      }
    }
  }
  private defeat(c: RagdollCharacter) {
    c.defeated = true;
    if (this.drag?.hit.character === c) this.endDrag();
    const head = c.parts.find(p => p.name === 'head')!;
    const pos = head.mesh.position;
    for (let i = 0; i < 12; i++) {
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd858 : 0xff81b4 }));
      mesh.position.copy(pos); this.scene.add(mesh);
      const a = i * Math.PI * 2 / 12;
      this.stars.push({ mesh, velocity: new THREE.Vector3(Math.cos(a) * 3, 2 + Math.random() * 2, Math.sin(a) * 3), time: 1 });
    }
    // A gentle poof is a lasting defeat cue; the playground and other toys remain.
    for (const p of c.parts) this.meshTargets.delete(p.mesh);
    removeCharacter(this.world, this.scene, c);
    this.characters = this.characters.filter(other => other !== c);
    if (this.selected === c) {
      this.selected = undefined;
      this.onEvent?.({ type: 'select', character: false });
    }
    this.sound.play('defeat'); this.onEvent?.({ type: 'defeat', character: true, kind: c.kind });
  }
  private animateStars(dt: number) {
    for (const star of this.stars) {
      star.time -= dt; star.mesh.position.addScaledVector(star.velocity, dt); star.velocity.y -= 5 * dt;
      star.mesh.rotation.x += dt * 5; star.mesh.rotation.y += dt * 4;
      if (star.time <= 0) { this.scene.remove(star.mesh); disposeGroup(star.mesh); }
    }
    this.stars = this.stars.filter(s => s.time > 0);
  }
}
