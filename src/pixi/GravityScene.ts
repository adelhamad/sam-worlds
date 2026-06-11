import { Application, Container, Graphics, Text } from "pixi.js";

const CYAN = 0x22d3ee;
const AMBER = 0xffb454;
const NIGHT = 0x070f22;
const BODY_COLORS = [0xff8c42, 0x7c5cff, 0x3ddc97, 0xf4845f, 0x5cc8ff];

/** A celestial body. Fractional center (cx, cy); optional circular orbit. */
export interface Body {
  cx: number;
  cy: number;
  r: number; // px
  m: number; // gravity strength
  orbitRadius?: number; // fraction of view height
  omega?: number; // rad/s
  phase?: number;
}

export interface OrbitLevel {
  bodies: Body[];
  star: { cx: number; cy: number; orbitRadius?: number; omega?: number; phase?: number };
  start: { x: number; y: number };
}

export type OrbitOutcome = "rescued" | "crashed" | "lost";
export interface FlightStats {
  closePasses: number;
}

const STEP = 1 / 120;
const PREDICT_TIME = 3.2;

/**
 * Orbit Rescue: n-body gravity with MOVING bodies, a live predicted
 * trajectory while aiming, and mid-flight thruster boosts.
 */
export class GravityScene {
  private app: Application;
  private level!: OrbitLevel;
  private world = new Container();
  private bodySprites: Graphics[] = [];
  private starSprite!: Text;
  private parallax: { g: Graphics; depth: number }[] = [];
  private aimLine = new Graphics();
  private predictLine = new Graphics();
  private probe = new Graphics();
  private flame = new Graphics();
  private trail = new Container();
  private oldTrails = new Container();
  private pos = { x: 0, y: 0 };
  private vel = { x: 0, y: 0 };
  private simT = 0;
  private flying = false;
  private flightT = 0;
  private trailTick = 0;
  private shakeT = 0;
  private closeSet = new Set<number>();
  private stats: FlightStats = { closePasses: 0 };
  private destroyed = false;
  onResult?: (o: OrbitOutcome, stats: FlightStats) => void;
  onClosePass?: () => void;

  private constructor(app: Application) {
    this.app = app;
  }

  static async create(host: HTMLElement): Promise<GravityScene> {
    const app = new Application();
    await app.init({ background: NIGHT, antialias: true, resizeTo: host });
    host.appendChild(app.canvas);
    const scene = new GravityScene(app);
    scene.build();
    app.ticker.add(() => scene.tick(Math.min(0.033, app.ticker.deltaMS / 1000)));
    return scene;
  }

  private build(): void {
    // two-depth parallax starfield
    for (const depth of [0.35, 0.7]) {
      for (let i = 0; i < 40; i++) {
        const g = new Graphics().circle(0, 0, depth * (Math.random() * 1.8 + 0.6)).fill(0xffffff);
        g.x = Math.random() * 2400;
        g.y = Math.random() * 1500;
        g.alpha = 0.2 + 0.5 * depth * Math.random();
        this.app.stage.addChild(g);
        this.parallax.push({ g, depth });
      }
    }
    this.flame.poly([-14, -4, -26, 0, -14, 4]).fill({ color: AMBER, alpha: 0.9 });
    this.flame.visible = false;
    this.probe
      .circle(0, 0, 7)
      .fill(0xe8edf7)
      .circle(2, -2, 2.5)
      .fill(CYAN);
    this.starSprite = new Text({ text: "⭐", style: { fontSize: 36 } });
    this.starSprite.anchor.set(0.5);
    this.app.stage.addChild(this.oldTrails, this.world, this.trail, this.predictLine, this.aimLine, this.flame, this.probe, this.starSprite);
  }

  private px(f: number, axis: "x" | "y"): number {
    return f * (axis === "x" ? this.app.renderer.width : this.app.renderer.height);
  }

