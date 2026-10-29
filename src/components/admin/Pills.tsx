import type { Lead } from "@/lib/db/types";
import { STATUS_LABEL, followUpOk, sourceInfo } from "./format";

export function SourcePill({ source }: { source: string }) {
  const s = sourceInfo(source);
  return (
    <span
      className="inline-flex h-6 items-center rounded-full border px-2.5 text-[12px] font-medium"
      style={{ color: s.color, borderColor: `${s.color}80`, background: `${s.color}14` }}
    >
      {s.label}
    </span>
  );
}

const STATUS_STYLE: Record<Lead["status"], string> = {
  booked: "bg-[#F1F1EE] text-[#121214]",
  new: "bg-orange text-white shadow-[0_0_12px_rgba(255,90,31,.55)]",
  quote: "bg-amber text-[#1a1200]",
  follow_up: "border border-amber text-amber",
  done: "border border-white/20 text-muted",
  lost: "border border-white/10 text-muted line-through",
};

export function StatusPill({ status }: { status: Lead["status"] }) {
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function FollowUp({ text }: { text: string | null }) {
  if (!text) return <span className="text-muted">—</span>;
  return <span className={`text-[14px] font-medium ${followUpOk(text) ? "text-success" : "text-warn"}`}>{text}</span>;
}

export function NewChip() {
  return <span className="ml-2 inline-flex h-[18px] items-center rounded-[4px] bg-red px-1.5 font-mono text-[9px] font-bold tracking-[0.12em] text-white shadow-[0_0_10px_rgba(255,42,31,.6)]">NEW</span>;
}
