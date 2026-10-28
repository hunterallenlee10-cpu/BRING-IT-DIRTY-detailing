"use client";

import type { ReactNode } from "react";
import { useReveal } from "./useReveal";

/** Client wrapper so server sections can use reveal headlines. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
