import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createCharacter, removeCharacter, setGlasses, stabilizeCharacter, type CharacterKind, type RagdollCharacter, type RagdollPart } from './RagdollCharacter';
import { RagdollSound } from './RagdollSound';
import { decoratePlayground, makePlacementGhost } from './RagdollWorld';
import { createProp, type ObjectKind, type Prop } from './RagdollProps';
import { applyPartyBlast } from './RagdollParty';
import { RagdollMission } from './RagdollMission';
import { RagdollAim } from './RagdollAim';
import { updateFans } from './RagdollFan';
import { freePlayLayout, stageLayouts } from './RagdollStageSetup';
import { guideToScreen, type GuideScreen } from './RagdollGuidePoints';
export type { CharacterKind } from './RagdollCharacter';
export type { ObjectKind } from './RagdollProps';
export type RagdollTool = 'grab' | 'kick' | 'move' | 'delete' | 'place-character' | 'place-object';
export interface SceneEvent { type: 'select' | 'spawn' | 'kick' | 'impact' | 'defeat' | 'delete' | 'grab' | 'release' | 'move' | 'bounce' | 'bump' | 'glasses' | 'collide' | 'party' | 'goal' | 'gateOpen' | 'crateCrash' | 'miss' | 'fruitHome' | 'friendsMeet' | 'bumperHit' | 'rescue' | 'landed' | 'bridgeReady' | 'fanReady' | 'windBoost'; character?: boolean; glasses?: boolean; kind?: string; part?: string; airborne?: boolean }
interface Hit { character?: RagdollCharacter; part?: RagdollPart; prop?: Prop; point: THREE.Vector3 }

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
  private missionStep = 0;
  private kind: CharacterKind = 'classic';
  private objectKind: ObjectKind = 'crate';
  private paused = false;
  private slowMo = false;
  private disposed = false;
  private angle = 0.65;
  private elevation = 0.50;
  private distance = 9.5;
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
  private lastCharacterCollision = 0;
  private mission = new RagdollMission(this.scene, this.world, event => this.onEvent?.(event));
  private aim = new RagdollAim<Hit>(this.scene, event => this.groundPoint(event));
  private setTheme!: (stage: number) => void;

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
    this.scene.add(grid); this.setTheme = decoratePlayground(this.scene);
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
    this.renderer.domElement.addEventListener('pointerdown', this.pointerDown); this.renderer.domElement.addEventListener('pointermove', this.pointerMove);
    this.renderer.domElement.addEventListener('pointerup', this.pointerUp); this.renderer.domElement.addEventListener('pointercancel', this.pointerUp);
    this.renderer.domElement.addEventListener('wheel', this.wheel, { passive: false }); this.renderer.domElement.addEventListener('contextmenu', this.contextMenu);
    this.frame = requestAnimationFrame(this.animate);
  }

  setTool(tool: RagdollTool) { this.tool = tool; this.endDrag(); this.showGhost(); }
  setMissionStep(step: number) { this.missionStep = step; }
  getGuide(step: number): GuideScreen | undefined { return guideToScreen(this.mission.guide(step, this.props, this.characters), this.camera, this.container.clientWidth, this.container.clientHeight); }
  setCharacter(kind: CharacterKind) { this.kind = kind; this.setTool('place-character'); }
  setObject(kind: ObjectKind) { this.objectKind = kind; this.setTool('place-object'); }
  setPaused(paused: boolean) { this.paused = paused; }
  setSlowMotion(enabled: boolean) { this.slowMo = enabled; }
  setMuted(muted: boolean) { this.sound.muted = muted; }
  captureStream() {
    const stream = this.renderer.domElement.captureStream(30);
    stream.addTrack(this.sound.captureTrack()); return stream;
  }
  stopCapture() { this.sound.stopCapture(); }
  toggleGlasses() {
    if (!this.selected) return;
    setGlasses(this.selected, !this.selected.glasses);
    this.onEvent?.({ type: 'select', character: true, glasses: !!this.selected.glasses, kind: this.selected.kind });
    this.onEvent?.({ type: 'glasses', character: true, glasses: !!this.selected.glasses, kind: this.selected.kind });
  }
  loadShow(index: number) {
    this.reset(false);
    this.setTheme(index);
    this.angle = 0.65; this.elevation = 0.5; this.distance = index === 0 || index === 5 ? 11.5 : 9.5; this.updateCamera();
    const layout = stageLayouts[index];
    for (const [kind, x, z] of layout.characters) this.spawnCharacter(kind, x, z, false);
    for (const [kind, x, y, z, dynamic] of layout.props) this.spawnProp(kind, x, y, z, dynamic);
    for (const character of this.characters) for (const part of character.parts) part.body.sleep();
    this.mission.start(index, this.props, this.characters);
  }
  enterFreePlay() {
    this.reset(false);
    this.setTheme(6);
    for (const [kind, x, z] of freePlayLayout.characters) this.spawnCharacter(kind, x, z, false);
    for (const [kind, x, y, z] of freePlayLayout.props) this.spawnProp(kind, x, y, z);
    for (const character of this.characters) for (const part of character.parts) part.body.sleep();
    this.angle = 0.65; this.elevation = 0.5; this.distance = 10.5; this.updateCamera();
  }
  celebrate() { this.sound.play('cheer'); this.burst(new THREE.Vector3(0, 2.5, 0), 0xffd86a); }
  partyBlast() {
    if (this.paused) return;
    applyPartyBlast(this.characters);
    this.burst(new THREE.Vector3(-1.2, 2.4, 0), 0xff8cac);
    this.burst(new THREE.Vector3(1.2, 2.4, 0), 0x7de7ed);
    this.sound.play('cheer'); this.onEvent?.({ type: 'party' });
  }
  reset(withStarter = true) {
    this.endDrag(); this.aim.clear(); this.mission.clear();
    for (const c of this.characters) {
      for (const p of c.parts) this.meshTargets.delete(p.mesh);
      removeCharacter(this.world, this.scene, c);
    }
    for (const p of this.props) this.removeProp(p);
    this.characters = []; this.props = []; this.selected = undefined;
    for (const star of this.stars) { this.scene.remove(star.mesh); disposeGroup(star.mesh); }
    this.stars = [];
    if (withStarter) this.spawnCharacter('classic', 0, 0, false);
    this.onEvent?.({ type: 'select', character: false });
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame); this.endDrag(); this.aim.clear(); this.mission.clear(); this.resizeObserver.disconnect();
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
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h, false); this.updateCamera();
  }
  private updateCamera() {
    const ce = Math.cos(this.elevation);
    const distance = this.distance * Math.max(1, 0.75 / this.camera.aspect);
    this.camera.position.set(this.target.x + distance * Math.sin(this.angle) * ce,
      Math.max(1.5, this.target.y + distance * Math.sin(this.elevation)),
      this.target.z + distance * Math.cos(this.angle) * ce);
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
  private spawnProp(kind: ObjectKind, x: number, y: number, z: number, dynamic = false) {
    const prop = createProp(this.world, this.scene, kind, x, y, z, dynamic); this.props.push(prop);
    this.meshTargets.set(prop.mesh, { prop, point: new THREE.Vector3() });
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
    this.onEvent?.({ type: 'delete', kind: hit.prop?.kind ?? hit.character?.kind, character: !!hit.character });
  }
  private select(hit?: Hit) {
    this.selected = hit?.character;
    this.onEvent?.({ type: 'select', character: !!hit?.character, glasses: !!hit?.character?.glasses, kind: hit?.character?.kind });
  }
  private kick(hit: Hit, aimed?: THREE.Vector3, power = 1) {
    this.mission.arm();
    const guide = !aimed && hit.prop?.kind === 'ball' ? this.mission.guide(this.missionStep, this.props, this.characters) : undefined;
    const target = guide && guide.from.distanceTo(hit.point) < 1 ? guide.to : undefined;
    const direction = aimed?.clone() ?? (target ? target.clone().sub(hit.point).setY(0).normalize() : new THREE.Vector3().subVectors(hit.point, this.camera.position).setY(0).normalize());
    if (direction.lengthSq() < 0.01) direction.set(0, 0, -1);
    if (hit.prop?.kind === 'ball') {
      hit.prop.body.wakeUp();
      hit.prop.body.applyImpulse(new CANNON.Vec3(direction.x * 6 * power, 1.7 + power * 0.8, direction.z * 6 * power));
      this.sound.play('kick'); this.onEvent?.({ type: 'kick', kind: 'ball' }); return;
    }
    if (!hit.character || !hit.part) return;
    for (const p of hit.character.parts) {
      p.body.wakeUp();
      p.body.applyImpulse(new CANNON.Vec3(direction.x * 1.8 * power, 2.4, direction.z * 1.8 * power));
    }
    const offset = hit.point.clone().sub(new THREE.Vector3(hit.part.body.position.x, hit.part.body.position.y, hit.part.body.position.z));
    hit.part.body.applyImpulse(new CANNON.Vec3(direction.x * 7 * power, 5.5, direction.z * 7 * power),
      new CANNON.Vec3(offset.x, offset.y, offset.z));
    this.sound.play('kick'); this.onEvent?.({ type: 'kick', character: true, kind: hit.character.kind });
  }
  private beginDrag(hit: Hit, event: PointerEvent) {
    const normal = new THREE.Vector3().subVectors(this.camera.position, this.target).normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, hit.point);
    const target = hit.point.clone(); this.drag = { hit, plane, target };
    if (!hit.part) return;
    for (const part of hit.character?.parts ?? []) part.body.wakeUp();
    const control = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
    control.position.set(target.x, target.y, target.z); this.world.addBody(control);
    const local = hit.part.body.pointToLocalFrame(new CANNON.Vec3(target.x, target.y, target.z));
    const constraint = new CANNON.PointToPointConstraint(hit.part.body, local, control, new CANNON.Vec3(), 300);
    constraint.collideConnected = false; this.world.addConstraint(constraint);
    this.drag.control = control; this.drag.constraint = constraint;
    const airborne = (hit.character?.parts[0].body.position.y ?? 0) > 2.4;
    this.onEvent?.({ type: 'grab', character: true, kind: hit.character?.kind, part: hit.part.name, airborne });
    this.renderer.domElement.setPointerCapture(event.pointerId);
  }
  private endDrag(dropPoint?: THREE.Vector3) {
    if (!this.drag) return;
    const { hit, constraint, control } = this.drag;
    if (constraint) this.world.removeConstraint(constraint);
    if (control) this.world.removeBody(control);
    this.drag = undefined;
    if (dropPoint && hit.character) this.mission.tryDrop(hit.character, dropPoint);
    if (dropPoint && hit.prop) this.mission.tryPlace(hit.prop, dropPoint);
    if (hit.part) this.onEvent?.({ type: 'release', character: true, kind: hit.character?.kind, part: hit.part.name });
  }
  private place(event: PointerEvent) {
    const point = this.groundPoint(event); if (!point) return;
    const x = THREE.MathUtils.clamp(point.x, -27, 27), z = THREE.MathUtils.clamp(point.z, -27, 27);
    if (this.tool === 'place-character') this.select({ character: this.spawnCharacter(this.kind, x, z), point });
    else {
      let y = 0.14;
      if (this.objectKind === 'crate') y = 0.6;
      if (this.objectKind === 'ball') y = 0.7;
      if (this.objectKind === 'bumper') y = 0.22;
      if (this.objectKind === 'fan') y = 0.85;
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
      this.orbitPointer = event.pointerId; this.renderer.domElement.setPointerCapture(event.pointerId); this.endDrag(); this.aim.clear(); return;
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
    if (this.tool === 'kick') {
      const position = hit.prop?.body.position ?? hit.part?.body.position;
      if (!position || !this.aim.begin(hit, event, new THREE.Vector3(position.x, position.y, position.z))) this.kick(hit);
      else this.renderer.domElement.setPointerCapture(event.pointerId);
    }
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
    if (this.aim.activeId === event.pointerId) { this.aim.update(event); return; }
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
    const aimed = this.aim.finish(event);
    if (aimed && event.type !== 'pointercancel') this.kick(aimed.hit, aimed.direction, aimed.power);
    this.pointer.delete(event.pointerId);
    if (this.pointer.size < 2) this.pinchDistance = undefined;
    if (this.orbitPointer === event.pointerId) this.orbitPointer = undefined;
    if (this.drag) this.endDrag(event.type === 'pointercancel' ? undefined : this.groundPoint(event) ?? undefined);
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
    const realDt = Math.min((now - this.lastFrame) / 1000, 0.05); this.lastFrame = now;
    const dt = realDt * (this.slowMo ? 0.36 : 1);
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
        this.mission.arm();
        const p = this.drag.hit.prop;
        p.mesh.position.set(this.drag.target.x, p.mesh.position.y, this.drag.target.z);
        p.body.position.set(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z);
        p.body.aabbNeedsUpdate = true;
        this.onEvent?.({ type: 'move', kind: p.kind });
      }
      this.world.step(1 / 60, dt, 3);
      if (updateFans(this.props, now, dt)) { this.sound.play('bounce'); this.mission.windBoosted(); }
      for (const c of this.characters) stabilizeCharacter(c, this.drag?.hit.character === c ? this.drag.hit.part?.body : undefined);
      this.sync(); this.checkCollisions(); this.mission.update(now, this.props, this.characters); this.animateStars(dt);
    }
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.animate);
  };
  private sync() {
    for (const prop of this.props) if (prop.body.mass > 0 && this.drag?.hit.prop !== prop) {
      prop.mesh.position.set(prop.body.position.x, prop.body.position.y, prop.body.position.z);
      prop.mesh.quaternion.set(prop.body.quaternion.x, prop.body.quaternion.y, prop.body.quaternion.z, prop.body.quaternion.w);
    }
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
    for (const c of [...this.characters]) for (const p of c.parts) {
      if (c.defeated) break;
      for (const prop of this.props) this.checkPropContact(c, p, prop);
    }
    this.checkCharacterCollisions();
  }
  private checkPropContact(c: RagdollCharacter, p: RagdollPart, prop: Prop) {
    const b = p.body;
    const dx = Math.abs(b.position.x - prop.body.position.x), dz = Math.abs(b.position.z - prop.body.position.z);
    const reach = prop.kind === 'crate' ? 0.95 : 1.05;
    if (dx > reach || dz > reach) return;
    const dy = Math.abs(b.position.y - prop.body.position.y);
    if (prop.kind === 'spikes' && !prop.covered && !c.defeated && dy < 0.62) { this.defeat(c); return; }
    if (prop.kind === 'launchpad' && dy < 0.85 && performance.now() - prop.lastTrigger > 900) {
      prop.lastTrigger = performance.now();
      for (const part of c.parts) part.body.applyImpulse(new CANNON.Vec3(0, 4.2, 0));
      this.sound.play('bounce'); this.burst(prop.mesh.position, 0x52d7eb);
    }
    if (prop.kind === 'bumper' && dy < 0.8 && performance.now() - prop.lastTrigger > 700) {
      prop.lastTrigger = performance.now();
      b.applyImpulse(new CANNON.Vec3((b.position.x - prop.body.position.x) * 8, 5, (b.position.z - prop.body.position.z) * 8));
      this.sound.play('bounce'); this.burst(prop.mesh.position, 0xffd76f);
      this.onEvent?.({ type: 'bump', character: true, kind: c.kind });
    }
    if (prop.kind === 'crate' && dy < 1.1 && b.velocity.length() > 2.5 && performance.now() - this.lastImpact > 200) {
      this.lastImpact = performance.now(); this.sound.play('impact'); this.onEvent?.({ type: 'impact', kind: 'crate' });
    }
  }
  private checkCharacterCollisions() {
    if (this.characters.length > 1 && performance.now() - this.lastCharacterCollision > 700) {
      for (let i = 0; i < this.characters.length; i++) for (let j = i + 1; j < this.characters.length; j++) {
        const a = this.characters[i].parts[0].body, b = this.characters[j].parts[0].body;
        if (a.position.distanceTo(b.position) < 1.05 && a.velocity.vsub(b.velocity).length() > 1.2) {
          this.lastCharacterCollision = performance.now(); this.sound.play('impact');
          this.onEvent?.({ type: 'collide', character: true }); return;
        }
      }
    }
  }
  private burst(position: THREE.Vector3, color: number) {
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), new THREE.MeshBasicMaterial({ color }));
      mesh.position.copy(position); mesh.position.y += 0.5; this.scene.add(mesh);
      const angle = i * Math.PI / 4;
      this.stars.push({ mesh, velocity: new THREE.Vector3(Math.cos(angle) * 2.2, 2 + i % 3, Math.sin(angle) * 2.2), time: 0.55 });
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
