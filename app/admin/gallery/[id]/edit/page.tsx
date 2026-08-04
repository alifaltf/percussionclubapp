import Link from "next/link";
import { notFound } from "next/navigation";
import AlbumForm from "@/components/admin/gallery/AlbumForm";
import AlbumImageManager from "@/components/admin/gallery/AlbumImageManager";
import AlbumRowActions from "@/components/admin/gallery/AlbumRowActions";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getAdminAlbumById, getAlbumImages } from "@/lib/supabase/gallery";
import { getEventOptions } from "@/lib/supabase/events";
import { updateAlbum } from "@/app/admin/gallery/actions";
import type { GalleryAlbumWithMeta, GalleryImage } from "@/types/gallery";

interface EditAlbumPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAlbumPage({ params }: EditAlbumPageProps) {
  await requireAdmin();
  const { id } = await params;

  let album: GalleryAlbumWithMeta | null;
  try {
    album = await getAdminAlbumById(id);
  } catch {
    notFound();
  }

  if (!album) {
    notFound();
  }

  let events: { id: string; title: string }[] = [];
  let images: GalleryImage[] = [];
  try {
    [events, images] = await Promise.all([getEventOptions(), getAlbumImages(id)]);
  } catch {
    events = [];
    images = [];
  }

  const boundUpdate = updateAlbum.bind(null, id);

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/admin/gallery"
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

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
              Edit Album
            </h1>
            <p className="mt-2 text-sm text-[#666666]">{album.slug}</p>
          </div>
          <AlbumRowActions album={album} showEditLink={false} redirectOnArchiveTo="/admin/gallery" />
        </div>

        <div className="mt-8 rounded-2xl border border-[#E8E8E8] bg-white p-8 shadow-sm sm:p-10">
          <AlbumForm mode="edit" album={album} events={events} action={boundUpdate} />
        </div>

        <div className="mt-10">
          <h2 className="font-serif text-xl font-semibold text-[#111111]">Photos</h2>
          <p className="mt-1 text-sm text-[#666666]">
            Upload, caption, reorder and manage this album&apos;s photos.
          </p>
          <div className="mt-5">
            <AlbumImageManager
              albumId={album.id}
              initialImages={images}
              coverImageUrl={album.cover_image_url}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
