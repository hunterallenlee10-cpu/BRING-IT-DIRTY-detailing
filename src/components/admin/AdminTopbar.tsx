"use client";

import { usePathname } from "next/navigation";
import { useLeads } from "./LeadsProvider";
import { IconBell, IconSearch } from "./AdminIcons";
import { LogoSquare } from "@/components/ui/Logo";

export function AdminTopbar() {
  const { query, setQuery, sound, setSound } = useLeads();
  const path = usePathname();
  const searchable = !/\/(messages|customers|reviews|settings|automations|more)/.test(path);
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-[rgba(10,10,11,.85)] px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      <span className="lg:hidden">
        <LogoSquare size={30} />
      </span>
      <label className="relative flex-1">
        <span className="sr-only">Search leads, cars, customers</span>
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!searchable}
          placeholder="Search leads, cars, customers…"
          className="h-11 w-full max-w-[520px] rounded-full border border-line-strong bg-surface-2 pl-11 pr-4 text-[15px] text-text placeholder:text-[#8a8a90] focus:border-red focus:outline-none focus:ring-[3px] focus:ring-red/25 disabled:opacity-40"
        />
      </label>
      <button
        type="button"
        onClick={() => setSound(!sound)}
        aria-pressed={sound}
        aria-label={sound ? "Turn off new-lead chime" : "Turn on new-lead chime"}
        title={sound ? "Chime on" : "Chime off"}
        className={`grid h-11 w-11 place-items-center rounded-full border transition-colors ${sound ? "border-red/60 bg-red/15 text-red-hot" : "border-line-strong text-muted hover:text-text"}`}
      >
        <IconBell off={!sound} />
      </button>
    </div>
  );
}
