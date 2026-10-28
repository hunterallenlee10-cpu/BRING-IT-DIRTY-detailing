# PLAN: REDLINE detailing template (film + booking + Owner OS)

Working defaults (no blocking questions): every `{{PLACEHOLDER}}` uses the default from the brief and is listed in `LAUNCH_CHECKLIST.md`. No Higgsfield (or any paid) generation is called. No external project (Supabase, Vercel) is created without asking.

## Key decisions

| Decision | Why |
|---|---|
| Next.js 15.5 + React 19 + Tailwind v4, TypeScript strict | As specified. |
| **Two data adapters behind one interface** (`src/lib/db`): `supabase` when `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set, otherwise a **local demo adapter** (in-memory + JSON file in `.data/`, seeded with the reference rows) | The site, booking and Owner OS all work end-to-end on a laptop or in a sales demo before any Supabase project exists. Swapping to Supabase is env-only. |
| Realtime: Supabase Realtime `INSERT` subscription; demo mode uses a Server-Sent Events stream from the same in-process emitter | Same UI code path (`useLeadStream`) for both. |
| Owner auth: Supabase Auth email/password + `admins` allow-list; demo mode uses `DEMO_OWNER_EMAIL` / `DEMO_OWNER_PASSWORD` with an HMAC-signed cookie | `/admin` is never open, even in demo mode. |
| **Double-booking safety in SQL**: a `book_slot()` Postgres function takes a per-slot advisory lock, counts, then inserts (returns `slot_full`) | Count-then-insert from the API alone races. Tested against a local Postgres 16 with 2 parallel requests for the last slot. Demo adapter uses an in-process mutex. |
| Film = canvas image sequence (no `<video>` scrub), GSAP ScrollTrigger pin + Lenis | As specified. |
| **Procedural placeholder art** when `assets-src/` is empty: the pipeline renders stylized SVG studio scenes (LED ceiling, wedge supercar silhouette, dirty / clean / dark / macro swirl / polished / bead / golden-hour variants) via sharp, then Ken Burns crossfades between them | The film, wash wipe and screenshots are meaningful before the Higgsfield files land; real files replace them with one `npm run frames`. |

## Phases

- [ ] **0 Plan**: this file.
- [ ] **1 Scaffold + design system**: Next app, tokens, fonts, `site.config.ts`, Logo / CtaPill / HighlightHeadline / Eyebrow / Chip / Grain, `/styleguide`.
- [ ] **2 Asset pipeline**: `build-frames.mjs` (clips → frames, stills, gallery, manifest, hashing, placeholders, `ASSETS_TODO.md`), `check-wash-align.mjs`. Run it.
- [ ] **3 The Film**: FilmStage, FrameSequence, LightsOn, WashWipe + Particles, ChapterText, StatusPill, ChapterRail, nav, BookingDock, mobile bar, reduced-motion stack. Playwright screenshots at 7 progress points × 2 viewports.
- [ ] **4 Booking drawer UI**: 4 steps, zod, summary flip, success + confetti, dock prefill, mobile sheet, 409 + network error states.
- [ ] **5 Backend**: migrations + RLS + `book_slot()`, seed, availability / bookings / questions / cron routes, `notify()` (Twilio, n8n), source attribution, rate limit. Race test.
- [ ] **6 Owner OS**: login, middleware, shell, Leads (realtime, highlight, toast, detail panel), Overview, Bookings, Calendar, Automations, stub pages. Two-browser live test.
- [ ] **7 Trust + SEO**: Services, Before/After, Reviews (placeholder-flagged), How it works, Area & Hours, FAQ (+JSON-LD), Final CTA, Footer, metadata, AutoWash JSON-LD, sitemap, robots, OG image.
- [ ] **8 Real assets**: waits on Hunter's files in `assets-src/`.
- [ ] **9 QA + polish**: Lighthouse, axe, keyboard, reduced motion, iOS quirks, slow 4G. README + LAUNCH_CHECKLIST.
- [ ] **10 Deploy prep**: `vercel.json` (cron, frame caching), env list. **Ask before deploying or creating projects.**

## Risks

1. **Wash alignment**: S1 is an AI edit of S0 and can drift a few px. Mitigated by `film.washAlign`, the `?align=1` overlay and `check-wash-align.mjs`.
2. **Clip morphing** in Kling / Seedance: the pipeline supports `C6a/C6b` splits.
3. **Frame weight on mobile data**: progressive loading keeps ~1.5 chapters ahead; budgets enforced in the pipeline log.
4. **JS budget (≤180KB gz)**: GSAP + Lenis + Motion are sizeable; the drawer, particles and admin are lazy chunks. Verified from build output.
5. **Demo adapter on Vercel** is per-instance memory, so it is for local demos only. Production needs Supabase (documented).
6. **Lighthouse on a canvas film**: LCP is the poster `<img>`; frames load after it.
