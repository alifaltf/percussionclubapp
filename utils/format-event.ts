const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** Formats a `date` column value ("YYYY-MM-DD") without shifting timezones. */
export function formatEventDate(eventDate: string, short = false): string {
  const [year, month, day] = eventDate.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return (short ? SHORT_DATE_FORMATTER : DATE_FORMATTER).format(date);
}

/** Formats a `time` column value ("HH:MM" or "HH:MM:SS") as "2:00 PM". */
export function formatEventTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** Combines start/end time into a single display string, with a fallback. */
export function formatEventTimeRange(
  startTime: string | null,
  endTime: string | null,
): string {
  if (!startTime && !endTime) return "Time TBA";
  if (startTime && endTime) {
    return `${formatEventTime(startTime)} – ${formatEventTime(endTime)}`;
  }
  return formatEventTime((startTime ?? endTime) as string);
}
