"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { useForm } from "react-hook-form";
import { siteConfig, type ServiceId, type VehicleId } from "@/site.config";
import type { Prefill } from "./BookingContext";
import type { AvailabilityDay, AvailabilityResponse, BookingResult } from "@/lib/schemas";
import { questionSchema } from "@/lib/schemas";
import { isValidUSPhone } from "@/lib/phone";
import { money, priceFor, serviceById, vehicleLabel } from "@/lib/pricing";
import { prettyTime, weekdayOfKey, weekdayShort } from "@/lib/time";
import { captureSource } from "@/lib/source";
import { lockScroll } from "@/lib/lenis";
import { CarTiles } from "./CarTiles";
import { WorkCards } from "./WorkCards";
import { TimePicker } from "./TimePicker";
import { DetailsForm, Field, type DetailsValues } from "./DetailsForm";
import { SummaryCard } from "./SummaryCard";
import { SuccessView } from "./SuccessView";
import { CloseIcon, PhoneIcon } from "@/components/ui/icons";
import { Arrow } from "@/components/ui/Arrow";

interface FormValues extends DetailsValues {
  vehicle?: VehicleId;
  service?: ServiceId;
  date?: string;
  time?: string;
  message?: string;
  [k: string]: unknown;
}

type View = "form" | "question" | "success" | "questionSuccess";