  /** Position of a body at sim time t (orbits are live). */
  private bodyPos(b: Body, t: number): { x: number; y: number } {
    let x = this.px(b.cx, "x");
    let y = this.px(b.cy, "y");
    if (b.orbitRadius && b.omega !== undefined) {
      const rad = b.orbitRadius * this.app.renderer.height;
      x += Math.cos((b.phase ?? 0) + b.omega * t) * rad;
      y += Math.sin((b.phase ?? 0) + b.omega * t) * rad;
    }
    return { x, y };
  }

  private starPos(t: number): { x: number; y: number } {
    return this.bodyPos({ ...this.level.star, r: 0, m: 0 }, t);
  }

  loadLevel(level: OrbitLevel): void {
    this.level = level;
    this.simT = 0;
    this.world.removeChildren().forEach((c) => c.destroy());
    this.oldTrails.removeChildren().forEach((c) => c.destroy());
    this.trail.removeChildren().forEach((c) => c.destroy());
    this.bodySprites = level.bodies.map((b, i) => {
      const color = BODY_COLORS[i % BODY_COLORS.length];
      const g = new Graphics()
        .circle(0, 0, b.r * 1.6)
        .fill({ color, alpha: 0.12 }) // atmosphere glow
        .circle(0, 0, b.r)
        .fill({ color })
        .circle(-b.r * 0.3, -b.r * 0.3, b.r * 0.55)
        .fill({ color: 0xffffff, alpha: 0.14 });
      this.world.addChild(g);
      return g;
    });
    this.resetProbe();
  }

  resetProbe(): void {
    this.flying = false;
    this.flame.visible = false;
    this.closeSet.clear();
    this.stats = { closePasses: 0 };
    this.pos = { x: this.px(this.level.start.x, "x"), y: this.px(this.level.start.y, "y") };
    this.probe.position.set(this.pos.x, this.pos.y);
    this.aimLine.clear();
    this.predictLine.clear();
  }

