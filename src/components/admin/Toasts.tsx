"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLeads } from "./LeadsProvider";

export function Toasts() {
  const { toasts, dismiss } = useLeads();
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[90] flex flex-col items-end gap-2" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            layout
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto flex min-h-11 items-center gap-2.5 rounded-full px-4 text-[14px] font-semibold text-white ${
              t.tone === "lead"
                ? "border border-red-hot/60 bg-[rgba(40,8,6,.92)] shadow-[0_0_0_1px_rgba(255,42,31,.4),0_0_30px_rgba(255,42,31,.55)]"
                : t.tone === "error"
                  ? "border border-warn/50 bg-[rgba(40,30,6,.92)]"
                  : "border border-line-strong bg-surface-2"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${t.tone === "lead" ? "bg-red-hot shadow-[0_0_10px_rgba(255,42,31,1)]" : t.tone === "error" ? "bg-warn" : "bg-success"}`} aria-hidden="true" />
            {t.text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
