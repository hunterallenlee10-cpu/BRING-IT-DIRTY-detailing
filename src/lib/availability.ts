import "server-only";
import { siteConfig } from "@/site.config";
import type { AvailabilityDay, AvailabilityResponse } from "./schemas";
import { db } from "./db";
import { addDays, dateKey, hoursFor, parseDateKey, toMinutes, weekdayLong, weekdayOfKey, weekdayShort, zonedToUtc } from "./time";

/** A slot must start at least this far in the future to be bookable online. */
export const LEAD_MINUTES = 60;
const SEARCH_DAYS = 21;

export function slotStart(date: string, time: string) {
  const { year, month, day } = parseDateKey(date);
  const m = toMinutes(time);
  return zonedToUtc(year, month, day, Math.floor(m / 60), m % 60);
}

/** Slot times that fall inside that weekday's hours. */
export function slotsForDay(date: string) {
  const h = hoursFor(weekdayOfKey(date));
  if (!h) return [];
  const open = toMinutes(h[0]), close = toMinutes(h[1]);
  return siteConfig.booking.slotTimes.filter((t) => toMinutes(t) >= open && toMinutes(t) < close);
}

/** Next `n` open days (by HOURS) with remaining capacity per slot. */
export async function getAvailability(n = siteConfig.booking.daysShown, now = new Date()): Promise<AvailabilityResponse> {
  const bays = siteConfig.booking.bays;
  const earliest = now.getTime() + LEAD_MINUTES * 60_000;
  const today = dateKey(now);
  const keys: string[] = [];
  for (let i = 0; i < SEARCH_DAYS && keys.length < n; i++) {
    const k = addDays(today, i);
    const times = slotsForDay(k);
    if (!times.length) continue;
    // today only counts while one of its slots is still ahead
    if (i === 0 && !times.some((t) => slotStart(k, t).getTime() >= earliest)) continue;
    keys.push(k);
  }
  if (!keys.length) return { tz: siteConfig.brand.timezone, bays, days: [] };

  const from = slotStart(keys[0], "00:00");
  const to = slotStart(addDays(keys[keys.length - 1], 1), "00:00");
  const taken = new Map<number, number>();
  for (const s of await db().activeSlotsBetween(from, to)) {
    const t = new Date(s).getTime();
    taken.set(t, (taken.get(t) ?? 0) + 1);
  }

  const days: AvailabilityDay[] = keys.map((k) => {
    const wd = weekdayOfKey(k);
    const slots = slotsForDay(k).map((time) => {
      const start = slotStart(k, time);
      const remaining = Math.max(0, bays - (taken.get(start.getTime()) ?? 0));
      return { time, start: start.toISOString(), remaining, available: remaining > 0 && start.getTime() >= earliest };
    });
    const remaining = slots.reduce((a, s) => a + (s.available ? s.remaining : 0), 0);
    const total = slots.length * bays;
    let status: AvailabilityDay["status"] = "open";
    let label = "Open";
    if (remaining === 0) {
      status = "full";
      label = "Full";
    } else if (remaining <= 2 && total > 2) {
      status = "few";
      label = `${remaining} left`;
    } else if (k === today) {
      status = "today";
      label = "Today";
    } else if (k === addDays(today, 1)) {
      status = "tomorrow";
      label = "Tomorrow";
    }
    return { date: k, weekday: wd, weekdayShort: weekdayShort(wd), weekdayLong: weekdayLong(wd), status, label, remaining, slots };
  });
  return { tz: siteConfig.brand.timezone, bays, days };
}

/** Server-side check of a requested slot. Returns an error string or the start instant. */
export function validateSlot(date: string, time: string, now = new Date()): { ok: true; start: Date } | { ok: false; error: string } {
  if (!slotsForDay(date).includes(time)) return { ok: false, error: "That time isn't one of our slots." };
  const start = slotStart(date, time);
  if (start.getTime() < now.getTime() + LEAD_MINUTES * 60_000) return { ok: false, error: "That time has passed." };
  if (start.getTime() > now.getTime() + 60 * 86_400_000) return { ok: false, error: "That's too far ahead to book online." };
  return { ok: true, start };
}
