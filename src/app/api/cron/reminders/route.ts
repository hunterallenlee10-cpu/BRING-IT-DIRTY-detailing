import { NextResponse } from "next/server";
import { siteConfig, fill } from "@/site.config";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendSms } from "@/lib/notify";
import { serviceById } from "@/lib/pricing";
import { addDays, dateKey, formatTime, zoned } from "@/lib/time";
import { slotStart } from "@/lib/availability";

export const dynamic = "force-dynamic";

/**
 * Day-before reminders. vercel.json calls this at 19:00 and 20:00 UTC; only the run that lands on
 * booking.reminderHour in the studio's timezone sends (DST-proof). ?force=1 skips the hour check.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const force = new URL(req.url).searchParams.get("force") === "1";
  if (!force && zoned(now).hour !== siteConfig.booking.reminderHour) {
    return NextResponse.json({ skipped: "not reminder hour", localHour: zoned(now).hour });
  }
  const tomorrow = addDays(dateKey(now), 1);
  const leads = await db().bookingsBetween(slotStart(tomorrow, "00:00"), slotStart(addDays(tomorrow, 1), "00:00"));
  const due = leads.filter((l) => (l.status === "booked" || l.status === "new") && l.follow_up !== "✓ Reminder sent");

  const results: { id: string; sent: boolean; error?: string }[] = [];
  for (const l of due) {
    const body = fill(siteConfig.copy.smsReminder, {
      service: l.service ? serviceById(l.service).name : "detail",
      time: formatTime(new Date(l.slot_start!)).replace(/^0/, ""),
    });
    try {
      if (env.hasTwilio) await sendSms(l.phone, body);
      else if (env.hasN8n) {
        await fetch(process.env.N8N_WEBHOOK_URL!, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ event: "lead.reminder", lead: l, message: body }),
          signal: AbortSignal.timeout(8000),
        });
      } else {
        results.push({ id: l.id, sent: false, error: "no SMS or n8n configured" });
        continue;
      }
      await db().updateLead(l.id, { follow_up: "✓ Reminder sent", follow_up_at: new Date().toISOString() });
      results.push({ id: l.id, sent: true });
    } catch (e) {
      results.push({ id: l.id, sent: false, error: String(e).slice(0, 200) });
    }
  }
  return NextResponse.json({ date: tomorrow, due: due.length, results });
}
