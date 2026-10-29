"use client";

import { useMemo, useState } from "react";
import { siteConfig } from "@/site.config";
import { useLeads } from "../LeadsProvider";
import { PageHead } from "../AdminShell";
import { serviceText } from "../format";
import { weekRange } from "../week";
import { dateKey, formatDateShort, formatTime, hoursFor, prettyTime, weekdayOfKey, weekdayShort } from "@/lib/time";
import { slotStartUtc } from "../slot";
import { Chevron } from "@/components/ui/icons";

export function CalendarScreen() {
  const { leads, now, select } = useLeads();
  const [offset, setOffset] = useState(0);
  const { days, from, to } = useMemo(() => weekRange(now, offset), [now, offset]);
  const today = dateKey(now);

  const { rows, cell } = useMemo(() => {
    const week = leads.filter((l) => l.kind === "booking" && l.slot_start && +new Date(l.slot_start) >= +from && +new Date(l.slot_start) < +to && l.status !== "lost");
    // rows = configured slot times plus any off-grid times that were booked by hand
    const times = new Set(siteConfig.booking.slotTimes);
    week.forEach((l) => times.add(formatTime(new Date(l.slot_start!))));
    const rows = [...times].sort();
    const cell = new Map<string, typeof week>();
    week.forEach((l) => {
      const key = `${dateKey(new Date(l.slot_start!))}|${formatTime(new Date(l.slot_start!))}`;
      cell.set(key, [...(cell.get(key) ?? []), l]);
    });
    return { rows, cell };
  }, [leads, from, to]);

  const label = `${formatDateShort(from)} – ${formatDateShort(new Date(+to - 86_400_000))}`;
  return (
    <>
      <PageHead
        title="CALENDAR"
        sub={`Week of ${label}. Red blocks are booked.`}
        right={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOffset((o) => o - 1)} aria-label="Previous week" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong text-text hover:border-white/30">
              <Chevron dir="left" />
            </button>
            <button type="button" onClick={() => setOffset(0)} disabled={offset === 0} className="min-h-11 rounded-full border border-line-strong px-4 text-[13px] font-semibold text-text disabled:opacity-40">
              This week
            </button>
            <button type="button" onClick={() => setOffset((o) => o + 1)} aria-label="Next week" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong text-text hover:border-white/30">
              <Chevron dir="right" />
            </button>
          </div>
        }
      />
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-[14px]">
          <caption className="sr-only">Bookings for the week of {label}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[72px] border-b border-line p-3" />
              {days.map((d) => {
                const closed = !hoursFor(weekdayOfKey(d));
                return (
                  <th key={d} scope="col" className={`border-b border-l border-line p-3 text-left font-normal ${d === today ? "bg-red/10" : ""}`}>
                    <span className={`block font-mono text-[10px] tracking-[0.14em] ${d === today ? "text-red-hot" : "text-muted"}`}>{weekdayShort(weekdayOfKey(d)).toUpperCase()}</span>
                    <span className={`display mt-1 block text-[22px] ${closed ? "text-muted" : ""}`}>{Number(d.slice(8))}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t}>
                <th scope="row" className="border-b border-line p-3 text-left font-mono text-[12px] font-normal text-muted tabular">
                  {prettyTime(t)}
                </th>
                {days.map((d) => {
                  const h = hoursFor(weekdayOfKey(d));
                  const items = cell.get(`${d}|${t}`) ?? [];
                  const past = +slotStartUtc(d, t) < +now;
                  return (
                    <td key={d} className={`h-[74px] border-b border-l border-line p-1.5 align-top ${!h ? "bg-[repeating-linear-gradient(135deg,transparent_0_8px,rgba(255,255,255,.025)_8px_16px)]" : ""} ${d === today ? "bg-red/[.04]" : ""}`}>
                      {items.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => select(l.id)}
                          className={`mb-1 block w-full rounded-[8px] px-2.5 py-2 text-left text-white shadow-[0_0_16px_rgba(255,42,31,.35)] transition-transform hover:scale-[1.02] ${past ? "opacity-60" : ""}`}
                          style={{ background: "linear-gradient(135deg, #E8150B, #B80F07)" }}
                        >
                          <span className="block truncate text-[13px] font-semibold">{l.name}</span>
                          <span className="block truncate text-[12px] text-white/80">{serviceText(l)}</span>
                        </button>
                      ))}
                      {!h && items.length === 0 && t === rows[0] && <span className="block px-1 pt-1 font-mono text-[10px] text-muted">CLOSED</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
