/**
 * Temporary placeholder data for the Admin Dashboard.
 *
 * The `members` and `requests` tables don't exist yet, so these two stats
 * (and the activity feed) are hardcoded. Once those tables exist, replace
 * them with real Supabase queries — see the comments on each export for
 * where that query would live.
 */

// TODO: replace with a real member count once an admin members query
// exists (e.g. `select count(*) from profiles`).
export const TOTAL_MEMBERS = 42;

// TODO: replace with the most recent rows from an `activity_log` (or
// similar audit) table once one exists.
export const RECENT_ACTIVITY: string[] = [
  "Admin approved a borrow request for Conga Set #2",
  "New member registered: Aisyah Rahman",
  'Instrument "Darbuka 1" marked as damaged',
  "Rhythm Night 2026 event details updated",
];
