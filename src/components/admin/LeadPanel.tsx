"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { siteConfig } from "@/site.config";
import type { Lead } from "@/lib/db/types";
import { formatDateShort, formatSlot, relativeTime } from "@/lib/time";
import { money } from "@/lib/pricing";
import { useLeads } from "./LeadsProvider";
import { FollowUp, SourcePill, StatusPill } from "./Pills";
import { STATUS_LABEL, serviceText, vehicleText, whenLabel } from "./format";
import { CloseIcon, PhoneIcon } from "@/components/ui/icons";
import { IconMessages } from "./AdminIcons";

const STATUSES: Lead["status"][] = ["new", "booked", "quote", "follow_up", "done", "lost"];

export function LeadPanel() {
  const { leads, selectedId, select } = useLeads();
  const lead = leads.find((l) => l.id === selectedId) ?? null;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lead) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("select, button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && select(null);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id]);

  return (
    <AnimatePresence>
      {lead && (
        <div className="fixed inset-0 z-[60]" key="panel">
          <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => select(null)} aria-hidden="true" />
          <motion.aside
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={`Lead: ${lead.name}`}
            className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col border-l border-line-strong bg-surface shadow-[0_0_60px_rgba(0,0,0,.6)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={reduce ? { duration: 0.01 } : { type: "spring", stiffness: 360, damping: 38 }}
          >
            <PanelBody lead={lead} onClose={() => select(null)} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function PanelBody({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { update, now, flags, toast } = useLeads();
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [composer, setComposer] = useState(false);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const first = lead.name.split(/\s+/)[0];

  // notes autosave (debounced)
  useEffect(() => {
    if (notes === (lead.notes ?? "")) return;
    setSaved("saving");
    const t = setTimeout(async () => {
      const ok = await update(lead.id, { notes });
      setSaved(ok ? "saved" : "idle");
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const smsBody = `Hi ${first}, it's ${siteConfig.brand.name}. `;
  const sendText = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/text`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: msg }) });
      if (!res.ok) throw new Error();
      toast(`Text sent to ${first}`, "info");
      setComposer(false);
      setMsg("");
    } catch {
      toast("Text didn't send. Try again or call.", "error");
    } finally {
      setSending(false);
    }
  };

  const rows: [string, React.ReactNode][] = [
    ["Phone", <a key="p" className="tabular text-text underline decoration-white/25 underline-offset-4" href={`tel:${lead.phone}`}>{lead.phone}</a>],
    ["Email", lead.email ? <a key="e" className="text-text underline decoration-white/25 underline-offset-4" href={`mailto:${lead.email}`}>{lead.email}</a> : "—"],
    ["Vehicle", vehicleText(lead)],
    ["Service", serviceText(lead)],
    ["When", lead.slot_start ? `${formatSlot(new Date(lead.slot_start), now)} · ${formatDateShort(new Date(lead.slot_start))}` : whenLabel(lead, now)],
    ["Ready by", lead.ready_at ? formatDateShort(new Date(lead.ready_at)) : "—"],
    ["Est. price", lead.est_price ? money(lead.est_price) : "—"],
    ["Source", <SourcePill key="s" source={lead.source} />],
    ["Came in", `${relativeTime(new Date(lead.created_at), now)} · ${formatDateShort(new Date(lead.created_at))}`],
    ["Follow-up", <FollowUp key="f" text={lead.follow_up} />],
  ];
  if (lead.utm && Object.keys(lead.utm).length) rows.push(["UTM", <span key="u" className="font-mono text-[12px] text-muted">{Object.entries(lead.utm).map(([k, v]) => `${k.replace("utm_", "")}=${v}`).join(" · ")}</span>]);

  return (
    <>
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 pb-5 pt-6">
        <div>
          <p className="hud text-[10px] text-muted">{lead.kind === "booking" ? "BOOKING" : lead.kind === "quote" ? "QUOTE REQUEST" : "QUESTION"}</p>
          <h2 className="display glow-white mt-1.5 text-[36px]">{lead.name}</h2>
          <div className="mt-2">
            <StatusPill status={lead.status} />
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close lead" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-strong text-muted hover:text-text">
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:${lead.phone}`} className="cta-pill min-h-12 text-[13px]">
            <PhoneIcon size={16} /> <span>CALL</span>
          </a>
          {flags.twilio ? (
            <button type="button" onClick={() => setComposer((c) => !c)} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-text hover:border-white/30">
              <IconMessages className="h-4 w-4" /> TEXT
            </button>
          ) : (
            <a href={`sms:${lead.phone}?&body=${encodeURIComponent(smsBody)}`} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-text hover:border-white/30">
              <IconMessages className="h-4 w-4" /> TEXT
            </a>
          )}
          <button type="button" onClick={() => update(lead.id, { status: "booked" })} disabled={lead.status === "booked"} className="min-h-12 rounded-full border border-line-strong text-[13px] font-semibold text-text hover:border-white/30 disabled:opacity-40">
            Mark booked
          </button>
          <button type="button" onClick={() => update(lead.id, { status: "done" })} disabled={lead.status === "done"} className="min-h-12 rounded-full border border-line-strong text-[13px] font-semibold text-text hover:border-white/30 disabled:opacity-40">
            Mark done
          </button>
        </div>

        {composer && (
          <div className="mt-3 rounded-[12px] border border-line-strong bg-surface-2 p-3">
            <label htmlFor="sms" className="sr-only">
              Text message
            </label>
            <textarea id="sms" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={`${smsBody}…`} className="input resize-none" />
            <div className="mt-2 flex justify-end">
              <button type="button" onClick={sendText} disabled={sending || !msg.trim()} className="cta-pill min-h-10 disabled:opacity-40">
                <span>{sending ? "SENDING…" : "SEND TEXT"}</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-6">
          <label htmlFor="status" className="hud mb-2 block text-[10px] text-muted">
            STATUS
          </label>
          <select id="status" value={lead.status} onChange={(e) => update(lead.id, { status: e.target.value as Lead["status"] })} className="input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22><path d=%22M2.5 4.5 6 8l3.5-3.5%22 fill=%22none%22 stroke=%22%23A1A1A6%22 stroke-width=%221.6%22/></svg>')] bg-[right_14px_center] bg-no-repeat pr-10">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        {lead.message && (
          <div className="mt-6">
            <p className="hud mb-2 text-[10px] text-muted">THEIR MESSAGE</p>
            <p className="rounded-[12px] border border-line bg-surface-2 p-4 text-[15px] leading-relaxed text-text/90">{lead.message}</p>
          </div>
        )}

        <dl className="mt-6 divide-y divide-line rounded-[12px] border border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-4 py-3 text-[15px]">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right text-text/90">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="notes" className="hud text-[10px] text-muted">
              NOTES
            </label>
            <span className="text-[12px] text-muted" aria-live="polite">
              {saved === "saving" ? "Saving…" : saved === "saved" ? "Saved" : ""}
            </span>
          </div>
          <textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paint condition, gate code, what they care about…" className="input resize-y" />
        </div>
      </div>
    </>
  );
}
