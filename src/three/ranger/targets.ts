// Star Ranger — the things you zap. A numbered crystal (a glowing gem with a
// number that always faces the camera), the star-bolt projectile fired at it,
// and the sparkle burst it shatters into. Pure mesh factories; the scene owns
// movement, hit-testing and lifecycle.
import * as THREE from "three";

function numberTexture(label: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 160;
  const g = c.getContext("2d")!;
  g.font = "900 92px Trebuchet MS, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 12;
  g.strokeStyle = "rgba(10,20,45,0.92)";
  g.strokeText(label, 80, 86);
  g.fillStyle = "#ffffff";
  g.fillText(label, 80, 86);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, "rgba(180,240,255,0.9)");
  grad.addColorStop(1, "rgba(180,240,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface CrystalParts {
  group: THREE.Group;
  gem: THREE.Mesh;
  ring: THREE.Mesh;
  label: THREE.Sprite;
  glow: THREE.Sprite;
  tex: THREE.CanvasTexture;
}

const GLOW = glowTexture();

/** A floating gem showing `value`; `ring` lights up when it's the aimed target. */
export function makeCrystal(value: string, hue: number): CrystalParts {
  const group = new THREE.Group();
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.05, 0),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.7, 0.6),
      emissive: new THREE.Color().setHSL(hue, 0.8, 0.35),
      emissiveIntensity: 0.7,
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.92,
    }),
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.09, 10, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: 0 }),
  );
  ring.rotation.x = Math.PI / 2;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }));
  glow.scale.setScalar(3.4);
  const tex = numberTexture(value);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  label.scale.setScalar(1.5);
  label.position.z = 0.2;
  label.renderOrder = 10;
  group.add(glow, ring, gem, label);
  return { group, gem, ring, label, glow, tex };
}

/** A small glowing projectile bolt. */
export function makeBolt(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0x9af0ff }),
  );
}

/** A short-lived spark for shatter/zap bursts. */
export function makeSpark(color: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color }));
  return m;
}

export function disposeCrystal(c: CrystalParts): void {
  c.tex.dispose();
  c.group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
}
