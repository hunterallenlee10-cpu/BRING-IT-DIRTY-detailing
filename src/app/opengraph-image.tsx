import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/site.config";

export const runtime = "nodejs";
export const alt = `${siteConfig.brand.name} ${siteConfig.brand.suffix}, car detailing in ${siteConfig.brand.city}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Google serves TTF to clients without a browser user agent, which is what satori needs. */
async function loadFont(family: string, weight = 400): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`, { signal: AbortSignal.timeout(4000) })).text();
    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url, { signal: AbortSignal.timeout(4000) })).arrayBuffer();
  } catch {
    return null;
  }
}

/** OG_share.jpg (via the asset pipeline: public/og/og-base.jpg) with the brand overlaid, so reskinning needs no image editing. */
export default async function OpengraphImage() {
  const b = siteConfig.brand;
  const t = siteConfig.theme;
  const [base, anton, mono] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "og", "og-base.jpg")).catch(() => null),
    loadFont("Anton"),
    loadFont("JetBrains Mono", 500),
  ]);
  const fonts = [
    ...(anton ? [{ name: "Anton", data: anton, weight: 400 as const, style: "normal" as const }] : []),
    ...(mono ? [{ name: "Mono", data: mono, weight: 500 as const, style: "normal" as const }] : []),
  ];
  const bg = base ? `data:image/jpeg;base64,${base.toString("base64")}` : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: t.bg }}>
        {bg && (
          <img src={bg} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex", background: "linear-gradient(90deg, rgba(10,10,11,.95) 0%, rgba(10,10,11,.7) 45%, rgba(10,10,11,0) 80%)" }} />
        <div style={{ position: "absolute", left: 72, top: 64, bottom: 64, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 44, height: 36, display: "flex", transform: "skewX(-20deg)", background: `linear-gradient(90deg, ${t.ctaFrom}, ${t.ctaTo})`, borderRadius: 3 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "Anton", fontSize: 44, color: t.text, lineHeight: 1 }}>{b.name}</span>
              <span style={{ fontFamily: "Mono", fontSize: 15, color: t.muted, letterSpacing: 5, marginTop: 6 }}>{b.suffix}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Anton", fontSize: 128, color: t.text, lineHeight: 0.9 }}>{siteConfig.copy.finalLead}</span>
            <div style={{ display: "flex", marginTop: 8 }}>
              <span style={{ fontFamily: "Anton", fontSize: 128, color: t.amber, lineHeight: 0.95, background: t.slab, padding: "6px 16px 0", borderBottom: `8px solid ${t.ctaTo}` }}>
                {siteConfig.copy.finalHighlight}
              </span>
            </div>
            <span style={{ fontFamily: "Mono", fontSize: 22, color: t.text, letterSpacing: 3, marginTop: 34 }}>
              {`${siteConfig.sections.ogTagline} · ${b.city.toUpperCase()}`}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
