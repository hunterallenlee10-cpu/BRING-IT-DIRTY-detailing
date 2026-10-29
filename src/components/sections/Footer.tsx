import Link from "next/link";
import { siteConfig } from "@/site.config";
import { Logo } from "@/components/ui/Logo";
import { InstagramIcon, GoogleIcon } from "@/components/ui/icons";
import { DAY_KEYS, weekdayShort } from "@/lib/time";
import { to12 } from "@/lib/hoursFormat";

const B = siteConfig.brand;

/** Collapse consecutive days with identical hours: "Mon–Sat 8:00 AM – 6:00 PM", "Sun Closed". */
function hoursSummary() {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const label = (wd: number) => {
    const h = siteConfig.hours[DAY_KEYS[wd]];
    return h ? `${to12(h[0])} – ${to12(h[1])}` : "Closed";
  };
  const out: { days: string; hours: string }[] = [];
  let start = order[0];
  for (let i = 1; i <= order.length; i++) {
    const prev = order[i - 1];
    if (i === order.length || label(order[i]) !== label(prev)) {
      out.push({ days: start === prev ? weekdayShort(start) : `${weekdayShort(start)}–${weekdayShort(prev)}`, hours: label(prev) });
      if (i < order.length) start = order[i];
    }
  }
  return out;
}

export function Footer() {
  const a = B.address;
  const socials = [
    { href: B.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: B.googleReviewsUrl, label: "Google reviews", Icon: GoogleIcon },
  ].filter((s) => s.href);
  return (
    <footer className="bg-[#070708] pb-32 pt-16 sm:pb-12">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 sm:px-8 md:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)]">
        <div>
          <Logo />
          <p className="mt-5 max-w-[34ch] text-[16px] text-muted">{siteConfig.sections.footerTagline}</p>
        </div>
        <div className="text-[16px] leading-relaxed text-text/85">
          <p className="font-semibold text-text">{B.legalName}</p>
          <p>
            {a.street}, {a.city}, {a.region} {a.postal}
          </p>
          <p>
            <a href={`tel:${B.phoneE164}`} className="tabular underline decoration-white/25 underline-offset-4 hover:decoration-red-hot">
              {B.phone}
            </a>
            {" · "}
            <a href={`mailto:${B.email}`} className="underline decoration-white/25 underline-offset-4 hover:decoration-red-hot">
              {B.email}
            </a>
          </p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 text-[15px]">
            {hoursSummary().map((h) => (
              <div key={h.days} className="contents">
                <dt className="text-muted">{h.days}</dt>
                <dd className="tabular">{h.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <ul className="flex gap-2">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="grid h-11 w-11 place-items-center rounded-full border border-line-strong text-text/85 transition-colors hover:border-white/35 hover:text-text"
                >
                  <Icon size={18} />
                </a>
              </li>
            ))}
          </ul>
          <Link href="/admin/login" className="inline-flex min-h-11 items-center text-[14px] text-muted underline decoration-white/20 underline-offset-4 hover:text-text">
            {siteConfig.sections.ownerLogin}
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[1240px] px-4 sm:px-8">
        <p className="border-t border-line pt-6 text-[14px] text-muted">
          © {new Date().getFullYear()} {B.legalName}. {B.city}.
        </p>
      </div>
    </footer>
  );
}
