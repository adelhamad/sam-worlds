// Star Ranger — the blocky meadow. Pure mesh factories (no game logic): a
// grassy planet floor, chunky low-poly trees, rocks, a pond, drifting clouds,
// a home flag bearing the ranger's name, distant hills, friendly critter NPCs
// and spinning star-coins. Everything is procedural (canvas textures + box/
// cone geometry) so there are NO new asset files to ship offline.
import * as THREE from "three";

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft cartoon face for an NPC critter (panda, fox…), always facing camera. */
export function faceTexture(emoji: string): THREE.CanvasTexture {
  return canvasTex(128, 128, (g) => {
    g.font = "96px Trebuchet MS, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(emoji, 64, 70);
  });
}

export function grassTexture(): THREE.CanvasTexture {
  const tex = canvasTex(256, 256, (g) => {
    g.fillStyle = "#76c043";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      const shades = ["#84ce4f", "#6bb23a", "#8fd95c", "#5fa432"];
      g.fillStyle = shades[i % shades.length];
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      g.fillRect(x, y, 2 + Math.random() * 3, 3 + Math.random() * 5);
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  return tex;
}

export function skyTexture(): THREE.CanvasTexture {
  return canvasTex(64, 256, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#3aa0ff");
    grad.addColorStop(0.55, "#8fd0ff");
    grad.addColorStop(1, "#dff3ff");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 256);
  });
}

const box = (w: number, h: number, d: number, color: number, opts: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts }));

/** A flat soft contact shadow disc to ground an object cheaply (no shadow maps). */
export function shadowBlob(radius: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 18),
    new THREE.MeshBasicMaterial({ color: 0x14331a, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  m.renderOrder = -1;
  return m;
}

const LEAF = [0x4fa83b, 0x3f9a44, 0x68c24a, 0x2f8f3a];

/** A chunky voxel tree: a stacked-cube canopy on a stubby trunk. */
export function makeTree(rng: () => number): THREE.Group {
  const g = new THREE.Group();
  const h = 1.4 + rng() * 1.4;
  const trunk = box(0.7, h, 0.7, 0x8a5a2b);
  trunk.position.y = h / 2;
  const leafColor = LEAF[Math.floor(rng() * LEAF.length)];
  const s = 1.8 + rng() * 0.9;
  const c1 = box(s, s * 0.8, s, leafColor, { flatShading: true });
  c1.position.y = h + s * 0.32;
  const c2 = box(s * 0.7, s * 0.7, s * 0.7, leafColor, { flatShading: true });
  c2.position.set((rng() - 0.5) * 0.6, h + s * 0.85, (rng() - 0.5) * 0.6);
  g.add(shadowBlob(s * 0.7), trunk, c1, c2);
  return g;
}

/** A few stacked grey blocks — a friendly boulder. */
export function makeRock(rng: () => number): THREE.Group {
  const g = new THREE.Group();
  const s = 0.7 + rng() * 0.8;
  const base = new THREE.Mesh(
    new THREE.IcosahedronGeometry(s, 0),
    new THREE.MeshStandardMaterial({ color: 0x9aa3ab, flatShading: true, roughness: 1 }),
  );
  base.position.y = s * 0.7;
  base.rotation.set(rng(), rng(), rng());
  g.add(shadowBlob(s), base);
  return g;
}

/** A round pond with a lighter rim, sitting just above the grass. */
export function makePond(radius = 3): THREE.Group {
  const g = new THREE.Group();
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 32),
    new THREE.MeshStandardMaterial({ color: 0x35a7e0, emissive: 0x0d4f73, roughness: 0.25, metalness: 0.3, transparent: true, opacity: 0.92 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.05;
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(radius, radius + 0.4, 32),
    new THREE.MeshStandardMaterial({ color: 0xc7a36a, roughness: 1 }),
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.04;
  g.add(rim, water);
  return g;
}

/** A puffy cloud: a clump of white boxes. Drifts in the scene step. */
export function makeCloud(rng: () => number): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0x9fc6ff, emissiveIntensity: 0.15 });
  for (let i = 0; i < 4; i++) {
    const s = 1.4 + rng() * 1.6;
    const m = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.7, s), mat);
    m.position.set((rng() - 0.5) * 4, (rng() - 0.5) * 0.8, (rng() - 0.5) * 2.4);
    g.add(m);
  }
  return g;
}

/** Home flag: a pole + a waving cloth carrying the ranger's name. */
export function makeFlag(name: string): THREE.Group {
  const g = new THREE.Group();
  const pole = box(0.16, 5, 0.16, 0xcdd3da, { metalness: 0.4, roughness: 0.3 });
  pole.position.y = 2.5;
  const tex = canvasTex(256, 160, (c) => {
    c.fillStyle = "#ff5f6d";
    c.fillRect(0, 0, 256, 160);
    c.fillStyle = "#fff7e6";
    c.font = "900 64px Trebuchet MS, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(name.toUpperCase(), 128, 84);
  });
  const cloth = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.6),
    new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.7 }),
  );
  cloth.position.set(1.38, 4.0, 0);
  g.add(shadowBlob(0.7), pole, cloth);
  return g;
}

