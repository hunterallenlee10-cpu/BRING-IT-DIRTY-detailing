export function KpiTile({ label, value, note, accent = false }: { label: string; value: string; note?: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border p-5 ${accent ? "border-red/50 bg-[linear-gradient(160deg,rgba(232,21,11,.22),rgba(18,18,20,1)_60%)] shadow-[0_0_30px_rgba(255,42,31,.15)]" : "border-line bg-surface"}`}
    >
      <p className="hud text-[10px] text-muted">{label}</p>
      <p className="display glow-white mt-3 text-[44px] tabular">{value}</p>
      {note && <p className="mt-1 text-[13px] text-muted">{note}</p>}
    </div>
  );
}
