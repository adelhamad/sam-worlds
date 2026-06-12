// 3D Rubik's cube view (three.js): real cubelets, animated 90° layer turns,
// drag-to-orbit. Visual rotation direction comes from the SAME latticeCW
// helper the logic engine uses, so the picture can never disagree with the
// engine's idea of the cube.
import * as THREE from "three";
import { FACE_AXIS, FACE_COLORS, latticeCW, rotateVec, type Move, type Vec } from "../engine/cube";

const TURN_MS = 260;
const INNER = 0x101c38;
const AXIS_VEC: Record<number, THREE.Vector3> = {
  0: new THREE.Vector3(1, 0, 0),
  1: new THREE.Vector3(0, 1, 0),
  2: new THREE.Vector3(0, 0, 1),
};

interface Cubelet {
  mesh: THREE.Mesh;
  grid: Vec;
  /** Exact accumulated orientation (multiples of 90°). */
  quat: THREE.Quaternion;
}

function cubeletMaterials(grid: Vec, n: number): THREE.Material[] {
  const m = n - 1;
  const [x, y, z] = grid;
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z  →  R, L, U, D, F, B
  const faces = [x === m && "R", x === 0 && "L", y === m && "U", y === 0 && "D", z === m && "F", z === 0 && "B"] as const;
  return faces.map(
    (f) =>
      new THREE.MeshStandardMaterial({
        color: f ? new THREE.Color(FACE_COLORS[f]) : INNER,
        roughness: 0.35,
      }),
  );
}

export class CubeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private root = new THREE.Group();
  private cubelets: Cubelet[] = [];
  private n = 3;
  private raf = 0;
  private azimuth = 0.62;
  private polar = 1.05;
  private anim: { pivot: THREE.Group; axis: THREE.Vector3; target: number; t0: number; sel: Cubelet[]; move: Move; done?: () => void } | null = null;

  static create(host: HTMLElement): CubeScene {
    return new CubeScene(host);
  }

  private constructor(private host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(40, host.clientWidth / host.clientHeight, 0.1, 60);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(6, 9, 7);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8fb6ff, 0.5);
    fill.position.set(-6, -4, -7);
    this.scene.add(fill);
    this.scene.add(this.root);

    this.attachOrbit();
    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);

    const tick = (t: number) => {
      this.stepAnim(t);
      this.placeCamera();
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /** Drag anywhere on the canvas to orbit around the cube. */
  private attachOrbit(): void {
    let dragging = false;
    let lx = 0;
    let ly = 0;
    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", (e) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      this.azimuth -= (e.clientX - lx) * 0.008;
      this.polar = Math.max(0.4, Math.min(2.4, this.polar - (e.clientY - ly) * 0.006));
      lx = e.clientX;
      ly = e.clientY;
    });
    el.addEventListener("pointerup", () => (dragging = false));
    el.addEventListener("pointercancel", () => (dragging = false));
  }

  private placeCamera(): void {
    const dist = 2.4 + this.n * 1.55;
    this.camera.position.set(
      dist * Math.sin(this.polar) * Math.sin(this.azimuth),
      dist * Math.cos(this.polar),
      dist * Math.sin(this.polar) * Math.cos(this.azimuth),
    );
    this.camera.lookAt(0, 0, 0);
  }

  private onResize(): void {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private gridToWorld(grid: Vec): THREE.Vector3 {
    const off = (this.n - 1) / 2;
    return new THREE.Vector3(grid[0] - off, grid[1] - off, grid[2] - off);
  }

  /** Build a fresh SOLVED cube of side n. */
  setSize(n: number): void {
    this.n = n;
    for (const c of this.cubelets) {
      this.root.remove(c.mesh);
      c.mesh.geometry.dispose();
      (c.mesh.material as THREE.Material[]).forEach((mat) => mat.dispose());
    }
    this.cubelets = [];
    const geo = new THREE.BoxGeometry(0.94, 0.94, 0.94);
    const m = n - 1;
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        for (let z = 0; z < n; z++) {
          if (x > 0 && x < m && y > 0 && y < m && z > 0 && z < m) continue; // hidden core
          const grid: Vec = [x, y, z];
          const mesh = new THREE.Mesh(geo.clone(), cubeletMaterials(grid, n));
          mesh.position.copy(this.gridToWorld(grid));
          this.root.add(mesh);
          this.cubelets.push({ mesh, grid, quat: new THREE.Quaternion() });
        }
      }
    }
  }

  get busy(): boolean {
    return this.anim !== null;
  }

  /** Animate one face turn; resolves when the layer snaps into place. */
  turn(move: Move, opts?: { fast?: boolean; done?: () => void }): boolean {
    if (this.anim) return false;
    const { axis, dir } = FACE_AXIS[move.face];
    const layer = dir > 0 ? this.n - 1 : 0;
    const sel = this.cubelets.filter((c) => c.grid[axis] === layer);
    const pivot = new THREE.Group();
    this.root.add(pivot);
    for (const c of sel) pivot.attach(c.mesh);
    // lattice-CW (viewed from +axis) = NEGATIVE rotation about +axis
    const target = (latticeCW(move) ? -1 : 1) * (Math.PI / 2);
    this.anim = { pivot, axis: AXIS_VEC[axis], target, t0: performance.now() - (opts?.fast ? TURN_MS * 0.6 : 0), sel, move, done: opts?.done };
    return true;
  }

  private stepAnim(t: number): void {
    if (!this.anim) return;
    const a = this.anim;
    const p = Math.min(1, (t - a.t0) / TURN_MS);
    const ease = 1 - Math.pow(1 - p, 3);
    a.pivot.quaternion.setFromAxisAngle(a.axis, a.target * ease);
    if (p < 1) return;
    // snap: compute EXACT final transforms from the lattice, no float drift
    const { axis } = FACE_AXIS[a.move.face];
    const cw = latticeCW(a.move);
    const exact = new THREE.Quaternion().setFromAxisAngle(a.axis, a.target);
    for (const c of a.sel) {
      this.root.attach(c.mesh);
      c.grid = rotateVec(c.grid, axis, cw, this.n - 1);
      c.quat = exact.clone().multiply(c.quat);
      c.mesh.position.copy(this.gridToWorld(c.grid));
      c.mesh.quaternion.copy(c.quat);
    }
    this.root.remove(a.pivot);
    const done = a.done;
    this.anim = null;
    done?.();
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    for (const c of this.cubelets) {
      c.mesh.geometry.dispose();
      (c.mesh.material as THREE.Material[]).forEach((mat) => mat.dispose());
    }
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
