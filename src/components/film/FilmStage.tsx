"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { siteConfig, type Chapter } from "@/site.config";
import manifest from "../../../public/frames/manifest.json";
import { filmStore, useFilm } from "@/lib/filmStore";
import { scrollToY } from "@/lib/lenis";
import { whenIdle } from "@/lib/idle";
import { ChapterText } from "./ChapterText";
import type { Align, FilmRenderer as Renderer } from "./FilmRenderer";

gsap.registerPlugin(ScrollTrigger);

const chapters = siteConfig.film.chapters;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
type ManifestChapter = { desktop: number; mobile: number };
const frameCounts = (manifest as { chapters: Record<string, ManifestChapter> }).chapters;

/** Headline choreography for chapter i at local time t (0..1). Exactly one chapter is ever non-zero. */
function vis(i: number, c: Chapter, t: number) {
  const first = i === 0;
  const last = i === chapters.length - 1;
  const exitStart = c.hudTag ? c.hudTag.from - 0.1 : 0.88;
  const exitLen = c.hudTag ? 0.1 : 0.12;
  const enter = first ? 1 : clamp(t / 0.18);
  const exit = last ? 0 : clamp((t - exitStart) / exitLen);
  const hlEnter = first ? 1 : clamp((t - 0.035) / 0.15);
  const hlExit = last ? 0 : clamp((t - exitStart + 0.02) / exitLen);
  return {
    lead: easeOut(enter) * (1 - easeIn(exit)),
    hl: easeOut(hlEnter) * (1 - easeIn(hlExit)),
    sub: (first ? 1 : easeOut(clamp((t - 0.06) / 0.14))) * (1 - exit),
    tag: c.hudTag ? clamp((t - c.hudTag.from) / 0.05) * (1 - clamp((t - 0.94) / 0.06)) : 0,
  };
}

