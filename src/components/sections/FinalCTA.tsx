"use client";

import { siteConfig } from "@/site.config";
import { useBooking } from "@/components/booking/BookingContext";
import { HighlightHeadline } from "@/components/ui/HighlightHeadline";
import { CtaPill } from "@/components/ui/CtaPill";
import { PhoneIcon } from "@/components/ui/icons";
import { useReveal } from "@/components/ui/useReveal";

/** Reprise of the opening line over the golden-hour still, with the two ways to book. */
export function FinalCTA() {
  const { open } = useBooking();
  const ref = useReveal<HTMLDivElement>(0.3);
  const c = siteConfig.copy;
  return (
    <section aria-labelledby="final-title" className="relative isolate overflow-hidden border-y border-line">
      <picture>
        <source media="(max-aspect-ratio: 9/10)" srcSet="/stills/S7_pickup_golden_m-1080.webp" />
        <img src="/stills/S7_pickup_golden-1600.webp" alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      </picture>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,10,11,.94)_0%,rgba(10,10,11,.75)_42%,rgba(10,10,11,.25)_100%),linear-gradient(0deg,rgba(10,10,11,.85),rgba(10,10,11,0)_45%)]" />
      <div ref={ref} className="mx-auto flex min-h-[78svh] max-w-[1240px] flex-col justify-end px-4 py-24 sm:px-8 sm:py-32">
        <HighlightHeadline id="final-title" lead={c.finalLead} highlight={c.finalHighlight} reveal className="text-[clamp(72px,12vw,180px)]" />
        <p className="mt-10 max-w-[40ch] text-[18px] leading-relaxed text-text/85">{c.finalSub}</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
          <CtaPill onClick={() => open()} className="min-h-[52px] px-7 text-[13px]">
            {c.cta}
          </CtaPill>
          <a href={`tel:${siteConfig.brand.phoneE164}`} className="inline-flex min-h-11 items-center gap-3 text-[17px] text-text/90 hover:text-text">
            <PhoneIcon size={18} className="text-red-hot" />
            <span>
              {siteConfig.sections.finalPhoneLabel} <span className="tabular font-semibold text-text">{siteConfig.brand.phone}</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
