"use client";

import { siteConfig, type ServiceId, type VehicleId } from "@/site.config";
import { money, priceFor } from "@/lib/pricing";

export function WorkCards({ value, vehicle, onChange }: { value?: ServiceId; vehicle?: VehicleId; onChange: (v: ServiceId) => void }) {
  const list = siteConfig.services;
  const move = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + list.length) % list.length;
    onChange(list[n].id);
    (e.currentTarget.parentElement?.children[n] as HTMLElement)?.focus();
  };
  return (
    <div role="radiogroup" aria-label="The work" className="flex flex-col gap-2">
      {list.map((s, i) => {
        const on = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${s.name}, ${s.badge.toLowerCase()}, from ${money(priceFor(s.id, vehicle))}. ${s.tagline}`}
            tabIndex={on || (!value && i === 0) ? 0 : -1}
            onKeyDown={(e) => move(e, i)}
            onClick={() => onChange(s.id)}
            className="selectable flex min-h-[68px] items-center gap-3 rounded-[12px] px-4 py-3 text-left"
          >
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${on ? "border-red bg-red shadow-[0_0_10px_rgba(255,42,31,.7)]" : "border-white/30"}`}
              aria-hidden="true"
            >
              {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[16px] font-semibold text-text">{s.name}</span>
                <span
                  className={`rounded-[4px] px-1.5 py-[3px] font-mono text-[9px] tracking-[0.14em] transition-colors ${on ? "bg-red text-white" : "bg-white/8 text-muted"}`}
                >
                  {s.badge}
                </span>
              </span>
              <span className="mt-0.5 block text-[14px] leading-snug text-muted">{s.tagline}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-mono text-[9px] tracking-[0.14em] text-muted">FROM</span>
              <span className="tabular block text-[16px] font-semibold text-text">{money(priceFor(s.id, vehicle))}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
