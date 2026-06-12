// Word Surfer's 3D world (three.js): a neon star-road with word/letter gates
// rushing toward a hover-surfer, plus bonus star pickups between gates.
// Same imperative pattern as the Pixi scenes: create(host) → methods →
// destroy(). React owns the game rules.
import * as THREE from "three";

const LANE_X = [-2.4, 0, 2.4];
const SPAWN_Z = -70;
const RUNNER_Z = 0;
const STAR_Z = SPAWN_Z / 2;

function labelTexture(label: string, color: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(6, 15, 36, 0.88)";
  g.beginPath();
  g.roundRect(4, 4, 248, 120, 26);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.25)";
  g.lineWidth = 4;
  g.stroke();
  const size = label.length <= 1 ? 92 : Math.min(72, 320 / label.length);
  g.font = `900 ${size}px Trebuchet MS, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = color;
  g.fillText(label, 128, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roadTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0a1c3f";
  g.fillRect(0, 0, 256, 512);
  g.strokeStyle = "rgba(120, 160, 255, 0.55)";
  g.lineWidth = 5;
  g.setLineDash([26, 30]);
  for (const x of [85, 171]) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 512);
    g.stroke();
  }
  g.setLineDash([]);
  g.strokeStyle = "rgba(34, 211, 238, 0.8)";
  g.lineWidth = 10;
  for (const x of [5, 251]) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 512);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 10);
  return tex;
}

function makeStarfield(): THREE.Points {
  const count = 400;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 120;
    pos[i * 3 + 1] = Math.random() * 50 + 2;
    pos[i * 3 + 2] = -Math.random() * 160;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xbcd4ff, size: 0.35, sizeAttenuation: true }));
}

function makeSurfer(): THREE.Group {
  const surfer = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.18, 2.6),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e7c94, roughness: 0.3 }),
  );
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 0.7, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xffb454, roughness: 0.5 }),
  );
  body.position.y = 0.95;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffe3b3, roughness: 0.6 }),
  );
  head.position.y = 1.85;
  surfer.add(board, body, head);
  return surfer;
}

function makeStarPickup(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.MeshStandardMaterial({ color: 0xffd84d, emissive: 0x8a6b13, roughness: 0.25 }),
  );
}

export class WordSurfScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private surfer: THREE.Group;
  private roadTex: THREE.CanvasTexture;
  private row: THREE.Group | null = null;
  private star: THREE.Mesh | null = null;
  private starLane = 0;
  private rowTextures: THREE.CanvasTexture[] = [];
  private burst: THREE.Mesh[] = [];
  private raf = 0;
  private lastT = 0;
  private running = false;
  private laneX = 0;
  private shake = 0;
  /** Units per second the gates travel. */
  speed = 16;
  onArrive?: () => void;
  /** Fired when a bonus star crosses the runner; arg = was it collected? */
  onStar?: (collected: boolean) => void;

  static create(host: HTMLElement): WordSurfScene {
    return new WordSurfScene(host);
  }

  private constructor(private host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(this.renderer.domElement);

    this.scene.fog = new THREE.Fog(0x060f24, 30, 95);
    this.scene.background = new THREE.Color(0x060f24);

    this.camera = new THREE.PerspectiveCamera(62, host.clientWidth / host.clientHeight, 0.1, 220);
    this.camera.position.set(0, 4.6, 8.5);
    this.camera.lookAt(0, 1.2, -16);

    this.scene.add(new THREE.AmbientLight(0xa8c0ff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(4, 12, 6);
    this.scene.add(sun);

    this.roadTex = roadTexture();
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 200),
      new THREE.MeshStandardMaterial({ map: this.roadTex, roughness: 0.85 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.z = -70;
    this.scene.add(road);

    this.scene.add(makeStarfield());
    this.surfer = makeSurfer();
    this.surfer.position.set(0, 0.4, RUNNER_Z);
    this.scene.add(this.surfer);

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

  setLane(lane: number): void {
    this.laneX = LANE_X[Math.max(0, Math.min(2, lane))];
  }

  /** Raise a fresh gate row (ring color = zone color) + a bonus star. */
  spawnRow(labels: string[], ringColor: number, starLane: number): void {
    this.clearRow();
    const row = new THREE.Group();
    labels.forEach((label, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.14, 10, 28),
        new THREE.MeshStandardMaterial({ color: ringColor, emissive: ringColor, emissiveIntensity: 0.35, roughness: 0.35 }),
      );
      const tex = labelTexture(label, "#ffe9c4");
      this.rowTextures.push(tex);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      const gate = new THREE.Group();
      gate.add(ring, plate);
      gate.position.set(LANE_X[i], 1.5, 0);
      row.add(gate);
    });
    row.position.z = SPAWN_Z;
    this.row = row;
    this.scene.add(row);

    this.starLane = starLane;
    this.star = makeStarPickup();
    this.star.position.set(LANE_X[starLane], 1.2, STAR_Z);
    this.scene.add(this.star);
  }

  flashWrong(): void {
    this.shake = 0.6;
  }

  /** Confetti-ish pop at the runner when something good happens. */
  celebrate(color = 0xffd84d): void {
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.16),
        new THREE.MeshBasicMaterial({ color }),
      );
      m.position.copy(this.surfer.position);
      m.position.y += 1.2;
      m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 9, Math.random() * 7 + 3, (Math.random() - 0.5) * 5);
      this.burst.push(m);
      this.scene.add(m);
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastT = performance.now();
    const tick = (t: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (t - this.lastT) / 1000);
      this.lastT = t;
      this.step(dt, t);
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private step(dt: number, t: number): void {
    // glide to the chosen lane + hover bob + lean into the turn
    this.surfer.position.x += (this.laneX - this.surfer.position.x) * Math.min(1, dt * 14);
    this.surfer.position.y = 0.4 + Math.sin(t / 280) * 0.12;
    this.surfer.rotation.z = (this.laneX - this.surfer.position.x) * -0.18;
    this.roadTex.offset.y -= dt * this.speed * 0.05;
    this.moveRow(dt, t);
    this.moveBurst(dt);
    if (this.shake > 0.01) {
      this.shake *= 0.86;
      this.camera.position.x = (Math.random() - 0.5) * this.shake;
    } else {
      this.camera.position.x = 0;
    }
  }

  private moveRow(dt: number, t: number): void {
    if (this.star) {
      this.star.rotation.y = t / 250;
      this.star.position.z += dt * this.speed;
      if (this.star.position.z >= RUNNER_Z) {
        const collected = Math.abs(LANE_X[this.starLane] - this.surfer.position.x) < 1.2;
        const star = this.star;
        this.star = null;
        this.scene.remove(star);
        star.geometry.dispose();
        this.onStar?.(collected);
      }
    }
    if (this.row) {
      this.row.position.z += dt * this.speed;
      if (this.row.position.z >= RUNNER_Z) this.onArrive?.();
    }
  }

  private moveBurst(dt: number): void {
    for (let i = this.burst.length - 1; i >= 0; i--) {
      const m = this.burst[i];
      const v = m.userData.v as THREE.Vector3;
      v.y -= 22 * dt;
      m.position.addScaledVector(v, dt);
      m.rotation.x += dt * 9;
      m.rotation.y += dt * 7;
      if (m.position.y < -2) {
        this.scene.remove(m);
        m.geometry.dispose();
        this.burst.splice(i, 1);
      }
    }
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private clearRow(): void {
    if (this.row) {
      this.scene.remove(this.row);
      this.row = null;
    }
    if (this.star) {
      this.scene.remove(this.star);
      this.star.geometry.dispose();
      this.star = null;
    }
    for (const tex of this.rowTextures) tex.dispose();
    this.rowTextures = [];
  }

  destroy(): void {
    this.stop();
    window.removeEventListener("resize", this.onResize);
    this.clearRow();
    this.roadTex.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