/** A low ring of distant hills around the play area for a horizon. */
export function makeHills(rng: () => number): THREE.Group {
  const g = new THREE.Group();
  const colors = [0x6bbf57, 0x57b07a, 0x7cc95f];
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const r = 52 + rng() * 10;
    const hs = 5 + rng() * 7;
    const hill = new THREE.Mesh(
      new THREE.ConeGeometry(6 + rng() * 5, hs, 5),
      new THREE.MeshStandardMaterial({ color: colors[i % colors.length], flatShading: true, roughness: 1 }),
    );
    hill.position.set(Math.cos(a) * r, hs / 2 - 1.5, Math.sin(a) * r);
    hill.rotation.y = rng() * Math.PI;
    g.add(hill);
  }
  return g;
}

/** A blocky critter NPC with an emoji face; bob/wander handled by the scene. */
export function makeNPC(emoji: string, color: number): THREE.Group {
  const g = new THREE.Group();
  const body = box(0.9, 0.9, 0.8, color, { roughness: 0.7 });
  body.position.y = 0.55;
  const head = box(0.8, 0.7, 0.7, color, { roughness: 0.7 });
  head.position.y = 1.3;
  const face = new THREE.Sprite(new THREE.SpriteMaterial({ map: faceTexture(emoji), transparent: true, depthTest: false }));
  face.scale.setScalar(0.7);
  face.position.set(0, 1.32, 0.42);
  for (const dx of [-0.32, 0.32]) {
    const foot = box(0.28, 0.3, 0.34, color, { roughness: 0.8 });
    foot.position.set(dx, 0.15, 0);
    g.add(foot);
  }
  g.add(shadowBlob(0.6), body, head, face);
  return g;
}

/** A spinning star-coin pickup (cosmetic reward drip). */
export function makeCoin(): THREE.Mesh {
  const coin = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.4, 0),
    new THREE.MeshStandardMaterial({ color: 0xffd84d, emissive: 0x8a6b13, emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.5 }),
  );
  coin.position.y = 1;
  return coin;
}

export const WORLD_R = 30;

const NPC_KINDS: Array<[string, number]> = [
  ["🐼", 0xf2f2f2], ["🦊", 0xe8884a], ["🐸", 0x7ec850], ["🐰", 0xe7d7c8], ["🐨", 0x9aa7b0], ["🐯", 0xf4b942],
];

export interface NPC { group: THREE.Group; phase: number; dir: number; speed: number; }
export interface Obstacle { x: number; z: number; r: number; }

/** Build the whole static meadow (lights, ground, hills, flag, props, NPCs,
 * clouds) and return the bits the scene needs to animate / collide against. */
export function buildMeadow(scene: THREE.Scene, name: string): { obstacles: Obstacle[]; npcs: NPC[]; clouds: THREE.Group[] } {
  scene.add(new THREE.HemisphereLight(0xcfeaff, 0x4f7a3a, 1.05));
  const sun = new THREE.DirectionalLight(0xfff4d6, 1.25);
  sun.position.set(14, 22, 8);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(WORLD_R + 8, 64),
    new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground, makeHills(Math.random));

  const flag = makeFlag(name);
  flag.position.set(0, 0, -6);
  scene.add(flag);

  const obstacles: Obstacle[] = [];
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 7 + Math.random() * (WORLD_R - 6);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const tree = Math.random() < 0.62;
    const obj = tree ? makeTree(Math.random) : makeRock(Math.random);
    obj.position.set(x, 0, z);
    scene.add(obj);
    obstacles.push({ x, z, r: tree ? 0.8 : 0.9 });
  }
  const pond = makePond(3.2);
  pond.position.set(-11, 0, 9);
  scene.add(pond);
  obstacles.push({ x: -11, z: 9, r: 3.4 });

  const npcs: NPC[] = [];
  for (let i = 0; i < 5; i++) {
    const [emoji, color] = NPC_KINDS[i % NPC_KINDS.length];
    const g = makeNPC(emoji, color);
    const a = Math.random() * Math.PI * 2;
    const r = 6 + Math.random() * 16;
    g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    scene.add(g);
    npcs.push({ group: g, phase: Math.random() * 10, dir: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 0.7 });
  }

  const clouds: THREE.Group[] = [];
  for (let i = 0; i < 7; i++) {
    const c = makeCloud(Math.random);
    c.position.set((Math.random() - 0.5) * 80, 16 + Math.random() * 8, (Math.random() - 0.5) * 80);
    clouds.push(c);
    scene.add(c);
  }
  return { obstacles, npcs, clouds };
}
