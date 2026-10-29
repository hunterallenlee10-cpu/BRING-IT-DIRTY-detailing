"use client";

import { useEffect, useRef } from "react";

/** ~40 red/amber water droplets that burst up and fall. Skipped for reduced motion. */
export function Confetti({ fire }: { fire: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!fire) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = ref.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = cv.getBoundingClientRect();
    cv.width = r.width * dpr;
    cv.height = r.height * dpr;
    const ctx = cv.getContext("2d")!;
    const colors = ["#FF2A1F", "#FF5A1F", "#FFB81A", "#E8150B", "#FFD27A"];
    const ps = Array.from({ length: 40 }, () => ({
      x: cv.width / 2 + (Math.random() - 0.5) * 60 * dpr,
      y: cv.height * 0.34,
      vx: (Math.random() - 0.5) * 0.9 * dpr,
      vy: (-0.55 - Math.random() * 0.7) * dpr,
      s: (3 + Math.random() * 4) * dpr,
      c: colors[(Math.random() * colors.length) | 0],
      life: 1300 + Math.random() * 700,
    }));
    let t0 = 0;
    let raf = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const el = t - t0;
      ctx.clearRect(0, 0, cv.width, cv.height);
      let alive = 0;
      for (const p of ps) {
        const k = 1 - el / p.life;
        if (k <= 0) continue;
        alive++;
        const tt = Math.min(el, p.life);
        const x = p.x + p.vx * tt;
        const y = p.y + p.vy * tt + 0.0009 * dpr * tt * tt;
        ctx.globalAlpha = Math.min(1, k * 1.6);
        ctx.fillStyle = p.c;
        // droplet: circle with a pointed top
        ctx.beginPath();
        ctx.moveTo(x, y - p.s * 1.6);
        ctx.quadraticCurveTo(x + p.s, y - p.s * 0.2, x, y + p.s);
        ctx.quadraticCurveTo(x - p.s, y - p.s * 0.2, x, y - p.s * 1.6);
        ctx.fill();
      }
      if (alive) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}
