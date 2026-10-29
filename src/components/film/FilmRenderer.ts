import { FrameSequence, type Drawable, type SeqItem } from "./FrameSequence";
import { LightsOn } from "./LightsOn";
import { WashWipe } from "./WashWipe";

export interface RChapter {
  id: string;
  range: [number, number];
  focalX: number;
  focalY: number;
  stills: string[];
  frames: number;
}

export interface Align {
  dx: number;
  dy: number;
  scale: number;
}

export interface RendererOptions {
  chapters: RChapter[];
  variant: "desktop" | "mobile";
  stillWidth: number;
  reduced: boolean;
  align: Align;
  alignDebug: boolean;
  /** global progress where the final still starts holding */
  holdFrom: number;
  onBoot: (ratio: number) => void;
}

const pad = (n: number) => String(n).padStart(4, "0");
const ARRIVE_DARK = "S2_dirty_dark";
const ARRIVE_LIT = "S1_dirty_lit";
const CLEAN = "S0_clean_lit";
const FINAL = "S7_pickup_golden";

/**
 * Draws the film for a given scroll progress. rAF runs only while something changes:
 * progress, the lights-on flicker, or the wash (animated water edge + spray).
 */
export class FilmRenderer {
  private ctx: CanvasRenderingContext2D;
  private seq: FrameSequence;
  private lights: LightsOn;
  private wash: WashWipe;
  private progress = 0;
  private raf = 0;
  private last = 0;
  private dirty = true;
  private cw = 0;
  private ch = 0;
  private dpr = 1;
  private opts: RendererOptions;
  private chapterIdx = 0;
  private stillSuffix: string;
  private arrive: RChapter;
  private disposed = false;

  constructor(
    private canvas: HTMLCanvasElement,
    opts: RendererOptions,
  ) {
    this.opts = opts;
    this.ctx = canvas.getContext("2d", { alpha: true })!;
    this.stillSuffix = opts.variant === "mobile" ? "_m-1080" : `-${opts.stillWidth}`;
    this.arrive = opts.chapters[0];
    this.lights = new LightsOn(opts.reduced, this.arrive.frames);
    this.wash = new WashWipe(opts.reduced);

    const items: SeqItem[] = [];
    const still = (name: string) => items.push({ key: "still:" + name, url: `/stills/${name}${this.stillSuffix}.webp`, chapter: "stills", index: 0, still: true });
    still(ARRIVE_DARK);
    still(ARRIVE_LIT);
    still(CLEAN);
    const seen = new Set([ARRIVE_DARK, ARRIVE_LIT, CLEAN]);
    for (const c of opts.chapters) {
      for (let i = 0; i < c.frames; i++) {
        items.push({ key: `${c.id}:${i}`, url: `/frames/${c.id}/${opts.variant}/${pad(i + 1)}.webp`, chapter: c.id, index: i });
      }
      // chapters without frames fall back to their stills
      if (!c.frames) {
        for (const s of c.stills) {
          if (seen.has(s)) continue;
          seen.add(s);
          still(s);
        }
      }
    }
    if (!seen.has(FINAL)) still(FINAL);
    const boot = ["still:" + ARRIVE_DARK, "still:" + ARRIVE_LIT];
    if (this.arrive.frames) for (let i = 0; i < this.arrive.frames; i += 4) boot.push(`arrive:${i}`);
    this.seq = new FrameSequence({ items, bootKeys: boot, onBootProgress: opts.onBoot, onUpdate: () => this.invalidate() });
    this.resize();
  }

  setAlign(a: Align, debug: boolean) {
    this.opts.align = a;
    this.opts.alignDebug = debug;
    this.invalidate();
  }

  startLights() {
    if (!this.lights.started) {
      this.lights.start();
      this.invalidate();
    }
  }

  get lightsStarted() {
    return this.lights.started;
  }

