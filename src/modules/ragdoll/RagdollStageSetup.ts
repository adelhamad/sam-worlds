import type { CharacterKind } from './RagdollCharacter';
import type { ObjectKind } from './RagdollProps';

type CharacterSpawn = [CharacterKind, number, number];
type PropSpawn = [ObjectKind, number, number, number, boolean?];
interface Layout { characters: CharacterSpawn[]; props: PropSpawn[] }

export const stageLayouts: Layout[] = [
  { characters: [['classic', 1.7, 0.7]], props: [['ball', 0, 0.7, 0.6]] },
  { characters: [], props: [
    ['crate', -1.8, 0.6, -1.2, true],
    ['crate', -2.8, 0.6, -2.1, true], ['crate', -3.5, 0.6, -0.6, true],
  ] },
  { characters: [['pineapple', 1.2, 0.7]], props: [['launchpad', -1, 0.14, 0.1]] },
  { characters: [['pineapple', -2.4, 0], ['watermelon', 2.4, 0]], props: [] },
  { characters: [], props: [['ball', 0, 0.7, 0.6], ['bumper', -1.9, 0.22, -1.5], ['bumper', -3.3, 0.22, -2.7]] },
  { characters: [['red', -1.8, 0]], props: [['spikes', -3.6, 0.14, -1.5]] },
  { characters: [['pineapple', 2, 0.3], ['watermelon', 3.2, -0.8]], props: [
    ['ball', 0, 0.7, 0.6], ['launchpad', -4.2, 0.14, -1.4],
  ] },
];

export const freePlayLayout: Layout = {
  characters: [['classic', 0, 0], ['pineapple', -2.3, -0.4]],
  props: [
    ['ball', 2.1, 0.7, 0.5], ['crate', -2.5, 0.6, -2.5],
    ['bumper', 2.7, 0.22, -2.5], ['launchpad', -0.5, 0.14, -3],
  ],
};
