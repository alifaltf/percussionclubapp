import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createClient } from "@/lib/supabase/server";
import { resolveDateRange } from "@/lib/supabase/reports";
import { toCsv } from "@/lib/csv";
import type { ReportDateRangeKey } from "@/types/report";

/**
 * Admin-only CSV export of members. "Total Borrows" is scoped to the
 * selected date range; "Active" / "Overdue" are current-state facts (a
 * borrowing either is or isn't overdue right now, so a date range doesn't
 * apply to them the same way).
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

  const [profilesResult, borrowResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, created_at").order("full_name", { ascending: true }),
    supabase.from("borrow_requests").select("member_id, status, requested_return_date, created_at"),
  ]);

  if (profilesResult.error || borrowResult.error) {
    return NextResponse.json({ error: "Could not generate the member report." }, { status: 500 });
  }

  const borrowRows = borrowResult.data ?? [];
  const rangeStart = range.start;
  const rangeEnd = range.end ? `${range.end}T23:59:59.999` : null;
  const today = new Date().toISOString().slice(0, 10);

  const totalBorrowsInRange = new Map<string, number>();
  const activeMembers = new Set<string>();
  const overdueMembers = new Set<string>();

  for (const row of borrowRows) {
    const inRange = (!rangeStart || row.created_at >= rangeStart) && (!rangeEnd || row.created_at <= rangeEnd);
    if (inRange) {
      totalBorrowsInRange.set(row.member_id, (totalBorrowsInRange.get(row.member_id) ?? 0) + 1);
    }

    if (row.status === "active" || row.status === "return_submitted") {
      if (row.status === "active" && row.requested_return_date < today) {
        overdueMembers.add(row.member_id);
      } else {
        activeMembers.add(row.member_id);
      }
    }
  }

  const rows = (profilesResult.data ?? []).map((member) => [
    member.full_name ?? "Unknown",
    member.role,
    totalBorrowsInRange.get(member.id) ?? 0,
    activeMembers.has(member.id) ? "Yes" : "No",
    overdueMembers.has(member.id) ? "Yes" : "No",
    member.created_at.slice(0, 10),
  ]);

  const csv = toCsv(
    [
      "Name",
      "Role",
      "Total Borrows (Selected Range)",
      "Has Active Borrowing",
      "Has Overdue Borrowing",
      "Member Since",
    ],
    rows,
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="member-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
