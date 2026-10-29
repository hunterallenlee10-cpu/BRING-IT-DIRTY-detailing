import { addDays, hoursFor, weekdayOfKey, weekdayShort } from "./time";

/** Calendar day the car is ready: drop-off + durationDays, pushed past closed days. */
export function readyDateKey(dropKey: string, durationDays: number) {
  if (durationDays <= 0) return dropKey;
  let k = addDays(dropKey, durationDays);
  for (let i = 0; i < 7 && !hoursFor(weekdayOfKey(k)); i++) k = addDays(k, 1);
  return k;
}

export function dropReadyCopy(dropKey: string, time: string, durationDays: number) {
  const drop = `${weekdayShort(weekdayOfKey(dropKey))} ${time.replace(/^0/, "")}`;
  if (durationDays <= 0) return `Drop-off ${drop} · Ready the same day`;
  return `Drop-off ${drop} · Ready ${weekdayShort(weekdayOfKey(readyDateKey(dropKey, durationDays)))}`;
}
