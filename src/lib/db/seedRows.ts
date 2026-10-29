import type { NewLead } from "./types";
import { addDays, dateKey, toMinutes, weekdayOfKey, zonedToUtc, parseDateKey } from "@/lib/time";
import { priceFor } from "@/lib/pricing";

/** Next date key (today or later) that falls on `weekday` (0 = Sun) where hh:mm is still ahead. */
function nextWeekday(now: Date, weekday: number, hhmm: string) {
  let k = dateKey(now);
  for (let i = 0; i < 8; i++) {
    if (weekdayOfKey(k) === weekday) {
      const { year, month, day } = parseDateKey(k);
      const at = zonedToUtc(year, month, day, Math.floor(toMinutes(hhmm) / 60), toMinutes(hhmm) % 60);
      if (at.getTime() > now.getTime()) return at;
    }
    k = addDays(k, 1);
  }
  return now;
}

function todayAt(now: Date, hhmm: string) {
  const { year, month, day } = parseDateKey(dateKey(now));
  return zonedToUtc(year, month, day, Math.floor(toMinutes(hhmm) / 60), toMinutes(hhmm) % 60);
}

const ago = (now: Date, ms: number) => new Date(now.getTime() - ms).toISOString();
const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

/** The six demo rows from the reference dashboard, timestamps relative to now. */
export function demoLeads(now = new Date()): NewLead[] {
  const yesterday = (h: number) => ago(now, DAY + h * HOUR);
  return [
    {
      name: "Alex M.", phone: "(301) 555-0188", vehicle: "sedan", service: "wash", kind: "booking", source: "google", status: "booked",
      slot_start: nextWeekday(now, 6, "09:00").toISOString(), follow_up: "✓ Reminder scheduled", est_price: priceFor("wash", "sedan"), created_at: ago(now, 2 * DAY + 3 * HOUR),
      follow_up_at: ago(now, 2 * DAY + 3 * HOUR - 6000),
    },
    {
      name: "Karim B.", phone: "(240) 555-0142", vehicle: "sedan", service: "polish", kind: "booking", source: "instagram", status: "booked",
      slot_start: nextWeekday(now, 5, "12:00").toISOString(), follow_up: "✓ Reminder scheduled", est_price: priceFor("polish", "sedan"), created_at: yesterday(5),
      follow_up_at: yesterday(5),
    },
    {
      name: "Sophie L.", phone: "(301) 555-0127", vehicle: "coupe", service: "ceramic", kind: "quote", source: "google", status: "quote",
      follow_up: "Follow-up tomorrow", est_price: priceFor("ceramic", "coupe"), message: "Can I get a quote for ceramic on my coupe? It has a few rock chips.", created_at: yesterday(2),
    },
    {
      name: "Jason T.", phone: "(240) 555-0163", vehicle: "truck", service: "wash", kind: "booking", source: "website", status: "booked",
      slot_start: todayAt(now, "13:30").toISOString(), follow_up: "✓ Confirmed by text", est_price: priceFor("wash", "truck"), created_at: ago(now, HOUR),
      follow_up_at: ago(now, HOUR - 5000),
    },
    {
      name: "Nadia R.", phone: "(301) 555-0109", vehicle: "suv", service: "polish", kind: "question", source: "chatgpt", status: "new",
      follow_up: "✓ Auto-reply sent", message: "Do you remove swirl marks on black paint? How long does it take?", created_at: ago(now, 12 * MIN),
      follow_up_at: ago(now, 12 * MIN - 3000),
    },
    {
      name: "Daniel Reyes", phone: "(240) 555-0171", vehicle: "coupe", service: "ceramic", kind: "booking", source: "website", status: "booked",
      slot_start: nextWeekday(now, 4, "10:00").toISOString(), follow_up: "✓ Text sent in 4s", est_price: priceFor("ceramic", "coupe"), created_at: ago(now, 20_000),
      follow_up_at: ago(now, 16_000),
    },
  ];
}
