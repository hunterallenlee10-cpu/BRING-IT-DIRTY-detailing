"use client";

import { useEffect, useRef } from "react";

/** Adds .is-in once the element scrolls into view (used with HighlightHeadline reveal). */
export function useReveal<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.matches(".hl-reveal") ? [el] : Array.from(el.querySelectorAll<HTMLElement>(".hl-reveal"));
    if (!("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}
