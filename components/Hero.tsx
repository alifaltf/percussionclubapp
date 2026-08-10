import Button from "@/components/ui/Button";
import Carousel from "@/components/ui/Carousel";
import { getSiteSettings } from "@/lib/supabase/settings";
import { DEFAULT_SITE_SETTINGS } from "@/types/settings";

const HERO_IMAGES = [
  {
    src: "/images/hero/hero-1.jpg",
    alt: "IIUM Percussion Club performing on stage",
  },
  {
    src: "/images/hero/hero-2.jpg",
    alt: "Percussion ensemble during rehearsal",
  },
  {
    src: "/images/hero/hero-3.jpg",
    alt: "Close-up of percussion instruments in performance",
  },
  {
    src: "/images/hero/hero-4.jpg",
    alt: "Club members performing together",
  },
];

const AUTOPLAY_INTERVAL_MS = 5000;

export default async function Hero() {
  const settings = await getSiteSettings().catch(() => DEFAULT_SITE_SETTINGS);

  return (
    <section
      id="home"
      className="relative h-[75vh] w-full sm:h-[85vh] lg:h-[92vh]"
    >
      <Carousel
        images={HERO_IMAGES}
        intervalMs={AUTOPLAY_INTERVAL_MS}
        className="h-full w-full"
      >
        <div className="flex flex-col items-center text-center">
          <h1 className="animate-fade-in-up font-serif text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            {settings.hero_heading}
          </h1>

          <p className="animate-fade-in-up mt-5 text-base tracking-wide text-white/85 [animation-delay:150ms] sm:text-xl">
            {settings.hero_subheading}
          </p>

          <div className="animate-fade-in-up mt-8 flex flex-col gap-4 [animation-delay:300ms] sm:flex-row">
            <Button href={settings.join_us_url} variant="primary">
              {settings.contact_cta_text}
            </Button>
            <Button href="/about" variant="outline">
              Explore
            </Button>
          </div>
        </div>
      </Carousel>
    </section>
  );
}
