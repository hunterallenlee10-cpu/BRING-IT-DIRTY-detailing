"use client";

/**
 * Run `fn` once the page has painted and gone idle, or right away on the first scroll / touch / key.
 * Keeps heavy start-up work (canvas, frame fetching, smooth-scroll ticker) out of the LCP window.
 */
export function whenIdle(fn: () => void, timeout = 1500) {
  let done = false;
  const events = ["wheel", "touchstart", "keydown", "pointerdown", "scroll"] as const;
  const go = () => {
    if (done) return;
    done = true;
    events.forEach((e) => window.removeEventListener(e, go));
    fn();
  };
  events.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  const schedule = () => (w.requestIdleCallback ? w.requestIdleCallback(go, { timeout }) : setTimeout(go, 300));
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    done = true;
    events.forEach((e) => window.removeEventListener(e, go));
  };
}
