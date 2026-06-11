import { Application, Container, Graphics } from "pixi.js";

const CYAN = 0x22d3ee;
const AMBER = 0xffb454;
const NIGHT = 0x0b1b3a;

interface Particle {
  g: Graphics;
  vx: number;
  vy: number;
  life: number;
}

interface Gate {
  root: Container;
  left: Graphics;
  right: Graphics;
  glow: Graphics;
  open: number; // 0 closed → 1 open
  opening: boolean;
}

/**
 * The shared "gate run" mechanic: a little ship flies down a corridor of
 * gates; each correct answer bursts a gate open and the ship advances.
 */
export class GateRunScene {
  private app: Application;
  private gates: Gate[] = [];
  private ship!: Container;
  private particles: Particle[] = [];
  private stars: { g: Graphics; phase: number }[] = [];
  private shipX = 0;
  private shipTargetX = 0;
  private shakeT = 0;
  private t = 0;
  private lastW = 0;
  private gateCount: number;
  private reducedMotion: boolean;
  private destroyed = false;

  private constructor(app: Application, gateCount: number, reducedMotion: boolean) {
    this.app = app;
    this.gateCount = gateCount;
    this.reducedMotion = reducedMotion;
  }

  static async create(host: HTMLElement, gateCount: number, reducedMotion: boolean): Promise<GateRunScene> {
    const app = new Application();
    await app.init({ background: NIGHT, resizeTo: host, antialias: true });
    host.appendChild(app.canvas);
    const scene = new GateRunScene(app, gateCount, reducedMotion);
    scene.build();
    app.ticker.add(() => scene.tick(app.ticker.deltaMS / 1000));
    return scene;
  }

  private build(): void {
    // starfield
    for (let i = 0; i < 60; i++) {
      const g = new Graphics().circle(0, 0, Math.random() * 1.6 + 0.4).fill(0xffffff);
      g.x = Math.random() * 2000;
      g.y = Math.random() * 1200;
      g.alpha = 0.3 + Math.random() * 0.5;
      this.app.stage.addChild(g);
      this.stars.push({ g, phase: Math.random() * Math.PI * 2 });
    }
    // gates
    for (let i = 0; i < this.gateCount; i++) {
      const root = new Container();
      const glow = new Graphics().circle(0, 0, 34).fill({ color: CYAN, alpha: 0.25 });
      glow.alpha = 0;
      const frame = new Graphics().roundRect(-26, -52, 52, 104, 10).stroke({ width: 4, color: AMBER, alpha: 0.9 });
      const left = new Graphics().roundRect(-22, -48, 21, 96, 6).fill({ color: 0x1d3460 }).stroke({ width: 2, color: AMBER, alpha: 0.5 });
      const right = new Graphics().roundRect(1, -48, 21, 96, 6).fill({ color: 0x1d3460 }).stroke({ width: 2, color: AMBER, alpha: 0.5 });
      root.addChild(glow, left, right, frame);
      this.app.stage.addChild(root);
      this.gates.push({ root, left, right, glow, open: 0, opening: false });
    }
    // ship — a friendly little rocket
    const ship = new Container();
    const body = new Graphics()
      .ellipse(0, 0, 26, 14)
      .fill(0xe8edf7)
      .circle(8, -2, 7)
      .fill({ color: CYAN, alpha: 0.9 });
    const fin = new Graphics()
      .poly([-22, -4, -34, -16, -20, -16])
      .fill(AMBER)
      .poly([-22, 4, -34, 16, -20, 16])
      .fill(AMBER);
    const flame = new Graphics().poly([-28, -5, -44, 0, -28, 5]).fill({ color: AMBER, alpha: 0.85 });
    ship.addChild(flame, fin, body);
    this.app.stage.addChild(ship);
    this.ship = ship;
    this.layout(true);
  }

  private gateX(i: number): number {
    const w = this.app.renderer.width;
    const pad = Math.min(140, w * 0.12);
    return pad + ((w - pad * 2) / Math.max(1, this.gateCount - 1)) * i;
  }

  private corridorY(): number {
    return this.app.renderer.height * 0.42;
  }

  private layout(initial = false): void {
    const y = this.corridorY();
    this.gates.forEach((gate, i) => {
      gate.root.x = this.gateX(i);
      gate.root.y = y;
    });
    if (initial) {
      this.shipX = this.gateX(0) - 70;
      this.shipTargetX = this.shipX;
    }
    this.ship.y = y;
    this.lastW = this.app.renderer.width;
  }

  /** Restore progress without animation (resume mid-puzzle). */
  setProgress(answeredCount: number): void {
    for (let i = 0; i < answeredCount && i < this.gates.length; i++) {
      this.gates[i].open = 1;
      this.applyOpen(this.gates[i]);
    }
    if (answeredCount > 0) {
      const i = Math.min(answeredCount, this.gates.length - 1);
      this.shipX = this.shipTargetX = this.gateX(i) - 70;
    }
  }

  /** Correct answer: burst the gate open and fly forward. */
  openGate(index: number): void {
    const gate = this.gates[index];
    if (!gate) return;
    gate.opening = true;
    gate.glow.alpha = 1;
    this.burst(gate.root.x, gate.root.y, 18);
    const nextI = Math.min(index + 1, this.gates.length - 1);
    this.shipTargetX = index >= this.gates.length - 1
      ? this.app.renderer.width + 80
      : this.gateX(nextI) - 70;
    if (this.reducedMotion) {
      gate.open = 1;
      this.applyOpen(gate);
      this.shipX = this.shipTargetX;
    }
  }

  wrongShake(): void {
    if (!this.reducedMotion) this.shakeT = 0.35;
  }

  celebrate(): void {
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    for (let i = 0; i < 5; i++) {
      this.burst(w * (0.2 + Math.random() * 0.6), h * (0.2 + Math.random() * 0.4), 14);
    }
  }

  private burst(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const g = new Graphics().circle(0, 0, 2 + Math.random() * 3).fill(Math.random() < 0.7 ? CYAN : 0xffffff);
      g.x = x;
      g.y = y;
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 160;
      this.app.stage.addChild(g);
      this.particles.push({ g, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.9 });
    }
  }

  private applyOpen(gate: Gate): void {
    gate.left.x = -gate.open * 26;
    gate.right.x = gate.open * 26;
    gate.left.alpha = 1 - gate.open * 0.7;
    gate.right.alpha = 1 - gate.open * 0.7;
  }

  private tick(dt: number): void {
    if (this.destroyed) return;
    this.t += dt;
    if (this.app.renderer.width !== this.lastW) this.layout();

    if (!this.reducedMotion) {
      for (const s of this.stars) s.g.alpha = 0.35 + 0.3 * Math.sin(this.t * 1.5 + s.phase);
    }
    for (const gate of this.gates) {
      if (gate.opening && gate.open < 1) {
        gate.open = Math.min(1, gate.open + dt * 3);
        this.applyOpen(gate);
      }
      if (gate.glow.alpha > 0) gate.glow.alpha = Math.max(0, gate.glow.alpha - dt * 1.5);
    }
    // ship movement + idle bob
    this.shipX += (this.shipTargetX - this.shipX) * Math.min(1, dt * 4);
    let offX = 0;
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      offX = Math.sin(this.shakeT * 60) * 6;
    }
    this.ship.x = this.shipX + offX;
    this.ship.y = this.corridorY() + (this.reducedMotion ? 0 : Math.sin(this.t * 2) * 6);
    // particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.g.x += p.vx * dt;
      p.g.y += p.vy * dt;
      p.vy += 120 * dt;
      p.g.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        p.g.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.app.destroy(true, { children: true });
  }
}
