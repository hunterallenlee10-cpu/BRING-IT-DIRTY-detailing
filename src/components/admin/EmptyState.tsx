import type { ReactNode } from "react";
import { PageHead } from "./AdminShell";

export function EmptyState({ title, sub, icon, line }: { title: string; sub: string; icon: ReactNode; line: string }) {
  return (
    <>
      <PageHead title={title} sub={sub} />
      <div className="grid place-items-center rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface px-6 py-20 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full border border-red/40 bg-red/10 text-red-hot shadow-[0_0_24px_rgba(255,42,31,.25)] [&_svg]:h-6 [&_svg]:w-6">{icon}</span>
        <p className="mt-5 text-[18px] font-semibold">Coming soon</p>
        <p className="mt-1 max-w-[42ch] text-[15px] text-muted">{line}</p>
      </div>
    </>
  );
}
