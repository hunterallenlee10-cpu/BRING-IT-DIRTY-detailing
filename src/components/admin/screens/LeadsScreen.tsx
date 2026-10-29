"use client";

import { useMemo, useState } from "react";
import type { Lead } from "@/lib/db/types";
import { useLeads } from "../LeadsProvider";
import { LeadsTable } from "../LeadsTable";
import { PageHead } from "../AdminShell";
import { followUpOk, matchesQuery } from "../format";

const FILTERS = [
  { id: "all", label: "ALL", test: () => true },
  { id: "new", label: "NEW", test: (l: Lead) => l.status === "new" },
  { id: "booked", label: "BOOKED", test: (l: Lead) => l.status === "booked" },
  { id: "follow", label: "FOLLOW UP", test: (l: Lead) => l.status === "follow_up" || l.status === "quote" || (!!l.follow_up && !followUpOk(l.follow_up) && l.status !== "done" && l.status !== "lost") },
] as const;

export function LeadsScreen() {
  const { leads, query } = useLeads();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    return leads.filter((l) => f.test(l) && matchesQuery(l, query)).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [leads, filter, query]);

  return (
    <>
      <PageHead
        title="LEADS"
        sub="Every booking and question from your website, Google and ChatGPT. Followed up automatically."
        right={
          <div role="tablist" aria-label="Filter leads" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const on = filter === f.id;
              const n = leads.filter((l) => f.test(l)).length;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFilter(f.id)}
                  className={`flex min-h-10 items-center gap-2 rounded-full px-4 font-mono text-[11px] font-semibold tracking-[0.12em] transition-all ${
                    on ? "bg-orange text-white shadow-[0_0_22px_rgba(255,90,31,.55)]" : "border border-line-strong text-muted hover:border-white/30 hover:text-text"
                  }`}
                >
                  {f.label}
                  <span className={`tabular text-[10px] ${on ? "text-white/80" : "text-muted"}`}>{n}</span>
                </button>
              );
            })}
          </div>
        }
      />
      <LeadsTable leads={rows} empty={query ? `Nothing matches “${query}”.` : "No leads here yet."} />
    </>
  );
}
