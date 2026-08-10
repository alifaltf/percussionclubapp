import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createClient } from "@/lib/supabase/server";
import { resolveDateRange } from "@/lib/supabase/reports";
import { toCsv } from "@/lib/csv";
import type { ReportDateRangeKey } from "@/types/report";

const CSV_COLUMNS =
  "status, requested_borrow_date, requested_return_date, actual_borrow_date, actual_return_date, damage_reported, created_at, instrument:instruments(instrument_code, name), member:profiles!member_id(full_name)";

interface BorrowingExportRow {
  status: string;
  requested_borrow_date: string;
  requested_return_date: string;
  actual_borrow_date: string | null;
  actual_return_date: string | null;
  damage_reported: boolean;
  instrument: { instrument_code: string; name: string } | { instrument_code: string; name: string }[] | null;
  member: { full_name: string | null } | { full_name: string | null }[] | null;
}

function one<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

/**
 * Admin-only CSV export of borrow requests within the selected date range.
 * Role is verified server-side against the `profiles` table (never trusted
 * from the client), and existing RLS on `borrow_requests` still applies —
 * this route only ever runs a plain SELECT.
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

  let query = supabase.from("borrow_requests").select(CSV_COLUMNS).order("created_at", { ascending: false });
  if (range.start) query = query.gte("created_at", range.start);
  if (range.end) query = query.lte("created_at", `${range.end}T23:59:59.999`);

  const { data, error } = await query;

  if (error) {
    // Never surface the raw Postgres/PostgREST error to the client.
    return NextResponse.json({ error: "Could not generate the borrowing report." }, { status: 500 });
  }

  const rows = ((data ?? []) as unknown as BorrowingExportRow[]).map((row) => {
    const instrument = one(row.instrument);
    const member = one(row.member);
    const duration =
      row.actual_borrow_date && row.actual_return_date
        ? Math.max(
            0,
            Math.round(
              (new Date(row.actual_return_date).getTime() - new Date(row.actual_borrow_date).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : null;

    return [
      instrument?.instrument_code ?? "",
      instrument?.name ?? "",
      member?.full_name ?? "Unknown Member",
      row.status,
      row.requested_borrow_date,
      row.requested_return_date,
      row.actual_borrow_date ?? "",
      row.actual_return_date ?? "",
      duration,
      row.damage_reported ? "Yes" : "No",
    ];
  });

  const csv = toCsv(
    [
      "Instrument Code",
      "Instrument Name",
      "Borrower",
      "Status",
      "Requested Borrow Date",
      "Requested Return Date",
      "Actual Borrow Date",
      "Actual Return Date",
      "Duration (Days)",
      "Damage Reported",
    ],
    rows,
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="borrowing-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
