import { Application, Container, Graphics, Text } from "pixi.js";

const CYAN = 0x22d3ee;
const AMBER = 0xffb454;
const NIGHT = 0x0b1b3a;
const WALL = 0x3b5694;

export interface MazeTarget {
  id: number;
  cell: [number, number];
  label: string;
}

export interface MazeSpec {
  cols: number;
  rows: number;
  /** Wall segments on grid lines, in cell coordinates: [x1, y1, x2, y2]. */
  walls: Array<[number, number, number, number]>;
  holes: Array<[number, number]>; // cell coords
  targets: MazeTarget[];
  start: [number, number];
}

interface WallRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const BALL_R = 9;
const WALL_T = 7;

/** Classic tilt labyrinth: roll the marble, dodge holes, collect in order. */
export class TiltMazeScene {
  private app: Application;
  private board = new Container();
  private ball = new Graphics();
  private spec!: MazeSpec;
  private wallRects: WallRect[] = [];
  private holePts: Array<{ x: number; y: number }> = [];
  private targetSprites = new Map<number, Container>();
  private cell = 40;
  private originX = 0;
  private originY = 0;
  private pos = { x: 0, y: 0 };
  private vel = { x: 0, y: 0 };
  private tiltX = 0;
  private tiltY = 0;
  private falling = 0;
  private destroyed = false;
  onTarget?: (id: number) => void;
  onHole?: () => void;

  private constructor(app: Application) {
    this.app = app;
  }

  static async create(host: HTMLElement): Promise<TiltMazeScene> {
    const app = new Application();
    await app.init({ background: NIGHT, antialias: true, resizeTo: host });
    host.appendChild(app.canvas);
    const scene = new TiltMazeScene(app);
    app.stage.addChild(scene.board);
    scene.ball
      .circle(0, 0, BALL_R)
      .fill(0xe8edf7)
      .circle(-3, -3, 3)
      .fill({ color: 0xffffff, alpha: 0.7 })
      .circle(0, 0, BALL_R)
      .stroke({ width: 1.5, color: CYAN });
    app.stage.addChild(scene.ball);
    app.ticker.add(() => scene.tick(Math.min(0.033, app.ticker.deltaMS / 1000)));
    return scene;
  }

  loadMaze(spec: MazeSpec): void {
    this.spec = spec;
    this.board.removeChildren().forEach((c) => c.destroy());
    this.targetSprites.clear();

    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    const topPad = 120;
    this.cell = Math.floor(Math.min((w - 36) / spec.cols, (h - topPad - 30) / spec.rows));
    this.originX = Math.floor((w - this.cell * spec.cols) / 2);
    this.originY = topPad + Math.floor((h - topPad - 24 - this.cell * spec.rows) / 2);

    const bg = new Graphics()
      .roundRect(this.originX - 10, this.originY - 10, this.cell * spec.cols + 20, this.cell * spec.rows + 20, 14)
      .fill(0x101f3e)
      .stroke({ width: 3, color: WALL });
    this.board.addChild(bg);

    this.wallRects = spec.walls.map(([x1, y1, x2, y2]) => {
      const horizontal = y1 === y2;
      return {
        x: this.originX + x1 * this.cell - WALL_T / 2,
        y: this.originY + y1 * this.cell - WALL_T / 2,
        w: horizontal ? (x2 - x1) * this.cell + WALL_T : WALL_T,
        h: horizontal ? WALL_T : (y2 - y1) * this.cell + WALL_T,
      };
    });
    const wallsG = new Graphics();
    for (const r of this.wallRects) wallsG.roundRect(r.x, r.y, r.w, r.h, 3).fill(WALL);
    this.board.addChild(wallsG);

    this.holePts = spec.holes.map(([c, r]) => ({
      x: this.originX + (c + 0.5) * this.cell,
      y: this.originY + (r + 0.5) * this.cell,
    }));
    for (const p of this.holePts) {
      this.board.addChild(
        new Graphics().circle(p.x, p.y, this.cell * 0.3).fill(0x05091a).circle(p.x, p.y, this.cell * 0.3).stroke({ width: 2, color: 0x22305a }),
      );
    }

    for (const t of spec.targets) {
      const root = new Container();
      const cx = this.originX + (t.cell[0] + 0.5) * this.cell;
      const cy = this.originY + (t.cell[1] + 0.5) * this.cell;
      root.position.set(cx, cy);
      root.addChild(new Graphics().circle(0, 0, this.cell * 0.3).fill({ color: AMBER, alpha: 0.2 }).circle(0, 0, this.cell * 0.3).stroke({ width: 2.5, color: AMBER }));
      const label = new Text({ text: t.label, style: { fontSize: this.cell * 0.32, fontWeight: "900", fill: 0xffe2b0, fontFamily: "Trebuchet MS" } });
      label.anchor.set(0.5);
      root.addChild(label);
      this.board.addChild(root);
      this.targetSprites.set(t.id, root);
    }

    this.respawn();
  }