export function FilmStage() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const chRefs = useRef<HTMLDivElement[]>([]);
  const tagRef = useRef<HTMLDivElement>(null);
  const renderer = useRef<Renderer | null>(null);
  const [boot, setBoot] = useState(0);
  // the loading readout only matters on the opening shot; deeper chapters fall back to the nearest frame anyway
  const firstChapter = useFilm((s) => s.chapter === 0);
  const [align, setAlign] = useState<{ on: boolean; v: Align }>({ on: false, v: siteConfig.film.washAlign });

  useEffect(() => {
    const sec = section.current!;
    const cv = canvas.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // stacked static film is pure CSS

    const params = new URLSearchParams(window.location.search);
    const alignDebug = params.get("align") === "1" && (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ALLOW_ALIGN === "1");
    let disposed = false;
    let current: Renderer | null = null;
    let variant: "desktop" | "mobile" | null = null;
    let idleTimer = 0;

    const pickVariant = () => (window.innerWidth / window.innerHeight < 0.9 ? "mobile" : "desktop");

    const build = async () => {
      const { FilmRenderer } = await import("./FilmRenderer");
      if (disposed) return;
      const v = pickVariant();
      if (v === variant && current) return;
      variant = v;
      const lit = current?.lightsStarted;
      current?.dispose();
      const pxW = window.innerWidth * Math.min(2, window.devicePixelRatio || 1);
      current = new FilmRenderer(cv, {
        chapters: chapters.map((c) => ({ id: c.id, range: c.range, focalX: c.focalX, focalY: c.focalY, stills: c.stills, frames: frameCounts[c.id]?.[v] ?? 0 })),
        variant: v,
        stillWidth: pxW > 1700 ? 2400 : 1600,
        reduced,
        align: siteConfig.film.washAlign,
        alignDebug,
        holdFrom: siteConfig.film.holdFrom,
        onBoot: (r) => setBoot(r),
      });
      renderer.current = current;
      if (lit) current.startLights();
      current.setProgress(st.progress || 0.00001);
      if (alignDebug) setAlign((a) => ({ ...a, on: true }));
    };

    const update = (p: number) => {
      const r = renderer.current;
      r?.setProgress(p);
      if (r && !r.lightsStarted && p > 0.01) r.startLights();
      let ci = chapters.length - 1;
      for (let i = 0; i < chapters.length; i++) if (p < chapters[i].range[1]) { ci = i; break; }
      chapters.forEach((c, i) => {
        const el = chRefs.current[i];
        if (!el) return;
        const t = clamp((p - c.range[0]) / (c.range[1] - c.range[0]));
        const v = i === ci ? vis(i, c, t) : { lead: 0, hl: 0, sub: 0, tag: 0 };
        el.style.setProperty("--p-lead", v.lead.toFixed(4));
        el.style.setProperty("--p-hl", v.hl.toFixed(4));
        el.style.setProperty("--p-sub", v.sub.toFixed(4));
        el.style.visibility = v.lead > 0.001 || v.hl > 0.001 ? "visible" : "hidden";
        if (c.hudTag && tagRef.current) {
          tagRef.current.style.opacity = v.tag.toFixed(3);
          tagRef.current.style.visibility = v.tag > 0.001 ? "visible" : "hidden";
        }
      });
      filmStore.set({ chapter: ci });
    };

    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });

    // "in the film" until its bottom edge passes 60% of the viewport (the last frame is still on screen until then)
    const inView = ScrollTrigger.create({
      trigger: sec,
      start: "top bottom",
      end: "bottom 60%",
      onToggle: (self) => filmStore.set({ inFilm: self.isActive }),
    });
    filmStore.set({ inFilm: inView.isActive || window.scrollY < sec.offsetTop + sec.offsetHeight * 0.9 });

    filmStore.set({
      scrollTarget: (i: number) => {
        const c = chapters[i];
        const span = sec.offsetHeight - window.innerHeight;
        const p = i === 0 ? 0 : c.range[0] + (c.range[1] - c.range[0]) * 0.2;
        scrollToY(sec.offsetTop + p * span + 1);
      },
    });

    // canvas + frame loading start after first paint (the poster image shows the same first frame)
    const cancelIdle = whenIdle(() => {
      build();
      idleTimer = window.setTimeout(() => renderer.current?.startLights(), siteConfig.film.lightsOnIdleMs);
    });

    let rz = 0;
    const onResize = () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => {
        renderer.current?.resize();
        if (pickVariant() !== variant) build();
      });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    update(st.progress);

    return () => {
      disposed = true;
      cancelIdle();
      clearTimeout(idleTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      st.kill();
      inView.kill();
      current?.dispose();
      renderer.current = null;
      filmStore.set({ scrollTarget: null });
    };
  }, []);

  // dev-only alignment nudging: arrows move, [ ] scale, shift = ×10
  useEffect(() => {
    if (!align.on) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.shiftKey ? 10 : 1;
      setAlign((a) => {
        const v = { ...a.v };
        if (e.key === "ArrowLeft") v.dx -= k;
        else if (e.key === "ArrowRight") v.dx += k;
        else if (e.key === "ArrowUp") v.dy -= k;
        else if (e.key === "ArrowDown") v.dy += k;
        else if (e.key === "[") v.scale = +(v.scale - 0.001 * k).toFixed(4);
        else if (e.key === "]") v.scale = +(v.scale + 0.001 * k).toFixed(4);
        else return a;
        e.preventDefault();
        return { ...a, v };
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [align.on]);
  useEffect(() => {
    renderer.current?.setAlign(align.v, align.on);
  }, [align]);

  return (
    <section
      id="film"
      ref={section}
      className="film relative"
      style={{ height: `${siteConfig.film.scrollLength}vh` }}
      aria-label={`${siteConfig.brand.name} detailing, told in five steps`}
    >
      <div className="film-pin">
        <picture className="film-poster">
          <source media="(max-aspect-ratio: 9/10)" srcSet="/stills/S2_dirty_dark_m-1080.webp" />
          <img
            src="/stills/S2_dirty_dark-1600.webp"
            alt=""
            fetchPriority="high"
            decoding="async"
            style={{ objectPosition: `${chapters[0].focalX * 100}% ${chapters[0].focalY * 100}%` }}
          />
        </picture>
        <canvas ref={canvas} className="film-canvas" aria-hidden="true" />
        <div className="film-shade" aria-hidden="true" />
        <div className="film-chapters">
          {chapters.map((c, i) => (
            <div
              key={c.id}
              ref={(el) => {
                if (el) chRefs.current[i] = el;
              }}
              className="film-ch-wrap"
              style={i === 0 ? undefined : { visibility: "hidden" }}
            >
              <ChapterText c={c} index={i} />
            </div>
          ))}
        </div>
        {chapters
          .filter((c) => c.hudTag)
          .map((c) => (
            <div key={c.id} ref={tagRef} className="film-hudtag hud" style={{ visibility: "hidden", opacity: 0 }}>
              <span className="text-red-hot">/</span> {c.hudTag!.text.replace(/^\/\s*/, "")}
            </div>
          ))}
        {boot < 1 && firstChapter && (
          <div className="film-loading hud" role="status" aria-live="polite">
            LOADING STUDIO {Math.round(boot * 100)}%
            <span className="film-loading-bar" style={{ transform: `scaleX(${boot})` }} />
          </div>
        )}
        {align.on && (
          <div className="fixed left-4 top-28 z-[70] rounded-lg border border-line-strong bg-black/85 p-3 font-mono text-[11px] leading-relaxed text-text">
            <div className="text-amber">WASH ALIGN (dev)</div>
            <div>
              dx {align.v.dx} · dy {align.v.dy} · scale {align.v.scale}
            </div>
            <div className="text-muted">arrows move · [ ] scale · shift ×10</div>
            <div className="mt-1 select-all text-success">
              washAlign: {`{ dx: ${align.v.dx}, dy: ${align.v.dy}, scale: ${align.v.scale} }`}
            </div>
            <button type="button" className="mt-2 underline" onClick={() => filmStore.get().scrollTarget?.(1)}>
              Jump to wash
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
