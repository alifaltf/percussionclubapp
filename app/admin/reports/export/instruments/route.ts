import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createClient } from "@/lib/supabase/server";
import { resolveDateRange } from "@/lib/supabase/reports";
import { toCsv } from "@/lib/csv";
import { STATUS_LABELS, CONDITION_LABELS } from "@/types/instrument";
import type { InstrumentCondition, InstrumentStatus } from "@/types/instrument";
import type { ReportDateRangeKey } from "@/types/report";

/**
 * Admin-only CSV export of instruments. "Times Borrowed" is scoped to the
 * selected date range (per the on-screen report filter); "Last Borrowed
 * Date" is a lifetime fact, not scoped to the range, since a range-limited
 * "last borrowed" would be misleading (it would just be the most recent
 * request that happens to fall inside the window).
 */
export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rangeKey = (searchParams.get("range") as ReportDateRangeKey) ?? "all";
  const range = resolveDateRange(rangeKey, searchParams.get("start"), searchParams.get("end"));

  const supabase = await createClient();

  const [instrumentsResult, borrowResult] = await Promise.all([
    supabase
      .from("instruments")
      .select("id, instrument_code, name, category, status, condition")
      .is("archived_at", null)
      .order("name", { ascending: true }),
    supabase.from("borrow_requests").select("instrument_id, requested_borrow_date, created_at"),
  ]);

  if (instrumentsResult.error || borrowResult.error) {
    return NextResponse.json({ error: "Could not generate the instrument report." }, { status: 500 });
  }

  const borrowRows = borrowResult.data ?? [];
  const rangeStart = range.start;
  const rangeEnd = range.end ? `${range.end}T23:59:59.999` : null;

  const timesBorrowedInRange = new Map<string, number>();
  const lastBorrowedLifetime = new Map<string, string>();

  for (const row of borrowRows) {
    const current = lastBorrowedLifetime.get(row.instrument_id);
    if (!current || row.requested_borrow_date > current) {
      lastBorrowedLifetime.set(row.instrument_id, row.requested_borrow_date);
    }

    const inRange = (!rangeStart || row.created_at >= rangeStart) && (!rangeEnd || row.created_at <= rangeEnd);
    if (inRange) {
      timesBorrowedInRange.set(row.instrument_id, (timesBorrowedInRange.get(row.instrument_id) ?? 0) + 1);
    }
  }

  const rows = (instrumentsResult.data ?? []).map((instrument) => [
    instrument.instrument_code,
    instrument.name,
    instrument.category,
    STATUS_LABELS[instrument.status as InstrumentStatus] ?? instrument.status,
    CONDITION_LABELS[instrument.condition as InstrumentCondition] ?? instrument.condition,
    timesBorrowedInRange.get(instrument.id) ?? 0,
    lastBorrowedLifetime.get(instrument.id) ?? "Never",
  ]);

  const csv = toCsv(
    [
      "Instrument Code",
      "Name",
      "Category",
      "Status",
      "Condition",
      "Times Borrowed (Selected Range)",
      "Last Borrowed Date (All Time)",
    ],
    rows,
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="instrument-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
