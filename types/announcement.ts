export type AnnouncementStatus = "draft" | "published";

export type AnnouncementPriority = "normal" | "important" | "urgent";

export interface Announcement {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: AnnouncementStatus;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  published_at: string | null;
  expires_at: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const ANNOUNCEMENT_STATUSES: AnnouncementStatus[] = ["draft", "published"];

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: "Draft",
  published: "Published",
};

// Declared in severity order to match the DB enum — see lib/supabase/announcements.ts
// for how this lets `order by priority` do the "highest priority" sort for free.
export const ANNOUNCEMENT_PRIORITIES: AnnouncementPriority[] = [
  "normal",
  "important",
  "urgent",
];

export const ANNOUNCEMENT_PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  normal: "Normal",
  important: "Important",
  urgent: "Urgent",
};

export type AnnouncementArchiveState = "all" | "active" | "archived";

export type AnnouncementPinnedState = "all" | "pinned" | "not-pinned";

export type AnnouncementSort =
  | "newest"
  | "oldest"
  | "title-asc"
  | "title-desc"
  | "priority-desc";

/** The member-facing /announcements page's filter tabs. */
export type PublicAnnouncementFilter = "all" | "pinned" | "important" | "urgent";

export interface AnnouncementStats {
  published: number;
  draft: number;
  urgent: number;
  pinned: number;
}
