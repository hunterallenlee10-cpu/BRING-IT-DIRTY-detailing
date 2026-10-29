"use client";

import { siteConfig } from "@/site.config";
import { useLeads } from "../LeadsProvider";
import { PageHead } from "../AdminShell";
import { prettyTime } from "@/lib/time";
import { signOut } from "@/app/admin/actions";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function SettingsScreen() {
  const { sound, setSound, owner, flags } = useLeads();
  const b = siteConfig.brand;
  return (
    <>
      <PageHead title="SETTINGS" sub="Your studio details come from site.config.ts. Editing them here is coming soon." />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <h2 className="hud text-[11px] text-muted">STUDIO</h2>
          <dl className="mt-3 divide-y divide-line text-[15px]">
            {[
              ["Name", `${b.name} ${b.suffix}`],
              ["Phone", b.phone],
              ["Email", b.email],
              ["Address", `${b.address.street}, ${b.address.city}, ${b.address.region} ${b.address.postal}`],
              ["Bays", String(siteConfig.booking.bays)],
              ["Slots", siteConfig.booking.slotTimes.map(prettyTime).join(" · ")],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <h2 className="hud text-[11px] text-muted">HOURS</h2>
          <dl className="mt-3 divide-y divide-line text-[15px]">
            {DAYS.map((d) => {
              const h = siteConfig.hours[d];
              return (
                <div key={d} className="flex justify-between py-2.5">
                  <dt className="capitalize text-muted">{d}</dt>
                  <dd className="tabular">{h ? `${prettyTime(h[0])} – ${prettyTime(h[1])}` : "Closed"}</dd>
                </div>
              );
            })}
          </dl>
        </section>
        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <h2 className="hud text-[11px] text-muted">ALERTS</h2>
          <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="block font-medium">Chime on new leads</span>
              <span className="block text-[14px] text-muted">Plays a soft sound in this browser when a lead comes in.</span>
            </span>
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} className="h-6 w-6 accent-[var(--red)]" />
          </label>
        </section>
        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <h2 className="hud text-[11px] text-muted">ACCOUNT</h2>
          <p className="mt-3 text-[15px]">{owner}</p>
          <p className="mt-1 text-[14px] text-muted">{flags.mode === "supabase" ? "Signed in with Supabase Auth." : "Demo mode login (no database connected)."}</p>
          <form action={signOut}>
            <button type="submit" className="mt-4 min-h-11 rounded-full border border-line-strong px-5 text-[14px] font-semibold hover:border-white/30">
              Sign out
            </button>
          </form>
        </section>
        {flags.mode === "demo" && (
          <section className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface p-5 lg:col-span-2">
            <h2 className="hud text-[11px] text-muted">DEMO DATA</h2>
            <p className="mt-2 max-w-[60ch] text-[15px] text-muted">Put the six sample leads back, with times relative to right now. Handy before showing the dashboard to a studio owner.</p>
            <button
              type="button"
              onClick={async () => {
                const res = await fetch("/api/admin/demo/reset", { method: "POST" });
                if (res.ok) window.location.assign("/admin/leads");
              }}
              className="mt-4 min-h-11 rounded-full border border-line-strong px-5 text-[14px] font-semibold hover:border-white/30"
            >
              Reset demo data
            </button>
          </section>
        )}
      </div>
    </>
  );
}
