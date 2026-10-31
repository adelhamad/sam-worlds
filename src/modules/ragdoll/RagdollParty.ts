import * as CANNON from 'cannon-es';
import type { RagdollCharacter } from './RagdollCharacter';

export function applyPartyBlast(characters: RagdollCharacter[]) {
  for (const c of characters) for (const p of c.parts) {
    const b = p.body; b.wakeUp();
    b.applyImpulse(new CANNON.Vec3(b.position.x * 0.75, 3.8, b.position.z * 0.75));
  }
}
