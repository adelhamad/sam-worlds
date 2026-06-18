// Star Ranger — the 3D orchestrator (three.js). A dumb-ish renderer: it owns
// the meadow, the third-person character controller, a follow camera, the
// star-bolt firing with auto-aim assist, and all particle/coin/NPC motion.
// React owns the math + answer rules and drives it through the public methods.
import * as THREE from "three";
import { Player, makeCompanion } from "./player";
import {
  grassTexture, skyTexture, makeTree, makeRock, makePond, makeCloud,
  makeFlag, makeHills, makeNPC, makeCoin,
} from "./world";
import { makeCrystal, makeBolt, makeSpark, disposeCrystal, type CrystalParts } from "./targets";

const WORLD_R = 30;
const SPEED = 7.5;
const JUMP_V = 8.5;
const GRAVITY = 22;
const CAM_DIST = 8.5;
const CAM_H = 5.2;
const PICKUP_R = 1.4;

interface Crystal { id: number; parts: CrystalParts; base: THREE.Vector3; phase: number; locked: boolean; }
interface Bolt { mesh: THREE.Mesh; target: THREE.Vector3; id: number | null; }
interface Spark { mesh: THREE.Mesh; v: THREE.Vector3; }
interface Coin { mesh: THREE.Mesh; phase: number; }
interface NPC { group: THREE.Group; phase: number; dir: number; speed: number; }
interface Obstacle { x: number; z: number; r: number; }

const NPC_KINDS: Array<[string, number]> = [
  ["🐼", 0xf2f2f2], ["🦊", 0xe8884a], ["🐸", 0x7ec850], ["🐰", 0xe7d7c8], ["🐨", 0x9aa7b0], ["🐯", 0xf4b942],
];

