import { siteConfig } from "@/site.config";
import { PhoneIcon } from "@/components/ui/icons";
import { Arrow } from "@/components/ui/Arrow";
import { HoursTable, MapEmbed } from "./AreaHoursClient";
import { Section } from "./Section";

const S = siteConfig.sections;
const B = siteConfig.brand;

export function AreaHours() {
  const a = B.address;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${a.street}, ${a.city}, ${a.region} ${a.postal}`)}`;
  return (
    <Section id="visit" title={siteConfig.copy.areaTitle} sub={S.areaSub}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16">
        <div className="flex flex-col gap-10">
          <div>
            <p className="hud text-[10px] text-muted">{S.callLabel}</p>
            <a
              href={`tel:${B.phoneE164}`}
              className="group mt-3 inline-flex min-h-11 items-center gap-4 text-text transition-colors hover:text-red-hot"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-red text-white shadow-[0_0_24px_rgba(255,42,31,.55)]">
                <PhoneIcon size={24} />
              </span>
              <span className="display tabular text-[clamp(44px,6.4vw,76px)] leading-none">{B.phone}</span>
            </a>
          </div>

          <address className="not-italic">
            <p className="hud text-[10px] text-muted">{B.legalName}</p>
            <p className="mt-3 text-[19px] leading-relaxed text-text">
              {a.street}
              <br />
              {a.city}, {a.region} {a.postal}
            </p>
            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-[16px] font-semibold text-text underline decoration-red-hot/70 underline-offset-[6px] hover:decoration-red-hot"
            >
              {S.directions} <Arrow />
            </a>
          </address>

          <div>
            <p className="hud text-[10px] text-muted">{S.areaCitiesLabel}</p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label={B.serviceArea}>
              {B.areaCities.map((c) => (
                <li key={c} className="rounded-full border border-line-strong bg-surface px-4 py-2 text-[15px] text-text/90">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius-card)] border border-line-strong bg-surface p-2 sm:p-3">
            <p className="hud px-3 pb-2 pt-3 text-[10px] text-muted">{S.hoursLabel}</p>
            <HoursTable />
          </div>
          <MapEmbed />
        </div>
      </div>
    </Section>
  );
}
