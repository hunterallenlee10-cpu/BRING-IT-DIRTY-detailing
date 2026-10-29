"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLeads } from "../LeadsProvider";
import { PageHead } from "../AdminShell";
import { KpiTile } from "../KpiTile";
import { LeadsTable } from "../LeadsTable";
import { StatusPill } from "../Pills";
import { serviceText, shortDuration, vehicleText } from "../format";
import { weekRange } from "../week";
import { dateKey, formatTime } from "@/lib/time";
import { money } from "@/lib/pricing";

export function OverviewScreen() {
  const { leads, now, select } = useLeads();
  const k = useMemo(() => {
    const today = dateKey(now);
    const { from, to } = weekRange(now);
    const active = (s: string) => s !== "lost";
    const newToday = leads.filter((l) => dateKey(new Date(l.created_at)) === today).length;
    const week = leads.filter((l) => l.kind === "booking" && l.slot_start && +new Date(l.slot_start) >= +from && +new Date(l.slot_start) < +to && active(l.status));
    const revenue = week.reduce((a, l) => a + (l.est_price ?? 0), 0);
    const responded = leads.filter((l) => l.follow_up_at && l.follow_up?.startsWith("✓"));
    const avg = responded.length ? responded.reduce((a, l) => a + (+new Date(l.follow_up_at!) - +new Date(l.created_at)), 0) / responded.length : null;
    const dropoffs = leads
      .filter((l) => l.kind === "booking" && l.slot_start && dateKey(new Date(l.slot_start)) === today && active(l.status))
      .sort((a, b) => +new Date(a.slot_start!) - +new Date(b.slot_start!));
    return { newToday, week: week.length, revenue, avg, dropoffs };
  }, [leads, now]);
  const latest = useMemo(() => [...leads].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5), [leads]);

  return (
    <>
      <PageHead title="OVERVIEW" sub="Today at a glance. New leads land here the second they book." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiTile label="NEW LEADS TODAY" value={String(k.newToday)} accent />
        <KpiTile label="BOOKINGS THIS WEEK" value={String(k.week)} />
        <KpiTile label="EST. REVENUE THIS WEEK" value={money(k.revenue)} note="Sum of booking estimates" />
        <KpiTile label="AVG. FIRST RESPONSE" value={k.avg == null ? "—" : shortDuration(k.avg)} note="Lead in → first text out" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section aria-labelledby="dropoffs" className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <h2 id="dropoffs" className="hud text-[11px] text-muted">
            TODAY&apos;S DROP-OFFS
          </h2>
          {k.dropoffs.length ? (
            <ul className="mt-4 flex flex-col gap-2">
              {k.dropoffs.map((l) => (
                <li key={l.id}>
                  <button type="button" onClick={() => select(l.id)} className="flex min-h-14 w-full items-center gap-4 rounded-[10px] border border-line bg-surface-2 px-4 text-left hover:border-white/25">
                    <span className="display tabular text-[24px] text-red-hot">{formatTime(new Date(l.slot_start!))}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{l.name}</span>
                      <span className="block text-[13px] text-muted">
                        {vehicleText(l)} · {serviceText(l)}
                      </span>
                    </span>
                    <StatusPill status={l.status} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[15px] text-muted">No drop-offs today.</p>
          )}
        </section>
        <section aria-labelledby="latest">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="latest" className="hud text-[11px] text-muted">
              LATEST LEADS
            </h2>
            <Link href="/admin/leads" className="text-[14px] font-medium text-text/85 underline decoration-white/30 underline-offset-4 hover:text-text">
              All leads
            </Link>
          </div>
          <LeadsTable leads={latest} />
        </section>
      </div>
    </>
  );
}
