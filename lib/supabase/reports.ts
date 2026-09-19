import { createClient } from "@/lib/supabase/server";
import {
  getMalaysiaDateEndUtcIso,
  getMalaysiaDateStartUtcIso,
  getMalaysiaTodayIsoDate,
  isValidIsoDate,
  shiftIsoDate,
} from "@/lib/date";
import { INSTRUMENT_CONDITIONS, INSTRUMENT_STATUSES, CONDITION_LABELS, STATUS_LABELS } from "@/types/instrument";
import type { InstrumentCondition, InstrumentStatus } from "@/types/instrument";
import type {
  BorrowingAnalytics,
  DamagedOrMaintenanceInstrument,
  DistributionItem,
  EventAnalytics,
  GalleryAnalytics,
  InstrumentAnalytics,
  InstrumentCount,
  MemberAnalytics,
  MemberCount,
  MonthlyCount,
  NeverBorrowedInstrument,
  ReportDateRange,
  ReportDateRangeKey,
  ReportSummary,
} from "@/types/report";

// ---------------------------------------------------------------------------
// Date range resolution — shared by the report page and the CSV export
// routes so both always agree on the same window for a given query string.
// Anchored on Malaysia's calendar date via lib/date.ts's shared helpers,
// never the server's own local timezone — see lib/date.ts for why that
// distinction matters for a club whose business day runs ~8 hours off UTC.
// ---------------------------------------------------------------------------

export function resolveDateRange(
  key: ReportDateRangeKey,
  customStart?: string | null,
  customEnd?: string | null,
): ReportDateRange {
  if (key === "all") {
    return { start: null, end: null };
  }

  if (key === "custom") {
    const start = customStart && isValidIsoDate(customStart) ? customStart : null;
    const end = customEnd && isValidIsoDate(customEnd) ? customEnd : null;
    // A custom range with an end before its start isn't meaningful — treat
    // it the same as "all time" rather than silently returning zero rows.
    if (start && end && end < start) {
      return { start: null, end: null };
    }
    return { start, end };
  }

  // A preset of N days should span exactly N Malaysia calendar dates
  // INCLUDING today (e.g. "Last 7 Days" = today plus the 6 previous days,
  // not 7 previous days plus today = 8). Shift by -(N - 1), not -N, via
  // shiftIsoDate's pure calendar arithmetic — never the server's own
  // local Date methods.
  const days = Number(key);
  const end = getMalaysiaTodayIsoDate();
  const start = shiftIsoDate(end, -(days - 1));
  return { start, end };
}

/**
 * UTC instant bounds for filtering a `created_at`-style timestamptz column
 * against a Malaysia calendar-date range — the one shared implementation
 * of "what does this Malaysia date range mean in UTC", used by every
 * timestamptz-filtered query below and by every CSV export route. A
 * date-only column (e.g. `event_date`, `actual_borrow_date`) should keep
 * comparing directly against range.start/range.end instead of going
 * through this — see the call sites below.
 */
function timestampRangeBoundsUtcIso(range: ReportDateRange): {
  start: string | null;
  end: string | null;
} {
  return {
    start: range.start ? getMalaysiaDateStartUtcIso(range.start) : null,
    end: range.end ? getMalaysiaDateEndUtcIso(range.end) : null,
  };
}

// ---------------------------------------------------------------------------
// Shared aggregation helpers
// ---------------------------------------------------------------------------

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function buildMonthlySeries(dates: string[]): MonthlyCount[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    if (!date) continue;
    const key = monthKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, label: monthLabel(month), count }));
}

type Relation<T> = T | T[] | null;

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