  setProgress(p: number) {
    if (p === this.progress) return;
    this.progress = p;
    const ci = this.chapterAt(p);
    if (ci !== this.chapterIdx) {
      if (this.opts.chapters[this.chapterIdx]?.id === "wash") this.wash.reset();
      this.chapterIdx = ci;
    }
    // position for the loader (global sequence index)
    const c = this.opts.chapters[ci];
    const t = this.local(p, c);
    const key = c.frames ? `${c.id}:${Math.round(this.frameT(p, c, t) * (c.frames - 1))}` : c.id === "pickup" ? "still:" + FINAL : "still:" + CLEAN;
    this.seq.focus(this.seq.globalOf(key) + (c.frames ? 6 : 0));
    this.invalidate();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * this.dpr));
    const h = Math.max(1, Math.round(r.height * this.dpr));
    if (w !== this.cw || h !== this.ch) {
      this.cw = this.canvas.width = w;
      this.ch = this.canvas.height = h;
      this.invalidate();
    }
  }

  invalidate() {
    this.dirty = true;
    if (!this.raf && !this.disposed) this.raf = requestAnimationFrame(this.tick);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.seq.dispose();
  }

  // ------------------------------------------------------------------
  private chapterAt(p: number) {
    const cs = this.opts.chapters;
    for (let i = 0; i < cs.length; i++) if (p < cs[i].range[1]) return i;
    return cs.length - 1;
  }

  private local(p: number, c: RChapter) {
    return Math.min(1, Math.max(0, (p - c.range[0]) / (c.range[1] - c.range[0])));
  }

  /** frame-time inside a chapter; the last chapter reaches its final frame at holdFrom */
  private frameT(p: number, c: RChapter, t: number) {
    if (c.id === "pickup") return Math.min(1, Math.max(0, (p - c.range[0]) / (this.opts.holdFrom - c.range[0])));
    return t;
  }

  private tick = (now: number) => {
    this.raf = 0;
    const dt = this.last ? Math.min(64, now - this.last) : 16;
    this.last = now;
    const animating = this.draw(now, dt);
    if (animating || this.dirty) {
      this.raf = requestAnimationFrame(this.tick);
    } else {
      this.last = 0;
    }
  };

  /** cover-fit with focal point; optional alignment nudge (dx/dy in px at 1600w reference) */
  private cover(img: Drawable, fx: number, fy: number, align?: Align) {
    const iw = (img as ImageBitmap).width, ih = (img as ImageBitmap).height;
    const s = Math.max(this.cw / iw, this.ch / ih);
    const dw = iw * s, dh = ih * s;
    const ox = Math.min(0, Math.max(this.cw - dw, this.cw / 2 - fx * dw));
    const oy = Math.min(0, Math.max(this.ch - dh, this.ch / 2 - fy * dh));
    if (!align || (align.dx === 0 && align.dy === 0 && align.scale === 1)) {
      this.ctx.drawImage(img, ox, oy, dw, dh);
      return;
    }
    const k = (iw / 1600) * s;
    const sc = align.scale;
    const ax = ox + align.dx * k - (dw * (sc - 1)) / 2;
    const ay = oy + align.dy * k - (dh * (sc - 1)) / 2;
    this.ctx.drawImage(img, ax, ay, dw * sc, dh * sc);
  }

  private drawStill(name: string, c: RChapter, alpha = 1, align?: Align) {
    const img = this.seq.still("still:" + name);
    if (!img) return false;
    if (alpha < 1) this.ctx.globalAlpha = alpha;
    this.cover(img, c.focalX, c.focalY, align);
    this.ctx.globalAlpha = 1;
    return true;
  }

  /** returns true while something is animating on its own */
  private draw(now: number, dt: number): boolean {
    if (!this.cw) return false;
    const ctx = this.ctx;
    const p = this.progress;
    const c = this.opts.chapters[this.chapterIdx];
    const t = this.local(p, c);
    this.dirty = false;
    let animating = false;

    if (c.id === "arrive") {
      const lit = this.lights.started ? this.lights.mix(now) : 0;
      const usingClip = this.arrive.frames > 0;
      if (usingClip && this.lights.started && !this.lights.done(now)) {
        const f = this.seq.frame("arrive", this.lights.clipIndex(now));
        if (f) this.cover(f, c.focalX, c.focalY);
        else this.drawStill(ARRIVE_DARK, c);
      } else if (!this.lights.started) {
        if (!this.drawStill(ARRIVE_DARK, c)) ctx.clearRect(0, 0, this.cw, this.ch);
      } else if (this.lights.done(now)) {
        if (!this.drawStill(ARRIVE_LIT, c)) this.drawStill(ARRIVE_DARK, c);
      } else {
        this.drawStill(ARRIVE_DARK, c);
        this.drawStill(ARRIVE_LIT, c, lit);
        const b = this.lights.bloom(now);
        if (b > 0.01) {
          const g = ctx.createRadialGradient(this.cw * 0.5, 0, 0, this.cw * 0.5, 0, this.cw * 0.7);
          g.addColorStop(0, `rgba(255,255,255,${0.45 * b})`);
          g.addColorStop(0.4, `rgba(255,250,240,${0.16 * b})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, this.cw, this.ch * 0.6);
          ctx.restore();
        }
      }
      animating = this.lights.started && !this.lights.done(now);
    } else if (c.id === "wash") {
      const clean = this.seq.still("still:" + CLEAN);
      const dirty = this.seq.still("still:" + ARRIVE_LIT);
      if (clean && dirty) {
        this.wash.draw({
          ctx,
          cw: this.cw,
          ch: this.ch,
          dpr: this.dpr,
          t,
          now,
          dt,
          alignDebug: this.opts.alignDebug,
          drawClean: () => this.cover(clean, c.focalX, c.focalY),
          drawDirty: () => this.cover(dirty, c.focalX, c.focalY, this.opts.align),
        });
        animating = !this.opts.reduced && !this.opts.alignDebug;
      } else if (dirty) this.cover(dirty, c.focalX, c.focalY);
    } else if (c.id === "pickup" && p >= this.opts.holdFrom && this.drawStill(FINAL, c)) {
      // final hold on the golden-hour still
    } else if (c.frames) {
      const idx = Math.round(this.frameT(p, c, t) * (c.frames - 1));
      const f = this.seq.frame(c.id, idx);
      if (f) this.cover(f, c.focalX, c.focalY);
    } else {
      // no frames for this chapter: crossfade its stills
      const n = c.stills.length;
      const pos = t * (n - 1);
      const i = Math.floor(pos);
      this.drawStill(c.stills[Math.min(n - 1, i)], c);
      if (i < n - 1) this.drawStill(c.stills[i + 1], c, pos - i);
    }
    return animating || this.wash.busy;
  }
}
