"use client";

import { useState } from "react";
import { siteConfig, type VehicleId } from "@/site.config";
import { useBooking } from "@/components/booking/BookingContext";
import { money, priceFor } from "@/lib/pricing";
import { CheckIcon } from "@/components/ui/icons";
import { Arrow } from "@/components/ui/Arrow";
import { Section } from "./Section";

const S = siteConfig.sections;

export function Services() {
  const { open, prefill, setPrefill } = useBooking();
  const [vehicle, setVehicle] = useState<VehicleId>(prefill.vehicle ?? "sedan");
  const sizes = siteConfig.booking.vehicles;
  const pick = (v: VehicleId) => {
    setVehicle(v);
    setPrefill({ vehicle: v });
  };
  const move = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + sizes.length) % sizes.length;
    pick(sizes[n].id);
    (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
  };

  const toggle = (
    <div className="flex flex-col gap-2.5">
      <span id="size-label" className="hud text-[10px] text-muted">
        {S.servicesSizeLabel}
      </span>
      <div role="radiogroup" aria-labelledby="size-label" className="inline-flex w-fit rounded-full border border-line-strong bg-surface p-1">
        {sizes.map((v, i) => {
          const on = v.id === vehicle;
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onKeyDown={(e) => move(e, i)}
              onClick={() => pick(v.id)}
              className={`min-h-11 rounded-full px-4 text-[15px] font-medium transition-[background-color,color,box-shadow] duration-200 sm:px-5 ${
                on ? "bg-red text-white shadow-[0_0_18px_rgba(255,42,31,.55)]" : "text-muted hover:text-text"
              }`}
            >
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Section id="services" title={siteConfig.copy.servicesTitle} sub={siteConfig.copy.servicesSub} aside={toggle}>
      <div className="grid gap-4 lg:grid-cols-3">
        {siteConfig.services.map((s, i) => {
          const flagship = i === siteConfig.services.length - 1;
          return (
            <article
              key={s.id}
              className={`relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border p-7 sm:p-8 lg:min-h-[600px] ${
                flagship
                  ? "border-red/60 bg-[linear-gradient(180deg,#1f0f0c_0%,#121214_60%)] shadow-[0_0_0_1px_rgba(255,42,31,.2),0_30px_80px_-20px_rgba(255,42,31,.35)]"
                  : "border-line-strong bg-surface"
              }`}
            >
              {flagship && <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red/25 blur-3xl" />}
              <div className="relative flex items-start justify-between gap-4">
                <h3 className="display text-[56px] text-text">{s.name}</h3>
                <span className={`mt-2 rounded-[5px] px-2 py-1 font-mono text-[10px] tracking-[0.14em] ${flagship ? "bg-red text-white" : "bg-white/8 text-text/80"}`}>
                  {s.badge}
                </span>
              </div>
              <p className="relative mt-3 text-[17px] text-text/85">{s.tagline}</p>

              <div className="relative mt-8 flex items-baseline gap-2">
                <span className="text-[15px] text-muted">from</span>
                <span className="tabular display text-[64px] leading-none text-text">{money(priceFor(s.id, vehicle))}</span>
              </div>
              <p className="relative mt-2 text-[14px] text-muted">{sizes.find((v) => v.id === vehicle)?.label}</p>

              <ul className="relative mt-8 flex flex-1 flex-col gap-3 border-t border-line pt-7">
                {s.includes.map((line) => (
                  <li key={line} className="flex gap-3 text-[16px] leading-snug text-text/90">
                    <CheckIcon size={16} className="mt-[3px] shrink-0 text-red-hot" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => open({ service: s.id, vehicle })}
                className={`relative mt-9 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-[12px] text-[13px] font-semibold uppercase tracking-[0.08em] transition-[filter,transform,border-color] active:scale-[.98] ${
                  flagship ? "text-white shadow-[var(--glow-cta)] hover:brightness-110" : "border border-line-strong bg-surface-2 text-text hover:border-white/30"
                }`}
                style={flagship ? { background: "var(--cta-gradient)" } : undefined}
              >
                {S.bookThis}
                <span className="sr-only">: {s.name}</span>
                <Arrow />
              </button>
            </article>
          );
        })}
      </div>
      <p className="mt-6 max-w-[70ch] text-[15px] text-muted">{S.servicesFootnote}</p>
    </Section>
  );
}
