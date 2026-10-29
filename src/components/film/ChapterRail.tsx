"use client";

import { siteConfig } from "@/site.config";
import { filmStore, useFilm } from "@/lib/filmStore";

/** Right-edge chapter rail (desktop). Click jumps to that chapter. */
export function ChapterRail() {
  const chapter = useFilm((s) => s.chapter);
  const inFilm = useFilm((s) => s.inFilm);
  return (
    <nav
      aria-label="Film chapters"
      className={`fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 transition-opacity duration-500 lg:block ${inFilm ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <ol className="flex flex-col gap-1">
        {siteConfig.film.chapters.map((c, i) => {
          const on = i === chapter;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => filmStore.get().scrollTarget?.(i)}
                aria-current={on ? "step" : undefined}
                className={`group flex min-h-9 items-center justify-end gap-3 rounded-md px-2 font-mono text-[10px] tracking-[0.16em] transition-colors ${on ? "text-text" : "text-muted hover:text-text"}`}
              >
                <span className="tabular">{c.num}</span>
                <span className="w-[62px] text-left">{c.rail}</span>
                <span
                  className={`block h-[2px] rounded-full transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${on ? "w-7 bg-red shadow-[0_0_10px_rgba(255,42,31,.8)]" : "w-3 bg-white/25 group-hover:bg-white/50"}`}
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
