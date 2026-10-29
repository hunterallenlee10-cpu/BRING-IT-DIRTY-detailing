"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Lead } from "@/lib/db/types";
import { relativeTime } from "@/lib/time";
import { useLeads } from "./LeadsProvider";
import { FollowUp, NewChip, SourcePill, StatusPill } from "./Pills";
import { isNewLead, serviceText, vehicleText, whenLabel } from "./format";

const COLS = "md:grid md:grid-cols-[minmax(170px,1.45fr)_0.75fr_0.8fr_1.05fr_0.95fr_0.85fr_1.35fr] md:items-center md:gap-4";

export function LeadsTable({ leads, empty = "No leads match." }: { leads: Lead[]; empty?: string }) {
  const { now, highlighted, select, selectedId } = useLeads();
  const reduce = useReducedMotion();
  return (
    <div role="table" aria-label="Leads" className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      <div role="row" className={`hidden border-b border-line px-5 py-3 font-mono text-[10px] tracking-[0.14em] text-muted ${COLS}`}>
        {["CUSTOMER", "VEHICLE", "SERVICE", "WHEN", "SOURCE", "STATUS", "FOLLOW-UP"].map((h) => (
          <span key={h} role="columnheader">
            {h}
          </span>
        ))}
      </div>
      <div role="rowgroup">
        <AnimatePresence initial={false}>
          {leads.map((l) => {
            const hot = highlighted.has(l.id);
            return (
              <motion.div
                key={l.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: -18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
                role="row"
                tabIndex={0}
                aria-selected={selectedId === l.id}
                onClick={() => select(l.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), select(l.id))}
                className={`relative cursor-pointer border-b border-line px-5 py-4 text-[15px] outline-none transition-colors last:border-b-0 hover:bg-white/[.03] focus-visible:bg-white/[.05] focus-visible:shadow-[inset_0_0_0_2px_var(--red-hot)] ${COLS}`}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 transition-opacity duration-[1400ms] ease-out"
                  style={{ opacity: hot ? 1 : 0, background: "linear-gradient(90deg, rgba(232,21,11,.85), rgba(232,21,11,.35))" }}
                />
                {/* customer */}
                <span role="cell" className="relative flex items-start justify-between gap-3 md:block">
                  <span>
                    <span className="flex items-center font-semibold text-text">
                      {l.name}
                      {isNewLead(l, now) && <NewChip />}
                    </span>
                    <span className={`mt-0.5 block text-[13px] ${hot ? "text-white/80" : "text-muted"}`}>{relativeTime(new Date(l.created_at), now)}</span>
                  </span>
                  <span className="md:hidden">
                    <StatusPill status={l.status} />
                  </span>
                </span>
                <span role="cell" className="relative mt-2 inline-block text-text/90 md:mt-0">
                  {vehicleText(l)}
                  <span className="text-muted md:hidden">&nbsp;·&nbsp;</span>
                </span>
                <span role="cell" className="relative inline-block text-text/90">
                  {serviceText(l)}
                  <span className="text-muted md:hidden">&nbsp;·&nbsp;</span>
                </span>
                <span role="cell" className="relative inline-block tabular text-text/90">
                  {whenLabel(l, now)}
                </span>
                <span role="cell" className="relative mt-2 ml-2 inline-block align-middle md:mt-0 md:ml-0">
                  <SourcePill source={l.source} />
                </span>
                <span role="cell" className="relative hidden md:block">
                  <StatusPill status={l.status} />
                </span>
                <span role="cell" className="relative mt-2 block md:mt-0">
                  <FollowUp text={l.follow_up} />
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!leads.length && <p className="px-5 py-12 text-center text-[15px] text-muted">{empty}</p>}
      </div>
    </div>
  );
}
