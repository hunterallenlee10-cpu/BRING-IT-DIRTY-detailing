import { siteConfig } from "@/site.config";
import { GoogleIcon, StarIcon } from "@/components/ui/icons";
import { Arrow } from "@/components/ui/Arrow";
import { Section } from "./Section";

const S = siteConfig.sections;
const R = siteConfig.reviews;

function PlaceholderTag() {
  return <span className="rounded-[4px] border border-dashed border-amber/60 px-1.5 py-[3px] font-mono text-[9px] tracking-[0.14em] text-amber">{S.placeholderTag.toUpperCase()}</span>;
}

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="flex gap-0.5 text-amber" aria-label={`${n} out of 5 stars`} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} size={size} className={i < Math.round(n) ? "" : "opacity-25"} />
      ))}
    </span>
  );
}

/**
 * Reviews. Template rule: entries flagged isPlaceholder render with a dashed border and a
 * "Placeholder" tag, so sample copy can never pass for a real customer's words.
 */
export function Reviews() {
  const hasLink = R.items.length > 0 && siteConfig.brand.googleReviewsUrl && siteConfig.brand.googleReviewsUrl !== "#";
  return (
    <Section id="reviews" title={siteConfig.copy.reviewsTitle}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div
          className={`relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-8 sm:p-10 ${
            R.ratingIsPlaceholder ? "border border-dashed border-white/25 bg-surface" : "border border-line-strong bg-surface"
          }`}
        >
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-amber/10 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <span className="flex items-center gap-2 text-[15px] text-text/85">
              <GoogleIcon size={18} /> Google
            </span>
            {R.ratingIsPlaceholder && <PlaceholderTag />}
          </div>
          <div className="relative mt-10">
            <p className="flex items-end gap-4">
              <span className="display tabular text-[132px] text-text">{R.rating.toFixed(1)}</span>
              <span className="mb-4">
                <Stars n={R.rating} size={20} />
              </span>
            </p>
            <p className="mt-4 text-[17px] text-muted">
              on Google · {R.count} reviews
            </p>
          </div>
          {hasLink ? (
            <a
              href={siteConfig.brand.googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-10 inline-flex min-h-11 w-fit items-center gap-2 text-[15px] font-semibold text-text underline decoration-red-hot/70 underline-offset-[6px] hover:decoration-red-hot"
            >
              {S.reviewsCta} <Arrow />
            </a>
          ) : (
            <span className="relative mt-10 block text-[14px] text-muted">{S.reviewsCta}</span>
          )}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {R.items.slice(0, 6).map((r, i) => (
            <li
              key={i}
              className={`flex flex-col rounded-[var(--radius-card)] p-6 ${i === 0 && R.items.length % 2 === 1 ? "sm:col-span-2" : ""} ${
                r.isPlaceholder ? "border border-dashed border-white/25 bg-[rgba(18,18,20,.6)]" : "border border-line-strong bg-surface"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <Stars n={r.stars} />
                {r.isPlaceholder && <PlaceholderTag />}
              </div>
              <blockquote className="mt-4 flex-1 text-[17px] leading-relaxed text-text/90">“{r.text}”</blockquote>
              <p className="mt-5 text-[15px] font-semibold text-text">
                {r.name}
                <span className="ml-2 font-normal text-muted">{r.car}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
