import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { Logo, LogoSquare } from "@/components/ui/Logo";
import { CtaPill } from "@/components/ui/CtaPill";
import { HighlightHeadline } from "@/components/ui/HighlightHeadline";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Chip } from "@/components/ui/Chip";
import { CheckBadge } from "@/components/ui/CheckBadge";
import { Grain } from "@/components/ui/Grain";

export const metadata: Metadata = { title: "Styleguide", robots: { index: false, follow: false } };

const tokens = Object.entries(siteConfig.theme);

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-10">
      <h2 className="hud mb-6 text-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function Styleguide() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_STYLEGUIDE !== "1") notFound();
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <Grain />
      <div className="flex items-center justify-between">
        <Logo />
        <span className="hud text-muted">STYLEGUIDE · DEV ONLY</span>
      </div>

      <Block title="Tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {tokens.map(([k, v]) => (
            <div key={k} className="overflow-hidden rounded-[10px] border border-line">
              <div className="h-14" style={{ background: v }} />
              <div className="p-2">
                <div className="font-mono text-[11px] text-text">{k}</div>
                <div className="font-mono text-[10px] text-muted">{v}</div>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Type">
        <div className="display glow-white text-[96px]">BRING IT</div>
        <p className="mt-4 max-w-[60ch] text-[16px] text-text">
          Inter body at 16px. Dark, cinematic, high contrast, one hot red-orange accent. Lit like the studio&apos;s LED strips.
        </p>
        <p className="mt-2 text-[15px] text-muted">Muted Inter 15px for dense admin tables.</p>
        <p className="hud mt-4 text-muted">JETBRAINS MONO · HUD 11PX · 0.14EM</p>
      </Block>

      <Block title="Highlight headline">
        <div className="grid gap-16 md:grid-cols-2">
          <HighlightHeadline lead="BRING IT" highlight="DIRTY." className="text-[88px]" />
          <HighlightHeadline lead="SCROLL TO" highlight="WASH IT." tone="orange" align="right" className="text-[88px]" />
          <HighlightHeadline lead="LOOK" highlight="CLOSER." className="text-[64px]" />
          <HighlightHeadline lead="KEYS BACK." highlight="JAW DROPS." align="right" className="text-[64px]" />
        </div>
      </Block>

      <Block title="Eyebrow · Logo">
        <div className="flex flex-wrap items-center gap-6">
          <Eyebrow num="01" label="ARRIVE" />
          <Eyebrow num="04" label="CERAMIC — WATER JUST ROLLS OFF" />
          <Logo />
          <Logo compact />
          <span className="flex items-center gap-2">
            <LogoSquare />
            <span className="flex flex-col leading-none">
              <span className="display text-[18px]">{siteConfig.brand.name}</span>
              <span className="hud text-[9px] text-muted">STUDIO OS</span>
            </span>
          </span>
        </div>
      </Block>

      <Block title="CTA pill">
        <div className="flex flex-wrap items-center gap-4">
          <CtaPill>{siteConfig.copy.cta}</CtaPill>
          <CtaPill pulse>PULSING</CtaPill>
          <CtaPill disabled className="opacity-40">
            DISABLED
          </CtaPill>
        </div>
      </Block>

      <Block title="Chips · selected states">
        <div className="flex flex-wrap gap-3">
          <Chip>Mon</Chip>
          <Chip selected>Tue</Chip>
          <Chip disabled className="line-through">
            Full
          </Chip>
          <Chip size="sm">10:00</Chip>
          <Chip size="sm" selected>
            13:00
          </Chip>
        </div>
        <div className="mt-6 flex gap-3">
          {["SUV", "Sedan"].map((v, i) => (
            <button key={v} type="button" aria-pressed={i === 0} className="selectable grid h-24 w-24 place-items-center rounded-[14px] text-[13px]">
              {i === 0 && <CheckBadge />}
              {v}
            </button>
          ))}
        </div>
      </Block>

      <Block title="Inputs">
        <div className="grid max-w-md gap-3">
          <input className="input" placeholder="Your name" />
          <input className="input" placeholder="(555) 000-0000" aria-invalid="true" />
        </div>
      </Block>
    </main>
  );
}
