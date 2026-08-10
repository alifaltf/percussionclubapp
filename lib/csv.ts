/**
 * Minimal CSV serializer for admin report exports. No external dependency —
 * the format is simple enough (comma-separated, quote-escaped) that a
 * library would be overkill, and this keeps the export routes dependency-free.
 */
export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escapeCell = (value: string | number | null): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];

  // CRLF line endings for maximum spreadsheet-app compatibility.
  return lines.join("\r\n");
}
