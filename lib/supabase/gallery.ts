import { createClient } from "@/lib/supabase/server";
import type {
  GalleryAlbum,
  GalleryAlbumWithMeta,
  GalleryArchiveState,
  GalleryFeaturedState,
  GalleryImage,
  GalleryAlbumStatus,
  GallerySort,
  GalleryStats,
} from "@/types/gallery";

// Postgres error code for a malformed literal passed to a typed column
// (e.g. a slug/id in the URL) — mirrors the pattern in instruments.ts / events.ts.
const INVALID_TEXT_REPRESENTATION = "22P02";

const ALBUM_COLUMNS =
  "id, title, slug, description, cover_image_url, event_id, status, is_featured, published_at, archived_at, created_by, created_at, updated_at";

const IMAGE_COLUMNS =
  "id, album_id, image_url, storage_path, caption, alt_text, display_order, created_at, updated_at";

// PostgREST embedded-resource shape for `event:events(title)` and
// `gallery_images(count)` — declared narrowly here rather than widening
// GalleryAlbum itself, since these fields only exist on the join result.
interface AlbumRow extends GalleryAlbum {
  event: { title: string } | { title: string }[] | null;
  gallery_images: { count: number }[] | null;
}

function withMeta(row: AlbumRow): GalleryAlbumWithMeta {
  const eventRelation = Array.isArray(row.event) ? row.event[0] : row.event;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    cover_image_url: row.cover_image_url,
    event_id: row.event_id,
    status: row.status,
    is_featured: row.is_featured,
    published_at: row.published_at,
    archived_at: row.archived_at,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    event_title: eventRelation?.title ?? null,
    image_count: row.gallery_images?.[0]?.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Public reads — RLS already restricts these to published, non-archived
// albums (and images belonging to them) for the anon/authenticated roles.
// The explicit filters below are defense in depth, same convention as events.
// ---------------------------------------------------------------------------

export interface PublicAlbumsQuery {
  search?: string;
  featured?: GalleryFeaturedState;
  year?: string; // "all" or a 4-digit year
  eventId?: string; // "all" or a specific event id
}

export async function getPublicAlbums(
  query: PublicAlbumsQuery = {},
): Promise<GalleryAlbumWithMeta[]> {
  const { search = "", featured = "all", year = "all", eventId = "all" } = query;
  const supabase = await createClient();

  let queryBuilder = supabase
    .from("gallery_albums")
    .select(`${ALBUM_COLUMNS}, event:events(title), gallery_images(count)`)
    .eq("status", "published")
    .is("archived_at", null)
    // Featured albums first, then most recently published.
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    const safeSearch = trimmedSearch.replace(/[%,]/g, "");
    queryBuilder = queryBuilder.or(
      `title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`,
    );
  }

  if (featured === "featured") {
    queryBuilder = queryBuilder.eq("is_featured", true);
  }

  if (eventId !== "all") {
    queryBuilder = queryBuilder.eq("event_id", eventId);
  }

  if (year !== "all") {
    queryBuilder = queryBuilder
      .gte("published_at", `${year}-01-01`)
      .lt("published_at", `${Number(year) + 1}-01-01`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error("Could not load gallery albums.");
  }

  return ((data as unknown as AlbumRow[] | null) ?? []).map(withMeta);
}

/** Distinct years (from published_at) across public albums, for the year filter. */
export async function getPublicAlbumYears(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_albums")
    .select("published_at")
    .eq("status", "published")
    .is("archived_at", null);

  if (error) {
    throw new Error("Could not load album years.");
  }

  const years = new Set(
    (data ?? [])
      .map((row) => (row.published_at ? row.published_at.slice(0, 4) : null))
      .filter((year): year is string => Boolean(year)),
  );

  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

/** Published events that have at least one visible album, for the event filter. */
export async function getPublicAlbumEvents(): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_albums")
    .select("event:events(id, title)")
    .eq("status", "published")
    .is("archived_at", null)
    .not("event_id", "is", null);

  if (error) {
    throw new Error("Could not load related events.");
  }

  const seen = new Map<string, string>();
  for (const row of (data ?? []) as unknown as { event: { id: string; title: string } | { id: string; title: string }[] | null }[]) {
    const relation = Array.isArray(row.event) ? row.event[0] : row.event;
    if (relation) seen.set(relation.id, relation.title);
  }

  return Array.from(seen.entries())
    .map(([id, title]) => ({ id, title }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * A single public album by slug, with its event title. Returns null both
 * when the album doesn't exist/isn't publicly visible (draft, archived —
 * blocked by RLS) and for a malformed slug, so the page can 404 either way.
 */
export async function getPublicAlbumBySlug(slug: string): Promise<GalleryAlbumWithMeta | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_albums")
    .select(`${ALBUM_COLUMNS}, event:events(title), gallery_images(count)`)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) return null;
    throw new Error("Could not load this album.");
  }

  const row = data as unknown as AlbumRow | null;
  return row ? withMeta(row) : null;
}

/** All images for an album, in display order. RLS covers visibility. */
export async function getAlbumImages(albumId: string): Promise<GalleryImage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_images")
    .select(IMAGE_COLUMNS)
    .eq("album_id", albumId)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error("Could not load album images.");
  }

  return (data as GalleryImage[] | null) ?? [];
}

