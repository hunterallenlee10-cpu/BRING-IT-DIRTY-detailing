"use client";

import { siteConfig } from "@/site.config";
import { filmStore, useFilm } from "@/lib/filmStore";
import { useBooking } from "@/components/booking/BookingContext";
import { Logo } from "@/components/ui/Logo";
import { CtaPill } from "@/components/ui/CtaPill";
import { PhoneIcon } from "@/components/ui/icons";
import { StatusPill } from "./StatusPill";
import { scrollToY } from "@/lib/lenis";

const chapterIndex = (id: string) => siteConfig.film.chapters.findIndex((c) => c.id === id);

export function TopBar() {
  const { open } = useBooking();
  const chapter = useFilm((s) => s.chapter);
  const inFilm = useFilm((s) => s.inFilm);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
        inFilm ? "border-b border-transparent" : "border-b border-line bg-[rgba(10,10,11,.78)] backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex items-start justify-between gap-4 px-4 pb-3 pt-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start">
          <a href="#top" onClick={(e) => (e.preventDefault(), scrollToY(0))} aria-label={`${siteConfig.brand.name} ${siteConfig.brand.suffix}, back to top`}>
            <Logo />
          </a>
          <div className={inFilm ? "" : "hidden sm:block"}>
            <StatusPill />
          </div>
        </div>

        <nav aria-label="Film" className="absolute left-1/2 top-6 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-1 font-mono text-[11px] tracking-[0.16em]">
            {siteConfig.film.nav.map((n, i) => {
              const ci = chapterIndex(n.chapter);
              const on = inFilm && chapter === ci;
              return (
                <li key={n.label} className="flex items-center">
                  {i > 0 && (
                    <span className="px-1 text-white/25" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => filmStore.get().scrollTarget?.(ci)}
                    className={`min-h-9 rounded-md px-2 transition-colors ${on ? "text-text" : "text-muted hover:text-text"}`}
                    aria-current={on ? "step" : undefined}
                  >
                    {n.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${siteConfig.brand.phoneE164}`}
            className="hidden min-h-11 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-text/90 hover:text-text lg:flex"
          >
            <PhoneIcon size={16} className="text-red-hot" />
            <span className="tabular">{siteConfig.brand.phone}</span>
          </a>
          <a
            href={`tel:${siteConfig.brand.phoneE164}`}
            aria-label={`Call ${siteConfig.brand.phone}`}
            className="grid h-11 w-11 place-items-center rounded-full bg-red text-white shadow-[0_0_18px_rgba(255,42,31,.5)] md:hidden"
          >
            <PhoneIcon size={18} />
          </a>
          <CtaPill onClick={() => open()} className="hidden sm:inline-flex">
            {siteConfig.copy.cta}
          </CtaPill>
        </div>
      </div>
    </header>
  );
}
