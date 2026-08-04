import Link from "next/link";
import AlbumCoverImage from "@/components/gallery/AlbumCoverImage";
import Badge from "@/components/ui/Badge";
import { CameraIcon } from "@/components/ui/icons";
import { formatAlbumDate } from "@/utils/format-gallery";
import type { GalleryAlbumWithMeta } from "@/types/gallery";

interface AlbumCardProps {
  album: GalleryAlbumWithMeta;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      href={`/gallery/${album.slug}`}
      className="group flex h-full flex-col overflow-hidden border border-[#E8E8E8] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-sm"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <AlbumCoverImage
          src={album.cover_image_url}
          alt={album.title}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {album.is_featured && (
          <Badge variant="gold" className="absolute left-4 top-4 bg-white/90">
            Featured
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#C8A928]">
          {formatAlbumDate(album.published_at)}
        </p>

        <h3 className="mt-2 font-serif text-xl font-semibold text-[#111111]">
          {album.title}
        </h3>

        {album.description && (
          <p className="mt-3 flex-1 text-sm leading-relaxed text-[#666666]">
            {album.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#666666]">
          <span className="inline-flex items-center gap-1.5">
            <CameraIcon className="h-4 w-4 text-[#C8A928]" />
            {album.image_count} {album.image_count === 1 ? "photo" : "photos"}
          </span>
          {album.event_title && (
            <>
              <span aria-hidden="true" className="text-[#E8E8E8]">
                •
              </span>
              <span>{album.event_title}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
