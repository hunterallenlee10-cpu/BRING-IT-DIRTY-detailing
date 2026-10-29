"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig, type ServiceId, type VehicleId } from "@/site.config";
import { useFilm } from "@/lib/filmStore";
import { useBooking } from "@/components/booking/BookingContext";
import { CtaPill } from "@/components/ui/CtaPill";
import { Chevron, CheckIcon } from "@/components/ui/icons";
import { vehicleLabel, serviceById } from "@/lib/pricing";

type Which = "vehicle" | "service" | null;

/** Bottom-center glass dock: VEHICLE ▾ | SERVICE ▾ | BOOK. Visible in chapter 01 and 05. Prefills the drawer. */
export function BookingDock() {
  const chapter = useFilm((s) => s.chapter);
  const inFilm = useFilm((s) => s.inFilm);
  const { open, prefill, setPrefill, isOpen } = useBooking();
  const [menu, setMenu] = useState<Which>(null);
  const root = useRef<HTMLDivElement>(null);
  const last = siteConfig.film.chapters.length - 1;
  const show = inFilm && (chapter === 0 || chapter === last) && !isOpen;

  useEffect(() => {
    if (!show) setMenu(null);
  }, [show]);
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const vehicle = prefill.vehicle;
  const service = prefill.service;

  const Segment = ({ which, label, value }: { which: Exclude<Which, null>; label: string; value: string }) => (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={menu === which}
      onClick={() => setMenu(menu === which ? null : which)}
      className="flex min-h-11 items-center gap-3 rounded-full px-4 text-left transition-colors hover:bg-white/5"
    >
      <span className="flex flex-col leading-tight">
        <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.16em] text-muted">
          {label} <Chevron size={9} dir={menu === which ? "up" : "down"} />
        </span>
        <span className="text-[14px] font-medium text-text">{value}</span>
      </span>
    </button>
  );

  return (
    <div
      ref={root}
      className={`fixed bottom-6 left-1/2 z-40 hidden -translate-x-1/2 transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] md:block ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      aria-hidden={!show}
      inert={!show}
    >
      <div className="glass flex items-center gap-1 rounded-full p-1.5 pl-2 shadow-[0_18px_50px_rgba(0,0,0,.55)]">
        <Segment which="vehicle" label="VEHICLE" value={vehicle ? vehicleLabel(vehicle) : "Choose"} />
        <span className="h-7 w-px bg-white/12" aria-hidden="true" />
        <Segment which="service" label="SERVICE" value={service ? serviceById(service).name : "Choose"} />
        <span className="h-7 w-px bg-white/12" aria-hidden="true" />
        <CtaPill pulse={chapter === last} className="ml-1 min-h-11" onClick={() => open()}>
          {siteConfig.copy.cta}
        </CtaPill>
      </div>

      {menu && (
        <div
          role="menu"
          aria-label={menu === "vehicle" ? "Vehicle" : "Service"}
          className="glass absolute bottom-[calc(100%+10px)] left-2 min-w-[220px] rounded-[14px] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.6)]"
          style={menu === "service" ? { left: 150 } : undefined}
        >
          {menu === "vehicle"
            ? siteConfig.booking.vehicles.map((v) => (
                <MenuItem key={v.id} label={v.label} on={vehicle === v.id} onPick={() => (setPrefill({ vehicle: v.id as VehicleId }), setMenu(null))} />
              ))
            : siteConfig.services.map((s) => (
                <MenuItem key={s.id} label={s.name} hint={s.badge} on={service === s.id} onPick={() => (setPrefill({ service: s.id as ServiceId }), setMenu(null))} />
              ))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, hint, on, onPick }: { label: string; hint?: string; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={on}
      onClick={onPick}
      className={`flex min-h-11 w-full items-center justify-between gap-6 rounded-[10px] px-3 text-left text-[14px] transition-colors ${on ? "bg-red/15 text-text" : "text-text hover:bg-white/6"}`}
    >
      <span>{label}</span>
      <span className="flex items-center gap-2">
        {hint && <span className="font-mono text-[9px] tracking-[0.14em] text-muted">{hint}</span>}
        {on && <CheckIcon size={13} className="text-red-hot" />}
      </span>
    </button>
  );
}
