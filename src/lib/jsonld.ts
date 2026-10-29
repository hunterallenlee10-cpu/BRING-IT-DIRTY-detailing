import { siteConfig } from "@/site.config";
import { DAY_KEYS, weekdayLong } from "./time";

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const real = (u: string) => !!u && u !== "#";

/** schema.org AutoWash (a LocalBusiness) built entirely from site.config.ts. */
export function localBusinessJsonLd() {
  const b = siteConfig.brand;
  const url = siteUrl();
  const hours = [1, 2, 3, 4, 5, 6, 0]
    .map((wd) => ({ wd, h: siteConfig.hours[DAY_KEYS[wd]] }))
    .filter((x) => x.h)
    .map(({ wd, h }) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${weekdayLong(wd)}`, opens: h![0], closes: h![1] }));
  return {
    "@context": "https://schema.org",
    "@type": "AutoWash",
    "@id": `${url}/#business`,
    name: `${b.name} ${b.suffix}`,
    legalName: b.legalName,
    url,
    image: `${url}/opengraph-image`,
    telephone: b.phoneE164,
    email: b.email,
    priceRange: siteConfig.seo.priceRange,
    foundingDate: String(b.foundedYear),
    address: { "@type": "PostalAddress", streetAddress: b.address.street, addressLocality: b.address.city, addressRegion: b.address.region, postalCode: b.address.postal, addressCountry: b.address.country },
    geo: { "@type": "GeoCoordinates", latitude: b.geo.lat, longitude: b.geo.lng },
    areaServed: b.areaCities.map((c) => ({ "@type": "City", name: `${c}, ${b.address.region}` })),
    openingHoursSpecification: hours,
    sameAs: [b.instagramUrl, b.facebookUrl, b.googleReviewsUrl].filter(real),
    makesOffer: siteConfig.services.map((s) => ({
      "@type": "Offer",
      name: s.name,
      description: s.tagline,
      priceSpecification: { "@type": "PriceSpecification", minPrice: s.basePrice, priceCurrency: "USD" },
    })),
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: siteConfig.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** Safe for a <script type="application/ld+json"> body. */
export const ldJson = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");
