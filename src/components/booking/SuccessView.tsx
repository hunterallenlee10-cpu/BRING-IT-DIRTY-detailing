"use client";

import { motion, useReducedMotion } from "motion/react";
import { siteConfig } from "@/site.config";
import { Confetti } from "./Confetti";

export function SuccessView({
  title = "YOU'RE BOOKED,",
  firstName,
  slotLabel,
  sub = siteConfig.copy.successSub,
  onDone,
}: {
  title?: string;
  firstName: string;
  slotLabel?: string | null;
  sub?: string;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex min-h-[460px] flex-col items-center justify-center px-6 py-12 text-center">
      <Confetti fire={1} />
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" className="drop-shadow-[0_0_18px_rgba(255,42,31,.65)]">
        <motion.circle
          cx="48"
          cy="48"
          r="42"
          fill="none"
          stroke="var(--red-hot)"
          strokeWidth="3"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
        />
        <motion.path
          d="M30 49 L43 62 L67 36"
          fill="none"
          stroke="var(--red-hot)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: reduce ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <motion.h2
        id="booking-success-title"
        className="display glow-white mt-8 text-[44px]"
        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {title}
        <br />
        <span className="text-amber">{firstName.toUpperCase()}.</span>
      </motion.h2>
      {slotLabel && (
        <motion.p
          className="mt-5 font-mono text-[13px] tracking-[0.14em] text-orange"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.8 }}
        >
          {slotLabel}
        </motion.p>
      )}
      <motion.p className="mt-3 max-w-[30ch] text-[16px] text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.9 }}>
        {sub}
      </motion.p>
      <button type="button" onClick={onDone} className="cta-pill mt-9 min-w-[140px]" autoFocus>
        <span>DONE</span>
      </button>
    </div>
  );
}
