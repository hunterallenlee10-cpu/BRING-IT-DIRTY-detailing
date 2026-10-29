import { siteConfig } from "@/site.config";
import { Section } from "./Section";

/** Three steps on one track: vertical on phones, horizontal from md up. Steps come from config.howItWorks[serviceMode]. */
export function HowItWorks() {
  const steps = siteConfig.howItWorks[siteConfig.serviceMode];
  return (
    <Section id="how" title={siteConfig.copy.howTitle} sub={siteConfig.sections.howSub} className="border-y border-line bg-[linear-gradient(180deg,#0d0d0f,#0a0a0b)]">
      <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
        {/* the track */}
        <span aria-hidden="true" className="absolute bottom-4 left-[19px] top-4 w-px bg-gradient-to-b from-red via-white/15 to-white/5 md:bottom-auto md:left-5 md:right-[calc((100%-4rem)/3-20px)] md:top-[19px] md:h-px md:w-auto md:bg-gradient-to-r" />
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          return (
            <li key={s.title} className="relative pl-16 md:pl-0">
              <span
                aria-hidden="true"
                className={`absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full border font-mono text-[13px] md:relative ${
                  last ? "border-red bg-red text-white shadow-[0_0_22px_rgba(255,42,31,.65)]" : "border-line-strong bg-surface text-text"
                }`}
              >
                {i + 1}
              </span>
              <h3 className={`display mt-0 text-[38px] md:mt-8 ${last ? "text-amber" : "text-text"}`}>
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-4 max-w-[36ch] text-[17px] leading-relaxed text-muted">{s.body}</p>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
