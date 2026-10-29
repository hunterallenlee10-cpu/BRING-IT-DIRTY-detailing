"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/site.config";
import { DAY_KEYS, openStatus, weekdayLong, zoned } from "@/lib/time";
import { to12 } from "@/lib/hoursFormat";
import { PinIcon } from "@/components/ui/icons";

const ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Hours table; today's row is highlighted in the studio's own timezone once the page is in the browser. */
export function HoursTable() {
  const [today, setToday] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const tick = () => {
      setToday(zoned(new Date()).weekday);
      setOpen(openStatus().open);
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <table className="w-full border-collapse text-[16px]">
      <caption className="sr-only">Opening hours ({siteConfig.brand.timezone.replace("_", " ")} time)</caption>
      <tbody>
        {ORDER.map((wd) => {
          const h = siteConfig.hours[DAY_KEYS[wd]];
          const isToday = wd === today;
          return (
            <tr key={wd} className={`border-b border-line last:border-0 ${isToday ? "bg-red/10" : ""}`} aria-current={isToday ? "date" : undefined}>
              <th scope="row" className={`py-3 pl-3 pr-4 text-left font-medium ${isToday ? "text-text" : "text-text/80"}`}>
                <span className="flex items-center gap-2.5">
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${isToday ? (open ? "bg-success shadow-[0_0_8px_rgba(74,222,128,.9)]" : "bg-red-hot") : "bg-transparent"}`} />
                  {weekdayLong(wd)}
                  {isToday && <span className="font-mono text-[10px] tracking-[0.14em] text-muted">{open ? "OPEN NOW" : "TODAY"}</span>}
                </span>
              </th>
              <td className={`tabular py-3 pr-3 text-right ${h ? (isToday ? "text-text" : "text-text/80") : "text-muted"}`}>{h ? `${to12(h[0])} – ${to12(h[1])}` : "Closed"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Map stays a static card until the visitor asks for it: no Google requests on page load. */
export function MapEmbed() {
  const [show, setShow] = useState(false);
  const src = siteConfig.brand.mapsEmbedUrl;
  if (!src) return null;
  const a = siteConfig.brand.address;
  const label = `${a.street}, ${a.city}, ${a.region} ${a.postal}`;
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-surface">
      {show ? (
        <iframe src={src} title={`Map: ${label}`} className="absolute inset-0 h-full w-full border-0 [filter:invert(.9)_hue-rotate(180deg)_saturate(.6)]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <button
          type="button"
          onClick={() => setShow(true)}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_45%,rgba(255,42,31,.18),transparent_55%),repeating-linear-gradient(0deg,transparent_0_38px,rgba(255,255,255,.04)_38px_39px),repeating-linear-gradient(90deg,transparent_0_38px,rgba(255,255,255,.04)_38px_39px)] text-text"
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-red text-white shadow-[0_0_26px_rgba(255,42,31,.6)] transition-transform group-hover:scale-105">
            <PinIcon size={24} />
          </span>
          <span className="text-[16px] font-semibold">{siteConfig.sections.mapCta}</span>
          <span className="text-[14px] text-muted">{label}</span>
        </button>
      )}
    </div>
  );
}
