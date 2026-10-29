"use client";

import { useLeads } from "../LeadsProvider";
import { PageHead } from "../AdminShell";

export function AutomationsScreen() {
  const { flags } = useLeads();
  const cards = [
    { title: "Instant confirmation text", on: flags.twilio || flags.simulated, body: "Texts the customer the second they book, with the day, time and service.", power: flags.simulated && !flags.twilio ? "Simulated (DEMO_SIMULATE_SMS)" : "Twilio · TWILIO_*" },
    { title: "Owner new-lead alert", on: flags.ownerAlert, body: "Texts your phone with the name, car, service and time of every new booking.", power: "Twilio · OWNER_ALERT_PHONE" },
    { title: "Day-before reminder", on: flags.cron && (flags.twilio || flags.n8n), body: "Every afternoon, tomorrow's customers get a reminder text. Fewer no-shows.", power: "Vercel Cron · CRON_SECRET + Twilio or n8n" },
    { title: "Quote follow-up next day", on: flags.n8n, body: "Questions and quote requests get a friendly nudge the next day if they haven't booked.", power: "n8n · N8N_WEBHOOK_URL" },
  ];
  return (
    <>
      <PageHead title="AUTOMATIONS" sub="Follow-ups that run without you touching your phone." />
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line-strong px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] text-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${flags.mode === "supabase" ? "bg-success" : "bg-warn"}`} aria-hidden="true" />
        {flags.mode === "supabase" ? "LIVE DATABASE · SUPABASE" : "DEMO MODE · LOCAL DATA"}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((c) => (
          <article key={c.title} className={`rounded-[var(--radius-card)] border p-5 ${c.on ? "border-success/30 bg-surface" : "border-line bg-surface"}`}>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-[18px] font-semibold">{c.title}</h2>
              <span className={`inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] ${c.on ? "bg-success/15 text-success" : "bg-white/6 text-muted"}`}>
                <span className={`h-2 w-2 rounded-full ${c.on ? "bg-success shadow-[0_0_10px_rgba(74,222,128,.9)]" : "bg-white/25"}`} aria-hidden="true" />
                {c.on ? "ON" : "OFF"}
              </span>
            </div>
            <p className="mt-2 max-w-[48ch] text-[15px] text-muted">{c.body}</p>
            <p className="mt-4 font-mono text-[11px] text-muted/80">{c.power}</p>
          </article>
        ))}
      </div>
    </>
  );
}
