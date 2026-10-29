"use client";

import { useCallback, useRef, useState } from "react";
import { siteConfig } from "@/site.config";
import { Chevron } from "@/components/ui/icons";
import { Section } from "./Section";

const S = siteConfig.sections;
const items = siteConfig.gallery.items;
const src = (name: string) => ({ src: `/gallery/${name}-1600.webp`, srcSet: `/gallery/${name}-800.webp 800w, /gallery/${name}-1600.webp 1600w` });

/**
 * Before/after slider. Same metaphor as the film's wash: clean is revealed to the left of a glowing
 * water line, dirt stays to its right. Pointer drag anywhere on the frame; arrows/Home/End on the handle.
 */
export function BeforeAfter() {
  const [tab, setTab] = useState(0);
  const [pos, setPos] = useState(50);
  const frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromX = useCallback((x: number) => {
    const r = frame.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)));
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    let next = pos;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = pos - step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = pos + step;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 100;
    else return;
    e.preventDefault();
    setPos(Math.min(100, Math.max(0, next)));
  };

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + items.length) % items.length;
    setTab(n);
    (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
  };

  const item = items[tab];
  const tabs = (
    <div role="tablist" aria-label="Vehicle" className="flex flex-wrap gap-2">
      {items.map((g, i) => (
        <button
          key={g.id}
          id={`ba-tab-${g.id}`}
          type="button"
          role="tab"
          aria-selected={i === tab}
          aria-controls="ba-panel"
          tabIndex={i === tab ? 0 : -1}
          onKeyDown={(e) => onTabKey(e, i)}
          onClick={() => setTab(i)}
          className="selectable min-h-11 rounded-full px-5 font-mono text-[11px] tracking-[0.16em] text-text"
        >
          {g.label}
        </button>
      ))}
    </div>
  );

  return (
    <Section id="results" title={siteConfig.copy.beforeAfterTitle} sub={siteConfig.copy.beforeAfterSub} aside={tabs}>
      <div id="ba-panel" role="tabpanel" aria-labelledby={`ba-tab-${item.id}`}>
        <div
          ref={frame}
          className="relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-surface sm:aspect-[16/9]"
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            fromX(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && fromX(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          {/* after = clean, full frame */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={item.after}
            {...src(item.after)}
            sizes="(min-width: 1240px) 1176px, 100vw"
            alt={`${item.label.toLowerCase()} after a detail`}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* before = dirty, clipped to the right of the water line */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={item.before}
              {...src(item.before)}
              sizes="(min-width: 1240px) 1176px, 100vw"
              alt={`${item.label.toLowerCase()} before a detail`}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <span className="hud pointer-events-none absolute left-4 top-4 rounded-[6px] border border-line-strong bg-black/60 px-2.5 py-1.5 text-[10px] text-text">
            {S.afterLabel}
          </span>
          <span className="hud pointer-events-none absolute right-4 top-4 rounded-[6px] border border-line-strong bg-black/60 px-2.5 py-1.5 text-[10px] text-text">
            {S.beforeLabel}
          </span>
          {siteConfig.gallery.isSample && (
            <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-black/65 px-3 py-1.5 text-[12px] text-muted">{S.sampleNote}</span>
          )}

          {/* the water line */}
          <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
            <span aria-hidden="true" className="absolute inset-y-0 -left-[9px] w-[18px] bg-[rgba(120,220,255,.14)] blur-[3px]" />
            <span aria-hidden="true" className="absolute inset-y-0 -left-[1.25px] w-[2.5px] bg-white shadow-[0_0_10px_rgba(255,255,255,.95),0_0_26px_rgba(255,255,255,.55)]" />
          </div>
          <button
            type="button"
            role="slider"
            aria-label={S.sliderLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={`${Math.round(pos)}% after`}
            onKeyDown={onKey}
            className="absolute top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border border-white/40 bg-black/55 text-white shadow-[0_0_22px_rgba(255,255,255,.35)] backdrop-blur-md"
            style={{ left: `${pos}%` }}
          >
            <span className="flex items-center" aria-hidden="true">
              <Chevron size={12} dir="left" />
              <Chevron size={12} dir="right" />
            </span>
          </button>
        </div>
      </div>
    </Section>
  );
}
