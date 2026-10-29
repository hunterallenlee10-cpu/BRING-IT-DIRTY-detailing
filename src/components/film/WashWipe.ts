import { createNoise2D } from "./noise";
import { Particles } from "./Particles";

export interface WashFrame {
  ctx: CanvasRenderingContext2D;
  cw: number;
  ch: number;
  dpr: number;
  /** 0..1 progress inside the wash chapter */
  t: number;
  now: number;
  dt: number;
  drawClean: () => void;
  drawDirty: () => void;
  /** dev ?align=1: 50% difference blend of dirty over clean instead of the wipe */
  alignDebug?: boolean;
}

interface Glint {
  y: number;
  behind: number;
  phase: number;
  size: number;
}

/**
 * The hero moment: clean is revealed from the left behind a glowing, jagged sheet-of-water edge.
 * Edge = base x + animated simplex offset per row (~14px). Spray particles scale with edge speed.
 */
export class WashWipe {
  private noise = createNoise2D(7);
  private particles = new Particles();
  private glints: Glint[] = [];
  private lastBase: number | null = null;
  private offsets = new Float32Array(0);
  private rowStep = 4;

  constructor(private reduced: boolean) {
    for (let i = 0; i < 9; i++) this.glints.push(this.newGlint());
  }

  get busy() {
    return this.particles.alive > 0;
  }

  reset() {
    this.particles.clear();
    this.lastBase = null;
  }

  private newGlint(): Glint {
    return { y: Math.random(), behind: 0.008 + Math.random() * 0.08, phase: Math.random() * Math.PI * 2, size: 0.6 + Math.random() * 0.8 };
  }

  /** Edge x (canvas px) at a given canvas y, using the offsets computed this frame. */
  private edgeAt(base: number, y: number) {
    const i = Math.min(this.offsets.length - 1, Math.max(0, Math.round(y / this.rowStep)));
    return base + this.offsets[i];
  }

  draw(f: WashFrame) {
    const { ctx, cw, ch, dpr, t, now, dt } = f;
    f.drawClean();
    if (f.alignDebug) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.globalCompositeOperation = "difference";
      f.drawDirty();
      ctx.restore();
      return;
    }
    const amp = 14 * dpr;
    const et = Math.min(1, Math.max(0, (t - 0.05) / 0.88));
    const base = -0.05 * cw + et * 1.1 * cw;

    // per-row noise offsets (animated slowly with time)
    this.rowStep = 4 * dpr;
    const rows = Math.ceil(ch / this.rowStep) + 1;
    if (this.offsets.length !== rows) this.offsets = new Float32Array(rows);
    const tt = this.reduced ? 0 : now * 0.00035;
    for (let r = 0; r < rows; r++) {
      const y = (r * this.rowStep) / dpr;
      this.offsets[r] =
        amp * (0.75 * this.noise(y * 0.0062, tt) + 0.25 * this.noise(y * 0.023, tt * 2.3 + 10));
    }

    const visible = base > -amp * 2 && base < cw + amp * 2;
    if (base < cw + amp * 2) {
      // dirty stays right of the edge
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cw + 2, -2);
      ctx.lineTo(this.edgeAt(base, 0), -2);
      for (let r = 0; r < rows; r++) ctx.lineTo(base + this.offsets[r], r * this.rowStep);
      ctx.lineTo(cw + 2, ch + 2);
      ctx.closePath();
      ctx.clip();
      f.drawDirty();
      ctx.restore();
    }

    if (visible) {
      // wet sheen trailing the edge on the clean side (~6% of width)
      const band = 0.06 * cw;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(base - band - amp, 0);
      for (let r = 0; r < rows; r++) ctx.lineTo(base + this.offsets[r], r * this.rowStep);
      ctx.lineTo(base - band - amp, ch);
      ctx.closePath();
      const g = ctx.createLinearGradient(base - band - amp, 0, base, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.7, "rgba(220,240,255,0.10)");
      g.addColorStop(1, "rgba(255,255,255,0.20)");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();

      const edgePath = () => {
        ctx.beginPath();
        ctx.moveTo(base + this.offsets[0], 0);
        for (let r = 1; r < rows; r++) ctx.lineTo(base + this.offsets[r], r * this.rowStep);
      };
      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      // faint cyan tint
      edgePath();
      ctx.strokeStyle = "rgba(120,220,255,0.14)";
      ctx.lineWidth = 18 * dpr;
      ctx.stroke();
      // soft bloom
      edgePath();
      ctx.shadowColor = "rgba(255,255,255,0.9)";
      ctx.shadowBlur = 24 * dpr;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 7 * dpr;
      ctx.stroke();
      // white core
      edgePath();
      ctx.shadowBlur = 6 * dpr;
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 2.5 * dpr;
      ctx.stroke();
      ctx.restore();

      // glints twinkling on the freshly clean side
      if (!this.reduced) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const gl of this.glints) {
          const y = gl.y * ch;
          const x = this.edgeAt(base, y) - gl.behind * cw;
          if (x < 0) continue;
          const tw = Math.pow(Math.max(0, Math.sin(now * 0.005 + gl.phase)), 3);
          if (tw < 0.02) continue;
          star(ctx, x, y, (7 + 7 * gl.size) * dpr * (0.6 + 0.4 * tw), tw);
        }
        ctx.restore();
      }
    }

    // spray: emission proportional to how fast the edge moved
    if (!this.reduced) {
      const speed = this.lastBase == null || dt <= 0 ? 0 : Math.abs(base - this.lastBase) / dt / dpr; // css px / ms
      this.lastBase = base;
      if (visible) {
        const rate = speed > 0.01 ? Math.min(1400, 40 + speed * 1600) : 6;
        this.particles.emit(rate, dt, dpr, () => {
          const y = Math.random() * ch;
          return [this.edgeAt(base, y) + Math.random() * 3 * dpr, y];
        });
      }
      this.particles.step(dt, dpr);
      this.particles.draw(ctx);
      // recycle glints that fell far behind
      if (Math.random() < 0.02) this.glints[(Math.random() * this.glints.length) | 0] = this.newGlint();
    }
  }
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${0.9 * a})`);
  g.addColorStop(0.25, `rgba(200,240,255,${0.35 * a})`);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  const w = r * 0.09;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x, y - w);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + w);
  ctx.closePath();
  ctx.moveTo(x, y - r * 0.8);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + r * 0.8);
  ctx.lineTo(x - w, y);
  ctx.closePath();
  ctx.fill();
}
