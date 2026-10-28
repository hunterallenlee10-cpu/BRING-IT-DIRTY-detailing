import { siteConfig } from "@/site.config";

/** Serialises site.config.ts > theme into CSS variables for :root. */
export function themeCss(): string {
  const t = siteConfig.theme;
  const vars: Record<string, string> = {
    "--bg": t.bg,
    "--surface": t.surface,
    "--surface-2": t.surface2,
    "--border": t.border,
    "--border-strong": t.borderStrong,
    "--text": t.text,
    "--muted": t.muted,
    "--red": t.red,
    "--red-hot": t.redHot,
    "--orange": t.orange,
    "--amber": t.amber,
    "--slab": t.slab,
    "--success": t.success,
    "--warn": t.warn,
    "--cta-from": t.ctaFrom,
    "--cta-to": t.ctaTo,
  };
  return `:root{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")}}`;
}
