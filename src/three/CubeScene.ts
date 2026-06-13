// 3D Rubik's cube view (three.js): real cubelets, animated 90° layer turns,
// drag-to-orbit. Visual rotation direction comes from the SAME latticeCW
// helper the logic engine uses, so the picture can never disagree with the
// engine's idea of the cube.
import * as THREE from "three";
import { FACE_AXIS, FACE_COLORS, FACES, latticeCW, layersFor, projectToGrid, rotateVec, type Face, type Move, type Vec } from "../engine/cube";

const TURN_MS = 260;
const INNER = 0x101c38;
const BLANK = 0x2a3550; // unpainted sticker
/** BoxGeometry material order +x,-x,+y,-y,+z,-z → face letters. */
const MAT_FACE: Face[] = ["R", "L", "U", "D", "F", "B"];

/** A sticker the player may paint: which cubelet face it lives on. */
export interface PaintSticker {
  grid: Vec;
  face: Face;
  color: Face | null; // null = blank
  locked: boolean;
}
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

const stickerKey = (grid: Vec, face: Face): string => `${grid[0]},${grid[1]},${grid[2]}|${face}`;

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

  private raycaster = new THREE.Raycaster();
  private painting = false;
  private paintColor: Face = "U";
  /** Paintable stickers keyed by `${x},${y},${z}|FACE`. */
  private paint = new Map<string, PaintSticker>();
  private onPaintChange?: (remaining: number) => void;

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

  /** Drag to orbit; a tap (while painting) paints the sticker under it. */
  private attachOrbit(): void {
    let dragging = false;
    let lx = 0;
    let ly = 0;
    let moved = 0; // total drag distance — distinguishes a tap from an orbit
    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", (e) => {
      dragging = true;
      moved = 0;
      lx = e.clientX;
      ly = e.clientY;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      moved += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly);
      this.azimuth -= (e.clientX - lx) * 0.008;
      this.polar = Math.max(0.4, Math.min(2.4, this.polar - (e.clientY - ly) * 0.006));
      lx = e.clientX;
      ly = e.clientY;
    });
    el.addEventListener("pointerup", (e) => {
      dragging = false;
      if (this.painting && moved < 8) this.paintAt(e.clientX, e.clientY);
    });
    el.addEventListener("pointercancel", () => (dragging = false));
  }

  /** Raycast a screen point to a sticker and paint it the current color. */
  private paintAt(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const meshes = this.cubelets.map((c) => c.mesh);
    const hit = this.raycaster.intersectObjects(meshes, false)[0];
    if (!hit || hit.face == null) return;
    const cub = this.cubelets.find((c) => c.mesh === hit.object);
    if (!cub) return;
    const face = MAT_FACE[Math.floor(hit.face.materialIndex)];
    const k = stickerKey(cub.grid, face);
    const st = this.paint.get(k);
    if (!st || st.locked) return;
    st.color = this.paintColor;
    (cub.mesh.material as THREE.MeshStandardMaterial[])[hit.face.materialIndex].color.set(FACE_COLORS[this.paintColor]);
    this.onPaintChange?.(this.remainingBlanks());
  }

  private remainingBlanks(): number {
    let n = 0;
    for (const st of this.paint.values()) if (!st.color) n++;
    return n;
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

  /**
   * Enter paint mode: rebuild a size-n cube with every visible sticker blank,
   * except `locked` reference stickers (centers / a fixed corner). `onChange`
   * reports how many stickers are still blank after each tap.
   */
  enterPaint(n: number, locked: { grid: Vec; face: Face; color: Face }[], onChange: (remaining: number) => void): void {
    this.setSize(n);
    this.paint.clear();
    this.painting = true;
    this.onPaintChange = onChange;
    const lock = new Map(locked.map((l) => [stickerKey(l.grid, l.face), l.color] as const));
    const m = n - 1;
    for (const cub of this.cubelets) {
      const [x, y, z] = cub.grid;
      const visible: Partial<Record<Face, boolean>> = { R: x === m, L: x === 0, U: y === m, D: y === 0, F: z === m, B: z === 0 };
      for (const face of FACES) {
        if (!visible[face]) continue;
        const k = stickerKey(cub.grid, face);
        const lockedColor = lock.get(k) ?? null;
        this.paint.set(k, { grid: [...cub.grid] as Vec, face, color: lockedColor, locked: lockedColor !== null });
        const mat = (cub.mesh.material as THREE.MeshStandardMaterial[])[MAT_FACE.indexOf(face)];
        mat.color.set(lockedColor ? FACE_COLORS[lockedColor] : BLANK);
      }
    }
    onChange(this.remainingBlanks());
  }

  setPaintColor(face: Face): void {
    this.paintColor = face;
  }

  exitPaint(): void {
    this.painting = false;
  }

  /** Read the painted stickers back as per-face color grids (blanks → "U"). */
  getPaintedColors(n: number): Record<Face, Face[][]> {
    const m = n - 1;
    const grids = {} as Record<Face, Face[][]>;
    for (const f of FACES) grids[f] = Array.from({ length: n }, () => Array.from({ length: n }, () => "U" as Face));
    for (const st of this.paint.values()) {
      const [row, col] = projectToGrid(st.face, st.grid, m);
      grids[st.face][row][col] = st.color ?? "U";
    }
    return grids;
  }

  get busy(): boolean {
    return this.anim !== null;
  }

  /** Animate one face turn; resolves when the layer snaps into place. */
  turn(move: Move, opts?: { fast?: boolean; done?: () => void }): boolean {
    if (this.anim) return false;
    const { axis } = FACE_AXIS[move.face];
    const layers = new Set(layersFor(move, this.n));
    const sel = this.cubelets.filter((c) => layers.has(c.grid[axis]));
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
