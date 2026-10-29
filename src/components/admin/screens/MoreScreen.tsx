"use client";

import Link from "next/link";
import { PageHead } from "../AdminShell";
import { NAV } from "../nav";

/** Phones only: the sections that don't fit the 5-tab bar. */
export function MoreScreen() {
  return (
    <>
      <PageHead title="MORE" />
      <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        {NAV.slice(4).map((n) => {
          const Icon = n.icon;
          return (
            <li key={n.href} className="border-b border-line last:border-b-0">
              <Link href={n.href} className="flex min-h-14 items-center gap-3 px-5 text-[16px] font-medium hover:bg-white/[.03]">
                <Icon className="text-muted" /> {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
