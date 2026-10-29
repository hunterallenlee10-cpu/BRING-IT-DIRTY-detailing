import { after, NextResponse } from "next/server";
import { siteConfig } from "@/site.config";
import { bookingSchema, type BookingResult } from "@/lib/schemas";
import { validateSlot } from "@/lib/availability";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { priceFor, serviceById } from "@/lib/pricing";
import { readyDateKey } from "@/lib/schedule";
import { formatTime, hoursFor, parseDateKey, toMinutes, weekdayLong, weekdayOfKey, zonedToUtc } from "@/lib/time";
import { maskPhone } from "@/lib/phone";
import { normaliseSource } from "@/lib/source";

export const dynamic = "force-dynamic";

const firstName = (n: string) => n.trim().split(/\s+/)[0];

export async function POST(req: Request) {
  const limit = await rateLimit(`book:${clientIp(req)}`);
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues.map((i) => ({ path: i.path.map(String), message: i.message })) }, { status: 400 });
  }
  const b = parsed.data;
  const service = serviceById(b.service);
  const slotLabel = `${weekdayLong(weekdayOfKey(b.date)).toUpperCase()} · ${b.time} · ${service.name.toUpperCase()}`;

  // honeypot: look successful, store nothing
  if (b.website) {
    return NextResponse.json({ ok: true, id: "0", firstName: firstName(b.name), slotLabel, readyLabel: null } satisfies BookingResult, { status: 201 });
  }

  const slot = validateSlot(b.date, b.time);
  if (!slot.ok) return NextResponse.json({ error: "bad_slot", issues: [{ path: ["time"], message: slot.error }] }, { status: 400 });

  const readyKey = readyDateKey(b.date, service.durationDays);
  const readyHours = hoursFor(weekdayOfKey(readyKey));
  const r = parseDateKey(readyKey);
  const close = toMinutes(readyHours?.[1] ?? "17:00");
  const readyAt = zonedToUtc(r.year, r.month, r.day, Math.floor(close / 60), close % 60);

  const result = await db().bookSlot(
    {
      name: b.name.trim(),
      phone: maskPhone(b.phone),
      email: b.email?.trim() || null,
      vehicle: b.vehicle,
      service: b.service,
      kind: "booking",
      status: "booked",
      slot_start: slot.start.toISOString(),
      ready_at: readyAt.toISOString(),
      source: normaliseSource(b.source || "website"),
      utm: b.utm ?? {},
      est_price: priceFor(b.service, b.vehicle),
    },
    siteConfig.booking.bays,
  );
  if (!result.ok) return NextResponse.json({ error: "slot_full" }, { status: 409 });

  after(() => notify(result.lead).catch((e) => console.error("[notify]", e)));

  return NextResponse.json(
    {
      ok: true,
      id: result.lead.id,
      firstName: firstName(b.name),
      slotLabel: `${weekdayLong(weekdayOfKey(b.date)).toUpperCase()} · ${formatTime(slot.start)} · ${service.name.toUpperCase()}`,
      readyLabel: service.durationDays ? weekdayLong(weekdayOfKey(readyKey)) : null,
    } satisfies BookingResult,
    { status: 201 },
  );
}
