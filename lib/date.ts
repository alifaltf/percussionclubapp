const MALAYSIA_TIME_ZONE = "Asia/Kuala_Lumpur";

/**
 * Today's calendar date in Malaysia (Asia/Kuala_Lumpur, UTC+8, no DST), as
 * YYYY-MM-DD.
 *
 * Deliberately timezone-explicit rather than relying on
 * `Date.prototype.toISOString()` (always UTC, regardless of where the code
 * runs) or the machine's own system/process timezone (which may not be
 * Malaysia and can vary by deployment target). Either of those would
 * misclassify "today" for roughly 8 hours a day — whenever Malaysia has
 * already rolled over to a new calendar date but UTC hasn't yet (00:00 to
 * 07:59 Malaysia time), a UTC-based check would still report yesterday's
 * date as "today".
 *
 * Uses `Intl.DateTimeFormat`'s `formatToParts` with an explicit `timeZone`
 * rather than string-slicing a locale-formatted date, so the YYYY-MM-DD
 * shape doesn't depend on assumptions about a particular locale's date
 * ordering or punctuation. Safe to call from both server code (Server
 * Actions/Components) and client components — it only depends on the
 * standard `Intl` API, not on any server-only context.
 */
export function getMalaysiaTodayIsoDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MALAYSIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const lookup = (type: string) => parts.find((part) => part.type === type)?.value;
  const year = lookup("year");
  const month = lookup("month");
  const day = lookup("day");

  if (!year || !month || !day) {
    // Intl with an explicit timeZone is universally supported in this
    // project's target runtimes, so this should never happen in practice —
    // fail loudly rather than silently returning a malformed date that
    // would corrupt a borrow-date comparison.
    throw new Error("Could not resolve the Malaysia calendar date.");
  }

  return `${year}-${month}-${day}`;
}
