import Link from "next/link";
import { notFound } from "next/navigation";
import AlbumImageGrid from "@/components/gallery/AlbumImageGrid";
import EmptyState from "@/components/ui/EmptyState";
import { CalendarIcon, GalleryIcon } from "@/components/ui/icons";
import { getAlbumImages, getPublicAlbumBySlug } from "@/lib/supabase/gallery";
import { formatAlbumDate } from "@/utils/format-gallery";

interface AlbumDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const { slug } = await params;

  const album = await getPublicAlbumBySlug(slug);
  if (!album) {
    notFound();
  }

  const images = await getAlbumImages(album.id);

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Gallery
        </Link>

        <div className="mt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            {formatAlbumDate(album.published_at)}
          </span>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
            {album.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#666666]">
            <span>
              {images.length} {images.length === 1 ? "photo" : "photos"}
            </span>
            {album.event_title && (
              <>
                <span aria-hidden="true" className="text-[#E8E8E8]">
                  •
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  {album.event_title}
                </span>
              </>
            )}
          </div>

          {album.description && (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#666666]">
              {album.description}
            </p>
          )}
        </div>

        <div className="mt-10">
          {images.length === 0 ? (
            <EmptyState
              icon={<GalleryIcon className="h-5 w-5" />}
              title="No photos yet"
              description="Photos for this album will appear here soon."
            />
          ) : (
            <AlbumImageGrid images={images} albumTitle={album.title} />
          )}
        </div>
      </div>
    </main>
  );
}
