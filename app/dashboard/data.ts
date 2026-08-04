/**
 * Remaining placeholder data for the Member Dashboard.
 *
 * Instruments and borrow requests (Module 2) are now backed by real
 * Supabase queries — see `getInstrumentStats` and `getMyBorrowStats`,
 * wired up directly in app/dashboard/page.tsx. Announcements and Events
 * are separate, not-yet-built modules, so those two stay hardcoded here
 * until their tables exist.
 */

// TODO: replace with the next few upcoming rows from an `events` table,
// and use its count for the "Upcoming Events" summary card.
export const UPCOMING_EVENTS_COUNT = 3;

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
