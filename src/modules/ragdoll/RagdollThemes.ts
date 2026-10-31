import * as THREE from 'three';

const palettes = [
  { ground: 0xf4dda7, rim: 0x55b8b3, sky: 0xaee5f8 }, // beach
  { ground: 0xf1d7dc, rim: 0xc398b7, sky: 0xe9d1eb }, // blossom grove
  { ground: 0xd9edf3, rim: 0x84bfdb, sky: 0xc4e4fb }, // ice
  { ground: 0xc6e3b0, rim: 0x70b789, sky: 0xb9e5ee }, // orchard
  { ground: 0xbfa7a0, rim: 0xe17e66, sky: 0xf3c4a6 }, // volcano
  { ground: 0xf0c996, rim: 0xd49b71, sky: 0xf8d7b5 }, // canyon
  { ground: 0xd8d4f1, rim: 0xa284ca, sky: 0xd8d8fa }, // festival
] as const;

const paint = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
function add(group: THREE.Group, geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(geometry, paint(color));
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  group.add(mesh); return mesh;
}
function tree(group: THREE.Group, x: number, z: number, blossom: boolean, fruit: boolean) {
  add(group, new THREE.CylinderGeometry(0.16, 0.27, 2.1, 9), 0x956143, x, 1.05, z);
  const crown = add(group, new THREE.SphereGeometry(1.17, 14, 9), blossom ? 0xf3a5be : 0x59b375, x, 2.35, z);
  crown.scale.set(1.2, 0.85, 1);
  if (fruit) for (const [dx, dy, dz] of [[-0.7, 0.1, 0.5], [0.55, 0.35, 0.55], [0.15, -0.45, -0.7]])
    add(group, new THREE.SphereGeometry(0.2, 10, 8), 0xf57956, x + dx, 2.35 + dy, z + dz);
}
function palm(group: THREE.Group, x: number, z: number) {
  const trunk = add(group, new THREE.CylinderGeometry(0.12, 0.24, 3.3, 9), 0xa9744a, x, 1.65, z);
  trunk.rotation.z = -0.13;
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    const leaf = add(group, new THREE.SphereGeometry(0.7, 10, 6), 0x47ad72,
      x + Math.cos(a) * 0.9, 3.26, z + Math.sin(a) * 0.9);
    leaf.scale.set(1.5, 0.17, 0.45); leaf.rotation.y = -a;
  }
}
function ice(group: THREE.Group, x: number, z: number) {
  add(group, new THREE.ConeGeometry(0.93, 3.6, 5), 0xe7f9ff, x, 1.8, z);
  add(group, new THREE.ConeGeometry(0.69, 2.3, 5), 0x82c9e6, x + 1.05, 1.15, z - 0.35);
}
function volcano(group: THREE.Group, x: number, z: number) {
  add(group, new THREE.ConeGeometry(1.4, 3.3, 7), 0x645f6a, x, 1.65, z);
  add(group, new THREE.ConeGeometry(0.33, 0.65, 7), 0xff8b53, x, 3.4, z);
  for (const dx of [-1.2, 1.35]) add(group, new THREE.IcosahedronGeometry(0.48, 0), 0x8d7185, x + dx, 0.38, z + 0.4);
}
function canyon(group: THREE.Group, x: number, z: number) {
  add(group, new THREE.CylinderGeometry(0.64, 0.92, 2.4, 7), 0xd59a70, x, 1.2, z);
  add(group, new THREE.CylinderGeometry(0.87, 0.76, 0.3, 7), 0xe7b180, x, 2.5, z);
  add(group, new THREE.CylinderGeometry(0.12, 0.15, 1.5, 8), 0x5ca274, x + 1.3, 0.75, z + 0.4);
  add(group, new THREE.SphereGeometry(0.27, 8, 6), 0x5ca274, x + 1.3, 1.55, z + 0.4);
}
function festival(group: THREE.Group, x: number, z: number) {
  for (let i = 0; i < 4; i++) {
    const column = add(group, new THREE.CylinderGeometry(0.28, 0.36, 1.1 + i * 0.35, 8),
      [0x69c9c4, 0xf59caf, 0xffcf67, 0xa98bd7][i], x + i * 0.65, 0.55 + i * 0.175, z);
    column.rotation.z = (i - 1.5) * 0.08;
  }
}

function makeLandmarks(index: number) {
  const group = new THREE.Group();
  for (const x of [-10, 4.5]) {
    const z = x < 0 ? -7 : -8;
    if (index === 0) palm(group, x, z);
    else if (index === 1) tree(group, x, z, true, false);
    else if (index === 2) ice(group, x, z);
    else if (index === 3) tree(group, x, z, false, true);
    else if (index === 4) volcano(group, x, z);
    else if (index === 5) canyon(group, x, z);
    else festival(group, x, z);
  }
  return group;
}

export function createStageThemes(scene: THREE.Scene, ground: THREE.MeshStandardMaterial, rim: THREE.MeshStandardMaterial) {
  const groups = palettes.map((_, index) => {
    const group = makeLandmarks(index); scene.add(group); return group;
  });
  const setTheme = (index: number) => {
    const palette = palettes[index] ?? palettes[0];
    ground.color.setHex(palette.ground); rim.color.setHex(palette.rim);
    scene.background = new THREE.Color(palette.sky);
    if (scene.fog instanceof THREE.Fog) scene.fog.color.setHex(palette.sky);
    groups.forEach((group, groupIndex) => { group.visible = groupIndex === index; });
  };
  setTheme(0);
  return setTheme;
}
