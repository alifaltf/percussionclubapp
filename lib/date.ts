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

const MALAYSIA_UTC_OFFSET_MINUTES = 8 * 60;

const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Parses a browser `<input type="datetime-local">` value (e.g.
 * "2026-09-20T14:30") as wall-clock time in Malaysia (Asia/Kuala_Lumpur,
 * UTC+8, no DST) and returns the equivalent UTC instant as an ISO 8601
 * string (e.g. "2026-09-20T06:30:00.000Z"), or `null` if the value is
 * missing, malformed, or not a real calendar date/time.
 *
 * A `datetime-local` value carries no timezone information of its own —
 * it's just wall-clock numbers. Handing it directly to `new Date(value)`
 * (or any other API that infers a timezone) makes JavaScript interpret
 * those numbers using whatever timezone the CODE happens to be running in:
 * on a server whose local/system timezone is UTC, `new
 * Date("2026-09-20T14:30").toISOString()` silently produces
 * "2026-09-20T14:30:00.000Z" — which is actually 2026-09-20 22:30 in
 * Malaysia, 8 hours later than the admin who typed "2:30 PM" intended, and
 * the result would also silently shift if the server's own timezone ever
 * changed. This function fixes the interpretation at Malaysia's fixed
 * UTC+8 offset, independent of the environment's own timezone.
 *
 * Deliberately uses `Date.UTC()`-based fixed-offset arithmetic rather than
 * `Intl.DateTimeFormat` (the approach `getMalaysiaTodayIsoDate` above
 * uses): this is the reverse direction — known Malaysia wall-clock
 * components going IN, a UTC instant coming OUT — and Malaysia's offset
 * never changes (no DST), so a constant subtraction is simpler and exact.
 *
 * Impossible dates (e.g. "2026-02-30") are rejected by round-tripping the
 * constructed UTC millis back through `getUTC*()` accessors and comparing
 * against the original components, BEFORE the Malaysia offset is applied —
 * `Date.UTC()` itself silently normalizes overflow (`Date.UTC(2026, 1,
 * 30)` becomes March 2, not an error), so this check has to be explicit.
 */
export function parseMalaysiaDateTimeLocal(value: string): string | null {
  const match = DATETIME_LOCAL_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const second = secondStr ? Number(secondStr) : 0;

  const wallClockMillis = Date.UTC(year, month - 1, day, hour, minute, second);
  const roundTrip = new Date(wallClockMillis);

  const isRealDateTime =
    roundTrip.getUTCFullYear() === year &&
    roundTrip.getUTCMonth() === month - 1 &&
    roundTrip.getUTCDate() === day &&
    roundTrip.getUTCHours() === hour &&
    roundTrip.getUTCMinutes() === minute &&
    roundTrip.getUTCSeconds() === second;

  if (!isRealDateTime) {
    return null;
  }

  const utcMillis = wallClockMillis - MALAYSIA_UTC_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcMillis).toISOString();
}
