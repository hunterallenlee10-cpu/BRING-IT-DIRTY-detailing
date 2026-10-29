/**
 * site.config.ts: the ONLY file with brand-specific copy, prices, hours and asset paths.
 * To reskin for a new detailer: edit this file, drop their files into assets-src/, run `npm run frames`.
 * Values still on the template default are listed in LAUNCH_CHECKLIST.md under "Replace before launch".
 */

export type VehicleId = "coupe" | "sedan" | "suv" | "truck";
export type ServiceId = "wash" | "polish" | "ceramic";
export type ChapterId = "arrive" | "wash" | "inspect" | "polish" | "pickup";
export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface Chapter {
  id: ChapterId;
  num: string;
  rail: string;
  /** Right half of the status pill while this chapter plays. */
  step: string;
  /** Progress range inside the pinned film, 0..1. */
  range: [number, number];
  /** Source clips (assets-src/*.mp4) concatenated in order by scripts/build-frames.mjs. */
  clips: string[];
  /** Key stills (assets-src/*.png) used by the chapter and by placeholder generation. */
  stills: string[];
  frames: { desktop: number; mobile: number };
  /** Cover-fit focal point, 0..1. Keeps the car framed on ultra-wide and tall screens. */
  focalX: number;
  focalY: number;
  /** Small "/ 01 · ARRIVE" chip above the headline. Empty = none. */
  eyebrow: string;
  lead: string;
  highlight: string;
  tone: "amber" | "orange";
  sub: string;
  /** Where the headline block sits over the canvas. */
  position: "bottom-left" | "right-center" | "right-bottom";
  /** Optional HUD-only line that replaces the headline late in the chapter. */
  hudTag?: { text: string; from: number };
}

const env = (k: string) => (typeof process !== "undefined" ? process.env[k] : undefined);

