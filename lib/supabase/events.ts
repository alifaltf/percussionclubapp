import { createClient } from "@/lib/supabase/server";
import type {
  Event,
  EventArchiveState,
  EventFeaturedState,
  EventSort,
  EventStats,
  EventStatus,
} from "@/types/event";

// Postgres error code for a malformed literal passed to a typed column
// (e.g. an id in the URL that isn't a valid UUID) — mirrors the pattern
// already used in lib/supabase/instruments.ts.
const INVALID_TEXT_REPRESENTATION = "22P02";

const EVENT_COLUMNS =
  "id, title, slug, short_description, description, event_date, start_time, end_time, location, banner_url, registration_url, status, is_featured, published_at, archived_at, created_by, created_at, updated_at";

// ---------------------------------------------------------------------------
// "Completed" is mostly a *derived* display status, not something an admin
// has to remember to set — same pattern as `overdue` for borrow requests.
// A published event whose event_date has passed reads as "completed"
// everywhere in the UI, with no scheduled job required. Admins can still
// explicitly set status to "completed" or "cancelled" from the edit form;
// this only ever promotes "published" forward, never overrides an explicit
// "cancelled".
// ---------------------------------------------------------------------------

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isPastEventDate(eventDate: string): boolean {
  return eventDate < todayIsoDate();
}

function withEffectiveStatus(event: Event): Event {
  if (event.status === "published" && isPastEventDate(event.event_date)) {
    return { ...event, status: "completed" };
  }
  return event;
}

function withEffectiveStatuses(events: Event[]): Event[] {
  return events.map(withEffectiveStatus);
}

// ---------------------------------------------------------------------------
// Public reads — RLS already restricts these to published/cancelled/
// completed, non-archived rows for the anon and authenticated roles, so no
// extra status filtering is required here for correctness. The explicit
// .in()/.is() filters below are kept anyway as defense in depth and so the
// query plan doesn't rely solely on RLS to narrow the result set.
// ---------------------------------------------------------------------------

export interface PublicEventsQuery {
  search?: string;
}

/**
 * All publicly-visible events (published, cancelled, or completed; never
 * archived or draft), ordered by date. Callers split this into upcoming /
 * past sections and apply the tab filter — see app/events/page.tsx.
 */
export async function getPublicEvents(query: PublicEventsQuery = {}): Promise<Event[]> {
  const { search = "" } = query;
  const supabase = await createClient();

  let queryBuilder = supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .in("status", ["published", "cancelled", "completed"])
    .is("archived_at", null)
    .order("event_date", { ascending: true });

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    const safeSearch = trimmedSearch.replace(/[%,]/g, "");
    queryBuilder = queryBuilder.or(
      `title.ilike.%${safeSearch}%,location.ilike.%${safeSearch}%,short_description.ilike.%${safeSearch}%`,
    );
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error("Could not load events.");
  }

  return withEffectiveStatuses((data as Event[] | null) ?? []);
}

/**
 * A single public event by id. Returns null both when the row doesn't
 * exist/isn't publicly visible (draft, archived — blocked by RLS) and when
 * the id isn't a valid UUID, so the page can show a single not-found state
 * either way.
 */
export async function getPublicEventById(id: string): Promise<Event | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) return null;
    throw new Error("Could not load this event.");
  }

  const row = (data as Event | null) ?? null;
  return row ? withEffectiveStatus(row) : null;
}

/**
 * The next 3 upcoming published events for the homepage — featured events
 * first, then soonest date. Archived, draft, completed and cancelled events
 * never appear here (all excluded by the status/date filters, not just
 * RLS), matching the homepage integration spec exactly.
 */
export async function getHomepageEvents(): Promise<Event[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("status", "published")
    .is("archived_at", null)
    .gte("event_date", todayIsoDate())
    .order("is_featured", { ascending: false })
    .order("event_date", { ascending: true })
    .limit(3);

  if (error) {
    throw new Error("Could not load upcoming events.");
  }

  return (data as Event[] | null) ?? [];
}

// ---------------------------------------------------------------------------
// Admin reads — the "Admins can view all events" RLS policy grants access
// to every row regardless of status/archived_at, so these can see drafts
// and archived events too.
// ---------------------------------------------------------------------------

export interface AdminEventsQuery {
  search?: string;
  status?: EventStatus | "all";
  archiveState?: EventArchiveState;
  featuredState?: EventFeaturedState;
  sort?: EventSort;
  page?: number;
  pageSize?: number;
}

export interface AdminEventsResult {
  events: Event[];
  totalCount: number;
}

export async function getAdminEvents(query: AdminEventsQuery): Promise<AdminEventsResult> {
  const {
    search = "",
    status = "all",
    archiveState = "all",
    featuredState = "all",
    sort = "event-date-asc",
    page = 1,
    pageSize = 20,
  } = query;

  const supabase = await createClient();

  let queryBuilder = supabase
    .from("events")
    .select(EVENT_COLUMNS, { count: "exact" });

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
      `title.ilike.%${safeSearch}%,location.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`,
    );
  }

  if (sort === "event-date-desc") {
    queryBuilder = queryBuilder.order("event_date", { ascending: false });
  } else if (sort === "newest") {
    queryBuilder = queryBuilder.order("created_at", { ascending: false });
  } else if (sort === "oldest") {
    queryBuilder = queryBuilder.order("created_at", { ascending: true });
  } else {
    queryBuilder = queryBuilder.order("event_date", { ascending: true });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await queryBuilder.range(from, to);

  if (error) {
    throw new Error("Could not load events.");
  }

  return {
    events: (data as Event[] | null) ?? [],
    totalCount: count ?? 0,
  };
}

/** Same as getPublicEventById, but for the admin edit page: sees drafts and archived events. */
export async function getAdminEventById(id: string): Promise<Event | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) return null;
    throw new Error("Could not load this event.");
  }

  return (data as Event | null) ?? null;
}

/** Lightweight id + title list for the gallery album form's "related event" picker. */
export async function getEventOptions(): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("id, title")
    .order("event_date", { ascending: false });

  if (error) {
    throw new Error("Could not load events.");
  }

  return (data as { id: string; title: string }[] | null) ?? [];
}

/** Counts for the admin events list header and the admin dashboard. */
export async function getEventStats(): Promise<EventStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("status, event_date, archived_at");

  if (error) {
    throw new Error("Could not load event statistics.");
  }

  const rows = data ?? [];
  const today = todayIsoDate();

  return {
    total: rows.length,
    draft: rows.filter((row) => row.status === "draft").length,
    published: rows.filter((row) => row.status === "published").length,
    upcoming: rows.filter(
      (row) => row.status === "published" && row.event_date >= today && !row.archived_at,
    ).length,
    archived: rows.filter((row) => row.archived_at !== null).length,
  };
}
