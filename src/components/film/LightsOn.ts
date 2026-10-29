/**
 * Lights-on: plays once. Either the C1_lights_on frames (time-based, not scroll) or the code fallback:
 * a flicker crossfade S2_dirty_dark → S1_dirty_lit (0 → .6 → .1 → .8 → .3 → 1 over 900ms) with a
 * white bloom along the ceiling strip. Reduced motion: a plain 300ms fade.
 */

const STEPS: [number, number][] = [
  [0, 0],
  [0.12, 0.6],
  [0.22, 0.1],
  [0.4, 0.8],
  [0.52, 0.3],
  [0.7, 1],
  [1, 1],
];

export class LightsOn {
  private t0 = -1;
  readonly duration: number;
  constructor(
    private reduced: boolean,
    private clipFrames = 0,
  ) {
    // a real lights-on clip plays over ~1.8s so the strips visibly flicker on one by one
    this.duration = reduced ? 300 : clipFrames ? 1800 : 900;
  }

  get started() {
    return this.t0 >= 0;
  }

  start(now = performance.now()) {
    if (this.t0 < 0) this.t0 = now;
  }

  /** 0..1 time progress */
  progress(now = performance.now()) {
    if (this.t0 < 0) return 0;
    return Math.min(1, (now - this.t0) / this.duration);
  }

  done(now = performance.now()) {
    return this.progress(now) >= 1;
  }

  /** Opacity of the lit still over the dark one. */
  mix(now = performance.now()) {
    const t = this.progress(now);
    if (this.reduced) return t;
    for (let i = 1; i < STEPS.length; i++) {
      const [ta, va] = STEPS[i - 1];
      const [tb, vb] = STEPS[i];
      if (t <= tb) {
        // hard-ish steps read as a flicker; a short ramp keeps it from strobing
        const k = Math.min(1, (t - ta) / Math.max(0.0001, (tb - ta) * 0.35));
        return va + (vb - va) * k;
      }
    }
    return 1;
  }

  /** Ceiling bloom strength: peaks with each flicker-on, fades out after. */
  bloom(now = performance.now()) {
    if (this.reduced) return 0;
    const t = this.progress(now);
    if (t >= 1) return 0;
    const m = this.mix(now);
    return m * (1 - t) * 0.9;
  }

  /** Frame index when a C1 clip exists. */
  clipIndex(now = performance.now()) {
    return Math.round(this.progress(now) * Math.max(0, this.clipFrames - 1));
  }
}
