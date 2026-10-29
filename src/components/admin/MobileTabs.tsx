"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLeads } from "./LeadsProvider";
import { NAV, isActive } from "./nav";
import { IconMore } from "./AdminIcons";

const TABS = [NAV[0], NAV[1], NAV[2], NAV[3]];

/** Phones: the sidebar becomes a 5-item bottom tab bar; "More" holds the rest. */
export function MobileTabs() {
  const path = usePathname();
  const { leads } = useLeads();
  const newCount = leads.filter((l) => l.status === "new").length;
  const moreOn = !TABS.some((t) => isActive(path, t.href));
  return (
    <nav aria-label="Studio OS" className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-[rgba(18,18,20,.94)] backdrop-blur-md lg:hidden">
      <ul className="grid grid-cols-5">
        {[...TABS, { href: "/admin/more", label: "More", icon: IconMore }].map((t) => {
          const on = t.href === "/admin/more" ? moreOn : isActive(path, t.href);
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={on ? "page" : undefined} className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-medium ${on ? "text-red-hot" : "text-muted"}`}>
                <Icon />
                {t.label}
                {t.label === "Leads" && newCount > 0 && (
                  <span className="absolute right-[22%] top-2 grid h-4 min-w-4 place-items-center rounded-full bg-red px-1 text-[10px] font-bold text-white">{newCount}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
