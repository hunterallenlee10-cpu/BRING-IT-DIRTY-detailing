import type { ReactNode } from "react";
import { HighlightHeadline } from "@/components/ui/HighlightHeadline";
import { Reveal } from "@/components/ui/Reveal";

/** Shared shell for the sections below the film: width, rhythm, revealed headline. */
export function Section({
  id,
  title,
  sub,
  aside,
  children,
  className = "",
  tone = "amber",
}: {
  id: string;
  title: { lead: string; highlight: string };
  sub?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "amber" | "orange";
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`relative scroll-mt-24 py-24 sm:py-32 ${className}`}>
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
        <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <HighlightHeadline id={`${id}-title`} lead={title.lead} highlight={title.highlight} tone={tone} reveal className="text-[clamp(52px,7.2vw,108px)]" />
            {sub && <p className="mt-9 max-w-[46ch] text-[17px] leading-relaxed text-muted">{sub}</p>}
          </div>
          {aside}
        </Reveal>
        <div className="mt-14 sm:mt-16">{children}</div>
      </div>
    </section>
  );
}
