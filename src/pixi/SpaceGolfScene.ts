import { Application, Container, Graphics, Text } from "pixi.js";

const CYAN = 0x22d3ee;
const NIGHT = 0x070f22;
const GREEN = 0x34d399;
const MAGNET_COLORS = [0xff8c42, 0x7c5cff, 0xf4845f, 0x5cc8ff];

/** A magnet-planet: visible pull rings, bouncy surface. */
export interface Magnet {
  x: number; // fractions of view
  y: number;
  r: number; // px
  m: number; // pull strength
}

export interface GolfHole {
  magnets: Magnet[];
  flag: { x: number; y: number };
  tee: { x: number; y: number };
  par: number;
}

const STEP = 1 / 120;
const FRICTION = 1.0; // space-dust drag, exp(-FRICTION·t)
const STOP_SPEED = 9;
const SINK_SPEED = 150;
const HOLE_R = 17;

/**
 * Space Golf: putt the ball to the flag. Magnet-planets visibly bend the
 * ball's path; everything bounces, nothing kills — golf rules kids know.
 */
export class SpaceGolfScene {
  private app: Application;
  private hole!: GolfHole;
  private course = new Container();
  private rings: Graphics[] = [];
  private aimLine = new Graphics();
  private predictLine = new Graphics();
  private ball = new Graphics();
  private trail = new Container();
  private pos = { x: 0, y: 0 };
  private vel = { x: 0, y: 0 };
  private rolling = false;
  private sunk = false;
  private t = 0;
  private trailTick = 0;
  private destroyed = false;
  onBounce?: (speed: number) => void;
  onStop?: () => void;
  onSink?: () => void;

  private constructor(app: Application) {
    this.app = app;
  }

  static async create(host: HTMLElement): Promise<SpaceGolfScene> {
    const app = new Application();
    await app.init({ background: NIGHT, antialias: true, resizeTo: host });
    host.appendChild(app.canvas);
    const scene = new SpaceGolfScene(app);
    scene.build();
    app.ticker.add(() => scene.tick(Math.min(0.033, app.ticker.deltaMS / 1000)));
    return scene;
  }

  private build(): void {
    for (let i = 0; i < 70; i++) {
      const g = new Graphics().circle(0, 0, Math.random() * 1.5 + 0.4).fill(0xffffff);
      g.x = Math.random() * 2400;
      g.y = Math.random() * 1500;
      g.alpha = 0.2 + Math.random() * 0.4;
      this.app.stage.addChild(g);
    }
    this.ball.circle(0, 0, 8).fill(0xffffff).circle(-2.5, -2.5, 3).fill({ color: 0xffffff, alpha: 0.5 }).circle(0, 0, 8).stroke({ width: 1.5, color: 0x9fb0d8 });
    this.app.stage.addChild(this.course, this.trail, this.predictLine, this.aimLine, this.ball);
  }

  private px(f: number, axis: "x" | "y"): number {
    return f * (axis === "x" ? this.app.renderer.width : this.app.renderer.height);
  }

  loadHole(hole: GolfHole): void {
    this.hole = hole;
    this.sunk = false;
    this.course.removeChildren().forEach((c) => c.destroy());
    this.trail.removeChildren().forEach((c) => c.destroy());
    this.rings = [];

    for (const [i, mp] of hole.magnets.entries()) {
      const color = MAGNET_COLORS[i % MAGNET_COLORS.length];
      const cx = this.px(mp.x, "x");
      const cy = this.px(mp.y, "y");
      // pull-zone rings make gravity VISIBLE
      const ring = new Graphics();
      for (const k of [2.2, 3.2, 4.4]) {
        ring.circle(cx, cy, mp.r * k).stroke({ width: 2, color, alpha: 0.6 / k });
      }
      this.course.addChild(ring);
      this.rings.push(ring);
      const body = new Graphics()
        .circle(cx, cy, mp.r)
        .fill({ color })
        .circle(cx - mp.r * 0.3, cy - mp.r * 0.3, mp.r * 0.5)
        .fill({ color: 0xffffff, alpha: 0.15 });
      this.course.addChild(body);
      const label = new Text({ text: "🧲", style: { fontSize: Math.max(14, mp.r * 0.8) } });
      label.anchor.set(0.5);
      label.position.set(cx, cy);
      this.course.addChild(label);
    }

    // the hole: a glowing green pad + flag
    const fx = this.px(hole.flag.x, "x");
    const fy = this.px(hole.flag.y, "y");
    const pad = new Graphics()
      .circle(fx, fy, HOLE_R + 6)
      .fill({ color: GREEN, alpha: 0.15 })
      .circle(fx, fy, HOLE_R)
      .stroke({ width: 3, color: GREEN })
      .circle(fx, fy, 4)
      .fill(0x05210f);
    this.course.addChild(pad);
    const flag = new Text({ text: "⛳", style: { fontSize: 30 } });
    flag.anchor.set(0.5, 0.95);
    flag.position.set(fx, fy);
    this.course.addChild(flag);

    this.placeBallAtTee();
  }

