import { BookingProvider } from "@/components/booking/BookingContext";
import { FilmStage } from "@/components/film/FilmStage";
import { FilmChrome } from "@/components/film/FilmChrome";
import { SmoothScroll } from "@/components/film/SmoothScroll";
import { Grain } from "@/components/ui/Grain";

export default function Home() {
  return (
    <BookingProvider>
      <SmoothScroll />
      <Grain />
      <FilmChrome />
      <main id="top">
        <FilmStage />
        <section className="grid min-h-screen place-items-center text-muted">Sections (Phase 7)</section>
      </main>
    </BookingProvider>
  );
}
