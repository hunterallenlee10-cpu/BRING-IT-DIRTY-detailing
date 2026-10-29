import type { Lead } from "@/lib/db/types";
import { formatSlot } from "@/lib/time";
import { serviceById, vehicleLabel } from "@/lib/pricing";

export const SOURCE: Record<string, { label: string; color: string }> = {
  website: { label: "Website", color: "#FF3B2F" },
  chatgpt: { label: "ChatGPT", color: "#34D399" },
  google: { label: "Google", color: "#8EA4D2" },
  instagram: { label: "Instagram", color: "#F472B6" },
  facebook: { label: "Facebook", color: "#60A5FA" },
  perplexity: { label: "Perplexity", color: "#2DD4BF" },
  bing: { label: "Bing", color: "#38BDF8" },
};
export const sourceInfo = (s: string) => SOURCE[s] ?? { label: s ? s[0].toUpperCase() + s.slice(1) : "Website", color: "#A1A1A6" };

export const STATUS_LABEL: Record<Lead["status"], string> = {
  new: "New",
  booked: "Booked",
  quote: "Quote",
  follow_up: "Follow up",
  done: "Done",
  lost: "Lost",
};

export function whenLabel(l: Lead, now: Date) {
  if (l.kind === "question") return "Asked a question";
  if (l.kind === "quote") return "Wants a quote";
  return l.slot_start ? formatSlot(new Date(l.slot_start), now) : "—";
}

export const vehicleText = (l: Lead) => (l.vehicle ? vehicleLabel(l.vehicle) : "—");
export const serviceText = (l: Lead) => (l.service ? serviceById(l.service).name : "—");
export const followUpOk = (f: string | null) => !!f && f.startsWith("✓");

export function isNewLead(l: Lead, now: Date) {
  return now.getTime() - new Date(l.created_at).getTime() < 15 * 60_000;
}

/** "4s", "2m", "1h 5m" */
export function shortDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function matchesQuery(l: Lead, q: string) {
  if (!q) return true;
  const hay = [l.name, l.phone, l.email, vehicleText(l), serviceText(l), sourceInfo(l.source).label, l.message, STATUS_LABEL[l.status], l.notes].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}
