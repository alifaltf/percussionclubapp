/**
 * Minimal CSV serializer for admin report exports. No external dependency —
 * the format is simple enough (comma-separated, quote-escaped) that a
 * library would be overkill, and this keeps the export routes dependency-free.
 */
// Cells whose first character is one of these are interpreted as a formula
// by Excel/Google Sheets/LibreOffice when the CSV is opened — a member-
// controlled field like profiles.full_name flowing into an admin's export
// (see app/admin/reports/export/*) is a real cross-privilege injection
// vector otherwise. Prefixing with a single quote is the standard
// spreadsheet convention for "treat this cell as literal text," and every
// major app respects it without displaying the quote itself.
const FORMULA_TRIGGER_PATTERN = /^[=+\-@]/;

export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escapeCell = (value: string | number | null): string => {
    let str = value === null || value === undefined ? "" : String(value);
    if (FORMULA_TRIGGER_PATTERN.test(str)) {
      str = `'${str}`;
    }
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
