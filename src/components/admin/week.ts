import { addDays, dateKey, weekdayOfKey } from "@/lib/time";
import { slotStartUtc } from "./slot";

/** Monday-based week containing `now`, in the studio timezone. */
export function weekRange(now: Date, offsetWeeks = 0) {
  const today = dateKey(now);
  const monday = addDays(today, -((weekdayOfKey(today) + 6) % 7) + offsetWeeks * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return { days, from: slotStartUtc(monday, "00:00"), to: slotStartUtc(addDays(monday, 7), "00:00") };
}
