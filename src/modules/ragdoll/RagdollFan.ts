import * as CANNON from 'cannon-es';
import type { Prop } from './RagdollProps';

export function updateFans(props: Prop[], now: number, dt: number) {
  const ball = props.find(prop => prop.kind === 'ball');
  let boosted = false;
  for (const fan of props.filter(prop => prop.kind === 'fan')) {
    const blades = fan.mesh.getObjectByName('fan-blades');
    if (blades) blades.rotation.z -= dt * 9;
    if (!ball || now - fan.lastTrigger < 1200 || ball.body.velocity.z > -0.2) continue;
    const dx = ball.body.position.x - fan.body.position.x;
    const dz = ball.body.position.z - fan.body.position.z;
    if (Math.abs(dx) > 1.35 || dz > -0.4 || dz < -3.6 || ball.body.position.y > 2.5) continue;
    fan.lastTrigger = now;
    ball.body.wakeUp();
    ball.body.applyImpulse(new CANNON.Vec3(0, 0.2, -5.5));
    boosted = true;
  }
  return boosted;
}