export const siteConfig = {
  brand: {
    name: "REDLINE",
    suffix: "DETAIL STUDIO",
    legalName: "REDLINE Detail Studio",
    city: "Frederick, MD",
    serviceArea: "Frederick, Hagerstown, Germantown & surrounding areas",
    areaCities: ["Frederick", "Hagerstown", "Germantown", "Urbana", "Middletown", "Walkersville", "Mount Airy", "Thurmont"],
    phone: "(555) 010-0199",
    phoneE164: "+15550100199",
    email: "book@example.com",
    address: { street: "123 Studio Way", city: "Frederick", region: "MD", postal: "21701", country: "US" },
    geo: { lat: 39.4143, lng: -77.4105 },
    timezone: "America/New_York",
    googleReviewsUrl: "#",
    instagramUrl: "#",
    facebookUrl: "",
    /** Google Maps embed src. Loaded only after the visitor clicks. Empty hides the map. */
    mapsEmbedUrl: "https://www.google.com/maps?q=Frederick,+MD&output=embed",
    foundedYear: 2019,
  },

  /** 24h "HH:MM" open/close per weekday, in brand.timezone. null = closed. */
  hours: {
    mon: ["08:00", "18:00"],
    tue: ["08:00", "18:00"],
    wed: ["08:00", "18:00"],
    thu: ["08:00", "18:00"],
    fri: ["08:00", "18:00"],
    sat: ["08:00", "18:00"],
    sun: null,
  } as Record<DayKey, [string, string] | null>,

  booking: {
    /** Bookings allowed per time slot. */
    bays: 1,
    slotTimes: ["08:00", "10:00", "13:00", "15:30"],
    /** How many open days the drawer offers. */
    daysShown: 4,
    /** Prices are rounded to this many dollars after the size multiplier. */
    priceRounding: 5,
    vehicles: [
      { id: "suv", label: "SUV" },
      { id: "sedan", label: "Sedan" },
      { id: "truck", label: "Truck" },
      { id: "coupe", label: "Coupe" },
    ] as { id: VehicleId; label: string }[],
    sizeMultipliers: { coupe: 1.0, sedan: 1.0, suv: 1.2, truck: 1.3 } as Record<VehicleId, number>,
    /** Day-before reminder text goes out at this local hour (Vercel Cron runs hourly-safe, see vercel.json). */
    reminderHour: 15,
  },

  services: [
    {
      id: "wash",
      name: "Wash",
      tagline: "Hand wash and clay. Back the same day.",
      badge: "SAME DAY",
      durationDays: 0,
      basePrice: 129,
      includes: [
        "Snow-foam pre-soak and two-bucket hand wash",
        "Clay bar to pull out bonded grit",
        "Wheels, tires and arches deep-cleaned",
        "Streak-free glass, inside and out",
        "Interior vacuum and wipe-down",
        "Tire dressing and a final hand dry",
      ],
    },
    {
      id: "polish",
      name: "Polish",
      tagline: "Swirls out. Deep gloss back.",
      badge: "1 DAY",
      durationDays: 1,
      basePrice: 349,
      includes: [
        "Everything in Wash",
        "Paint inspection under bright LEDs",
        "Machine polish to remove swirls and light scratches",
        "Plastic trim cleaned and restored",
        "Spray sealant for months of easy washing",
        "Walk-around with you at pick-up",
      ],
    },
    {
      id: "ceramic",
      name: "Ceramic",
      tagline: "Polish, then a ceramic coat. Shine that lasts.",
      badge: "2 DAYS",
      durationDays: 2,
      basePrice: 899,
      includes: [
        "Everything in Polish",
        "Multi-stage paint correction",
        "Professional ceramic coating, cured in-studio",
        "Wheels and glass coated too",
        "Water beads and rolls right off",
        "Aftercare kit and a written care guide",
      ],
    },
  ] as {
    id: ServiceId;
    name: string;
    tagline: string;
    badge: string;
    durationDays: number;
    basePrice: number;
    includes: string[];
  }[],

  film: {
    /** Pinned scroll length of the film, in viewport heights. */
    scrollLength: 700,
    /** Pixel nudge applied to the dirty still so it lines up with the clean one. Tune with ?align=1. */
    washAlign: { dx: 0, dy: 0, scale: 1 },
    /** Drawer header ribbon: a crop of this still around the car's flank and wheel (focus 0..1). */
    ribbon: { still: "S7_pickup_golden", focusX: 0.6, focusY: 0.8 },
    /** The last chapter's frames end here (global progress); the golden-hour still holds after it. */
    holdFrom: 0.9,
    /** Lights-on plays once after the first 1% of scroll, or after this idle time. */
    lightsOnIdleMs: 1800,
    chapters: [
      {
        id: "arrive",
        num: "01",
        rail: "ARRIVE",
        step: "BOOKING THIS WEEK",
        range: [0, 0.1],
        clips: ["C1_lights_on"],
        stills: ["S2_dirty_dark", "S1_dirty_lit"],
        frames: { desktop: 30, mobile: 24 },
        focalX: 0.62,
        focalY: 0.55,
        eyebrow: "ARRIVE",
        lead: "BRING IT",
        highlight: "DIRTY.",
        tone: "amber",
        sub: "We'll take it from here.",
        position: "bottom-left",
      },
      {
        id: "wash",
        num: "02",
        rail: "WASH",
        step: "STEP 1 · WASH",
        range: [0.1, 0.32],
        clips: [],
        stills: ["S1_dirty_lit", "S0_clean_lit"],
        frames: { desktop: 0, mobile: 0 },
        focalX: 0.62,
        focalY: 0.55,
        eyebrow: "",
        lead: "SCROLL TO",
        highlight: "WASH IT.",
        tone: "orange",
        sub: "Hand wash, clay, polish. All by hand.",
        position: "right-center",
      },
      {
        id: "inspect",
        num: "03",
        rail: "INSPECT",
        step: "STEP 2 · INSPECT",
        range: [0.32, 0.5],
        clips: ["C2_push_inspect", "C3_into_macro"],
        stills: ["S0_clean_lit", "S3_inspect_close", "S4_swirl_macro"],
        frames: { desktop: 120, mobile: 80 },
        focalX: 0.55,
        focalY: 0.5,
        eyebrow: "INSPECT",
        lead: "LOOK",
        highlight: "CLOSER.",
        tone: "amber",
        sub: "Under a bright light, every swirl shows.",
        position: "bottom-left",
      },
      {
        id: "polish",
        num: "04",
        rail: "POLISH",
        step: "STEP 3 · POLISH + CERAMIC",
        range: [0.5, 0.72],
        clips: ["C4_polish", "C5_bead"],
        stills: ["S4_swirl_macro", "S5_polished_macro", "S6_bead_macro"],
        frames: { desktop: 120, mobile: 80 },
        focalX: 0.5,
        focalY: 0.5,
        eyebrow: "",
        lead: "SWIRLS OUT.",
        highlight: "GLASS ON.",
        tone: "amber",
        sub: "Polish fills them. Ceramic seals them in.",
        position: "right-bottom",
        hudTag: { text: "/ 04 · CERAMIC — WATER JUST ROLLS OFF", from: 0.55 },
      },
      {
        id: "pickup",
        num: "05",
        rail: "PICK-UP",
        step: "READY · PICK-UP",
        range: [0.72, 1],
        clips: ["C6_pull_back"],
        stills: ["S6_bead_macro", "S7_pickup_golden"],
        frames: { desktop: 60, mobile: 40 },
        focalX: 0.62,
        focalY: 0.55,
        eyebrow: "PICK-UP",
        lead: "KEYS BACK.",
        highlight: "JAW DROPS.",
        tone: "amber",
        sub: "Book your detail. You'll know the price before we start.",
        position: "bottom-left",
      },
    ] as Chapter[],
    /** Top-center nav items: label → chapter it jumps to. */
    nav: [
      { label: "WASH", chapter: "wash" },
      { label: "POLISH", chapter: "polish" },
      { label: "PICK-UP", chapter: "pickup" },
    ] as { label: string; chapter: ChapterId }[],
  },

  copy: {
    cta: "BOOK A DETAIL",
    ribbon: "CERAMIC STUDIO · BOOK IN 30 SECONDS",
    drawerTitle: "BOOK YOUR DETAIL",
    drawerFootnote: "No payment now. Free to reschedule.",
    successSub: "We'll text you a reminder the day before.",
    slotTaken: "That time just got booked. Pick another?",
    smsCustomer: "{BRAND}: You're booked for {day} {time} – {service}. Reply C to change. See you then!",
    smsOwner: "New booking: {name}, {vehicle}, {service}, {day} {time}",
    smsReminder: "{BRAND}: Reminder, your {service} is tomorrow at {time}. Reply C to change.",
    finalLead: "BRING IT",
    finalHighlight: "DIRTY.",
    finalSub: "Pick a time in 30 seconds. You'll know the price before we start.",
    servicesTitle: { lead: "PICK THE", highlight: "WORK." },
    servicesSub: "Clear prices by vehicle size. No surprises at pick-up.",
    beforeAfterTitle: { lead: "SAME CAR.", highlight: "NEW SHINE." },
    beforeAfterSub: "Drag the water line to see what one visit does.",
    reviewsTitle: { lead: "DON'T TAKE", highlight: "OUR WORD." },
    howTitle: { lead: "HOW IT", highlight: "WORKS." },
    areaTitle: { lead: "FIND", highlight: "THE STUDIO." },
    faqTitle: { lead: "GOOD", highlight: "QUESTIONS." },
  },

  /* ---------- Phase 7: trust + SEO sections copy (below the film) ---------- */
  sections: {
    servicesSizeLabel: "Vehicle size",
    servicesFootnote: "Final price confirmed at drop-off after a quick look under the lights. Heavy contamination or pet hair may add time.",
    bookThis: "BOOK THIS",
    beforeLabel: "BEFORE",
    afterLabel: "AFTER",
    sampleNote: "Sample images",
    sliderLabel: "Drag to compare before and after",
    reviewsCta: "Read every review on Google",
    placeholderTag: "Placeholder",
    howSub: "No calls back and forth. No surprise invoice.",
    areaSub: "Drop-offs by appointment. Call or text any time we're open.",
    areaCitiesLabel: "We serve",
    hoursLabel: "Hours",
    callLabel: "Call or text",
    mapCta: "Show map",
    directions: "Get directions",
    finalPhoneLabel: "Rather talk? Call",
    footerTagline: "Hand wash, paint correction and ceramic coating.",
    ownerLogin: "Owner login",
    ogTagline: "DETAILING & CERAMIC",
    faqCallLead: "Something else on your mind? Call",
  },

  /** "dropoff" = customers bring the car to the studio. "onsite" = mobile detailer that comes to them. */
  serviceMode: "dropoff" as "dropoff" | "onsite",
  howItWorks: {
    dropoff: [
      { title: "Book in 30 seconds", body: "Pick your car, the work and a time. You see the price before you confirm." },
      { title: "Drop it off", body: "Leave the keys with us. We text you when the work starts and when it's ready." },
      { title: "Keys back, jaw drops.", body: "We walk around the car with you under the lights. Pay only when you're happy." },
    ],
    onsite: [
      { title: "Book in 30 seconds", body: "Pick your car, the work and a time. You see the price before you confirm." },
      { title: "We come to you", body: "Our van brings water, power and everything else. You don't lift a finger." },
      { title: "Keys back, jaw drops.", body: "We walk around the car with you. Pay only when you're happy." },
    ],
  },

  reviews: {
    rating: 4.9,
    count: "120+",
    /** true = the rating badge itself is a template value and gets flagged on the page. */
    ratingIsPlaceholder: true,
    items: [
      { name: "Sample customer", car: "SUV · Ceramic", stars: 5, text: "Paste a real Google review here. Placeholder reviews show a dashed border so nobody mistakes them for real ones.", isPlaceholder: true },
      { name: "Sample customer", car: "Truck · Wash", stars: 5, text: "Short and specific works best: what the car looked like before, what it looks like now, and how easy booking was.", isPlaceholder: true },
      { name: "Sample customer", car: "Sedan · Polish", stars: 5, text: "Three to six reviews is the sweet spot. Pick ones that mention swirl marks, time saved, or the walk-around at pick-up.", isPlaceholder: true },
    ] as { name: string; car: string; stars: number; text: string; isPlaceholder: boolean }[],
  },

  gallery: {
    /** true shows a "Sample images" note. Set false once real job photos are in. */
    isSample: true,
    items: [
      { id: "suv", label: "SUV", before: "G1_suv_before", after: "G1_suv_after" },
      { id: "truck", label: "PICKUP", before: "G2_truck_before", after: "G2_truck_after" },
      { id: "sedan", label: "SEDAN", before: "G3_sedan_before", after: "G3_sedan_after" },
      { id: "coupe", label: "COUPE", before: "G4_coupe_before", after: "G4_coupe_after" },
    ],
  },

  faq: [
    { q: "How long does a detail take?", a: "A Wash is back the same day, usually in 3 to 4 hours. Polish takes one day. Ceramic takes two days because the coating needs time to cure indoors." },
    { q: "What's the difference between ceramic and wax?", a: "Wax sits on top of the paint and wears off in weeks. A ceramic coating bonds to the clear coat and lasts years, so the car stays glossy and much easier to wash." },
    { q: "What should I take out of the car?", a: "Please remove valuables, child seats and anything in the trunk you'll need. We'll handle the rest, including floor mats." },
    { q: "How do I pay?", a: "Nothing is due when you book. You pay at pick-up by card, Apple Pay, Google Pay or cash, after you've seen the car." },
    { q: "What if it rains after my detail?", a: "We work indoors, so weather never affects the job. After a ceramic coat, rain actually helps show it off: the water beads and rolls right off." },
    { q: "Can I cancel or reschedule?", a: "Yes, free of charge. Reply to your confirmation text or call us any time before your drop-off." },
    { q: "Do you work on trucks and big SUVs?", a: "Yes. Prices are set by vehicle size and you see the exact starting price before you confirm." },
  ],

  seo: {
    titlePattern: "{BRAND} {SUFFIX} | Car Detailing & Ceramic Coating in {CITY}",
    description:
      "Hand wash, paint correction and ceramic coating in {CITY}. See prices by vehicle size and book a time in 30 seconds.",
    priceRange: "$$",
  },

  owner: {
    /** Comma-separated allow-list, read from env so it never ships in the client bundle. */
    emails: () => (env("OWNER_EMAILS") ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
  },

  /** Mirrors the CSS variables on :root. Edited here, injected by app/layout.tsx. */
  theme: {
    bg: "#0A0A0B",
    surface: "#121214",
    surface2: "#1A1A1D",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.16)",
    text: "#F5F5F2",
    muted: "#A1A1A6",
    red: "#E8150B",
    redHot: "#FF2A1F",
    orange: "#FF5A1F",
    amber: "#FFB81A",
    slab: "rgba(24,10,8,0.82)",
    success: "#4ADE80",
    warn: "#FBBF24",
    ctaFrom: "#FF3B1F",
    ctaTo: "#FF7A1A",
  },
};

export type SiteConfig = typeof siteConfig;

/** Fill {BRAND} {SUFFIX} {CITY} and any extra {KEY} placeholders. */
export function fill(template: string, extra: Record<string, string> = {}): string {
  const map: Record<string, string> = {
    BRAND: siteConfig.brand.name,
    SUFFIX: siteConfig.brand.suffix,
    CITY: siteConfig.brand.city,
    ...extra,
  };
  return template.replace(/\{(\w+)\}/g, (m, k: string) => map[k] ?? m);
}