/**
 * Up to 6 images for the homepage — preferring featured, published,
 * non-archived albums, falling back to any other published album if
 * featured albums don't have enough images between them.
 */
export async function getHomepageGalleryImages(): Promise<GalleryImage[]> {
  const supabase = await createClient();

  const { data: albums, error } = await supabase
    .from("gallery_albums")
    .select("id")
    .eq("status", "published")
    .is("archived_at", null)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error("Could not load gallery images.");
  }

  const albumIds = (albums ?? []).map((album) => album.id);
  if (albumIds.length === 0) return [];

  const { data: images, error: imagesError } = await supabase
    .from("gallery_images")
    .select(IMAGE_COLUMNS)
    .in("album_id", albumIds)
    .order("display_order", { ascending: true });

  if (imagesError) {
    throw new Error("Could not load gallery images.");
  }

  const allImages = (images as GalleryImage[] | null) ?? [];

  // Preserve album preference order (featured-first) rather than the flat
  // image query's order, then cap at 6.
  const albumOrder = new Map(albumIds.map((id, index) => [id, index]));
  const sorted = [...allImages].sort((a, b) => {
    const albumDiff = (albumOrder.get(a.album_id) ?? 0) - (albumOrder.get(b.album_id) ?? 0);
    return albumDiff !== 0 ? albumDiff : a.display_order - b.display_order;
  });

  return sorted.slice(0, 6);
}

// ---------------------------------------------------------------------------
// Admin reads — the "Admins can view all albums/images" RLS policies grant
// access regardless of status/archived_at.
// ---------------------------------------------------------------------------

export interface AdminAlbumsQuery {
  search?: string;
  status?: GalleryAlbumStatus | "all";
  archiveState?: GalleryArchiveState;
  featuredState?: GalleryFeaturedState;
  sort?: GallerySort;
  page?: number;
  pageSize?: number;
}

export interface AdminAlbumsResult {
  albums: GalleryAlbumWithMeta[];
  totalCount: number;
}

export async function getAdminAlbums(query: AdminAlbumsQuery): Promise<AdminAlbumsResult> {
  const {
    search = "",
    status = "all",
    archiveState = "all",
    featuredState = "all",
    sort = "newest",
    page = 1,
    pageSize = 20,
  } = query;

  const supabase = await createClient();

  let queryBuilder = supabase
    .from("gallery_albums")
    .select(`${ALBUM_COLUMNS}, event:events(title), gallery_images(count)`, { count: "exact" });

  if (archiveState === "active") {
    queryBuilder = queryBuilder.is("archived_at", null);
  } else if (archiveState === "archived") {
    queryBuilder = queryBuilder.not("archived_at", "is", null);
  }

  if (status !== "all") {
    queryBuilder = queryBuilder.eq("status", status);
  }

  if (featuredState === "featured") {
    queryBuilder = queryBuilder.eq("is_featured", true);
  } else if (featuredState === "not-featured") {
    queryBuilder = queryBuilder.eq("is_featured", false);
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    const safeSearch = trimmedSearch.replace(/[%,]/g, "");
    queryBuilder = queryBuilder.or(
      `title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`,
    );
  }

  if (sort === "oldest") {
    queryBuilder = queryBuilder.order("created_at", { ascending: true });
  } else if (sort === "title-asc") {
    queryBuilder = queryBuilder.order("title", { ascending: true });
  } else if (sort === "title-desc") {
    queryBuilder = queryBuilder.order("title", { ascending: false });
  } else {
    queryBuilder = queryBuilder.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await queryBuilder.range(from, to);

  if (error) {
    throw new Error("Could not load gallery albums.");
  }

  return {
    albums: ((data as unknown as AlbumRow[] | null) ?? []).map(withMeta),
    totalCount: count ?? 0,
  };
}

/** Same as getPublicAlbumBySlug, but for the admin edit page: sees drafts and archived albums, keyed by id. */
export async function getAdminAlbumById(id: string): Promise<GalleryAlbumWithMeta | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_albums")
    .select(`${ALBUM_COLUMNS}, event:events(title), gallery_images(count)`)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) return null;
    throw new Error("Could not load this album.");
  }

  const row = data as unknown as AlbumRow | null;
  return row ? withMeta(row) : null;
}

/** Counts for the admin gallery list header and the admin dashboard. */
export async function getGalleryStats(): Promise<GalleryStats> {
  const supabase = await createClient();

  const [albumsResult, imagesResult] = await Promise.all([
    supabase.from("gallery_albums").select("status"),
    supabase.from("gallery_images").select("id", { count: "exact", head: true }),
  ]);

  if (albumsResult.error) {
    throw new Error("Could not load gallery statistics.");
  }
  if (imagesResult.error) {
    throw new Error("Could not load gallery statistics.");
  }

  const rows = albumsResult.data ?? [];

  return {
    totalAlbums: rows.length,
    published: rows.filter((row) => row.status === "published").length,
    draft: rows.filter((row) => row.status === "draft").length,
    totalImages: imagesResult.count ?? 0,
  };
}
