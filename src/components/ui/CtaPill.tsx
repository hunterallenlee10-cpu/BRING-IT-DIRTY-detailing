"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Arrow } from "./Arrow";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pulse?: boolean;
  arrow?: boolean;
};

export function CtaPill({ children, pulse = false, arrow = true, className = "", ...rest }: Props) {
  return (
    <button type="button" data-pulse={pulse} className={`cta-pill ${className}`} {...rest}>
      <span>{children}</span>
      {arrow && (
        <span className="arrow" aria-hidden="true">
          <Arrow />
        </span>
      )}
    </button>
  );
}

export function CtaLink({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a href={href} className={`cta-pill ${className}`}>
      <span>{children}</span>
      <span className="arrow" aria-hidden="true">
        <Arrow />
      </span>
    </a>
  );
}
