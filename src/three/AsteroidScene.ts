// Asteroid Arena's 3D world (three.js): numbered asteroids drift out of a deep
// nebula toward the player's cannon. React owns the math rules; the scene owns
// visuals + tap hit-testing, reporting taps and fly-bys via callbacks. Same
// imperative create()/methods/destroy() pattern as the other scenes.
import * as THREE from "three";

const SPAWN_Z = -60;
const PLAYER_Z = 7;

function numberTexture(label: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.font = "900 76px Trebuchet MS, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 8;
  g.strokeStyle = "rgba(6,15,36,0.9)";
  g.strokeText(label, 64, 70);
  g.fillStyle = "#fff7e6";
  g.fillText(label, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface Rock {
  id: number;
  group: THREE.Group;
  label: THREE.Sprite;
  tex: THREE.CanvasTexture;
  spin: THREE.Vector3;
  speed: number;
}

function makeStarfield(): THREE.Points {
  const count = 600;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 140;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 90;
    pos[i * 3 + 2] = -Math.random() * 140;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xbcd4ff, size: 0.32, sizeAttenuation: true }));
}

export class AsteroidScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private rocks: Rock[] = [];
  private burst: THREE.Mesh[] = [];
  private ray = new THREE.Raycaster();
  private raf = 0;
  private lastT = 0;
  private running = false;
  private shake = 0;
  private nextId = 1;
  speed = 9;
  onTap?: (id: number) => void;
  onExit?: (id: number, blasted: boolean) => void;

  static create(host: HTMLElement): AsteroidScene {
    return new AsteroidScene(host);
  }

  private constructor(private host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x070b1e);
    this.scene.fog = new THREE.Fog(0x070b1e, 35, 75);

    this.camera = new THREE.PerspectiveCamera(60, host.clientWidth / host.clientHeight, 0.1, 200);
    this.camera.position.set(0, 0, PLAYER_Z + 3);
    this.camera.lookAt(0, 0, -20);

    this.scene.add(new THREE.AmbientLight(0x9fb8ff, 0.8));
    const key = new THREE.PointLight(0xffd9a8, 1.5, 120);
    key.position.set(6, 8, 12);
    this.scene.add(key);
    const rim = new THREE.PointLight(0x7c5cff, 1.2, 120);
    rim.position.set(-10, -6, -10);
    this.scene.add(rim);
    this.scene.add(makeStarfield());

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

  /** Spawn one asteroid with a number; returns its id. */
  spawn(label: string): number {
    const id = this.nextId++;
    const group = new THREE.Group();
    const hue = 0.05 + Math.random() * 0.08;
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 0),
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hue, 0.5, 0.45), flatShading: true, roughness: 0.9 }),
    );
    const tex = numberTexture(label);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(2.2, 2.2, 1);
    sprite.position.z = 1.4;
    group.add(rock, sprite);
    group.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 9, SPAWN_Z);
    group.userData.id = id;
    this.scene.add(group);
    this.rocks.push({
      id, group, label: sprite, tex,
      spin: new THREE.Vector3(Math.random() * 0.8, Math.random() * 0.8, 0),
      speed: this.speed * (0.85 + Math.random() * 0.4),
    });
    return id;
  }

  /** Explode + remove an asteroid (a hit). Gold for good, red for a miss. */
  blast(id: number, color = 0xffd84d): void {
    const i = this.rocks.findIndex((r) => r.id === id);
    if (i < 0) return;
    const r = this.rocks[i];
    this.explode(r.group.position, color);
    this.removeRock(i);
    this.onExit?.(id, true);
  }

  shakeNow(): void {
    this.shake = 0.8;
  }

  private explode(at: THREE.Vector3, color: number): void {
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.28), new THREE.MeshBasicMaterial({ color }));
      m.position.copy(at);
      m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10);
      this.burst.push(m);
      this.scene.add(m);
    }
  }

  /** Pointer/tap → raycast asteroids, report the nearest hit. */
  tapAt(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.ray.setFromCamera(ndc, this.camera);
    const hits = this.ray.intersectObjects(this.rocks.map((r) => r.group), true);
    if (!hits.length) return;
    let obj: THREE.Object3D | null = hits[0].object;
    while (obj && obj.userData.id === undefined) obj = obj.parent;
    if (obj) this.onTap?.(obj.userData.id as number);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastT = performance.now();
    const tick = (t: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (t - this.lastT) / 1000);
      this.lastT = t;
      this.step(dt);
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private step(dt: number): void {
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      r.group.position.z += dt * r.speed;
      r.group.rotation.x += r.spin.x * dt;
      r.group.rotation.y += r.spin.y * dt;
      if (r.group.position.z > PLAYER_Z) {
        const id = r.id;
        this.removeRock(i);
        this.onExit?.(id, false);
      }
    }
    this.moveBurst(dt);
    if (this.shake > 0.01) {
      this.shake *= 0.85;
      this.camera.position.x = (Math.random() - 0.5) * this.shake;
      this.camera.position.y = (Math.random() - 0.5) * this.shake;
    } else {
      this.camera.position.x = 0;
      this.camera.position.y = 0;
    }
  }

  private moveBurst(dt: number): void {
    for (let i = this.burst.length - 1; i >= 0; i--) {
      const m = this.burst[i];
      const v = m.userData.v as THREE.Vector3;
      m.position.addScaledVector(v, dt);
      m.rotation.x += dt * 10;
      m.scale.multiplyScalar(1 - dt * 1.4);
      if (m.scale.x < 0.1) {
        this.scene.remove(m);
        m.geometry.dispose();
        this.burst.splice(i, 1);
      }
    }
  }

  private removeRock(i: number): void {
    const r = this.rocks[i];
    this.scene.remove(r.group);
    r.tex.dispose();
    r.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.rocks.splice(i, 1);
  }

  clearRocks(): void {
    for (let i = this.rocks.length - 1; i >= 0; i--) this.removeRock(i);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy(): void {
    this.stop();
    window.removeEventListener("resize", this.onResize);
    this.clearRocks();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
