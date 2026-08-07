import { createClient } from "@/lib/supabase/server";
import type {
  Announcement,
  AnnouncementArchiveState,
  AnnouncementPinnedState,
  AnnouncementPriority,
  AnnouncementSort,
  AnnouncementStats,
  AnnouncementStatus,
  PublicAnnouncementFilter,
} from "@/types/announcement";

// Postgres error code for a malformed literal passed to a typed column
// (e.g. an id in the URL that isn't a valid UUID) — mirrors the pattern
// already used in events.ts / gallery.ts / instruments.ts.
const INVALID_TEXT_REPRESENTATION = "22P02";

const ANNOUNCEMENT_COLUMNS =
  "id, title, slug, summary, content, status, priority, is_pinned, published_at, expires_at, archived_at, created_by, created_at, updated_at";

// ---------------------------------------------------------------------------
// Member reads — RLS already restricts these to published, non-archived,
// non-expired rows for the authenticated role (there is no anon policy at
// all, so guests get nothing). The explicit filters below are defense in
// depth, same convention as events/gallery, and let the "no rows" case be
// distinguished from "not authenticated" by the caller.
// ---------------------------------------------------------------------------

export interface PublicAnnouncementsQuery {
  search?: string;
  filter?: PublicAnnouncementFilter;
}

/**
 * Published, visible announcements — pinned first, then by priority
 * (urgent > important > normal, thanks to the enum's declaration order),
 * then most recently published.
 */
export async function getPublicAnnouncements(
  query: PublicAnnouncementsQuery = {},
): Promise<Announcement[]> {
  const { search = "", filter = "all" } = query;
  const supabase = await createClient();

  let queryBuilder = supabase
    .from("announcements")
    .select(ANNOUNCEMENT_COLUMNS)
    .order("is_pinned", { ascending: false })
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false });

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    const safeSearch = trimmedSearch.replace(/[%,]/g, "");
    queryBuilder = queryBuilder.or(
      `title.ilike.%${safeSearch}%,content.ilike.%${safeSearch}%`,
    );
  }

  if (filter === "pinned") {
    queryBuilder = queryBuilder.eq("is_pinned", true);
  } else if (filter === "important") {
    queryBuilder = queryBuilder.eq("priority", "important");
  } else if (filter === "urgent") {
    queryBuilder = queryBuilder.eq("priority", "urgent");
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error("Could not load announcements.");
  }

  return (data as Announcement[] | null) ?? [];
}

/**
 * A single announcement by id, for a member. Returns null both when the
 * row doesn't exist/isn't visible to this user (draft, archived, expired —
 * all blocked by RLS) and for a malformed id, so the page can show a single
 * not-found state either way.
 */
export async function getPublicAnnouncementById(id: string): Promise<Announcement | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) return null;
    throw new Error("Could not load this announcement.");
  }

  return (data as Announcement | null) ?? null;
}

/** The latest 3 visible announcements for the member dashboard, pinned first. */
export async function getLatestDashboardAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_COLUMNS)
    .order("is_pinned", { ascending: false })
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) {
    throw new Error("Could not load announcements.");
  }

  return (data as Announcement[] | null) ?? [];
}

// ---------------------------------------------------------------------------
// Admin reads — the "Admins can view all announcements" RLS policy grants
// access to every row regardless of status/archived_at/expires_at.
// ---------------------------------------------------------------------------

export interface AdminAnnouncementsQuery {
  search?: string;
  status?: AnnouncementStatus | "all";
  priority?: AnnouncementPriority | "all";
  pinnedState?: AnnouncementPinnedState;
  archiveState?: AnnouncementArchiveState;
  sort?: AnnouncementSort;
  page?: number;
  pageSize?: number;
}

export interface AdminAnnouncementsResult {
  announcements: Announcement[];
  totalCount: number;
}

export async function getAdminAnnouncements(
  query: AdminAnnouncementsQuery,
): Promise<AdminAnnouncementsResult> {
  const {
    search = "",
    status = "all",
    priority = "all",
    pinnedState = "all",
    archiveState = "all",
    sort = "newest",
    page = 1,
    pageSize = 20,
  } = query;

  const supabase = await createClient();

  let queryBuilder = supabase
    .from("announcements")
    .select(ANNOUNCEMENT_COLUMNS, { count: "exact" });

  if (archiveState === "active") {
    queryBuilder = queryBuilder.is("archived_at", null);
  } else if (archiveState === "archived") {
    queryBuilder = queryBuilder.not("archived_at", "is", null);
  }

  if (status !== "all") {
    queryBuilder = queryBuilder.eq("status", status);
  }

  if (priority !== "all") {
    queryBuilder = queryBuilder.eq("priority", priority);
  }

  if (pinnedState === "pinned") {
    queryBuilder = queryBuilder.eq("is_pinned", true);
  } else if (pinnedState === "not-pinned") {
    queryBuilder = queryBuilder.eq("is_pinned", false);
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    const safeSearch = trimmedSearch.replace(/[%,]/g, "");
    queryBuilder = queryBuilder.or(
      `title.ilike.%${safeSearch}%,summary.ilike.%${safeSearch}%,content.ilike.%${safeSearch}%`,
    );
  }

  if (sort === "oldest") {
    queryBuilder = queryBuilder.order("created_at", { ascending: true });
  } else if (sort === "title-asc") {
    queryBuilder = queryBuilder.order("title", { ascending: true });
  } else if (sort === "title-desc") {
    queryBuilder = queryBuilder.order("title", { ascending: false });
  } else if (sort === "priority-desc") {
    queryBuilder = queryBuilder.order("priority", { ascending: false });
  } else {
    queryBuilder = queryBuilder.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await queryBuilder.range(from, to);

  if (error) {
    throw new Error("Could not load announcements.");
  }

  return {
    announcements: (data as Announcement[] | null) ?? [],
    totalCount: count ?? 0,
  };
}

/** Same as getPublicAnnouncementById, but for the admin edit page: sees drafts, archived and expired rows. */
export async function getAdminAnnouncementById(id: string): Promise<Announcement | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) return null;
    throw new Error("Could not load this announcement.");
  }

  return (data as Announcement | null) ?? null;
}

/** Counts for the admin announcements list header and the admin dashboard. */
export async function getAnnouncementStats(): Promise<AnnouncementStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("announcements").select("status, priority, is_pinned");

  if (error) {
    throw new Error("Could not load announcement statistics.");
  }

  const rows = data ?? [];

  return {
    published: rows.filter((row) => row.status === "published").length,
    draft: rows.filter((row) => row.status === "draft").length,
    urgent: rows.filter((row) => row.priority === "urgent").length,
    pinned: rows.filter((row) => row.is_pinned).length,
  };
}
