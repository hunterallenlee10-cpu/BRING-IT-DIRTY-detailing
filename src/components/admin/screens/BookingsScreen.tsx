"use client";

import { useMemo } from "react";
import { useLeads } from "../LeadsProvider";
import { PageHead } from "../AdminShell";
import { StatusPill } from "../Pills";
import { matchesQuery, serviceText, vehicleText } from "../format";
import { addDays, dateKey, formatDateShort, formatTime, weekdayLong, weekdayOfKey } from "@/lib/time";
import { money } from "@/lib/pricing";

export function BookingsScreen() {
  const { leads, now, select, query } = useLeads();
  const groups = useMemo(() => {
    const today = dateKey(now);
    const upcoming = leads
      .filter((l) => l.kind === "booking" && l.slot_start && dateKey(new Date(l.slot_start)) >= today && matchesQuery(l, query))
      .sort((a, b) => +new Date(a.slot_start!) - +new Date(b.slot_start!));
    const map = new Map<string, typeof upcoming>();
    for (const l of upcoming) {
      const k = dateKey(new Date(l.slot_start!));
      map.set(k, [...(map.get(k) ?? []), l]);
    }
    return [...map.entries()].map(([k, list]) => ({
      key: k,
      title: k === today ? "Today" : k === addDays(today, 1) ? "Tomorrow" : weekdayLong(weekdayOfKey(k)),
      list,
    }));
  }, [leads, now, query]);

  return (
    <>
      <PageHead title="BOOKINGS" sub="Upcoming drop-offs by day, with when each car is ready." />
      {!groups.length && <p className="rounded-[var(--radius-card)] border border-line bg-surface px-5 py-12 text-center text-muted">No upcoming bookings.</p>}
      <div className="flex flex-col gap-8">
        {groups.map((g) => (
          <section key={g.key} aria-labelledby={`d-${g.key}`}>
            <h2 id={`d-${g.key}`} className="mb-3 flex items-baseline gap-3">
              <span className="display text-[28px]">{g.title.toUpperCase()}</span>
              <span className="text-[14px] text-muted">{formatDateShort(new Date(g.list[0].slot_start!))}</span>
              <span className="hud text-[10px] text-muted">
                {g.list.length} {g.list.length === 1 ? "CAR" : "CARS"}
              </span>
            </h2>
            <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              {g.list.map((l) => (
                <li key={l.id} className="border-b border-line last:border-b-0">
                  <button type="button" onClick={() => select(l.id)} className="grid min-h-16 w-full grid-cols-[64px_1fr_auto] items-center gap-4 px-5 py-3 text-left hover:bg-white/[.03] md:grid-cols-[72px_1.4fr_1fr_1fr_auto]">
                    <span className="display tabular text-[24px] text-red-hot">{formatTime(new Date(l.slot_start!))}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{l.name}</span>
                      <span className="block text-[13px] text-muted md:hidden">
                        {vehicleText(l)} · {serviceText(l)}
                      </span>
                    </span>
                    <span className="hidden text-[15px] text-text/90 md:block">
                      {vehicleText(l)} · {serviceText(l)}
                      {l.est_price ? <span className="text-muted"> · {money(l.est_price)}</span> : null}
                    </span>
                    <span className="hidden text-[14px] text-muted md:block">
                      Ready {l.ready_at ? formatDateShort(new Date(l.ready_at)) : "same day"}
                    </span>
                    <StatusPill status={l.status} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
