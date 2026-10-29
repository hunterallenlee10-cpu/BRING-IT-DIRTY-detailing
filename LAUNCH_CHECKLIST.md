# LAUNCH CHECKLIST

Work through this for every new studio before the site goes public.

## Replace before launch (still on template defaults)

Every brand variable in the master prompt was left as a `{{PLACEHOLDER}}`, so the template defaults are in use. All of these live in `src/site.config.ts`.

- [ ] `brand.name`: "REDLINE"
- [ ] `brand.suffix`: "DETAIL STUDIO"
- [ ] `brand.legalName`: "REDLINE Detail Studio"
- [ ] `brand.city`: "Frederick, MD"
- [ ] `brand.serviceArea` and `brand.areaCities`: Frederick, Hagerstown, Germantown & surrounding areas
- [ ] `brand.phone` / `brand.phoneE164`: (555) 010-0199, a fictional number
- [ ] `brand.email`: book@example.com
- [ ] `brand.address`: 123 Studio Way, Frederick, MD 21701 (fictional)
- [ ] `brand.geo`: lat/lng of the real studio, used in the LocalBusiness JSON-LD
- [ ] `brand.mapsEmbedUrl`: the real Google Maps embed, or `""` to hide the map
- [ ] `brand.googleReviewsUrl`: "#"
- [ ] `brand.instagramUrl`: "#" (and `facebookUrl` if they have one)
- [ ] `brand.foundedYear`
- [ ] `brand.timezone`: America/New_York
- [ ] `hours`: Mon–Sat 8:00–18:00, Sun closed
- [ ] `booking.bays`: 1
- [ ] `booking.slotTimes`: 08:00, 10:00, 13:00, 15:30
- [ ] `services[].basePrice`: Wash $129, Polish $349, Ceramic $899
- [ ] `services[].includes`: what they actually do
- [ ] `booking.sizeMultipliers`: coupe 1.0, sedan 1.0, SUV 1.2, truck 1.3
- [ ] `faq`: check every answer against how the studio really works (payment methods, cancellations, timing)
- [ ] `serviceMode`: "dropoff", or "onsite" for a mobile detailer
- [ ] `seo.titlePattern` / `seo.description` / `seo.priceRange`
- [ ] `theme`: only if the studio has its own colours
- [ ] `OWNER_EMAILS` env and `npm run create-owner` for the real owner

## Placeholders that must not ship

- [ ] **Reviews**: all three items in `reviews.items` have `isPlaceholder: true` and render with a dashed border and a "Placeholder" tag. Replace them with real Google reviews (copy the text exactly, use first name + last initial) and set `isPlaceholder: false`. Never invent reviews.
- [ ] **Rating badge**: `reviews.rating` 4.9 / `reviews.count` "120+" are template values (`ratingIsPlaceholder: true` shows a Placeholder tag). Use the studio's real Google numbers and set it to `false`.
- [ ] **Before/after gallery**: AI-generated sample cars (brand badges removed), flagged "Sample images" by `gallery.isSample: true`. Replace `G1…G4` with real job photos and set `isSample: false`.
- [ ] **Film and stills**: photoreal AI footage generated in Higgsfield (all 38 files in `assets-src/`, nothing missing in `ASSETS_TODO.md`). The demo car is unbadged but its styling resembles a real production sports car. For a real studio, consider regenerating with their own hero car or real footage, then `npm run frames` and `npm run check-align`.
- [ ] **OG image**: `OG_share.jpg` is AI-generated from the golden-hour shot. Swap in the studio's own photo if they have one.

## Accounts and env

- [ ] Supabase project created, migration applied, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] Owner created with `npm run create-owner`, and test login at `/admin/login`
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real domain (canonical, sitemap, OG)
- [ ] `CRON_SECRET` set (Vercel sends it to the cron route automatically)
- [ ] Twilio (optional): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `OWNER_ALERT_PHONE`
- [ ] **US texting compliance**: register the brand and an A2P 10DLC campaign in Twilio before sending, and keep "Reply C to change" / STOP handling. The booking form says "We text your confirmation here"; have the studio confirm that wording works for their consent policy.
- [ ] n8n (optional): `N8N_WEBHOOK_URL`, and test that a lead arrives
- [ ] Upstash (recommended on Vercel): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` for rate limiting across instances
- [ ] Demo-mode vars are **not** set in production (`DEMO_OWNER_*`, `DEMO_SIMULATE_SMS`, `DEMO_SHOW_HINT`)

## Final checks

- [ ] Make a real booking on a phone: confirmation text arrives, the row shows up live in `/admin/leads`, the source pill is right
- [ ] Try to book the same slot twice from two phones: the second one gets "That time just got booked"
- [ ] Trigger the reminder once: `curl -H "Authorization: Bearer $CRON_SECRET" "https://DOMAIN/api/cron/reminders?force=1"`
- [ ] `npm run lint && npm run typecheck && npm run build`
- [ ] `BASE_URL=https://DOMAIN npm run test:visual`
- [ ] Lighthouse mobile on the live URL (targets: Perf ≥ 85, A11y ≥ 95, Best Practices ≥ 95, SEO 100)
- [ ] Google Business Profile links to the site. Submit `https://DOMAIN/sitemap.xml` in Search Console.
- [ ] Privacy policy page, if the studio collects emails for marketing

## Deploy (Vercel)

Nothing has been deployed and no external project has been created yet.

1. Import the GitHub repo in Vercel (framework preset: Next.js, default build command).
2. Add the env vars above to Production (and Preview if you want previews to hit a staging Supabase).
3. Deploy. `vercel.json` registers two daily cron runs for reminders (19:00 and 20:00 UTC; only the one at 15:00 studio time sends).
4. Add the custom domain, then set `NEXT_PUBLIC_SITE_URL` to it and redeploy.
