"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export interface SummaryRow {
  label: string;
  value?: string | null;
  strong?: boolean;
}

/** YOUR BOOKING: values flip in whenever they change; unset values show "—". */
export function SummaryCard({ rows }: { rows: SummaryRow[] }) {
  const reduce = useReducedMotion();
  return (
    <section aria-label="Your booking" className="rounded-[14px] border border-line-strong bg-[rgba(26,26,29,.6)] p-4">
      <h3 className="hud mb-3 text-[10px] text-muted">YOUR BOOKING</h3>
      <dl className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className={`flex items-baseline justify-between gap-4 ${r.strong ? "mt-1 border-t border-line pt-3" : ""}`}>
            <dt className={`text-[14px] ${r.strong ? "font-semibold text-text" : "text-muted"}`}>{r.label}</dt>
            <dd className="relative overflow-hidden text-right" style={{ perspective: 400 }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={r.value ?? "—"}
                  initial={reduce ? { opacity: 0 } : { rotateX: -90, opacity: 0, y: -6 }}
                  animate={{ rotateX: 0, opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { rotateX: 90, opacity: 0, y: 6 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className={`tabular inline-block ${r.value ? "text-red-hot" : "text-muted"} ${r.strong ? "text-[18px] font-semibold" : "text-[14px] font-medium"}`}
                  style={{ transformOrigin: "50% 50% -8px" }}
                >
                  {r.value || "—"}
                </motion.span>
              </AnimatePresence>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