  respawn(): void {
    this.falling = 0;
    this.ball.scale.set(1);
    this.pos = {
      x: this.originX + (this.spec.start[0] + 0.5) * this.cell,
      y: this.originY + (this.spec.start[1] + 0.5) * this.cell,
    };
    this.vel = { x: 0, y: 0 };
    this.ball.position.set(this.pos.x, this.pos.y);
  }

  setTilt(gx: number, gy: number): void {
    this.tiltX = Math.max(-1, Math.min(1, gx));
    this.tiltY = Math.max(-1, Math.min(1, gy));
  }

  /** Mark a target collected (burst + remove). */
  collect(id: number): void {
    const sprite = this.targetSprites.get(id);
    if (!sprite) return;
    for (let i = 0; i < 10; i++) {
      const g = new Graphics().circle(0, 0, 2.5).fill(CYAN);
      g.position.copyFrom(sprite.position);
      this.board.addChild(g);
      const a = (i / 10) * Math.PI * 2;
      let life = 0.6;
      const fn = () => {
        const dt = this.app.ticker.deltaMS / 1000;
        life -= dt;
        g.x += Math.cos(a) * 130 * dt;
        g.y += Math.sin(a) * 130 * dt;
        g.alpha = Math.max(0, life * 1.6);
        if (life <= 0) {
          this.app.ticker.remove(fn);
          g.destroy();
        }
      };
      this.app.ticker.add(fn);
    }
    sprite.destroy();
    this.targetSprites.delete(id);
  }

  /** Wrong-order target: brief shake, stays in place. */
  rejectFlash(id: number): void {
    const sprite = this.targetSprites.get(id);
    if (!sprite) return;
    const ox = sprite.x;
    let t = 0;
    const fn = () => {
      t += this.app.ticker.deltaMS / 1000;
      sprite.x = ox + Math.sin(t * 50) * 4;
      if (t > 0.3) {
        sprite.x = ox;
        this.app.ticker.remove(fn);
      }
    };
    this.app.ticker.add(fn);
  }

  private collideWalls(): void {
    for (const r of this.wallRects) {
      const cx = Math.max(r.x, Math.min(this.pos.x, r.x + r.w));
      const cy = Math.max(r.y, Math.min(this.pos.y, r.y + r.h));
      const dx = this.pos.x - cx;
      const dy = this.pos.y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 >= BALL_R * BALL_R || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const ny = dy / d;
      this.pos.x = cx + nx * BALL_R;
      this.pos.y = cy + ny * BALL_R;
      const dot = this.vel.x * nx + this.vel.y * ny;
      if (dot < 0) {
        this.vel.x -= 1.4 * dot * nx;
        this.vel.y -= 1.4 * dot * ny;
      }
    }
  }

  private tick(dt: number): void {
    if (this.destroyed || !this.spec) return;

    if (this.falling > 0) {
      this.falling -= dt;
      this.ball.scale.set(Math.max(0.1, this.falling / 0.35));
      if (this.falling <= 0) this.respawn();
      return;
    }

    this.vel.x += this.tiltX * 1150 * dt;
    this.vel.y += this.tiltY * 1150 * dt;
    const drag = Math.exp(-1.6 * dt);
    this.vel.x *= drag;
    this.vel.y *= drag;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.collideWalls();
    this.ball.position.set(this.pos.x, this.pos.y);

    for (const p of this.holePts) {
      if (Math.hypot(p.x - this.pos.x, p.y - this.pos.y) < this.cell * 0.3 - 2) {
        this.falling = 0.35;
        this.ball.position.set(p.x, p.y);
        this.onHole?.();
        return;
      }
    }
    for (const [id, sprite] of this.targetSprites) {
      if (Math.hypot(sprite.x - this.pos.x, sprite.y - this.pos.y) < this.cell * 0.3 + 2) {
        this.onTarget?.(id);
        return;
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.app.destroy(true, { children: true });
  }
}
