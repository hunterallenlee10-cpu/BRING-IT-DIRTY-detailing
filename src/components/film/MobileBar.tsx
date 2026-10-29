"use client";

import { siteConfig } from "@/site.config";
import { useBooking } from "@/components/booking/BookingContext";
import { PhoneIcon } from "@/components/ui/icons";
import { Arrow } from "@/components/ui/Arrow";

/** Phones: sticky CALL + BOOK bar, 56px tall plus the safe area. Keeps the number one tap away on every screen. */
export function MobileBar() {
  const { open, isOpen } = useBooking();
  return (
    <div
      className={`safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-[rgba(12,12,13,.9)] px-3 pt-2.5 backdrop-blur-md transition-transform duration-300 sm:hidden ${isOpen ? "translate-y-full" : ""}`}
    >
      <div className="grid grid-cols-[auto_1fr] gap-2.5">
        <a
          href={`tel:${siteConfig.brand.phoneE164}`}
          className="flex min-h-14 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface-2 px-5 text-[14px] font-semibold uppercase tracking-[0.06em] text-text"
        >
          <PhoneIcon size={18} className="text-red-hot" /> CALL
        </a>
        <button type="button" onClick={() => open()} className="cta-pill min-h-14 text-[13px]">
          <span>{siteConfig.copy.cta}</span>
          <span className="arrow" aria-hidden="true">
            <Arrow />
          </span>
        </button>
      </div>
    </div>
  );
}
