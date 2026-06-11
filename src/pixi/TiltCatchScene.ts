import { Application, Container, Graphics, Text } from "pixi.js";

const CYAN = 0x22d3ee;
const AMBER = 0xffb454;
const NIGHT = 0x0b1b3a;

interface Falling {
  root: Container;
  vy: number;
  value: string;
  correct: boolean;
  dead: boolean;
}

interface Particle {
  g: Graphics;
  vx: number;
  vy: number;
  life: number;
}

/**
 * Comet Catch: tilt (or drag) to steer the ship and catch the comets whose
 * expression matches the target number.
 */
export class TiltCatchScene {
  private app: Application;
  private ship!: Container;
  private items: Falling[] = [];
  private particles: Particle[] = [];
  private shipX = 0;
  private steerInput = 0; // -1..1 (tilt)
  private absTarget: number | null = null; // 0..1 (touch fallback)
  private running = false;
  private t = 0;
  private destroyed = false;
  onCatch?: (correct: boolean, label: string) => void;

  private constructor(app: Application) {
    this.app = app;
  }

  static async create(host: HTMLElement): Promise<TiltCatchScene> {
    const app = new Application();
    await app.init({ background: NIGHT, resizeTo: host, antialias: true });
    host.appendChild(app.canvas);
    const scene = new TiltCatchScene(app);
    scene.build();
    app.ticker.add(() => scene.tick(app.ticker.deltaMS / 1000));
    return scene;
  }

  private build(): void {
    for (let i = 0; i < 50; i++) {
      const g = new Graphics().circle(0, 0, Math.random() * 1.6 + 0.4).fill(0xffffff);
      g.x = Math.random() * 2000;
      g.y = Math.random() * 1400;
      g.alpha = 0.25 + Math.random() * 0.5;
      this.app.stage.addChild(g);
    }
    const ship = new Container();
    const net = new Graphics()
      .moveTo(-44, -26)
      .lineTo(-30, 10)
      .lineTo(30, 10)
      .lineTo(44, -26)
      .stroke({ width: 5, color: CYAN, alpha: 0.9 })
      .moveTo(-30, 10)
      .lineTo(30, 10)
      .stroke({ width: 5, color: CYAN, alpha: 0.9 });
    const body = new Graphics().ellipse(0, 22, 30, 13).fill(0xe8edf7).circle(0, 18, 6).fill(AMBER);
    ship.addChild(net, body);
    this.app.stage.addChild(ship);
    this.ship = ship;
    this.shipX = this.app.renderer.width / 2;
  }

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
    for (const it of this.items) it.root.destroy();
    this.items = [];
  }

  /** Tilt steering, -1 (full left) .. 1 (full right). */
  steer(norm: number): void {
    this.steerInput = Math.max(-1, Math.min(1, norm));
    this.absTarget = null;
  }

  /** Touch/mouse fallback: absolute x position, 0..1. */
  setXNorm(p: number): void {
    this.absTarget = Math.max(0, Math.min(1, p));
  }

  spawn(label: string, correct: boolean): void {
    if (!this.running || this.destroyed) return;
    const root = new Container();
    const ball = new Graphics().circle(0, 0, 34).fill({ color: 0x1d3460 }).stroke({
      width: 3,
      color: AMBER,
      alpha: 0.9,
    });
    const tail = new Graphics()
      .poly([-10, -30, 10, -30, 0, -58])
      .fill({ color: AMBER, alpha: 0.5 });
    const txt = new Text({
      text: label,
      style: { fill: 0xeaf0ff, fontSize: 20, fontWeight: "900", fontFamily: "Trebuchet MS" },
    });
    txt.anchor.set(0.5);
    root.addChild(tail, ball, txt);
    const w = this.app.renderer.width;
    root.x = 60 + Math.random() * (w - 120);
    root.y = -60;
    this.app.stage.addChild(root);
    this.items.push({ root, vy: 95 + Math.random() * 70, value: label, correct, dead: false });
  }

  private burst(x: number, y: number, color: number): void {
    for (let i = 0; i < 14; i++) {
      const g = new Graphics().circle(0, 0, 2 + Math.random() * 3).fill(color);
      g.x = x;
      g.y = y;
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 140;
      this.app.stage.addChild(g);
      this.particles.push({ g, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.8 });
    }
  }

  private tick(dt: number): void {
    if (this.destroyed) return;
    this.t += dt;
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    const shipY = h - 86;

    // steering: tilt = velocity, touch = follow
    if (this.absTarget !== null) {
      const target = 50 + this.absTarget * (w - 100);
      this.shipX += (target - this.shipX) * Math.min(1, dt * 10);
    } else {
      this.shipX += this.steerInput * 560 * dt;
    }
    this.shipX = Math.max(50, Math.min(w - 50, this.shipX));
    this.ship.x = this.shipX;
    this.ship.y = shipY + Math.sin(this.t * 2.4) * 4;
    this.ship.rotation = (this.absTarget === null ? this.steerInput : 0) * 0.25;

    for (const it of this.items) {
      if (it.dead) continue;
      it.root.y += it.vy * dt;
      it.root.rotation = Math.sin(this.t * 2 + it.root.x) * 0.08;
      const dx = Math.abs(it.root.x - this.shipX);
      const dy = Math.abs(it.root.y - (shipY - 10));
      if (dx < 64 && dy < 36) {
        it.dead = true;
        this.burst(it.root.x, it.root.y, it.correct ? CYAN : AMBER);
        it.root.destroy();
        this.onCatch?.(it.correct, it.value);
      } else if (it.root.y > h + 70) {
        it.dead = true;
        it.root.destroy();
      }
    }
    this.items = this.items.filter((i) => !i.dead);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.g.x += p.vx * dt;
      p.g.y += p.vy * dt;
      p.vy += 140 * dt;
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
