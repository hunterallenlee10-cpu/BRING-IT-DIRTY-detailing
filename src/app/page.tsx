import { BookingProvider } from "@/components/booking/BookingContext";
import { FilmStage } from "@/components/film/FilmStage";
import { FilmChrome } from "@/components/film/FilmChrome";
import { SmoothScroll } from "@/components/film/SmoothScroll";
import { Grain } from "@/components/ui/Grain";
import { Services } from "@/components/sections/Services";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { Reviews } from "@/components/sections/Reviews";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { AreaHours } from "@/components/sections/AreaHours";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { faqJsonLd, ldJson, localBusinessJsonLd } from "@/lib/jsonld";

export default function Home() {
  return (
    <BookingProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(localBusinessJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqJsonLd()) }} />
      <SmoothScroll />
      <Grain />
      <FilmChrome />
      <main id="top">
        <FilmStage />
        <Services />
        <BeforeAfter />
        <HowItWorks />
        <Reviews />
        <AreaHours />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </BookingProvider>
  );
}
