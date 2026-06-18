// Turbo Tracks — the 3D orchestrator (three.js). On-rails driving: the road
// scrolls toward a third-person kart that the player steers between three
// lanes. Numbered answer-gates rush in; passing through the correct one fires
// onGate(lane). Rival karts are placed by their race lead. React owns the math
// + race rules; this is a dumb renderer.
import * as THREE from "three";
import { skyTexture, roadTexture, makeKart, makeRival, makeGate, makeRaceCoin, makeRoadsideTree, LANE_X } from "./build";

const SPAWN_Z = -95;
const KART_Z = 0;
const BASE_SPEED = 26;
const Z_PER_M = 1.2;

interface GateRow { group: THREE.Group; evaluated: boolean }
interface RaceCoin { mesh: THREE.Mesh; lane: number }
interface Rival { group: THREE.Group; lane: number; lead: number; shown: number }
interface Tree { group: THREE.Group; }

export class RacerScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private kart: THREE.Group;
  private flames: THREE.Mesh[] = [];
  private road: THREE.Mesh;
  private roadTex: THREE.CanvasTexture;
  private rivals: Rival[] = [];
  private trees: Tree[] = [];
  private gate: GateRow | null = null;
  private coins: RaceCoin[] = [];
  private lane = 1;
  private boostT = 0;
  private shake = 0;
  private raf = 0;
  private lastT = 0;
  private running = false;
  onGate?: (lane: number) => void;
  onCoin?: () => void;
  onTick?: (dt: number) => void;

  static create(host: HTMLElement, rivals: Array<{ color: number; emoji: string }>): RacerScene {
    return new RacerScene(host, rivals);
  }

  private constructor(private host: HTMLElement, rivalDefs: Array<{ color: number; emoji: string }>) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(this.renderer.domElement);

    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog(0x9fd0ff, 55, 100);
    this.camera = new THREE.PerspectiveCamera(64, host.clientWidth / host.clientHeight, 0.1, 220);
    this.camera.position.set(0, 5, 9);

    this.scene.add(new THREE.HemisphereLight(0xcfeaff, 0x6b7a3a, 1.1));
    const sun = new THREE.DirectionalLight(0xfff4d6, 1.2);
    sun.position.set(8, 18, 6);
    this.scene.add(sun);

    // ground grass + road
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x6cbf48, roughness: 1 }));
    grass.rotation.x = -Math.PI / 2; grass.position.y = -0.02;
    this.scene.add(grass);
    this.roadTex = roadTexture();
    this.road = new THREE.Mesh(new THREE.PlaneGeometry(11, 320), new THREE.MeshStandardMaterial({ map: this.roadTex, roughness: 0.9 }));
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.set(0, 0, -130);
    this.scene.add(this.road);

    this.kart = makeKart(0x22a0ff, "🏁");
    this.kart.position.set(0, 0, KART_Z);
    this.scene.add(this.kart);
    this.buildFlames();
    this.buildScenery();
    rivalDefs.forEach((r, i) => {
      const group = makeRival(r.color, r.emoji);
      group.visible = false;
      this.scene.add(group);
      this.rivals.push({ group, lane: i % LANE_X.length, lead: 0, shown: 0 });
    });

    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
  }

  private buildFlames(): void {
    for (const dx of [-0.5, 0.5]) {
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 1.2, 8),
        new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0 }),
      );
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(dx, 0.7, -1.9);
      this.flames.push(flame);
      this.kart.add(flame);
    }
  }

  private buildScenery(): void {
    for (let i = 0; i < 14; i++) {
      const t = makeRoadsideTree();
      const side = i % 2 ? 1 : -1;
      t.position.set(side * (7 + Math.random() * 4), 0, -i * 14 - Math.random() * 6);
      this.scene.add(t);
      this.trees.push({ group: t });
    }
  }

  private onResize(): void {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /* ---------------- public API ---------------- */

  setLane(lane: number): void {
    this.lane = Math.max(0, Math.min(LANE_X.length - 1, lane));
  }
  steer(dir: number): void {
    this.setLane(this.lane + (dir > 0 ? 1 : -1));
  }
  get currentLane(): number {
    return this.lane;
  }

  spawnGateRow(values: string[]): void {
    this.clearGate();
    const group = new THREE.Group();
    values.forEach((v, i) => {
      const gate = makeGate(v);
      gate.position.x = LANE_X[i];
      group.add(gate);
    });
    group.position.z = SPAWN_Z;
    this.gate = { group, evaluated: false };
    this.scene.add(group);
  }

  clearGate(): void {
    if (!this.gate) return;
    this.scene.remove(this.gate.group);
    this.gate.group.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); } });
    this.gate = null;
  }

  spawnCoin(lane: number): void {
    const mesh = makeRaceCoin();
    mesh.position.set(LANE_X[lane], 1, SPAWN_Z + 10);
    this.coins.push({ mesh, lane });
    this.scene.add(mesh);
  }

  boost(): void {
    this.boostT = 0.9;
  }
  bump(): void {
    this.shake = 0.6;
  }

  /** Set each rival's race lead (metres ahead of the player). */
  setRivalLead(leads: number[]): void {
    leads.forEach((l, i) => { if (this.rivals[i]) this.rivals[i].lead = l; });
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
    const speed = BASE_SPEED * (this.boostT > 0 ? 1.7 : 1);
    this.boostT = Math.max(0, this.boostT - dt);
    this.roadTex.offset.y -= dt * speed * 0.02;
    this.stepKart(dt, t);
    this.stepGate(dt, speed);
    this.stepCoins(dt, speed, t);
    this.stepTrees(dt, speed);
    this.stepRivals(dt);
    this.stepCamera(dt);
  }

  private stepKart(dt: number, t: number): void {
    const targetX = LANE_X[this.lane];
    this.kart.position.x += (targetX - this.kart.position.x) * Math.min(1, dt * 9);
    this.kart.rotation.z = (targetX - this.kart.position.x) * -0.12;
    this.kart.position.y = Math.sin(t / 120) * 0.03;
    const op = this.boostT > 0 ? 0.85 : 0;
    for (const f of this.flames) {
      (f.material as THREE.MeshBasicMaterial).opacity = op;
      f.scale.y = 1 + Math.sin(t / 40) * 0.3;
    }
  }

  private stepGate(dt: number, speed: number): void {
    const g = this.gate;
    if (!g) return;
    g.group.position.z += dt * speed;
    if (!g.evaluated && g.group.position.z >= KART_Z) {
      g.evaluated = true;
      this.onGate?.(this.lane);
    }
    if (g.group.position.z > KART_Z + 14) this.clearGate();
  }

  private stepCoins(dt: number, speed: number, t: number): void {
    const lx = LANE_X[this.lane];
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.mesh.position.z += dt * speed;
      c.mesh.rotation.y = t / 200;
      const collected = Math.abs(c.mesh.position.z - KART_Z) < 1.4 && Math.abs(LANE_X[c.lane] - lx) < 1.4;
      if (collected || c.mesh.position.z > KART_Z + 6) {
        if (collected) this.onCoin?.();
        this.scene.remove(c.mesh);
        c.mesh.geometry.dispose();
        (c.mesh.material as THREE.Material).dispose();
        this.coins.splice(i, 1);
      }
    }
  }

  private stepTrees(dt: number, speed: number): void {
    for (const tr of this.trees) {
      tr.group.position.z += dt * speed;
      if (tr.group.position.z > 12) tr.group.position.z -= 14 * this.trees.length / 2;
    }
  }

  private stepRivals(dt: number): void {
    for (const r of this.rivals) {
      r.shown += (r.lead - r.shown) * Math.min(1, dt * 2.5);
      const z = KART_Z - r.shown * Z_PER_M;
      r.group.position.set(LANE_X[r.lane], 0, z);
      r.group.visible = z < KART_Z + 4 && z > -90;
    }
  }

  private stepCamera(dt: number): void {
    const wantX = this.kart.position.x * 0.5;
    this.camera.position.x += (wantX - this.camera.position.x) * Math.min(1, dt * 5);
    let y = 5, zoff = 9;
    if (this.boostT > 0) { y = 4.4; zoff = 8.2; } // dip + pull in on boost
    this.camera.position.y += (y - this.camera.position.y) * Math.min(1, dt * 5);
    this.camera.position.z += (zoff - this.camera.position.z) * Math.min(1, dt * 5);
    if (this.shake > 0.01) { this.camera.position.x += (Math.random() - 0.5) * this.shake; this.shake *= 0.85; }
    this.camera.lookAt(this.kart.position.x * 0.4, 1.5, -18);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy(): void {
    this.stop();
    window.removeEventListener("resize", this.onResize);
    this.clearGate();
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
