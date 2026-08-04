export type GalleryAlbumStatus = "draft" | "published";

export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  event_id: string | null;
  status: GalleryAlbumStatus;
  is_featured: boolean;
  published_at: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Album row joined with its related event's title (for display) and image count. */
export interface GalleryAlbumWithMeta extends GalleryAlbum {
  event_title: string | null;
  image_count: number;
}

export interface GalleryImage {
  id: string;
  album_id: string;
  image_url: string;
  storage_path: string;
  caption: string | null;
  alt_text: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const GALLERY_ALBUM_STATUSES: GalleryAlbumStatus[] = ["draft", "published"];

export const GALLERY_ALBUM_STATUS_LABELS: Record<GalleryAlbumStatus, string> = {
  draft: "Draft",
  published: "Published",
};

export type GalleryArchiveState = "all" | "active" | "archived";

export type GalleryFeaturedState = "all" | "featured" | "not-featured";

export type GallerySort = "newest" | "oldest" | "title-asc" | "title-desc";

export interface GalleryStats {
  totalAlbums: number;
  published: number;
  draft: number;
  totalImages: number;
}
