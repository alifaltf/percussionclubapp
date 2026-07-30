import Button from "@/components/ui/Button";
import GalleryTile from "@/components/ui/GalleryTile";
import Reveal from "@/components/ui/Reveal";

const GALLERY_IMAGES = [
  {
    src: "/images/gallery/gallery-1.jpg",
    alt: "IIUM Percussion Club performing live on stage",
    caption: "Live Performance",
  },
  {
    src: "/images/gallery/gallery-2.jpg",
    alt: "IIUM Percussion Club members in rehearsal",
    caption: "Rehearsal",
  },
  {
    src: "/images/gallery/gallery-3.jpg",
    alt: "Percussion ensemble practicing together",
    caption: "Ensemble Practice",
  },
  {
    src: "/images/gallery/gallery-4.jpg",
    alt: "Club members backstage before a show",
    caption: "Backstage",
  },
  {
    src: "/images/gallery/gallery-5.jpg",
    alt: "Percussion club community gathering",
    caption: "Community Spirit",
  },
  {
    src: "/images/gallery/gallery-6.jpg",
    alt: "Percussionist performing on stage",
    caption: "On Stage",
  },
];

export default function Gallery() {
  const [featured, ...supporting] = GALLERY_IMAGES;

  return (
    <section id="gallery" className="bg-[#F8F8F6] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Featured Moments
          </span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#111111] sm:text-5xl">
            Rhythm in Motion
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[#666666] sm:text-lg">
            A glimpse into our performances, rehearsals and the moments that
            bring our percussion community together.
          </p>
        </Reveal>

        <Reveal delayMs={150}>
          <div className="mt-16 grid auto-rows-[240px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            <GalleryTile
              {...featured}
              priority
              className="lg:col-span-2 lg:row-span-2"
            />
            {supporting.map((image) => (
              <GalleryTile key={image.src} {...image} />
            ))}
          </div>
        </Reveal>

        <Reveal delayMs={250} className="mt-14 flex justify-center">
          <Button href="/gallery" variant="outline">
            View Full Gallery
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
