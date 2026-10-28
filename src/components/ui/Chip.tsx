"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  children: ReactNode;
  size?: "sm" | "md";
};

/** Selectable chip. Selected = red border + red glow + warmer surface. */
export function Chip({ selected = false, children, size = "md", className = "", ...rest }: Props) {
  const pad = size === "sm" ? "min-h-9 px-3 text-[12px]" : "min-h-11 px-4 text-[14px]";
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`selectable inline-flex items-center justify-center gap-2 rounded-full font-medium text-text disabled:opacity-35 ${pad} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
