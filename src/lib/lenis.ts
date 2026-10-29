"use client";

import type Lenis from "lenis";

let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => (instance = l);
export const getLenis = () => instance;

/** Smooth scroll to a y position (Lenis when active, native otherwise). */
export function scrollToY(y: number, opts: { immediate?: boolean } = {}) {
  if (instance) instance.scrollTo(y, { immediate: opts.immediate, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: y, behavior: opts.immediate ? "auto" : "smooth" });
}

export function lockScroll(lock: boolean) {
  if (instance) {
    if (lock) instance.stop();
    else instance.start();
  }
  document.documentElement.style.overflow = lock ? "hidden" : "";
}