  private accelAt(x: number, y: number, t: number): { ax: number; ay: number; crashed: boolean } {
    let ax = 0;
    let ay = 0;
    for (const b of this.level.bodies) {
      const p = this.bodyPos(b, t);
      const dx = p.x - x;
      const dy = p.y - y;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2);
      if (d < b.r + 6) return { ax, ay, crashed: true };
      const a = b.m / Math.max(d2, 380);
      ax += (a * dx) / d;
      ay += (a * dy) / d;
    }
    return { ax, ay, crashed: false };
  }

  /** Live aim: arrow + predicted path through the (moving) gravity field. */
  aim(vx: number, vy: number): void {
    if (this.flying || !this.level) return;
    const len = Math.min(1, Math.hypot(vx, vy) / 560);
    this.aimLine
      .clear()
      .moveTo(this.pos.x, this.pos.y)
      .lineTo(this.pos.x + vx * 0.18, this.pos.y + vy * 0.18)
      .stroke({ width: 4, color: CYAN, alpha: 0.35 + 0.5 * len });

    // forward-simulate with the same integrator the flight uses
    this.predictLine.clear();
    let x = this.pos.x;
    let y = this.pos.y;
    let pvx = vx;
    let pvy = vy;
    let t = this.simT;
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    for (let i = 0; i < PREDICT_TIME / STEP; i++) {
      const { ax, ay, crashed } = this.accelAt(x, y, t);
      if (crashed) {
        this.predictLine.circle(x, y, 5).stroke({ width: 2, color: AMBER, alpha: 0.9 });
        break;
      }
      pvx += ax * STEP;
      pvy += ay * STEP;
      x += pvx * STEP;
      y += pvy * STEP;
      t += STEP;
      if (i % 10 === 0) {
        const fade = 1 - i / (PREDICT_TIME / STEP);
        this.predictLine.circle(x, y, 2).fill({ color: CYAN, alpha: 0.55 * fade });
      }
      if (x < -60 || x > w + 60 || y < -60 || y > h + 60) break;
    }
  }

  launch(vx: number, vy: number): boolean {
    if (this.flying) return false;
    while (this.trail.children.length) {
      const dot = this.trail.children[0];
      this.trail.removeChild(dot);
      dot.alpha *= 0.3;
      this.oldTrails.addChild(dot);
    }
    this.aimLine.clear();
    this.predictLine.clear();
    this.vel = { x: vx, y: vy };
    this.flightT = 0;
    this.flying = true;
    return true;
  }

  /** Mid-flight thruster burn toward a screen point. */
  boost(towardX: number, towardY: number, impulse = 150): boolean {
    if (!this.flying) return false;
    const dx = towardX - this.pos.x;
    const dy = towardY - this.pos.y;
    const d = Math.hypot(dx, dy) || 1;
    this.vel.x += (dx / d) * impulse;
    this.vel.y += (dy / d) * impulse;
    this.flame.visible = true;
    this.flame.rotation = Math.atan2(dy, dx) + Math.PI;
    setTimeout(() => {
      this.flame.visible = false;
    }, 220);
    return true;
  }

  isFlying(): boolean {
    return this.flying;
  }

  private finish(outcome: OrbitOutcome): void {
    this.flying = false;
    this.flame.visible = false;
    if (outcome === "crashed") this.shakeT = 0.4;
    this.onResult?.(outcome, this.stats);
  }

  private stepFlight(): boolean {
    const { ax, ay, crashed } = this.accelAt(this.pos.x, this.pos.y, this.simT);
    if (crashed) {
      this.finish("crashed");
      return false;
    }
    this.vel.x += ax * STEP;
    this.vel.y += ay * STEP;
    this.pos.x += this.vel.x * STEP;
    this.pos.y += this.vel.y * STEP;
    // gravity-assist detection: skim a body without dying
    for (const [i, b] of this.level.bodies.entries()) {
      const p = this.bodyPos(b, this.simT);
      const d = Math.hypot(p.x - this.pos.x, p.y - this.pos.y);
      if (d < b.r + 30 && !this.closeSet.has(i)) {
        this.closeSet.add(i);
        this.stats.closePasses++;
        this.onClosePass?.();
      }
    }
    return true;
  }

  private tick(dt: number): void {
    if (this.destroyed || !this.level) return;
    this.simT += dt;

    // animate orbiting bodies + drifting star
    this.level.bodies.forEach((b, i) => {
      const p = this.bodyPos(b, this.simT);
      this.bodySprites[i]?.position.set(p.x, p.y);
    });
    const sp = this.starPos(this.simT);
    this.starSprite.position.set(sp.x, sp.y);
    this.starSprite.rotation = Math.sin(this.simT * 2) * 0.15;

    // parallax drifts opposite the probe
    const w = this.app.renderer.width;
    for (const s of this.parallax) {
      s.g.x -= (this.flying ? this.vel.x : 0) * s.depth * 0.004;
      if (s.g.x < -10) s.g.x += w + 20;
      if (s.g.x > w + 10) s.g.x -= w + 20;
    }

    // screen shake on crash
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      this.app.stage.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    } else {
      this.app.stage.position.set(0, 0);
    }

    if (!this.flying) return;
    this.flightT += dt;
    const steps = Math.max(1, Math.round(dt / STEP));
    for (let i = 0; i < steps; i++) {
      if (!this.stepFlight()) return;
    }
    this.probe.position.set(this.pos.x, this.pos.y);
    this.flame.position.set(this.pos.x, this.pos.y);

    if (++this.trailTick % 3 === 0) {
      const speed = Math.hypot(this.vel.x, this.vel.y);
      const dot = new Graphics().circle(0, 0, 2).fill({ color: speed > 300 ? AMBER : CYAN, alpha: 0.7 });
      dot.position.set(this.pos.x, this.pos.y);
      this.trail.addChild(dot);
    }

    if (Math.hypot(sp.x - this.pos.x, sp.y - this.pos.y) < 22) {
      this.finish("rescued");
      return;
    }
    const h = this.app.renderer.height;
    if (this.pos.x < -90 || this.pos.x > w + 90 || this.pos.y < -90 || this.pos.y > h + 90 || this.flightT > 10) {
      this.finish("lost");
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.app.destroy(true, { children: true });
  }
}