const emailOk = (v?: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const firstName = (n: string) => n.trim().split(/\s+/)[0] || n.trim();

export default function BookingDrawer({ open, onClose, prefill, openKey }: { open: boolean; onClose: () => void; prefill: Prefill; openKey: number }) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();
  // client-only component (dynamic, ssr:false), so reading matchMedia up front is safe and avoids a wrong first animation
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 639px)").matches);
  const [view, setView] = useState<View>("form");
  const [days, setDays] = useState<AvailabilityDay[] | null>(null);
  const [loadingDays, setLoadingDays] = useState(false);
  const [daysError, setDaysError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [netError, setNetError] = useState<string | null>(null);
  const [slotMsg, setSlotMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [qName, setQName] = useState("");

  const { register, watch, setValue, reset, setError, formState, trigger } = useForm<FormValues>({
    mode: "onTouched",
    defaultValues: { name: "", phone: "", email: "", website: "", message: "" },
  });
  const v = watch();

  // ------------------------------------------------------------ open / close lifecycle
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const set = () => setMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const loadDays = useCallback(async () => {
    setLoadingDays(true);
    setDaysError(false);
    try {
      const res = await fetch(`/api/availability?days=${siteConfig.booking.daysShown}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as AvailabilityResponse;
      setDays(data.days);
      return data.days;
    } catch {
      setDaysError(true);
      return null;
    } finally {
      setLoadingDays(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    // fresh drawer after a finished booking; otherwise keep what they typed
    if (view === "success" || view === "questionSuccess") {
      reset({ name: "", phone: "", email: "", website: "", message: "" });
      setResult(null);
      setView("form");
    }
    if (prefill.vehicle) setValue("vehicle", prefill.vehicle);
    if (prefill.service) setValue("service", prefill.service);
    setSlotMsg(null);
    setNetError(null);
    loadDays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey, open]);

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement as HTMLElement;
    lockScroll(true);
    const t = setTimeout(() => {
      // start on the first car tile (the first thing to decide), not the close button
      const first = panel.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]') ?? panel.current?.querySelector<HTMLElement>("button, input");
      first?.focus({ preventScroll: true });
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab" && panel.current) {
        const f = Array.from(
          panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([tabindex="-1"]), textarea, [tabindex="0"]'),
        ).filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        const a = f[0], b = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          b.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      lockScroll(false);
      restoreFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  // a day change can invalidate the chosen time
  useEffect(() => {
    if (!v.date || !v.time || !days) return;
    const slot = days.find((d) => d.date === v.date)?.slots.find((s) => s.time === v.time);
    if (!slot?.available) setValue("time", undefined);
  }, [v.date, v.time, days, setValue]);

  // ------------------------------------------------------------ derived
  const steps = [!!v.vehicle, !!v.service, !!(v.date && v.time), !!(v.name?.trim() && isValidUSPhone(v.phone || "") && emailOk(v.email))];
  const valid = steps.every(Boolean);
  const service = v.service ? serviceById(v.service) : null;
  const price = v.service ? priceFor(v.service, v.vehicle) : null;
  const dropLabel = v.date && v.time ? `${weekdayShort(weekdayOfKey(v.date))} ${prettyTime(v.time)}` : null;
  const rows = useMemo(
    () => [
      { label: "Car", value: v.vehicle ? vehicleLabel(v.vehicle) : null },
      { label: "Work", value: service?.name ?? null },
      { label: "Drop-off", value: dropLabel },
      { label: "Name", value: v.name?.trim() || null },
      { label: "Est. price", value: price ? money(price) : null, strong: true },
    ],
    [v.vehicle, service, dropLabel, v.name, price],
  );

  // ------------------------------------------------------------ submit
  const submit = async () => {
    if (!valid || submitting) {
      trigger(["name", "phone", "email"]);
      return;
    }
    setSubmitting(true);
    setNetError(null);
    setSlotMsg(null);
    const t0 = performance.now();
    const src = captureSource();
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          vehicle: v.vehicle,
          service: v.service,
          date: v.date,
          time: v.time,
          name: v.name,
          phone: v.phone,
          email: v.email || undefined,
          website: v.website || undefined,
          source: src.source,
          utm: src.utm,
        }),
      });
      await wait(Math.max(0, 600 - (performance.now() - t0)));
      if (res.status === 201) {
        setResult((await res.json()) as BookingResult);
        setView("success");
      } else if (res.status === 409) {
        setShake((n) => n + 1);
        setSlotMsg(siteConfig.copy.slotTaken);
        setValue("time", undefined);
        loadDays();
      } else if (res.status === 400) {
        const body = await res.json().catch(() => ({}));
        const issues: { path: string[]; message: string }[] = body.issues ?? [];
        issues.forEach((i) => setError(i.path[0] as "name", { message: i.message }));
        if (!issues.length) setNetError("Something in the form needs another look.");
      } else if (res.status === 429) {
        setNetError("Too many tries in a row. Give it a minute, or call us.");
      } else {
        setNetError("We couldn't reach the studio.");
      }
    } catch {
      setNetError("You seem to be offline.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitQuestion = async () => {
    const payload = { name: v.name, phone: v.phone, email: v.email || undefined, message: v.message, vehicle: v.vehicle, service: v.service, website: v.website || undefined, ...captureSource() };
    const parsed = questionSchema.safeParse(payload);
    if (!parsed.success) {
      parsed.error.issues.forEach((i) => setError(String(i.path[0]) as "name", { message: i.message }));
      return;
    }
    setSubmitting(true);
    setNetError(null);
    try {
      const res = await fetch("/api/questions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(String(res.status));
      setQName(firstName(v.name));
      setView("questionSuccess");
    } catch {
      setNetError("We couldn't send that.");
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------------------------ render
  const panelMotion = mobile
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
    : { initial: { x: "calc(100% + 24px)" }, animate: { x: 0 }, exit: { x: "calc(100% + 24px)" } };
  const spring = reduce ? { duration: 0.01 } : { type: "spring" as const, stiffness: 340, damping: 36, mass: 0.9 };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" key="booking">
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.3 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 top-2 flex flex-col overflow-hidden rounded-t-[var(--radius-drawer)] border border-line-strong bg-[rgba(18,18,20,.96)] shadow-[0_0_0_1px_rgba(255,42,31,.08),0_0_60px_rgba(255,42,31,.18),0_30px_80px_rgba(0,0,0,.7)] backdrop-blur-xl sm:inset-y-4 sm:left-auto sm:right-4 sm:top-4 sm:w-[440px] sm:rounded-[var(--radius-drawer)]"
            {...panelMotion}
            transition={spring}
            drag={mobile ? "y" : false}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose();
            }}
          >
            {/* header */}
            <div className="relative shrink-0 touch-none" onPointerDown={(e) => mobile && dragControls.start(e)}>
              {mobile && <div className="absolute left-1/2 top-2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-white/40" aria-hidden="true" />}
              <div className="relative h-24 overflow-hidden">
                {/* decorative 880px crop made by the asset pipeline; next/image would only add a resize hop */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/stills/ribbon-880.webp" alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,18,20,.95)] via-[rgba(18,18,20,.2)] to-transparent" />
                <span className="absolute bottom-3 left-4 rounded-full bg-red px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-white shadow-[0_0_16px_rgba(255,42,31,.6)]">
                  {siteConfig.copy.ribbon}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close booking"
                  className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md transition-colors hover:bg-black/75"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {view === "success" && result ? (
                <motion.div key="ok" className="flex-1 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <span id={titleId} className="sr-only">
                    Booking confirmed
                  </span>
                  <SuccessView firstName={result.firstName} slotLabel={result.slotLabel} onDone={onClose} />
                </motion.div>
              ) : view === "questionSuccess" ? (
                <motion.div key="qok" className="flex-1 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <span id={titleId} className="sr-only">
                    Question sent
                  </span>
                  <SuccessView title="GOT IT," firstName={qName} sub="We'll text you back shortly." onDone={onClose} />
                </motion.div>
              ) : (
                <motion.div key={view} className="flex min-h-0 flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6" data-lenis-prevent>
                    <p className="hud mt-4 text-[10px] text-muted">
                      {siteConfig.brand.name} · {siteConfig.brand.suffix}
                    </p>
                    <h2 id={titleId} className="display glow-white mt-1.5 text-[40px]">
                      {view === "question" ? "ASK A QUESTION" : siteConfig.copy.drawerTitle}
                    </h2>

                    {view === "form" ? (
                      <>
                        <div className="mt-4 grid grid-cols-4 gap-1.5" aria-label={`${steps.filter(Boolean).length} of 4 steps done`} role="img">
                          {steps.map((s, i) => (
                            <span key={i} className="h-1 overflow-hidden rounded-full bg-white/10">
                              <span
                                className="block h-full origin-left rounded-full bg-red shadow-[0_0_8px_rgba(255,42,31,.8)] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
                                style={{ transform: `scaleX(${s ? 1 : 0})` }}
                              />
                            </span>
                          ))}
                        </div>

                        <Step n={1} title="YOUR CAR">
                          <CarTiles value={v.vehicle} onChange={(x) => setValue("vehicle", x)} />
                        </Step>
                        <Step n={2} title="THE WORK">
                          <WorkCards value={v.service} vehicle={v.vehicle} onChange={(x) => setValue("service", x)} />
                        </Step>
                        <Step n={3} title="PICK A TIME">
                          <TimePicker
                            days={days}
                            loading={loadingDays}
                            error={daysError}
                            onRetry={loadDays}
                            date={v.date}
                            time={v.time}
                            onDate={(d) => (setValue("date", d), setSlotMsg(null))}
                            onTime={(t) => (setValue("time", t), setSlotMsg(null))}
                            durationDays={service?.durationDays ?? 0}
                            shake={shake}
                            message={slotMsg}
                          />
                        </Step>
                        <Step n={4} title="YOUR DETAILS">
                          <DetailsForm register={register} errors={formState.errors} />
                        </Step>
                        <div className="mt-6">
                          <SummaryCard rows={rows} />
                        </div>
                      </>
                    ) : (
                      <div className="mt-5 flex flex-col gap-3">
                        <p className="text-[15px] text-muted">Ask anything: a quote for your car, timing, what&apos;s included. We text back fast.</p>
                        <DetailsForm register={register} errors={formState.errors} idPrefix="q" />
                        <Field id="q-message" label="Your question" error={formState.errors.message?.message as string | undefined}>
                          <textarea id="q-message" rows={4} className="input resize-none" placeholder="How much for a ceramic coat on a 2022 Tahoe?" {...register("message")} />
                        </Field>
                      </div>
                    )}
                  </div>

                  {/* sticky footer */}
                  <div className="safe-pb shrink-0 border-t border-line bg-[rgba(18,18,20,.98)] px-5 pt-3">
                    {netError && (
                      <div role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-[10px] border border-[#ff6b5f]/40 bg-[#ff2a1f]/10 px-3 py-2.5 text-[14px]">
                        <span>
                          {netError} Your answers are saved.
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <button type="button" onClick={view === "question" ? submitQuestion : submit} className="font-semibold underline">
                            Retry
                          </button>
                          <a href={`tel:${siteConfig.brand.phoneE164}`} className="flex items-center gap-1 font-semibold text-red-hot">
                            <PhoneIcon size={14} /> Call
                          </a>
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={view === "question" ? submitQuestion : submit}
                      aria-disabled={view === "form" ? !valid : false}
                      disabled={submitting}
                      className={`relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-[14px] text-[14px] font-semibold uppercase tracking-[0.08em] text-white transition-[opacity,box-shadow] duration-300 ${
                        view === "form" && !valid ? "opacity-40" : "shadow-[0_0_28px_rgba(255,80,30,.5),0_4px_14px_rgba(255,60,20,.35)]"
                      }`}
                      style={{ background: "var(--cta-gradient)" }}
                    >
                      {submitting && (
                        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)]" style={{ animation: "shimmer 600ms linear infinite" }} />
                      )}
                      <span className="relative">{submitting ? (view === "question" ? "SENDING…" : "BOOKING…") : view === "question" ? "SEND QUESTION" : "CONFIRM BOOKING"}</span>
                      {!submitting && <Arrow className="relative" />}
                    </button>
                    <div className="flex items-center justify-between py-2.5 text-[13px] text-muted">
                      <span>{view === "form" ? siteConfig.copy.drawerFootnote : "No spam. Just an answer."}</span>
                      <button
                        type="button"
                        onClick={() => (setView(view === "form" ? "question" : "form"), setNetError(null))}
                        className="min-h-9 font-medium text-text/85 underline decoration-white/30 underline-offset-4 hover:text-text"
                      >
                        {view === "form" ? "Ask a question" : "Back to booking"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-7">
      <legend className="hud mb-3 flex items-center gap-2 text-[10px] text-muted">
        <span className="text-red-hot">{n}</span>
        <span>·</span>
        <span className="text-text">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}
