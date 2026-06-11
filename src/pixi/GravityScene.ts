import { Application, Container, Graphics, Text } from "pixi.js";

const CYAN = 0x22d3ee;
const NIGHT = 0x0b1b3a;
const PLANET_COLORS = [0xff8c42, 0x7c5cff, 0x3ddc97, 0xf4845f, 0x5cc8ff];

export interface OrbitPlanet {
  x: number; // fractions of view size
  y: number;
  r: number; // px
  m: number; // gravity strength
}

export interface OrbitLevel {
  planets: OrbitPlanet[];
  star: { x: number; y: number };
  start: { x: number; y: number };
}

export type OrbitOutcome = "rescued" | "crashed" | "lost";

/**
 * Gravity slingshot: drag to aim, release to launch; the probe curves
 * through real n-body gravity toward the lost star.
 */
export class GravityScene {
  private app: Application;
  private level!: OrbitLevel;
  private world = new Container();
  private aimLine = new Graphics();
  private probe = new Graphics();
  private trail = new Container();
  private oldTrails = new Container();
  private pos = { x: 0, y: 0 };
  private vel = { x: 0, y: 0 };
  private flying = false;
  private flightT = 0;
  private trailTick = 0;
  private destroyed = false;
  onResult?: (o: OrbitOutcome) => void;

  private constructor(app: Application) {
    this.app = app;
  }

  static async create(host: HTMLElement): Promise<GravityScene> {
    const app = new Application();
    await app.init({ background: NIGHT, resizeTo: host, antialias: true });
    host.appendChild(app.canvas);
    const scene = new GravityScene(app);
    scene.build();
    app.ticker.add(() => scene.tick(Math.min(0.033, app.ticker.deltaMS / 1000)));
    return scene;
  }

  private build(): void {
    for (let i = 0; i < 50; i++) {
      const g = new Graphics().circle(0, 0, Math.random() * 1.5 + 0.4).fill(0xffffff);
      g.x = Math.random() * 2000;
      g.y = Math.random() * 1400;
      g.alpha = 0.25 + Math.random() * 0.4;
      this.app.stage.addChild(g);
    }
    this.probe
      .circle(0, 0, 7)
      .fill(0xe8edf7)
      .circle(2, -2, 2.5)
      .fill(CYAN);
    this.app.stage.addChild(this.oldTrails, this.world, this.trail, this.aimLine, this.probe);
  }

  private px(f: number, axis: "x" | "y"): number {
    return f * (axis === "x" ? this.app.renderer.width : this.app.renderer.height);
  }

  loadLevel(level: OrbitLevel): void {
    this.level = level;
    this.world.removeChildren().forEach((c) => c.destroy());
    this.oldTrails.removeChildren().forEach((c) => c.destroy());
    this.clearTrail();
    for (const [i, p] of level.planets.entries()) {
      const g = new Graphics()
        .circle(0, 0, p.r)
        .fill({ color: PLANET_COLORS[i % PLANET_COLORS.length] })
        .circle(-p.r * 0.3, -p.r * 0.3, p.r * 0.55)
        .fill({ color: 0xffffff, alpha: 0.12 });
      g.x = this.px(p.x, "x");
      g.y = this.px(p.y, "y");
      this.world.addChild(g);
    }
    const star = new Text({ text: "⭐", style: { fontSize: 34 } });
    star.anchor.set(0.5);
    star.x = this.px(level.star.x, "x");
    star.y = this.px(level.star.y, "y");
    this.world.addChild(star);
    this.resetProbe();
  }

  resetProbe(): void {
    this.flying = false;
    this.pos = { x: this.px(this.level.start.x, "x"), y: this.px(this.level.start.y, "y") };
    this.probe.position.set(this.pos.x, this.pos.y);
    this.aimLine.clear();
  }

  /** Show the aim arrow while dragging (vx, vy = launch velocity preview). */
  aim(vx: number, vy: number): void {
    if (this.flying) return;
    const len = Math.min(1, Math.hypot(vx, vy) / 560);
    this.aimLine
      .clear()
      .moveTo(this.pos.x, this.pos.y)
      .lineTo(this.pos.x + vx * 0.22, this.pos.y + vy * 0.22)
      .stroke({ width: 4, color: CYAN, alpha: 0.4 + 0.5 * len });
  }

  launch(vx: number, vy: number): boolean {
    if (this.flying) return false;
    // fade the previous attempt's trail so he can learn from it
    while (this.trail.children.length) {
      const dot = this.trail.children[0];
      this.trail.removeChild(dot);
      dot.alpha *= 0.35;
      this.oldTrails.addChild(dot);
    }
    this.aimLine.clear();
    this.vel = { x: vx, y: vy };
    this.flightT = 0;
    this.flying = true;
    return true;
  }

  private clearTrail(): void {
    this.trail.removeChildren().forEach((c) => c.destroy());
  }

  private finish(outcome: OrbitOutcome): void {
    this.flying = false;
    this.onResult?.(outcome);
  }

  private tick(dt: number): void {
    if (this.destroyed || !this.flying || !this.level) return;
    this.flightT += dt;
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;

    // sub-steps keep close passes stable
    for (let i = 0; i < 4; i++) {
      const sdt = dt / 4;
      let ax = 0;
      let ay = 0;
      for (const p of this.level.planets) {
        const pxp = this.px(p.x, "x");
        const pyp = this.px(p.y, "y");
        const dx = pxp - this.pos.x;
        const dy = pyp - this.pos.y;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2);
        if (d < p.r + 6) {
          this.finish("crashed");
          return;
        }
        const a = p.m / Math.max(d2, 400);
        ax += (a * dx) / d;
        ay += (a * dy) / d;
      }
      this.vel.x += ax * sdt;
      this.vel.y += ay * sdt;
      this.pos.x += this.vel.x * sdt;
      this.pos.y += this.vel.y * sdt;
    }
    this.probe.position.set(this.pos.x, this.pos.y);

    if (++this.trailTick % 3 === 0) {
      const dot = new Graphics().circle(0, 0, 2).fill({ color: CYAN, alpha: 0.7 });
      dot.position.set(this.pos.x, this.pos.y);
      this.trail.addChild(dot);
    }

    const sx = this.px(this.level.star.x, "x");
    const sy = this.px(this.level.star.y, "y");
    if (Math.hypot(sx - this.pos.x, sy - this.pos.y) < 20) {
      this.finish("rescued");
      return;
    }
    if (this.pos.x < -90 || this.pos.x > w + 90 || this.pos.y < -90 || this.pos.y > h + 90 || this.flightT > 9) {
      this.finish("lost");
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.app.destroy(true, { children: true });
  }
}
