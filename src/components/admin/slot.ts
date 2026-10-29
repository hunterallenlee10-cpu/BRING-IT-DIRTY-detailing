import { parseDateKey, toMinutes, zonedToUtc } from "@/lib/time";

export function slotStartUtc(date: string, time: string) {
  const { year, month, day } = parseDateKey(date);
  const m = toMinutes(time);
  return zonedToUtc(year, month, day, Math.floor(m / 60), m % 60);
}