export class RangerScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private player = new Player();
  private companion = makeCompanion();
  private companionHome = new THREE.Vector3(4, 3, 4);
  private clouds: THREE.Group[] = [];
  private npcs: NPC[] = [];
  private obstacles: Obstacle[] = [];
  private crystals = new Map<number, Crystal>();
  private beacon: THREE.Mesh | null = null;
  private bolts: Bolt[] = [];
  private sparks: Spark[] = [];
  private coins: Coin[] = [];
  private moveX = 0;
  private moveY = 0;
  private camYaw = 0;
  private vy = 0;
  private grounded = true;
  private aimedId: number | null = null;
  private raf = 0;
  private lastT = 0;
  private running = false;
  onHit?: (id: number) => void;
  onCoin?: () => void;
  onTick?: (dt: number) => void;

  static create(host: HTMLElement, name: string): RangerScene {
    return new RangerScene(host, name);
  }

  private constructor(private host: HTMLElement, name: string) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(this.renderer.domElement);

    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog(0xdff3ff, 42, 78);
    this.camera = new THREE.PerspectiveCamera(60, host.clientWidth / host.clientHeight, 0.1, 200);

    this.buildWorld(name);
    this.player.group.rotation.y = Math.PI; // start facing into the meadow (back to camera)
    this.scene.add(this.player.group, this.companion);
    this.camera.position.set(0, CAM_H, CAM_DIST);

    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
  }

  private buildWorld(name: string): void {
    this.scene.add(new THREE.HemisphereLight(0xcfeaff, 0x4f7a3a, 1.05));
    const sun = new THREE.DirectionalLight(0xfff4d6, 1.25);
    sun.position.set(14, 22, 8);
    this.scene.add(sun);

    const grass = grassTexture();
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(WORLD_R + 8, 64),
      new THREE.MeshStandardMaterial({ map: grass, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground, makeHills(Math.random));

    const flag = makeFlag(name);
    flag.position.set(0, 0, -6);
    this.scene.add(flag);
    this.scatterProps();
    this.spawnNPCs();
    this.spawnClouds();
  }

  private scatterProps(): void {
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 7 + Math.random() * (WORLD_R - 6);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const tree = Math.random() < 0.62;
      const obj = tree ? makeTree(Math.random) : makeRock(Math.random);
      obj.position.set(x, 0, z);
      this.scene.add(obj);
      this.obstacles.push({ x, z, r: tree ? 0.8 : 0.9 });
    }
    const pond = makePond(3.2);
    pond.position.set(-11, 0, 9);
    this.scene.add(pond);
    this.obstacles.push({ x: -11, z: 9, r: 3.4 });
  }

  private spawnNPCs(): void {
    for (let i = 0; i < 5; i++) {
      const [emoji, color] = NPC_KINDS[i % NPC_KINDS.length];
      const g = makeNPC(emoji, color);
      const a = Math.random() * Math.PI * 2;
      const r = 6 + Math.random() * 16;
      g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      this.scene.add(g);
      this.npcs.push({ group: g, phase: Math.random() * 10, dir: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 0.7 });
    }
  }

  private spawnClouds(): void {
    for (let i = 0; i < 7; i++) {
      const c = makeCloud(Math.random);
      c.position.set((Math.random() - 0.5) * 80, 16 + Math.random() * 8, (Math.random() - 0.5) * 80);
      this.clouds.push(c);
      this.scene.add(c);
    }
  }

  private onResize(): void {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /* ---------------- public controls (called by React) ---------------- */

  setMove(x: number, y: number): void {
    this.moveX = Math.max(-1, Math.min(1, x));
    this.moveY = Math.max(-1, Math.min(1, y));
  }

  /** Drag-to-look: nudge the camera yaw (radians). */
  look(deltaYaw: number): void {
    this.camYaw += deltaYaw;
  }

  jump(): void {
    if (this.grounded) {
      this.vy = JUMP_V;
      this.grounded = false;
    }
  }

  /** Is a crystal currently in the aim cone? (drives the ZAP-ready glow.) */
  hasAim(): boolean {
    return this.aimedId != null;
  }

  /** Fire at the aimed crystal; returns true if one was actually targeted. */
  fire(): boolean {
    const bolt = makeBolt();
    bolt.position.copy(this.player.muzzle());
    const aimed = this.aimedId != null ? this.crystals.get(this.aimedId) : undefined;
    if (aimed) {
      aimed.locked = true;
      this.bolts.push({ mesh: bolt, target: aimed.parts.group.position.clone(), id: aimed.id });
    } else {
      const f = this.facing();
      this.bolts.push({ mesh: bolt, target: bolt.position.clone().addScaledVector(f, 16), id: null });
    }
    this.scene.add(bolt);
    return Boolean(aimed);
  }

  /** Lay out a fresh cluster of numbered crystals somewhere in the meadow. */
  spawnCluster(items: Array<{ id: number; value: string; golden?: boolean }>): void {
    this.clearCluster();
    // Favor the meadow ahead of the home view (-Z), so crystals are easy to find.
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
    const r = 9 + Math.random() * 8;
    const center = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    this.beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 18, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    );
    this.beacon.position.set(center.x, 9, center.z);
    this.scene.add(this.beacon);
    const span = Math.min(2.1, 1.1 + items.length * 0.18);
    items.forEach((it, i) => {
      const t = items.length === 1 ? 0 : (i / (items.length - 1) - 0.5) * 2 * span;
      const hue = it.golden ? 0.13 : 0.5 + i * 0.12;
      const parts = makeCrystal(it.value, hue);
      if (it.golden) (parts.gem.material as THREE.MeshStandardMaterial).color.setHex(0xffd84d);
      const base = new THREE.Vector3(center.x + Math.cos(a + Math.PI / 2) * t * 2.4, 2 + Math.sin(i) * 0.4, center.z + Math.sin(a + Math.PI / 2) * t * 2.4);
      parts.group.position.copy(base);
      parts.glow.scale.setScalar(it.golden ? 4.6 : 3.4);
      this.crystals.set(it.id, { id: it.id, parts, base, phase: Math.random() * 6, locked: false });
      this.scene.add(parts.group);
    });
    this.companionHome.set(center.x, 3.2, center.z);
  }

  clearCluster(): void {
    for (const c of this.crystals.values()) {
      this.scene.remove(c.parts.group);
      disposeCrystal(c.parts);
    }
    this.crystals.clear();
    this.aimedId = null;
    if (this.beacon) {
      this.scene.remove(this.beacon);
      this.beacon.geometry.dispose();
      (this.beacon.material as THREE.Material).dispose();
      this.beacon = null;
    }
  }

  /** Correct hit: shatter a crystal into gold sparkles and remove it. */
  shatter(id: number): void {
    const c = this.crystals.get(id);
    if (!c) return;
    this.burst(c.parts.group.position, 0xffe27a, 16);
    this.scene.remove(c.parts.group);
    disposeCrystal(c.parts);
    this.crystals.delete(id);
    if (this.aimedId === id) this.aimedId = null;
  }

  /** Gentle "not that one": a soft cyan puff + recoil, crystal stays put. */
  bounce(id: number): void {
    const c = this.crystals.get(id);
    if (!c) return;
    this.burst(c.parts.group.position, 0x8fd0ff, 8);
    c.locked = false;
  }

  /** Drop a collectible coin near the player. */
  dropCoin(): void {
    const coin = makeCoin();
    const p = this.player.group.position;
    coin.position.set(p.x + (Math.random() - 0.5) * 2, 1.1, p.z + (Math.random() - 0.5) * 2 - 1);
    this.coins.push({ mesh: coin, phase: Math.random() * 6 });
    this.scene.add(coin);
  }

  private burst(at: THREE.Vector3, color: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const s = makeSpark(color);
      s.position.copy(at);
      s.userData.v = new THREE.Vector3((Math.random() - 0.5) * 9, Math.random() * 7 + 2, (Math.random() - 0.5) * 9);
      this.sparks.push({ mesh: s, v: s.userData.v as THREE.Vector3 });
      this.scene.add(s);
    }
  }

  private facing(): THREE.Vector3 {
    const r = this.player.group.rotation.y;
    return new THREE.Vector3(Math.sin(r), 0, Math.cos(r));
  }

  /* ---------------- loop ---------------- */

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastT = performance.now();
    const tick = (t: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (t - this.lastT) / 1000);
      this.lastT = t;
      this.onTick?.(dt);
      this.step(dt, t);
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private step(dt: number, t: number): void {
    this.stepPlayer(dt, t);
    this.stepCamera(dt);
    this.stepCompanion(dt, t);
    this.stepAim();
    this.stepCrystals(dt);
    this.stepBolts(dt);
    this.stepSparks(dt);
    this.stepCoins(dt, t);
    this.stepNPCs(dt, t);
    for (const c of this.clouds) c.position.x += dt * 0.4;
  }

  private stepPlayer(dt: number, t: number): void {
    const pos = this.player.group.position;
    const f = new THREE.Vector3(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
    const rt = new THREE.Vector3(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
    const move = new THREE.Vector3().addScaledVector(rt, this.moveX).addScaledVector(f, this.moveY);
    const moving = move.lengthSq() > 0.02;
    if (moving) {
      move.normalize();
      pos.addScaledVector(move, SPEED * dt);
      this.player.group.rotation.y = Math.atan2(move.x, move.z);
    }
    // jump physics
    this.vy -= GRAVITY * dt;
    pos.y += this.vy * dt;
    if (pos.y <= 0) { pos.y = 0; this.vy = 0; this.grounded = true; }
    this.resolveCollisions(pos);
    this.player.step(dt, moving, t);
  }

  private resolveCollisions(pos: THREE.Vector3): void {
    const flat = Math.hypot(pos.x, pos.z);
    if (flat > WORLD_R) { pos.x = (pos.x / flat) * WORLD_R; pos.z = (pos.z / flat) * WORLD_R; }
    for (const o of this.obstacles) {
      const dx = pos.x - o.x;
      const dz = pos.z - o.z;
      const d = Math.hypot(dx, dz);
      const min = o.r + 0.5;
      if (d < min && d > 0.001) { pos.x = o.x + (dx / d) * min; pos.z = o.z + (dz / d) * min; }
    }
  }

  private stepCamera(dt: number): void {
    const p = this.player.group.position;
    const want = new THREE.Vector3(
      p.x + Math.sin(this.camYaw) * CAM_DIST,
      CAM_H + p.y * 0.5,
      p.z + Math.cos(this.camYaw) * CAM_DIST,
    );
    this.camera.position.lerp(want, Math.min(1, dt * 6));
    this.camera.lookAt(p.x, p.y + 1.4, p.z);
  }

  private stepCompanion(dt: number, t: number): void {
    const home = this.companionHome;
    this.companion.position.lerp(home, Math.min(1, dt * 1.8));
    this.companion.position.y = home.y + Math.sin(t / 500) * 0.25;
    this.companion.lookAt(this.player.group.position.x, this.companion.position.y, this.player.group.position.z);
  }

  /** Highlight the crystal the player is most facing (auto-aim assist). */
  private stepAim(): void {
    const p = this.player.group.position;
    const f = this.facing();
    let best: number | null = null;
    let bestDot = 0.55; // ~57° cone
    for (const c of this.crystals.values()) {
      if (c.locked) continue;
      const to = c.parts.group.position.clone().sub(p);
      const dist = to.length();
      if (dist > 26) continue;
      to.y = 0;
      to.normalize();
      const dot = to.dot(f);
      if (dot > bestDot) { bestDot = dot; best = c.id; }
    }
    this.aimedId = best;
    for (const c of this.crystals.values()) {
      const mat = c.parts.ring.material as THREE.MeshBasicMaterial;
      const target = c.id === best ? 0.9 : 0;
      mat.opacity += (target - mat.opacity) * 0.25;
    }
  }

  private stepCrystals(dt: number): void {
    for (const c of this.crystals.values()) {
      c.phase += dt;
      c.parts.group.position.y = c.base.y + Math.sin(c.phase * 1.6) * 0.25;
      c.parts.gem.rotation.y += dt * 1.1;
      c.parts.ring.rotation.z += dt * 0.6;
    }
  }

  private stepBolts(dt: number): void {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      const to = b.target.clone().sub(b.mesh.position);
      const step = 34 * dt;
      if (to.length() <= step) {
        if (b.id != null) this.onHit?.(b.id);
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        (b.mesh.material as THREE.Material).dispose();
        this.bolts.splice(i, 1);
      } else {
        b.mesh.position.addScaledVector(to.normalize(), step);
      }
    }
  }

  private stepSparks(dt: number): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.v.y -= 16 * dt;
      s.mesh.position.addScaledVector(s.v, dt);
      s.mesh.rotation.x += dt * 9;
      s.mesh.scale.multiplyScalar(1 - dt * 1.3);
      if (s.mesh.scale.x < 0.12) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
        this.sparks.splice(i, 1);
      }
    }
  }

  private stepCoins(dt: number, t: number): void {
    const p = this.player.group.position;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.mesh.rotation.y += dt * 3;
      c.mesh.position.y = 1 + Math.sin(t / 300 + c.phase) * 0.18;
      if (Math.hypot(c.mesh.position.x - p.x, c.mesh.position.z - p.z) < PICKUP_R && Math.abs(p.y - 0) < 2) {
        this.scene.remove(c.mesh);
        c.mesh.geometry.dispose();
        (c.mesh.material as THREE.Material).dispose();
        this.coins.splice(i, 1);
        this.onCoin?.();
      }
    }
  }

  private stepNPCs(dt: number, t: number): void {
    for (const n of this.npcs) {
      n.phase += dt;
      const g = n.group;
      g.position.x += Math.sin(n.dir) * n.speed * dt;
      g.position.z += Math.cos(n.dir) * n.speed * dt;
      if (Math.hypot(g.position.x, g.position.z) > WORLD_R - 2) n.dir += Math.PI;
      if (n.phase > 3) { n.phase = 0; n.dir += (Math.random() - 0.5) * 1.5; }
      g.position.y = Math.abs(Math.sin(t / 240 + n.speed * 10)) * 0.14;
      g.rotation.y = Math.atan2(Math.sin(n.dir), Math.cos(n.dir));
    }
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy(): void {
    this.stop();
    window.removeEventListener("resize", this.onResize);
    this.clearCluster();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
