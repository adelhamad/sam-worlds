// Star Ranger — the 3D orchestrator (three.js). Owns the meadow, a third-person
// character controller, a free orbit/pitch follow-camera (drag to look around),
// the star-bolt firing with auto-aim, the Number Golem you battle, and all
// particle/coin/NPC motion. React owns the math + battle rules and drives it
// through the public methods.
import * as THREE from "three";
import { Player, makeCompanion } from "./player";
import { buildMeadow, makeCoin, skyTexture, WORLD_R, type NPC, type Obstacle } from "./world";
import { makeCrystal, makeBolt, makeSpark, disposeCrystal, type CrystalParts } from "./targets";
import { makeMonster, type MonsterParts } from "./monster";

const SPEED = 7.5;
const JUMP_V = 8.5;
const GRAVITY = 22;
const CAM_DIST = 9;
const PICKUP_R = 1.4;

interface Crystal { id: number; parts: CrystalParts; base: THREE.Vector3; phase: number; locked: boolean; }
interface Bolt { mesh: THREE.Mesh; target: THREE.Vector3; id: number | null; }
interface Spark { mesh: THREE.Mesh; v: THREE.Vector3; }
interface Coin { mesh: THREE.Mesh; phase: number; }
interface Monster { parts: MonsterParts; scale: number; base: THREE.Vector3; phase: number; flinchT: number; dying: number; }

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
  private monster: Monster | null = null;
  private bolts: Bolt[] = [];
  private sparks: Spark[] = [];
  private coins: Coin[] = [];
  private moveX = 0;
  private moveY = 0;
  private camYaw = 0;
  private camPitch = 0.45;
  private shake = 0;
  private knock = new THREE.Vector3();
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

    const meadow = buildMeadow(this.scene, name);
    this.obstacles = meadow.obstacles;
    this.npcs = meadow.npcs;
    this.clouds = meadow.clouds;
    this.player.group.rotation.y = Math.PI; // start facing into the meadow (back to camera)
    this.scene.add(this.player.group, this.companion);
    this.camera.position.set(0, 5, CAM_DIST);

    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
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

  /** Drag-to-look: orbit (yaw) and tilt (pitch) the camera. */
  look(dYaw: number, dPitch: number): void {
    this.camYaw -= dYaw;
    this.camPitch = Math.max(0.12, Math.min(1.15, this.camPitch + dPitch));
  }

  jump(): void {
    if (this.grounded) { this.vy = JUMP_V; this.grounded = false; }
  }

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
      this.bolts.push({ mesh: bolt, target: bolt.position.clone().addScaledVector(this.facing(), 16), id: null });
    }
    this.scene.add(bolt);
    return Boolean(aimed);
  }

  /* ---------------- monster ---------------- */

  /** Summon a golem ahead of the player to battle. */
  spawnMonster(face: string, color: number, scale: number, boss: boolean): void {
    this.removeMonster();
    const parts = makeMonster(face, color, scale, boss);
    const a = this.player.group.rotation.y; // in front of where the player faces
    const fx = Math.sin(a), fz = Math.cos(a);
    const p = this.player.group.position;
    let x = p.x + fx * 11, z = p.z + fz * 11;
    const flat = Math.hypot(x, z);
    if (flat > WORLD_R - 3) { x = (x / flat) * (WORLD_R - 3); z = (z / flat) * (WORLD_R - 3); }
    parts.group.position.set(x, 0, z);
    this.scene.add(parts.group);
    this.monster = { parts, scale, base: new THREE.Vector3(x, 0, z), phase: 0, flinchT: 0, dying: 0 };
    this.companionHome.set(x + 2.5, 3.2, z);
  }

  private monsterHead(): THREE.Vector3 {
    const m = this.monster;
    if (!m) return new THREE.Vector3(0, 3, -12);
    return new THREE.Vector3(m.parts.group.position.x, m.parts.headTop * m.scale, m.parts.group.position.z);
  }

  /** Correct hit reaction: golem recoils + flashes (React decrements HP). */
  flinch(): void {
    const m = this.monster;
    if (!m) return;
    m.flinchT = 0.45;
    const away = m.parts.group.position.clone().sub(this.player.group.position).setY(0).normalize();
    m.parts.group.position.addScaledVector(away, 0.6);
  }

  /** Golem beaten: burst into coins + sparkles, then fade out. */
  monsterDefeat(): void {
    const m = this.monster;
    if (!m) return;
    const at = m.parts.group.position.clone().setY(1.6);
    this.burst(at, 0xffe27a, 26);
    this.dropCoinsAt(at, 5);
    m.dying = 0.001;
  }

  /** Wrong answer: golem roars — camera shake + shockwave + a gentle shove. */
  monsterAttack(): void {
    this.shake = 0.9;
    const m = this.monster;
    const from = m ? m.parts.group.position : new THREE.Vector3(0, 0, -12);
    this.burst(this.player.group.position.clone().setY(1.4), 0xff7a7a, 10);
    this.knock.copy(this.player.group.position).sub(from).setY(0).normalize().multiplyScalar(7);
  }

  private removeMonster(): void {
    if (!this.monster) return;
    this.scene.remove(this.monster.parts.group);
    this.monster.parts.group.traverse((o) => {
      if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); }
    });
    this.monster = null;
  }

  /* ---------------- crystals (float above the golem) ---------------- */

  spawnCluster(items: Array<{ id: number; value: string; golden?: boolean }>): void {
    this.clearCluster();
    const head = this.monsterHead();
    const toP = this.player.group.position.clone().sub(head).setY(0);
    if (toP.lengthSq() < 0.01) toP.set(0, 0, 1);
    toP.normalize();
    const perp = new THREE.Vector3(-toP.z, 0, toP.x);
    const n = items.length;
    items.forEach((it, i) => {
      const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2; // -1..1
      const hue = it.golden ? 0.13 : 0.5 + i * 0.12;
      const parts = makeCrystal(it.value, hue);
      if (it.golden) (parts.gem.material as THREE.MeshStandardMaterial).color.setHex(0xffd84d);
      parts.glow.scale.setScalar(it.golden ? 4.6 : 3.4);
      const base = head.clone()
        .addScaledVector(perp, off * 3.1)
        .addScaledVector(toP, 2.2)
        .add(new THREE.Vector3(0, 1.4 + Math.abs(off) * 0.3, 0));
      parts.group.position.copy(base);
      this.crystals.set(it.id, { id: it.id, parts, base, phase: Math.random() * 6, locked: false });
      this.scene.add(parts.group);
    });
  }

  clearCluster(): void {
    for (const c of this.crystals.values()) {
      this.scene.remove(c.parts.group);
      disposeCrystal(c.parts);
    }
    this.crystals.clear();
    this.aimedId = null;
  }

  shatter(id: number): void {
    const c = this.crystals.get(id);
    if (!c) return;
    this.burst(c.parts.group.position, 0xffe27a, 16);
    this.scene.remove(c.parts.group);
    disposeCrystal(c.parts);
    this.crystals.delete(id);
    if (this.aimedId === id) this.aimedId = null;
  }

  bounce(id: number): void {
    const c = this.crystals.get(id);
    if (!c) return;
    this.burst(c.parts.group.position, 0x8fd0ff, 8);
    c.locked = false;
  }

  dropCoin(): void {
    const p = this.player.group.position;
    this.dropCoinsAt(new THREE.Vector3(p.x + (Math.random() - 0.5) * 2, 1.1, p.z + (Math.random() - 0.5) * 2 - 1), 1);
  }

  private dropCoinsAt(pos: THREE.Vector3, n: number): void {
    for (let i = 0; i < n; i++) {
      const coin = makeCoin();
      coin.position.set(pos.x + (Math.random() - 0.5) * 2.4, 1.1, pos.z + (Math.random() - 0.5) * 2.4);
      this.coins.push({ mesh: coin, phase: Math.random() * 6 });
      this.scene.add(coin);
    }
  }

  private burst(at: THREE.Vector3, color: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const s = makeSpark(color);
      s.position.copy(at);
      const v = new THREE.Vector3((Math.random() - 0.5) * 9, Math.random() * 7 + 2, (Math.random() - 0.5) * 9);
      this.sparks.push({ mesh: s, v });
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
    this.stepMonster(dt, t);
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
    if (this.knock.lengthSq() > 0.01) {
      pos.addScaledVector(this.knock, dt);
      this.knock.multiplyScalar(0.86);
    }
    this.vy -= GRAVITY * dt;
    pos.y += this.vy * dt;
    if (pos.y <= 0) { pos.y = 0; this.vy = 0; this.grounded = true; }
    this.resolveCollisions(pos);
    this.player.step(dt, moving, t);
  }

  private resolveCollisions(pos: THREE.Vector3): void {
    const flat = Math.hypot(pos.x, pos.z);
    if (flat > WORLD_R) { pos.x = (pos.x / flat) * WORLD_R; pos.z = (pos.z / flat) * WORLD_R; }
    const blockers = [...this.obstacles];
    if (this.monster && !this.monster.dying) blockers.push({ x: this.monster.parts.group.position.x, z: this.monster.parts.group.position.z, r: 1.7 * this.monster.scale });
    for (const o of blockers) {
      const dx = pos.x - o.x, dz = pos.z - o.z;
      const d = Math.hypot(dx, dz);
      const min = o.r + 0.5;
      if (d < min && d > 0.001) { pos.x = o.x + (dx / d) * min; pos.z = o.z + (dz / d) * min; }
    }
  }

  private stepCamera(dt: number): void {
    const p = this.player.group.position;
    const horiz = Math.cos(this.camPitch) * CAM_DIST;
    const want = new THREE.Vector3(
      p.x + Math.sin(this.camYaw) * horiz,
      p.y + 1.3 + Math.sin(this.camPitch) * CAM_DIST,
      p.z + Math.cos(this.camYaw) * horiz,
    );
    this.camera.position.lerp(want, Math.min(1, dt * 6));
    if (this.shake > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake;
      this.shake *= 0.86;
    }
    this.camera.lookAt(p.x, p.y + 1.4, p.z);
  }

  private stepCompanion(dt: number, t: number): void {
    this.companion.position.lerp(this.companionHome, Math.min(1, dt * 1.8));
    this.companion.position.y = this.companionHome.y + Math.sin(t / 500) * 0.25;
    this.companion.lookAt(this.player.group.position.x, this.companion.position.y, this.player.group.position.z);
  }

  private stepMonster(dt: number, t: number): void {
    const m = this.monster;
    if (!m) return;
    const g = m.parts.group;
    if (m.dying > 0) {
      m.dying += dt;
      g.scale.multiplyScalar(1 - dt * 2.2);
      g.rotation.y += dt * 9;
      g.position.y += dt * 2;
      if (m.dying > 0.7) this.removeMonster();
      return;
    }
    m.phase += dt;
    // flash on flinch
    if (m.flinchT > 0) m.flinchT = Math.max(0, m.flinchT - dt);
    const flash = m.flinchT;
    for (const mesh of m.parts.skin) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissive.setRGB(flash * 1.2, flash * 0.2, flash * 0.2);
    }
    // creep toward the player, stopping a few steps away
    const toP = this.player.group.position.clone().sub(g.position).setY(0);
    const dist = toP.length();
    if (dist > 6.5) g.position.addScaledVector(toP.normalize(), dt * 1.3);
    g.position.y = Math.abs(Math.sin(t / 380 + m.phase)) * 0.14;
    g.rotation.y = Math.atan2(this.player.group.position.x - g.position.x, this.player.group.position.z - g.position.z);
  }

  private stepAim(): void {
    const p = this.player.group.position;
    const f = this.facing();
    let best: number | null = null;
    let bestDot = 0.4;
    for (const c of this.crystals.values()) {
      if (c.locked) continue;
      const to = c.parts.group.position.clone().sub(p).setY(0);
      if (to.length() > 30) continue;
      const dot = to.normalize().dot(f);
      if (dot > bestDot) { bestDot = dot; best = c.id; }
    }
    this.aimedId = best;
    for (const c of this.crystals.values()) {
      const mat = c.parts.ring.material as THREE.MeshBasicMaterial;
      mat.opacity += ((c.id === best ? 0.95 : 0) - mat.opacity) * 0.25;
    }
  }

  private stepCrystals(dt: number): void {
    for (const c of this.crystals.values()) {
      c.phase += dt;
      c.parts.group.position.y = c.base.y + Math.sin(c.phase * 1.6) * 0.22;
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
      if (Math.hypot(c.mesh.position.x - p.x, c.mesh.position.z - p.z) < PICKUP_R) {
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
    this.removeMonster();
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
