const MALAYSIA_TIME_ZONE = "Asia/Kuala_Lumpur";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: MALAYSIA_TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
});

/**
 * Formats a timestamptz column value ("published_at"/"expires_at") as
 * "September 4, 2026" — explicitly in Malaysia time (Asia/Kuala_Lumpur),
 * not the server/Vercel runtime's own timezone. Without an explicit
 * `timeZone`, a UTC-configured server would show the UTC calendar date
 * instead, which is wrong for roughly 8 hours of every day (a timestamp
 * stored as, say, "2026-09-19T20:00:00.000Z" is already "September 20" in
 * Malaysia). The stored value itself stays UTC — this only changes how
 * it's displayed.
 */
export function formatAnnouncementDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_FORMATTER.format(date);
}

const DATETIME_LOCAL_PART_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: MALAYSIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * Converts a stored timestamptz value to the "YYYY-MM-DDTHH:mm" shape a
 * `datetime-local` input expects, as the corresponding Malaysia wall-clock
 * value — the read-side counterpart to lib/date.ts's
 * parseMalaysiaDateTimeLocal, which converts the other direction (a
 * datetime-local value back to a UTC instant) using the same fixed
 * Asia/Kuala_Lumpur offset. Together they keep the admin announcement
 * form's edit prefill and its save path agreeing on what "the same
 * wall-clock time" means.
 *
 * Deliberately does NOT use `date.getFullYear()`/`getMonth()`/`getDate()`/
 * `getHours()`/`getMinutes()` — those are LOCAL getters, so on a
 * UTC-configured server they'd return the UTC wall-clock components, not
 * Malaysia's, silently prefilling the edit form 8 hours off from what was
 * actually saved.
 *
 * Example: toDatetimeLocalValue("2026-09-19T20:00:00.000Z") -> "2026-09-20T04:00"
 * (4:00 AM MYT the next calendar day).
 */
export function toDatetimeLocalValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = DATETIME_LOCAL_PART_FORMATTER.formatToParts(date);
  const lookup = (type: string) => parts.find((part) => part.type === type)?.value;
  const year = lookup("year");
  const month = lookup("month");
  const day = lookup("day");
  const hour = lookup("hour");
  const minute = lookup("minute");

  if (!year || !month || !day || !hour || !minute) return "";

  return `${year}-${month}-${day}T${hour}:${minute}`;
}
