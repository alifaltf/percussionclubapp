const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

/**
 * Formats an album's published_at (or created_at fallback) as "September
 * 2026" for display on cards and the detail page. Falls back to just the
 * year if the value is unparseable, and to "Undated" if there's nothing at
 * all (shouldn't happen for published albums, but keeps the UI safe).
 */
export function formatAlbumDate(publishedAt: string | null): string {
  if (!publishedAt) return "Undated";
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "Undated";
  return MONTH_YEAR_FORMATTER.format(date);
}

export function albumYear(publishedAt: string | null): string | null {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return String(date.getFullYear());
}
