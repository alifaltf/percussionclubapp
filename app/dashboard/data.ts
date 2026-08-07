/**
 * Remaining placeholder data for the Member Dashboard.
 *
 * Instruments and borrow requests (Module 2) are backed by real Supabase
 * queries — see `getInstrumentStats` and `getMyBorrowStats`. Announcements
 * (Module 6) are now real too — see `getLatestDashboardAnnouncements`,
 * wired up directly in app/dashboard/page.tsx. Events' dashboard card is
 * still a placeholder here; Module 4 only wired real event data into the
 * public homepage and the admin dashboard, not this member dashboard card,
 * so it's left untouched and out of scope for this module.
 */

// TODO: replace with the next few upcoming rows from an `events` table,
// and use its count for the "Upcoming Events" summary card.
export const UPCOMING_EVENTS_COUNT = 3;

// TODO: replace with the next few upcoming rows from an `events` table.
export const UPCOMING_EVENTS: string[] = [
  "Rhythm Night 2026",
  "Beginner Percussion Workshop",
  "Club Open Day",
];
