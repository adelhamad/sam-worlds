// Pulse Pads' 3D world (three.js): six glowing pads on a dark reflective floor,
// floating in space. A sequence lights up; the player repeats it. React drives
// the game + sound; the scene owns the look, the glow pulses, and tap hit-tests.
import * as THREE from "three";

const PAD_COLORS = [0xff5a5a, 0xffb454, 0xffe14d, 0x4ade80, 0x22d3ee, 0xc084fc];
const COUNT = 6;

interface Pad {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  glow: number;
  base: THREE.Color;
}

function makeStarfield(): THREE.Points {
  const n = 400;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 80;
    pos[i * 3 + 1] = Math.random() * 30 + 4;
    pos[i * 3 + 2] = -Math.random() * 60 - 5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xbcd4ff, size: 0.25 }));
}

export class PulseScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private pads: Pad[] = [];
  private ray = new THREE.Raycaster();
  private raf = 0;
  private lastT = 0;
  private running = false;
  onTap?: (index: number) => void;

  static create(host: HTMLElement): PulseScene {
    return new PulseScene(host);
  }

  private constructor(private host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x060c1c);
    this.scene.fog = new THREE.Fog(0x060c1c, 18, 42);

    this.camera = new THREE.PerspectiveCamera(55, host.clientWidth / host.clientHeight, 0.1, 120);
    this.camera.position.set(0, 7.5, 10.5);
    this.camera.lookAt(0, 0.4, -0.5);

    this.scene.add(new THREE.AmbientLight(0x8aa0d8, 0.7));
    const top = new THREE.DirectionalLight(0xffffff, 0.8);
    top.position.set(0, 12, 6);
    this.scene.add(top);
    this.scene.add(makeStarfield());

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(11, 48),
      new THREE.MeshStandardMaterial({ color: 0x0c1838, roughness: 0.35, metalness: 0.6 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.2;
    this.scene.add(floor);

    this.buildPads();
    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
    this.renderer.render(this.scene, this.camera);
  }

  private buildPads(): void {
    const radius = 4.6;
    for (let i = 0; i < COUNT; i++) {
      const ang = Math.PI - (i / (COUNT - 1)) * Math.PI; // arc, left→right
      const base = new THREE.Color(PAD_COLORS[i]);
      const mat = new THREE.MeshStandardMaterial({ color: base, emissive: base, emissiveIntensity: 0.12, roughness: 0.4 });
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.5, 6), mat);
      mesh.position.set(Math.cos(ang) * radius, 0.1, -Math.sin(ang) * radius * 0.55);
      mesh.rotation.y = Math.PI / 6;
      mesh.userData.index = i;
      this.scene.add(mesh);
      this.pads.push({ mesh, mat, glow: 0, base });
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

  /** Flare a pad (during playback or on a tap). */
  pulse(index: number): void {
    const pad = this.pads[index];
    if (pad) pad.glow = 1;
  }

  tapAt(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.ray.setFromCamera(ndc, this.camera);
    const hits = this.ray.intersectObjects(this.pads.map((p) => p.mesh));
    if (hits.length) this.onTap?.(hits[0].object.userData.index as number);
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
    for (const pad of this.pads) {
      pad.glow = Math.max(0, pad.glow - dt * 2.4);
      pad.mat.emissiveIntensity = 0.12 + pad.glow * 1.5;
      const lift = pad.glow * 0.6;
      pad.mesh.position.y = 0.1 + lift;
      pad.mesh.rotation.z = Math.sin(t / 700 + pad.mesh.position.x) * 0.03;
    }
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy(): void {
    this.stop();
    window.removeEventListener("resize", this.onResize);
    this.pads.forEach((p) => {
      p.mesh.geometry.dispose();
      p.mat.dispose();
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
