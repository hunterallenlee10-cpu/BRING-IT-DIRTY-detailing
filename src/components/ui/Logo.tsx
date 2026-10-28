import { siteConfig } from "@/site.config";

/** Skewed red→orange parallelogram with a thin highlight stripe. */
export function LogoMark({ size = 22, className = "" }: { size?: number; className?: string }) {
  const id = "lm" + size;
  return (
    <svg width={size * 1.25} height={size} viewBox="0 0 30 24" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--cta-from)" />
          <stop offset="1" stopColor="var(--cta-to)" />
        </linearGradient>
      </defs>
      <g transform="skewX(-20) translate(9 0)">
        <rect x="0" y="2" width="16" height="20" rx="1.5" fill={`url(#${id})`} />
        <rect x="11" y="2" width="1.6" height="20" fill="rgba(255,255,255,.55)" />
      </g>
    </svg>
  );
}

export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={compact ? 18 : 22} className="drop-shadow-[0_0_10px_rgba(255,60,20,.55)]" />
      <span className="flex flex-col leading-none">
        <span className="display text-[22px] tracking-[0.02em] text-text">{siteConfig.brand.name}</span>
        {!compact && (
          <span className="mt-[3px] font-mono text-[9px] uppercase tracking-[0.32em] text-muted">
            {siteConfig.brand.suffix}
          </span>
        )}
      </span>
    </span>
  );
}

/** Admin variant: mark inside a 28px rounded red square. */
export function LogoSquare({ size = 28 }: { size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-[8px] bg-red shadow-[0_0_18px_rgba(255,42,31,.55)]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size * 0.62} height={size * 0.5} viewBox="0 0 30 24">
        <g transform="skewX(-20) translate(9 0)">
          <rect x="0" y="2" width="16" height="20" rx="1.5" fill="#fff" />
          <rect x="11" y="2" width="1.6" height="20" fill="rgba(232,21,11,.6)" />
        </g>
      </svg>
    </span>
  );
}
