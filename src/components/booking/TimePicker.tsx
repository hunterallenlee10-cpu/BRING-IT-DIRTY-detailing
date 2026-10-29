"use client";

import type { AvailabilityDay } from "@/lib/schemas";
import { dropReadyCopy } from "@/lib/schedule";
import { prettyTime } from "@/lib/time";

interface Props {
  days: AvailabilityDay[] | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  date?: string;
  time?: string;
  onDate: (d: string) => void;
  onTime: (t: string) => void;
  durationDays: number;
  shake: number;
  message?: string | null;
}

export function TimePicker({ days, loading, error, onRetry, date, time, onDate, onTime, durationDays, shake, message }: Props) {
  if (error && !days) {
    return (
      <div className="rounded-[12px] border border-line-strong bg-surface-2 p-4 text-[14px] text-muted">
        Couldn&apos;t load open times.{" "}
        <button type="button" onClick={onRetry} className="font-semibold text-text underline">
          Try again
        </button>
      </div>
    );
  }
  const day = days?.find((d) => d.date === date);
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Day" className="grid grid-cols-4 gap-2">
        {(days ?? Array.from({ length: 4 }, () => null)).map((d, i) =>
          d ? (
            <button
              key={d.date}
              type="button"
              role="radio"
              aria-checked={date === d.date}
              disabled={d.status === "full"}
              aria-label={`${d.weekdayLong}, ${d.label}`}
              onClick={() => onDate(d.date)}
              className="selectable flex min-h-[60px] flex-col items-center justify-center rounded-[12px] px-1 disabled:opacity-40"
            >
              <span className={`text-[16px] font-semibold text-text ${d.status === "full" ? "line-through decoration-red-hot/80" : ""}`}>{d.weekdayShort}</span>
              <span
                className={`mt-0.5 font-mono text-[10px] tracking-[0.06em] ${d.status === "few" ? "text-amber" : d.status === "full" ? "text-muted line-through" : "text-muted"}`}
              >
                {d.label}
              </span>
            </button>
          ) : (
            <span key={i} className="h-[60px] animate-pulse rounded-[12px] bg-surface-2" aria-hidden="true" />
          ),
        )}
      </div>

      <div key={shake} role="radiogroup" aria-label="Time" className="grid grid-cols-4 gap-2" style={shake ? { animation: "shake 480ms var(--ease-io)" } : undefined}>
        {(day?.slots ?? (days?.[0]?.slots || [])).map((s) => {
          const avail = !!day && s.available;
          return (
            <button
              key={s.time}
              type="button"
              role="radio"
              aria-checked={!!day && time === s.time}
              disabled={!avail}
              onClick={() => onTime(s.time)}
              className="selectable tabular min-h-11 rounded-full text-[14px] font-medium text-text disabled:opacity-30"
            >
              {prettyTime(s.time)}
            </button>
          );
        })}
        {loading && !days && Array.from({ length: 4 }, (_, i) => <span key={i} className="h-11 animate-pulse rounded-full bg-surface-2" aria-hidden="true" />)}
      </div>

      <p className="min-h-5 text-[14px] text-muted" aria-live="polite">
        {message ? <span className="font-medium text-amber">{message}</span> : date && time ? dropReadyCopy(date, time, durationDays) : !date ? "Pick a day, then a time." : "Now pick a time."}
      </p>
    </div>
  );
}
