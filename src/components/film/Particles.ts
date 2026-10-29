/**
 * Pooled spray droplets for the wash edge. ~220 particles, no allocation per frame.
 * Emission is driven by scroll velocity: faster scroll = bigger splash.
 */

const POOL = 220;

export class Particles {
  private x = new Float32Array(POOL);
  private y = new Float32Array(POOL);
  private vx = new Float32Array(POOL);
  private vy = new Float32Array(POOL);
  private life = new Float32Array(POOL);
  private max = new Float32Array(POOL);
  private size = new Float32Array(POOL);
  private alpha = new Float32Array(POOL);
  private next = 0;
  private carry = 0;
  alive = 0;

  /** Emit `rate` particles per second for `dt` ms at points chosen by `at()` (canvas px). */
  emit(rate: number, dt: number, dpr: number, at: () => [number, number]) {
    this.carry += (rate * dt) / 1000;
    let n = Math.floor(this.carry);
    this.carry -= n;
    n = Math.min(n, 40);
    for (let k = 0; k < n; k++) {
      const i = this.next;
      this.next = (this.next + 1) % POOL;
      const [px, py] = at();
      this.x[i] = px;
      this.y[i] = py;
      const speed = (0.25 + Math.random() * 0.9) * dpr;
      const ang = (Math.random() - 0.5) * 1.1 - 0.12; // mostly right, a little up/down
      this.vx[i] = Math.cos(ang) * speed;
      this.vy[i] = Math.sin(ang) * speed;
      this.max[i] = 500 + Math.random() * 400;
      this.life[i] = this.max[i];
      this.size[i] = (1 + Math.random() * 2) * dpr;
      this.alpha[i] = 0.4 + Math.random() * 0.5;
    }
  }

  step(dt: number, dpr: number) {
    const g = 0.0012 * dpr;
    let alive = 0;
    for (let i = 0; i < POOL; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      this.vy[i] += g * dt;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      this.vx[i] *= 0.996;
      if (this.life[i] > 0) alive++;
    }
    this.alive = alive;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = "#fff";
    for (let i = 0; i < POOL; i++) {
      if (this.life[i] <= 0) continue;
      const k = this.life[i] / this.max[i];
      ctx.globalAlpha = this.alpha[i] * k;
      const s = this.size[i];
      ctx.beginPath();
      ctx.arc(this.x[i], this.y[i], s * (0.6 + 0.4 * k), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clear() {
    this.life.fill(0);
    this.alive = 0;
  }
}
