"use client";

import { TopBar } from "./TopBar";
import { ChapterRail } from "./ChapterRail";
import { BookingDock } from "./BookingDock";
import { MobileBar } from "./MobileBar";

export function FilmChrome() {
  return (
    <>
      <TopBar />
      <ChapterRail />
      <BookingDock />
      <MobileBar />
    </>
  );
}
