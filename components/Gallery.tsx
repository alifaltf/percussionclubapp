import Button from "@/components/ui/Button";
import GalleryTile from "@/components/ui/GalleryTile";
import Reveal from "@/components/ui/Reveal";
import EmptyState from "@/components/ui/EmptyState";
import { GalleryIcon } from "@/components/ui/icons";
import { getHomepageGalleryImages } from "@/lib/supabase/gallery";
import type { GalleryImage } from "@/types/gallery";

function toTileProps(image: GalleryImage) {
  return {
    src: image.image_url,
    alt: image.alt_text ?? "IIUM Percussion Club gallery photo",
    caption: image.caption ?? "IIUM Percussion Club",
  };
}

export default async function Gallery() {
  let images: GalleryImage[] = [];
  let loadError = false;

  try {
    images = await getHomepageGalleryImages();
  } catch {
    loadError = true;
  }

  const [featured, ...supporting] = images;

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

        {!loadError && featured && (
          <Reveal delayMs={150}>
            <div className="mt-16 grid auto-rows-[240px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              <GalleryTile
                {...toTileProps(featured)}
                priority
                className="lg:col-span-2 lg:row-span-2"
              />
              {supporting.map((image) => (
                <GalleryTile key={image.id} {...toTileProps(image)} />
              ))}
            </div>
          </Reveal>
        )}

        {!loadError && !featured && (
          <div className="mt-16">
            <EmptyState
              icon={<GalleryIcon className="h-5 w-5" />}
              title="No photos yet"
              description="Check back soon for photos from our performances and events."
            />
          </div>
        )}

        {loadError && (
          <div className="mt-16">
            <EmptyState
              icon={<GalleryIcon className="h-5 w-5" />}
              title="Couldn't load the gallery"
              description="Something went wrong while fetching photos."
            />
          </div>
        )}

        <Reveal delayMs={300} className="mt-14 flex justify-center">
          <Button href="/gallery" variant="outline">
            View Full Gallery
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
