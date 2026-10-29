import { toMinutes } from "./time";

/** "08:00" → "8:00 AM" (older customers read 12-hour time faster). */
export function to12(hhmm: string) {
  const m = toMinutes(hhmm);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
