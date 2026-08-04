export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export interface Event {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  banner_url: string | null;
  registration_url: string | null;
  status: EventStatus;
  is_featured: boolean;
  published_at: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const EVENT_STATUSES: EventStatus[] = [
  "draft",
  "published",
  "cancelled",
  "completed",
];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
  completed: "Completed",
};

export type EventArchiveState = "all" | "active" | "archived";

export type EventFeaturedState = "all" | "featured" | "not-featured";

export type EventSort =
  | "event-date-asc"
  | "event-date-desc"
  | "newest"
  | "oldest";

// The public /events page's tab filter. "upcoming" and "past" are date-based
// splits of published events; "completed" and "cancelled" are status-based.
// See lib/supabase/events.ts for how "completed" is derived rather than
// always being a stored value.
export type PublicEventFilter = "all" | "upcoming" | "past" | "completed" | "cancelled";

export interface EventStats {
  total: number;
  draft: number;
  published: number;
  upcoming: number;
  archived: number;
}
