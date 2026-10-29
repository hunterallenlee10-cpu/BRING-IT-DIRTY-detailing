"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/site.config";
import { LogoSquare } from "@/components/ui/Logo";
import { useLeads } from "./LeadsProvider";
import { NAV, isActive } from "./nav";
import { IconLogout } from "./AdminIcons";
import { signOut } from "@/app/admin/actions";

export function Sidebar() {
  const path = usePathname();
  const { leads, owner, live } = useLeads();
  const newCount = leads.filter((l) => l.status === "new").length;
  return (
    <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-6">
        <LogoSquare />
        <span className="flex flex-col leading-none">
          <span className="display text-[18px] tracking-[0.02em]">{siteConfig.brand.name}</span>
          <span className="mt-1 font-mono text-[9px] tracking-[0.28em] text-muted">STUDIO OS</span>
        </span>
      </div>
      <nav aria-label="Studio OS" className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {NAV.map((n) => {
            const on = isActive(path, n.href);
            const Icon = n.icon;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition-colors ${
                    on ? "text-white shadow-[0_0_22px_rgba(255,42,31,.35)]" : "text-muted hover:bg-white/5 hover:text-text"
                  }`}
                  style={on ? { background: "linear-gradient(90deg, #E8150B 0%, #FF4A1F 100%)" } : undefined}
                >
                  <Icon className="shrink-0" />
                  <span className="flex-1">{n.label}</span>
                  {n.badge && newCount > 0 && (
                    <span
                      className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold tabular ${on ? "bg-white text-red" : "bg-red text-white shadow-[0_0_10px_rgba(255,42,31,.6)]"}`}
                      aria-label={`${newCount} new`}
                    >
                      {newCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-line px-5 py-4">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${live === "live" ? "bg-success shadow-[0_0_8px_rgba(74,222,128,.8)]" : live === "offline" ? "bg-warn" : "bg-white/30"}`} aria-hidden="true" />
          {live === "live" ? "LIVE" : live === "offline" ? "RECONNECTING" : "CONNECTING"}
        </div>
        <p className="mt-2 truncate text-[13px] text-text/80" title={owner}>
          {owner}
        </p>
        <form action={signOut}>
          <button type="submit" className="mt-2 flex min-h-9 items-center gap-2 text-[13px] text-muted hover:text-text">
            <IconLogout className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
