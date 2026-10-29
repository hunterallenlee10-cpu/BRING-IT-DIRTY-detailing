import type { Chapter } from "@/site.config";
import { HighlightHeadline } from "@/components/ui/HighlightHeadline";
import { Eyebrow } from "@/components/ui/Eyebrow";

const keyStill: Record<string, string> = {
  arrive: "S1_dirty_lit",
  wash: "S0_clean_lit",
  inspect: "S3_inspect_close",
  polish: "S6_bead_macro",
  pickup: "S7_pickup_golden",
};

/**
 * One chapter's copy. In the pinned film it is absolutely positioned and driven by --p-lead / --p-hl / --p-sub.
 * In the stacked fallback (reduced motion / no JS) the same element becomes a full-height section with its still.
 */
export function ChapterText({ c, index }: { c: Chapter; index: number }) {
  const right = c.position !== "bottom-left";
  const still = keyStill[c.id] ?? c.stills[c.stills.length - 1];
  return (
    <div className="film-ch" data-ch={c.id} data-pos={c.position} data-first={index === 0 || undefined}>
      <picture className="film-ch-still">
        <source media="(orientation: portrait)" srcSet={`/stills/${still}_m-1080.webp`} />
        <img src={`/stills/${still}-1600.webp`} alt="" loading="lazy" decoding="async" />
      </picture>
      <div className={`film-ch-copy ${right ? "items-end text-right" : "items-start"}`}>
        {c.eyebrow && <Eyebrow num={c.num} label={c.eyebrow} className="film-ch-eyebrow mb-5" />}
        <HighlightHeadline
          as={index === 0 ? "h1" : "h2"}
          lead={c.lead}
          highlight={c.highlight}
          tone={c.tone}
          align={right ? "right" : "left"}
          className="film-ch-title"
        />
        <p className="film-ch-sub">{c.sub}</p>
      </div>
    </div>
  );
}
