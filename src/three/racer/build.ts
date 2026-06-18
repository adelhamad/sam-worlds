// Turbo Tracks — procedural mesh factories (no game logic): the kart, the
// scrolling 3-lane road, numbered answer-gate arches, rival karts, coins and
// roadside scenery. All canvas textures + boxes, so nothing new to ship.
import * as THREE from "three";

export const LANE_X = [-3, 0, 3];

function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeatY = 1): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeatY !== 1) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, repeatY); }
  return t;
}

export function skyTexture(): THREE.CanvasTexture {
  return tex(64, 256, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#2b6cff");
    grad.addColorStop(0.55, "#74b8ff");
    grad.addColorStop(1, "#ffe1b0");
    g.fillStyle = grad; g.fillRect(0, 0, 64, 256);
  });
}

export function roadTexture(): THREE.CanvasTexture {
  return tex(256, 256, (g) => {
    g.fillStyle = "#3a3f4b"; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#33384300";
    // edge lines
    g.fillStyle = "#ffd54a";
    g.fillRect(6, 0, 8, 256); g.fillRect(242, 0, 8, 256);
    // dashed lane dividers (3 lanes => 2 dividers at 1/3 and 2/3)
    g.fillStyle = "#eef2ff";
    for (const x of [85, 171]) for (let y = 0; y < 256; y += 64) g.fillRect(x - 3, y, 6, 34);
  }, 6);
}

const std = (color: number, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const boxMesh = (w: number, h: number, d: number, color: number, o?: THREE.MeshStandardMaterialParameters) =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(color, o));

function wheels(g: THREE.Group, halfW: number): void {
  for (const x of [-halfW, halfW]) for (const z of [-1.0, 1.0]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), std(0x1c1c22, { roughness: 0.9 }));
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.42, z);
    g.add(w);
  }
}

/** A blocky go-kart. `emoji` rides as the driver's face. */
export function makeKart(color: number, emoji: string): THREE.Group {
  const g = new THREE.Group();
  const body = boxMesh(1.7, 0.5, 2.8, color, { metalness: 0.3 });
  body.position.y = 0.75;
  const nose = boxMesh(1.3, 0.4, 0.9, color);
  nose.position.set(0, 0.7, 1.6);
  const seat = boxMesh(1.2, 0.7, 0.9, 0x222831);
  seat.position.set(0, 1.05, -0.5);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), std(0xffe0b5));
  head.position.set(0, 1.7, -0.4);
  const helmet = boxMesh(0.8, 0.4, 0.8, 0xffffff, { metalness: 0.2 });
  helmet.position.set(0, 1.95, -0.4);
  const face = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(64, 64, (c) => { c.font = "48px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(emoji, 32, 36); }), transparent: true, depthTest: false }));
  face.scale.setScalar(0.7); face.position.set(0, 1.72, 0.0);
  const spoiler = boxMesh(1.8, 0.5, 0.2, color);
  spoiler.position.set(0, 1.25, -1.5);
  wheels(g, 0.95);
  g.add(body, nose, seat, head, helmet, face, spoiler);
  return g;
}

export function makeRival(color: number, emoji: string): THREE.Group {
  return makeKart(color, emoji);
}

/** One numbered arch in a lane. */
export function makeGate(value: string): THREE.Group {
  const g = new THREE.Group();
  const postMat = std(0x2b6cff, { emissive: 0x16306b, emissiveIntensity: 0.4 });
  for (const x of [-1.3, 1.3]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.4), postMat);
    post.position.set(x, 2, 0);
    g.add(post);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 0.4), postMat);
  bar.position.y = 4;
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.4),
    new THREE.MeshBasicMaterial({ map: plateTexture(value), transparent: true }),
  );
  plate.position.set(0, 2.4, 0.25);
  g.add(bar, plate);
  return g;
}

function plateTexture(value: string): THREE.CanvasTexture {
  return tex(192, 128, (c) => {
    c.fillStyle = "#fffdf5";
    c.beginPath(); (c as CanvasRenderingContext2D).roundRect(6, 6, 180, 116, 22); c.fill();
    c.strokeStyle = "#2b6cff"; c.lineWidth = 8; c.stroke();
    c.fillStyle = "#13203f"; c.font = "900 84px Trebuchet MS, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(value, 96, 70);
  });
}

export function makeRaceCoin(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.TorusGeometry(0.4, 0.16, 10, 18),
    std(0xffd84d, { emissive: 0x8a6b13, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.25 }),
  );
}

export function makeRoadsideTree(): THREE.Group {
  const g = new THREE.Group();
  const trunk = boxMesh(0.5, 1.4, 0.5, 0x8a5a2b);
  trunk.position.y = 0.7;
  const top = boxMesh(1.8, 1.6, 1.8, 0x49a23c, { flatShading: true });
  top.position.y = 2.2;
  g.add(trunk, top);
  return g;
}
