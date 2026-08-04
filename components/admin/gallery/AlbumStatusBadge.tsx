import Badge from "@/components/ui/Badge";
import { GALLERY_ALBUM_STATUS_LABELS, type GalleryAlbumStatus } from "@/types/gallery";

const VARIANT_MAP: Record<GalleryAlbumStatus, "default" | "gold"> = {
  draft: "default",
  published: "gold",
};

interface AlbumStatusBadgeProps {
  status: GalleryAlbumStatus;
  className?: string;
}

export default function AlbumStatusBadge({ status, className = "" }: AlbumStatusBadgeProps) {
  return (
    <Badge variant={VARIANT_MAP[status]} className={className}>
      {GALLERY_ALBUM_STATUS_LABELS[status]}
    </Badge>
  );
}
