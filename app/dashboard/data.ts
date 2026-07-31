/**
 * Temporary placeholder data for the Member Dashboard.
 *
 * None of this is backed by a database table yet — the instruments,
 * borrowing/requests, and announcements tables don't exist. Once they do,
 * replace these constants with real Supabase queries (see the comments on
 * each export for where that query would live).
 */

export interface SummaryStat {
  label: string;
  value: number;
}

// TODO: replace with counts from `instruments`, `borrowings`, and
// `requests` tables once they exist (e.g. available instruments = count of
// instruments where status = 'available'; my active borrowings = count of
// borrowings for the current user where returned_at is null; etc).
export const SUMMARY_STATS: SummaryStat[] = [
  { label: "Available Instruments", value: 24 },
  { label: "My Active Borrowings", value: 2 },
  { label: "Pending Requests", value: 1 },
  { label: "Upcoming Events", value: 3 },
];

// TODO: replace with the most recent rows from an `announcements` table.
export const RECENT_ANNOUNCEMENTS: string[] = [
  "Rehearsal Schedule Updated",
  "Registration Open for Rhythm Night",
  "Instrument Maintenance Notice",
];

// TODO: replace with the next few upcoming rows from an `events` table.
export const UPCOMING_EVENTS: string[] = [
  "Rhythm Night 2026",
  "Beginner Percussion Workshop",
  "Club Open Day",
];
