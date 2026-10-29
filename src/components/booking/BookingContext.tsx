"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { captureSource } from "@/lib/source";
import type { ServiceId, VehicleId } from "@/site.config";

export interface Prefill {
  vehicle?: VehicleId;
  service?: ServiceId;
}

interface BookingCtx {
  open: (prefill?: Prefill) => void;
  close: () => void;
  isOpen: boolean;
  /** Choices made in the dock / pricing toggle before the drawer opens. */
  prefill: Prefill;
  setPrefill: (p: Prefill) => void;
}

const Ctx = createContext<BookingCtx | null>(null);

// The drawer (form, validation, confetti) is its own chunk, fetched on first open or on idle.
const BookingDrawer = dynamic(() => import("./BookingDrawer"), { ssr: false });

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [prefill, setPrefillState] = useState<Prefill>({});
  const [openKey, setOpenKey] = useState(0);

  // record first-touch source on landing (referrer is only reliable on the first page view)
  useEffect(() => {
    captureSource();
    // warm the drawer chunk once the page is idle so the first open is instant
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const warm = () => import("./BookingDrawer");
    if (w.requestIdleCallback) w.requestIdleCallback(warm);
    else setTimeout(warm, 2500);
  }, []);

  const open = useCallback((p?: Prefill) => {
    if (p) setPrefillState((cur) => ({ ...cur, ...p }));
    setMounted(true);
    setOpenKey((k) => k + 1);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const setPrefill = useCallback((p: Prefill) => setPrefillState((cur) => ({ ...cur, ...p })), []);

  const value = useMemo(() => ({ open, close, isOpen, prefill, setPrefill }), [open, close, isOpen, prefill, setPrefill]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {mounted && <BookingDrawer open={isOpen} onClose={close} prefill={prefill} openKey={openKey} />}
    </Ctx.Provider>
  );
}

export function useBooking() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBooking must be used inside <BookingProvider>");
  return c;
}
