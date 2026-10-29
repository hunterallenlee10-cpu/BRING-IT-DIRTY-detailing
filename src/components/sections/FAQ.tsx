import { siteConfig } from "@/site.config";
import { HighlightHeadline } from "@/components/ui/HighlightHeadline";
import { Reveal } from "@/components/ui/Reveal";

/** Native <details> accordion: keyboard and screen-reader friendly, and it works without JavaScript. */
export function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-4 sm:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20">
        <Reveal className="lg:sticky lg:top-32 lg:self-start">
          <HighlightHeadline id="faq-title" lead={siteConfig.copy.faqTitle.lead} highlight={siteConfig.copy.faqTitle.highlight} reveal className="text-[clamp(52px,7.2vw,108px)]" />
          <p className="mt-9 max-w-[34ch] text-[17px] leading-relaxed text-muted">
            {siteConfig.sections.faqCallLead}{" "}
            <a href={`tel:${siteConfig.brand.phoneE164}`} className="tabular whitespace-nowrap font-semibold text-text underline decoration-red-hot/70 underline-offset-4">
              {siteConfig.brand.phone}
            </a>
            .
          </p>
        </Reveal>
        <div className="border-t border-line">
          {siteConfig.faq.map((f) => (
            <details key={f.q} className="faq group border-b border-line">
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-5 text-[19px] font-semibold text-text transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <span aria-hidden="true" className="relative h-5 w-5 shrink-0">
                  <span className="absolute left-0 top-1/2 h-[2px] w-5 -translate-y-1/2 rounded bg-red-hot" />
                  <span className="absolute left-1/2 top-0 h-5 w-[2px] -translate-x-1/2 rounded bg-red-hot transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="max-w-[62ch] pb-6 pr-10 text-[17px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