  placeBallAtTee(): void {
    this.rolling = false;
    this.pos = { x: this.px(this.hole.tee.x, "x"), y: this.px(this.hole.tee.y, "y") };
    this.vel = { x: 0, y: 0 };
    this.ball.position.set(this.pos.x, this.pos.y);
    this.ball.visible = true;
  }

  canStroke(): boolean {
    return !this.rolling && !this.sunk;
  }

  ballPosition(): { x: number; y: number } {
    return { ...this.pos };
  }

  private accelAt(x: number, y: number): { ax: number; ay: number } {
    let ax = 0;
    let ay = 0;
    for (const mp of this.hole.magnets) {
      const dx = this.px(mp.x, "x") - x;
      const dy = this.px(mp.y, "y") - y;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2);
      const a = mp.m / Math.max(d2, 500);
      ax += (a * dx) / d;
      ay += (a * dy) / d;
    }
    return { ax, ay };
  }

  /** One physics micro-step shared by flight and prediction. Returns "bounce" speed or null. */
  private microStep(s: { x: number; y: number; vx: number; vy: number }): number | null {
    const { ax, ay } = this.accelAt(s.x, s.y);
    s.vx += ax * STEP;
    s.vy += ay * STEP;
    const drag = Math.exp(-FRICTION * STEP);
    s.vx *= drag;
    s.vy *= drag;
    s.x += s.vx * STEP;
    s.y += s.vy * STEP;
    let bounced: number | null = null;
    // bounce off magnets
    for (const mp of this.hole.magnets) {
      const cx = this.px(mp.x, "x");
      const cy = this.px(mp.y, "y");
      const dx = s.x - cx;
      const dy = s.y - cy;
      const d = Math.hypot(dx, dy);
      if (d < mp.r + 8) {
        const nx = dx / d;
        const ny = dy / d;
        const dot = s.vx * nx + s.vy * ny;
        s.vx = (s.vx - 2 * dot * nx) * 0.72;
        s.vy = (s.vy - 2 * dot * ny) * 0.72;
        s.x = cx + nx * (mp.r + 8.5);
        s.y = cy + ny * (mp.r + 8.5);
        bounced = Math.hypot(s.vx, s.vy);
      }
    }
    // bounce off the walls — nothing is ever lost
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    if (s.x < 8) { s.x = 8; s.vx = Math.abs(s.vx) * 0.8; bounced = Math.hypot(s.vx, s.vy); }
    if (s.x > w - 8) { s.x = w - 8; s.vx = -Math.abs(s.vx) * 0.8; bounced = Math.hypot(s.vx, s.vy); }
    if (s.y < 8) { s.y = 8; s.vy = Math.abs(s.vy) * 0.8; bounced = Math.hypot(s.vx, s.vy); }
    if (s.y > h - 8) { s.y = h - 8; s.vy = -Math.abs(s.vy) * 0.8; bounced = Math.hypot(s.vx, s.vy); }
    return bounced;
  }

  /** Aim preview: arrow + friction-and-gravity-true predicted path. */
  aim(vx: number, vy: number): void {
    if (!this.canStroke()) return;
    const len = Math.min(1, Math.hypot(vx, vy) / 620);
    this.aimLine
      .clear()
      .moveTo(this.pos.x, this.pos.y)
      .lineTo(this.pos.x + vx * 0.16, this.pos.y + vy * 0.16)
      .stroke({ width: 4, color: CYAN, alpha: 0.35 + 0.5 * len });

    this.predictLine.clear();
    const s = { x: this.pos.x, y: this.pos.y, vx, vy };
    for (let i = 0; i < 2.6 / STEP; i++) {
      this.microStep(s);
      if (Math.hypot(s.vx, s.vy) < STOP_SPEED) break;
      if (i % 9 === 0) {
        const fade = 1 - i / (2.6 / STEP);
        this.predictLine.circle(s.x, s.y, 2).fill({ color: CYAN, alpha: 0.5 * fade });
      }
    }
  }

  stroke(vx: number, vy: number): boolean {
    if (!this.canStroke()) return false;
    this.aimLine.clear();
    this.predictLine.clear();
    this.vel = { x: vx, y: vy };
    this.rolling = true;
    return true;
  }

  private tick(dt: number): void {
    if (this.destroyed || !this.hole) return;
    this.t += dt;
    this.rings.forEach((r, i) => {
      r.alpha = 0.75 + 0.25 * Math.sin(this.t * 2 + i);
    });
    if (!this.rolling || this.sunk) return;

    const steps = Math.max(1, Math.round(dt / STEP));
    const s = { x: this.pos.x, y: this.pos.y, vx: this.vel.x, vy: this.vel.y };
    for (let i = 0; i < steps; i++) {
      const bounce = this.microStep(s);
      if (bounce !== null && bounce > 40) this.onBounce?.(bounce);
      // sink check: over the hole and slow enough
      const fx = this.px(this.hole.flag.x, "x");
      const fy = this.px(this.hole.flag.y, "y");
      const speed = Math.hypot(s.vx, s.vy);
      if (Math.hypot(fx - s.x, fy - s.y) < HOLE_R && speed < SINK_SPEED) {
        this.pos = { x: fx, y: fy };
        this.ball.position.set(fx, fy);
        this.ball.visible = false;
        this.sunk = true;
        this.rolling = false;
        this.burst(fx, fy);
        this.onSink?.();
        return;
      }
      if (speed < STOP_SPEED) {
        s.vx = 0;
        s.vy = 0;
        this.pos = { x: s.x, y: s.y };
        this.vel = { x: 0, y: 0 };
        this.ball.position.set(s.x, s.y);
        this.rolling = false;
        this.onStop?.();
        return;
      }
    }
    this.pos = { x: s.x, y: s.y };
    this.vel = { x: s.vx, y: s.vy };
    this.ball.position.set(s.x, s.y);
    if (++this.trailTick % 4 === 0) {
      const dot = new Graphics().circle(0, 0, 1.8).fill({ color: 0xffffff, alpha: 0.35 });
      dot.position.set(s.x, s.y);
      this.trail.addChild(dot);
      if (this.trail.children.length > 90) this.trail.removeChildAt(0).destroy();
    }
  }

  private burst(x: number, y: number): void {
    for (let i = 0; i < 16; i++) {
      const g = new Graphics().circle(0, 0, 2 + Math.random() * 2).fill(GREEN);
      g.position.set(x, y);
      this.app.stage.addChild(g);
      const a = Math.random() * Math.PI * 2;
      const sp = 50 + Math.random() * 120;
      let life = 0.8;
      const tickFn = () => {
        life -= this.app.ticker.deltaMS / 1000;
        g.x += (Math.cos(a) * sp * this.app.ticker.deltaMS) / 1000;
        g.y += (Math.sin(a) * sp * this.app.ticker.deltaMS) / 1000;
        g.alpha = Math.max(0, life);
        if (life <= 0) {
          this.app.ticker.remove(tickFn);
          g.destroy();
        }
      };
      this.app.ticker.add(tickFn);
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.app.destroy(true, { children: true });
  }
}
