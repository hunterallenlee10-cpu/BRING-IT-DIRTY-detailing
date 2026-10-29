"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileTabs } from "./MobileTabs";
import { AdminTopbar } from "./AdminTopbar";
import { Toasts } from "./Toasts";
import { LeadPanel } from "./LeadPanel";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <AdminTopbar />
        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>
      </div>
      <MobileTabs />
      <LeadPanel />
      <Toasts />
    </div>
  );
}

export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="display glow-white text-[44px] sm:text-[56px]">{title}</h1>
        {sub && <p className="mt-2 max-w-[62ch] text-[15px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
