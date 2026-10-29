"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { siteConfig } from "@/site.config";
import { openStatus, type OpenStatus } from "@/lib/time";
import { useFilm } from "@/lib/filmStore";

const steps = siteConfig.film.chapters.map((c) => c.step);

/** ● STUDIO OPEN │ BOOKING THIS WEEK. Right half rolls to the current film step. */
export function StatusPill() {
  const chapter = useFilm((s) => (s.inFilm ? s.chapter : 0));
  const [status, setStatus] = useState<OpenStatus | null>(null);
  const col = useRef<HTMLSpanElement>(null);
  const [w, setW] = useState<number | undefined>(undefined);

  // the window sizes to the current step, so the pill never carries empty space
  useLayoutEffect(() => {
    const measure = () => {
      const el = col.current?.children[chapter] as HTMLElement | undefined;
      if (el) setW(el.scrollWidth);
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [chapter]);

  useEffect(() => {
    const tick = () => setStatus(openStatus());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const open = status?.open;
  return (
    <div className="glass mt-2.5 inline-flex h-7 items-center gap-2.5 rounded-full px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text">
      <span className={`flex items-center gap-2 whitespace-nowrap transition-opacity duration-300 ${status ? "opacity-100" : "opacity-0"}`}>
        <span
          className={`h-1.5 w-1.5 rounded-full ${open ? "bg-success shadow-[0_0_8px_rgba(74,222,128,.9)]" : "bg-[#6b6b70]"}`}
          aria-hidden="true"
        />
        <span>{status ? (open ? "STUDIO OPEN" : `CLOSED · ${status.nextLabel}`) : "STUDIO OPEN"}</span>
      </span>
      <span className="h-3 w-px bg-white/20" aria-hidden="true" />
      <span
        className="relative block h-[13px] overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
        style={{ width: w }}
        aria-live="polite"
      >
        <span
          ref={col}
          className="flex w-max flex-col transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
          style={{ transform: `translateY(${-chapter * 13}px)` }}
        >
          {steps.map((s, i) => (
            <span key={s} className={`block w-max h-[13px] leading-[13px] whitespace-nowrap ${i === chapter ? "text-text" : "text-muted"}`} aria-hidden={i !== chapter}>
              {s}
            </span>
          ))}
        </span>
      </span>
    </div>
  );
}