function aggregateInstrumentCounts(
  rows: { instrument_id: string; instrument: Relation<{ id: string; name: string; instrument_code: string }> }[],
  limit: number,
): InstrumentCount[] {
  const counts = new Map<string, InstrumentCount>();
  for (const row of rows) {
    const instrument = one(row.instrument);
    if (!instrument) continue;
    const existing = counts.get(row.instrument_id);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(row.instrument_id, {
        id: row.instrument_id,
        name: instrument.name,
        instrumentCode: instrument.instrument_code,
        count: 1,
      });
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function aggregateMemberCounts(
  rows: { member_id: string; member: Relation<{ id: string; full_name: string | null }> }[],
  limit: number,
): MemberCount[] {
  const counts = new Map<string, MemberCount>();
  for (const row of rows) {
    const member = one(row.member);
    if (!member) continue;
    const existing = counts.get(row.member_id);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(row.member_id, {
        id: row.member_id,
        name: member.full_name ?? "Unknown Member",
        count: 1,
      });
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function averageDurationDays(
  rows: { actual_borrow_date: string | null; actual_return_date: string | null }[],
): number | null {
  const complete = rows.filter(
    (row): row is { actual_borrow_date: string; actual_return_date: string } =>
      Boolean(row.actual_borrow_date && row.actual_return_date),
  );
  if (complete.length === 0) return null;

  const totalDays = complete.reduce((sum, row) => {
    const start = new Date(row.actual_borrow_date).getTime();
    const end = new Date(row.actual_return_date).getTime();
    return sum + Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
  }, 0);

  return Math.round((totalDays / complete.length) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Summary cards — current-state snapshot, not affected by the date range.
// Queries these tables directly rather than calling the per-module stats
// functions (getInstrumentStats/getBorrowRequestStats/getEventStats) —
// keep the metric definitions below (status groupings, the Malaysia
// "today" used for overdue/upcoming) in sync with those functions by hand
// whenever either side changes.
// ---------------------------------------------------------------------------

export async function getReportSummary(): Promise<ReportSummary> {
  const supabase = await createClient();

  const [instrumentsResult, borrowResult, eventsResult, announcementsResult] = await Promise.all([
    supabase.from("instruments").select("status").is("archived_at", null),
    supabase.from("borrow_requests").select("status, requested_return_date"),
    supabase.from("events").select("status, event_date").is("archived_at", null),
    supabase.from("announcements").select("status").is("archived_at", null),
  ]);

  if (instrumentsResult.error) throw new Error("Could not load instrument statistics.");
  if (borrowResult.error) throw new Error("Could not load borrowing statistics.");
  if (eventsResult.error) throw new Error("Could not load event statistics.");
  if (announcementsResult.error) throw new Error("Could not load announcement statistics.");

  const instrumentRows = instrumentsResult.data ?? [];
  const today = getMalaysiaTodayIsoDate();

  const borrowRows = borrowResult.data ?? [];
  let active = 0;
  let pending = 0;
  let overdue = 0;
  let completed = 0;
  for (const row of borrowRows) {
    if (row.status === "pending") pending += 1;
    else if (row.status === "completed") completed += 1;
    else if (row.status === "active" || row.status === "return_submitted") {
      if (row.status === "active" && row.requested_return_date < today) {
        overdue += 1;
      } else {
        active += 1;
      }
    }
  }

  const eventRows = eventsResult.data ?? [];
  const announcementRows = announcementsResult.data ?? [];

  return {
    totalInstruments: instrumentRows.length,
    availableInstruments: instrumentRows.filter((row) => row.status === "available").length,
    borrowedInstruments: instrumentRows.filter((row) => row.status === "borrowed").length,
    damagedInstruments: instrumentRows.filter((row) => row.status === "damaged").length,
    activeBorrowings: active,
    pendingBorrowRequests: pending,
    overdueBorrowings: overdue,
    completedBorrowings: completed,
    upcomingEvents: eventRows.filter((row) => row.status === "published" && row.event_date >= today)
      .length,
    publishedAnnouncements: announcementRows.filter((row) => row.status === "published").length,
  };
}

// ---------------------------------------------------------------------------
// Borrowing analytics — date-filtered on created_at (when the request was
// made), which is the only timestamp populated for every request regardless
// of how far it progressed.
// ---------------------------------------------------------------------------

export async function getBorrowingAnalytics(range: ReportDateRange): Promise<BorrowingAnalytics> {
  const supabase = await createClient();

  let statusQuery = supabase.from("borrow_requests").select("status, created_at");
  let instrumentQuery = supabase
    .from("borrow_requests")
    .select("instrument_id, created_at, instrument:instruments(id, name, instrument_code)");
  let memberQuery = supabase
    .from("borrow_requests")
    .select("member_id, created_at, member:profiles!member_id(id, full_name)");
  let durationQuery = supabase
    .from("borrow_requests")
    .select("actual_borrow_date, actual_return_date")
    .not("actual_borrow_date", "is", null)
    .not("actual_return_date", "is", null);

  const { start: createdAtStart, end: createdAtEnd } = timestampRangeBoundsUtcIso(range);

  if (createdAtStart) {
    statusQuery = statusQuery.gte("created_at", createdAtStart);
    instrumentQuery = instrumentQuery.gte("created_at", createdAtStart);
    memberQuery = memberQuery.gte("created_at", createdAtStart);
  }
  if (createdAtEnd) {
    statusQuery = statusQuery.lte("created_at", createdAtEnd);
    instrumentQuery = instrumentQuery.lte("created_at", createdAtEnd);
    memberQuery = memberQuery.lte("created_at", createdAtEnd);
  }
  // actual_borrow_date is a date-only column (no time-of-day component),
  // so it compares directly against the Malaysia calendar-date strings —
  // no UTC-instant conversion needed here, unlike created_at above.
  if (range.start) {
    durationQuery = durationQuery.gte("actual_borrow_date", range.start);
  }
  if (range.end) {
    durationQuery = durationQuery.lte("actual_borrow_date", range.end);
  }

  const [statusResult, instrumentResult, memberResult, durationResult] = await Promise.all([
    statusQuery,
    instrumentQuery,
    memberQuery,
    durationQuery,
  ]);

  if (statusResult.error) throw new Error("Could not load borrowing analytics.");
  if (instrumentResult.error) throw new Error("Could not load borrowing analytics.");
  if (memberResult.error) throw new Error("Could not load borrowing analytics.");
  if (durationResult.error) throw new Error("Could not load borrowing analytics.");

  const statusRows = statusResult.data ?? [];

  return {
    byMonth: buildMonthlySeries(statusRows.map((row) => row.created_at)),
    mostBorrowed: aggregateInstrumentCounts(
      (instrumentResult.data ?? []) as unknown as {
        instrument_id: string;
        instrument: Relation<{ id: string; name: string; instrument_code: string }>;
      }[],
      5,
    ),
    memberActivity: aggregateMemberCounts(
      (memberResult.data ?? []) as unknown as {
        member_id: string;
        member: Relation<{ id: string; full_name: string | null }>;
      }[],
      10,
    ),
    averageDurationDays: averageDurationDays(durationResult.data ?? []),
    completedCount: statusRows.filter((row) => row.status === "completed").length,
    cancelledOrRejectedCount: statusRows.filter(
      (row) => row.status === "cancelled" || row.status === "rejected",
    ).length,
  };
}

// ---------------------------------------------------------------------------
// Instrument analytics — lifetime facts about each instrument, not scoped to
// the date range (status/condition and "ever borrowed" aren't a trend).
// ---------------------------------------------------------------------------

export async function getInstrumentAnalytics(): Promise<InstrumentAnalytics> {
  const supabase = await createClient();

  const [instrumentsResult, borrowResult, damageResult] = await Promise.all([
    supabase
      .from("instruments")
      .select("id, name, instrument_code, category, status, condition")
      .is("archived_at", null),
    supabase
      .from("borrow_requests")
      .select("instrument_id, instrument:instruments(id, name, instrument_code)"),
    supabase
      .from("borrow_requests")
      .select("instrument_id, instrument:instruments(id, name, instrument_code)")
      .eq("damage_reported", true),
  ]);

  if (instrumentsResult.error) throw new Error("Could not load instrument analytics.");
  if (borrowResult.error) throw new Error("Could not load instrument analytics.");
  if (damageResult.error) throw new Error("Could not load instrument analytics.");

  const instrumentRows = instrumentsResult.data ?? [];
  const borrowRows = (borrowResult.data ?? []) as unknown as {
    instrument_id: string;
    instrument: Relation<{ id: string; name: string; instrument_code: string }>;
  }[];

  const statusDistribution: DistributionItem[] = INSTRUMENT_STATUSES.map((status) => ({
    key: status,
    label: STATUS_LABELS[status],
    count: instrumentRows.filter((row) => row.status === status).length,
  }));

  const conditionDistribution: DistributionItem[] = INSTRUMENT_CONDITIONS.map((condition) => ({
    key: condition,
    label: CONDITION_LABELS[condition],
    count: instrumentRows.filter((row) => row.condition === condition).length,
  }));

  const borrowedInstrumentIds = new Set(borrowRows.map((row) => row.instrument_id));
  const neverBorrowed: NeverBorrowedInstrument[] = instrumentRows
    .filter((row) => !borrowedInstrumentIds.has(row.id))
    .map((row) => ({
      id: row.id,
      name: row.name,
      instrumentCode: row.instrument_code,
      category: row.category,
    }));

  const damagedOrMaintenance: DamagedOrMaintenanceInstrument[] = instrumentRows
    .filter((row) => row.status === "damaged" || row.status === "maintenance")
    .map((row) => ({
      id: row.id,
      name: row.name,
      instrumentCode: row.instrument_code,
      status: STATUS_LABELS[row.status as InstrumentStatus],
      condition: CONDITION_LABELS[row.condition as InstrumentCondition],
    }));

  return {
    statusDistribution,
    conditionDistribution,
    mostBorrowedLifetime: aggregateInstrumentCounts(borrowRows, 5),
    neverBorrowed,
    damagedOrMaintenance,
    highestDamageReports: aggregateInstrumentCounts(
      (damageResult.data ?? []) as unknown as {
        instrument_id: string;
        instrument: Relation<{ id: string; name: string; instrument_code: string }>;
      }[],
      5,
    ),
  };
}

// ---------------------------------------------------------------------------
// Member analytics — "activity" here means borrowing activity only,
// derived from real borrow_requests rows. The schema has no login/last-seen
// timestamp, so this deliberately never implies account/session activity.
// ---------------------------------------------------------------------------

export async function getMemberAnalytics(): Promise<MemberAnalytics> {
  const supabase = await createClient();

  const [profilesResult, borrowMemberResult, statusResult] = await Promise.all([
    supabase.from("profiles").select("id, role"),
    supabase.from("borrow_requests").select("member_id, member:profiles!member_id(id, full_name)"),
    supabase.from("borrow_requests").select("member_id, status, requested_return_date"),
  ]);

  if (profilesResult.error) throw new Error("Could not load member analytics.");
  if (borrowMemberResult.error) throw new Error("Could not load member analytics.");
  if (statusResult.error) throw new Error("Could not load member analytics.");

  const profileRows = profilesResult.data ?? [];
  const borrowMemberRows = (borrowMemberResult.data ?? []) as unknown as {
    member_id: string;
    member: Relation<{ id: string; full_name: string | null }>;
  }[];
  const statusRows = statusResult.data ?? [];
  const today = getMalaysiaTodayIsoDate();

  const activeMemberIds = new Set<string>();
  const overdueMemberIds = new Set<string>();
  for (const row of statusRows) {
    if (row.status === "active" || row.status === "return_submitted") {
      if (row.status === "active" && row.requested_return_date < today) {
        overdueMemberIds.add(row.member_id);
      } else {
        activeMemberIds.add(row.member_id);
      }
    }
  }

  const distinctBorrowingMembers = new Set(borrowMemberRows.map((row) => row.member_id));

  return {
    total: profileRows.length,
    withBorrowingActivity: distinctBorrowingMembers.size,
    withNoBorrowingActivity: Math.max(0, profileRows.length - distinctBorrowingMembers.size),
    memberRoleCount: profileRows.filter((row) => row.role === "member").length,
    adminRoleCount: profileRows.filter((row) => row.role === "admin").length,
    membersWithActiveBorrowings: activeMemberIds.size,
    membersWithOverdueBorrowings: overdueMemberIds.size,
    mostActiveBorrowersLifetime: aggregateMemberCounts(borrowMemberRows, 5),
  };
}

// ---------------------------------------------------------------------------
// Event analytics — current-state counts plus a date-filtered monthly trend.
// ---------------------------------------------------------------------------

export async function getEventAnalytics(range: ReportDateRange): Promise<EventAnalytics> {
  const supabase = await createClient();

  let rangedQuery = supabase.from("events").select("event_date").is("archived_at", null);
  if (range.start) rangedQuery = rangedQuery.gte("event_date", range.start);
  if (range.end) rangedQuery = rangedQuery.lte("event_date", range.end);

  const [allResult, rangedResult] = await Promise.all([
    supabase.from("events").select("status, event_date").is("archived_at", null),
    rangedQuery,
  ]);

  if (allResult.error) throw new Error("Could not load event analytics.");
  if (rangedResult.error) throw new Error("Could not load event analytics.");

  const rows = allResult.data ?? [];
  const today = getMalaysiaTodayIsoDate();

  return {
    upcoming: rows.filter((row) => row.status === "published" && row.event_date >= today).length,
    completed: rows.filter(
      (row) => row.status === "completed" || (row.status === "published" && row.event_date < today),
    ).length,
    cancelled: rows.filter((row) => row.status === "cancelled").length,
    byMonth: buildMonthlySeries((rangedResult.data ?? []).map((row) => row.event_date)),
  };
}

// ---------------------------------------------------------------------------
// Gallery analytics — current-state.
// ---------------------------------------------------------------------------

export async function getGalleryAnalytics(): Promise<GalleryAnalytics> {
  const supabase = await createClient();

  const [albumsResult, imagesResult] = await Promise.all([
    supabase.from("gallery_albums").select("status, is_featured"),
    supabase.from("gallery_images").select("id", { count: "exact", head: true }),
  ]);

  if (albumsResult.error) throw new Error("Could not load gallery analytics.");
  if (imagesResult.error) throw new Error("Could not load gallery analytics.");

  const rows = albumsResult.data ?? [];

  return {
    totalAlbums: rows.length,
    publishedAlbums: rows.filter((row) => row.status === "published").length,
    featuredAlbums: rows.filter((row) => row.is_featured).length,
    totalImages: imagesResult.count ?? 0,
  };
}
