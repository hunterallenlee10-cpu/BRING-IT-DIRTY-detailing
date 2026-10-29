"use client";

import { siteConfig, type VehicleId } from "@/site.config";
import { VehicleIcon } from "./icons/VehicleIcon";
import { CheckBadge } from "@/components/ui/CheckBadge";

export function CarTiles({ value, onChange }: { value?: VehicleId; onChange: (v: VehicleId) => void }) {
  const list = siteConfig.booking.vehicles;
  const move = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = list[(i + d + list.length) % list.length];
    onChange(next.id);
    (e.currentTarget.parentElement?.children[(i + d + list.length) % list.length] as HTMLElement)?.focus();
  };
  return (
    <div role="radiogroup" aria-label="Your car" className="grid grid-cols-4 gap-2">
      {list.map((v, i) => {
        const on = value === v.id;
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (!value && i === 0) ? 0 : -1}
            onKeyDown={(e) => move(e, i)}
            onClick={() => onChange(v.id)}
            className="selectable flex aspect-square flex-col items-center justify-center gap-2 rounded-[12px] px-1 text-[13px] font-medium text-text"
          >
            {on && <CheckBadge />}
            <VehicleIcon type={v.id} className={`h-auto w-[78%] transition-colors ${on ? "text-red-hot" : "text-text/80"}`} />
            <span>{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}
