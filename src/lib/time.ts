import { siteConfig, type DayKey } from "@/site.config";

export const TZ = siteConfig.brand.timezone;
export const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 = Sunday
  hour: number;
  minute: number;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      weekday: "short",
      hourCycle: "h23",
    });
    fmtCache.set(tz, f);
  }
  return f;
}

/** Wall-clock parts of `date` in the studio's timezone. */
export function zoned(date: Date, tz = TZ): ZonedParts {
  const p = Object.fromEntries(partsFormatter(tz).formatToParts(date).map((x) => [x.type, x.value]));
  return {
    year: +p.year,
    month: +p.month,
    day: +p.day,
    weekday: WEEKDAY_SHORT.indexOf(p.weekday),
    hour: +p.hour % 24,
    minute: +p.minute,
  };
}

/** UTC instant for a wall-clock time in the studio's timezone (DST-safe). */
export function zonedToUtc(year: number, month: number, day: number, hour: number, minute: number, tz = TZ): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let t = guess;
  for (let i = 0; i < 3; i++) {
    const z = zoned(new Date(t), tz);
    const asUtc = Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute);
    t += guess - asUtc;
  }
  return new Date(t);
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** "08:00" → "8:00" (the studio's own style); "15:30" stays "15:30". */
export const prettyTime = (hhmm: string) => hhmm.replace(/^0/, "");

export function hoursFor(weekday: number) {
  return siteConfig.hours[DAY_KEYS[weekday]];
}

export interface OpenStatus {
  open: boolean;
  /** e.g. "OPENS 8:00" or "OPENS MON 8:00" when closed. */
  nextLabel: string;
}

export function openStatus(now = new Date()): OpenStatus {
  const z = zoned(now);
  const mins = z.hour * 60 + z.minute;
  const today = hoursFor(z.weekday);
  if (today && mins >= toMinutes(today[0]) && mins < toMinutes(today[1])) return { open: true, nextLabel: "" };
  if (today && mins < toMinutes(today[0])) return { open: false, nextLabel: `OPENS ${prettyTime(today[0])}` };
  for (let i = 1; i <= 7; i++) {
    const wd = (z.weekday + i) % 7;
    const h = hoursFor(wd);
    if (h) return { open: false, nextLabel: i === 1 ? `OPENS ${prettyTime(h[0])}` : `OPENS ${WEEKDAY_SHORT[wd].toUpperCase()} ${prettyTime(h[0])}` };
  }
  return { open: false, nextLabel: "" };
}

/** Calendar date key "YYYY-MM-DD" in the studio timezone. */
export function dateKey(date: Date) {
  const z = zoned(date);
  return `${z.year}-${String(z.month).padStart(2, "0")}-${String(z.day).padStart(2, "0")}`;
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { year: y, month: m, day: d };
}

/** Add whole calendar days to a date key (noon anchor avoids DST edges). */
export function addDays(key: string, n: number) {
  const { year, month, day } = parseDateKey(key);
  const t = new Date(Date.UTC(year, month - 1, day + n, 12));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

export function weekdayOfKey(key: string) {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

export const weekdayShort = (wd: number) => WEEKDAY_SHORT[wd];
export const weekdayLong = (wd: number) => WEEKDAY_LONG[wd];

/** "Thu 10:00" (or "Today 13:30" / "Tomorrow 8:00") for a slot instant. */
export function formatSlot(date: Date, now = new Date(), relative = true) {
  const k = dateKey(date);
  const z = zoned(date);
  const time = `${z.hour}:${String(z.minute).padStart(2, "0")}`;
  if (relative) {
    const today = dateKey(now);
    if (k === today) return `Today ${time}`;
    if (k === addDays(today, 1)) return `Tomorrow ${time}`;
  }
  return `${WEEKDAY_SHORT[z.weekday]} ${time}`;
}

export function formatDayLong(date: Date) {
  return WEEKDAY_LONG[zoned(date).weekday];
}

export function formatTime(date: Date) {
  const z = zoned(date);
  return `${String(z.hour).padStart(2, "0")}:${String(z.minute).padStart(2, "0")}`;
}

/** "Thu Oct 30" style */
export function formatDateShort(date: Date) {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).format(date);
}

export function relativeTime(date: Date, now = new Date()) {
  const s = Math.round((now.getTime() - date.getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24 && dateKey(date) === dateKey(now)) return `${h}h ago`;
  if (dateKey(date) === addDays(dateKey(now), -1)) return "Yesterday";
  const d = Math.round(h / 24);
  if (d < 7) return `${Math.max(2, d)} days ago`;
  return formatDateShort(date);
}
