import { Suspense } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import AlbumCard from "@/components/gallery/AlbumCard";
import GalleryFilterBar from "@/components/gallery/GalleryFilterBar";
import { GalleryIcon } from "@/components/ui/icons";
import {
  getPublicAlbumEvents,
  getPublicAlbums,
  getPublicAlbumYears,
} from "@/lib/supabase/gallery";
import type { GalleryAlbumWithMeta, GalleryFeaturedState } from "@/types/gallery";

interface GalleryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams;
  const search = firstValue(params.q) ?? "";
  const featured = (firstValue(params.featured) ?? "all") as GalleryFeaturedState;
  const year = firstValue(params.year) ?? "all";
  const eventId = firstValue(params.event) ?? "all";

  let albums: GalleryAlbumWithMeta[] = [];
  let years: string[] = [];
  let events: { id: string; title: string }[] = [];
  let loadError = false;

  try {
    [albums, years, events] = await Promise.all([
      getPublicAlbums({ search, featured, year, eventId }),
      getPublicAlbumYears(),
      getPublicAlbumEvents(),
    ]);
  } catch {
    loadError = true;
  }

  const hasActiveFilters =
    search.trim() !== "" || featured !== "all" || year !== "all" || eventId !== "all";

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
          IIUM Percussion Club
        </span>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
          Gallery
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#666666]">
          A collection of moments from our performances, rehearsals and events.
        </p>

        {loadError ? (
          <div className="mt-10">
            <EmptyState
              icon={<GalleryIcon className="h-5 w-5" />}
              title="Couldn't load the gallery"
              description="Something went wrong while fetching albums. Please try again."
              action={
                <Button href="/gallery" variant="outline">
                  Try Again
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-10">
              <Suspense fallback={null}>
                <GalleryFilterBar years={years} events={events} />
              </Suspense>
            </div>

            <div className="mt-8">
              {albums.length === 0 ? (
                <EmptyState
                  icon={<GalleryIcon className="h-5 w-5" />}
                  title="No albums found"
                  description={
                    hasActiveFilters
                      ? "Try adjusting your search or filters."
                      : "Check back soon for photos from our events."
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {albums.map((album, index) => (
                    <Reveal key={album.id} delayMs={Math.min(index, 5) * 80}>
                      <AlbumCard album={album} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
