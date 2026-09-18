import { createClient } from "@/lib/supabase/server";
import { getMalaysiaTodayIsoDate } from "@/lib/date";
import type {
  BorrowRequestAdminView,
  BorrowRequestStatus,
  BorrowRequestWithInstrument,
} from "@/types/borrow-request";
import { ACTIVE_BORROW_STATUSES } from "@/types/borrow-request";
import type { InstrumentCondition, InstrumentStatus } from "@/types/instrument";

// Postgres error code for a malformed literal passed to a typed column
// (e.g. an id in the URL that isn't a valid UUID) — mirrors the pattern
// already used in lib/supabase/instruments.ts.
const INVALID_TEXT_REPRESENTATION = "22P02";

const REQUEST_COLUMNS_WITH_INSTRUMENT =
  "id, member_id, instrument_id, purpose, requested_borrow_date, requested_return_date, status, admin_note, reviewed_by, reviewed_at, actual_borrow_date, actual_return_date, return_photo_url, return_notes, condition_before, condition_after, damage_reported, damage_notes, damage_reported_at, verified_by, verified_at, created_at, updated_at, instrument:instruments(id, instrument_code, name, category, image_url)";

const REQUEST_COLUMNS_ADMIN =
  "id, member_id, instrument_id, purpose, requested_borrow_date, requested_return_date, status, admin_note, reviewed_by, reviewed_at, actual_borrow_date, actual_return_date, return_photo_url, return_notes, condition_before, condition_after, damage_reported, damage_notes, damage_reported_at, verified_by, verified_at, created_at, updated_at, instrument:instruments(id, instrument_code, name, category, image_url), member:profiles!member_id(id, full_name, avatar_url, phone)";

// ---------------------------------------------------------------------------
// "Overdue" is a *derived display state*, never a value written to the
// `status` column. There is no scheduled job that flips a row to overdue —
// per the Module 2 spec, that's intentionally out of scope for now. Instead,
// a borrowing is treated as overdue whenever it's still `active` (the member
// has it, no return submitted yet) and `requested_return_date` has passed.
// That check is applied once, here, to every row this module returns, so
// badges, admin filters and dashboard counts all agree on the same effective
// status without each caller re-deriving it.
//
// "Today" is the club's own calendar date (Asia/Kuala_Lumpur), via the
// shared getMalaysiaTodayIsoDate helper — not UTC or the server's system
// timezone, which would misclassify a borrowing as (not) overdue for part
// of every day. See lib/date.ts for why.
// ---------------------------------------------------------------------------

function isPastReturnDate(requestedReturnDate: string): boolean {
  return requestedReturnDate < getMalaysiaTodayIsoDate();
}

function withEffectiveStatus<
  T extends { status: BorrowRequestStatus; requested_return_date: string },
>(row: T): T {
  if (row.status === "active" && isPastReturnDate(row.requested_return_date)) {
    return { ...row, status: "overdue" };
  }
  return row;
}

function withEffectiveStatuses<
  T extends { status: BorrowRequestStatus; requested_return_date: string },
>(rows: T[]): T[] {
  return rows.map(withEffectiveStatus);
}

/** All of the current member's requests, newest first — the full history. */
export async function getMyRequests(): Promise<BorrowRequestWithInstrument[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("borrow_requests")
    .select(REQUEST_COLUMNS_WITH_INSTRUMENT)
    .eq("member_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Could not load your requests.");
  }

  return withEffectiveStatuses((data as unknown as BorrowRequestWithInstrument[] | null) ?? []);
}

/**
 * Requests that actually became a physical borrowing (active, returned, or
 * still in the return/verification pipeline) — the member's borrowing
 * history, distinct from requests that never left the pending queue.
 */
export async function getMyBorrowings(): Promise<BorrowRequestWithInstrument[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("borrow_requests")
    .select(REQUEST_COLUMNS_WITH_INSTRUMENT)
    .eq("member_id", user.id)
    .in("status", [...ACTIVE_BORROW_STATUSES, "completed"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Could not load your borrowings.");
  }

  return withEffectiveStatuses((data as unknown as BorrowRequestWithInstrument[] | null) ?? []);
}

/** A single borrowing, scoped to the current member (RLS also enforces this). */
export async function getMyBorrowingById(
  id: string,
): Promise<BorrowRequestWithInstrument | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("borrow_requests")
    .select(REQUEST_COLUMNS_WITH_INSTRUMENT)
    .eq("id", id)
    .eq("member_id", user.id)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) return null;
    throw new Error("Could not load this borrowing.");
  }

  const row = (data as unknown as BorrowRequestWithInstrument | null) ?? null;
  return row ? withEffectiveStatus(row) : null;
}

/**
 * The member's current non-terminal request for a given instrument, if any
 * (pending, active, return_submitted or overdue). Used on the instrument
 * detail page to prevent submitting a duplicate request and to explain why
 * the button is disabled.
 */
export async function getMyOpenRequestForInstrument(
  instrumentId: string,
): Promise<BorrowRequestWithInstrument | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("borrow_requests")
    .select(REQUEST_COLUMNS_WITH_INSTRUMENT)
    .eq("member_id", user.id)
    .eq("instrument_id", instrumentId)
    .in("status", ["pending", ...ACTIVE_BORROW_STATUSES])
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) return null;
    return null;
  }

  const row = (data as unknown as BorrowRequestWithInstrument | null) ?? null;
  return row ? withEffectiveStatus(row) : null;
}

/**
 * The instrument's current non-terminal borrow request, if any (pending,
 * active, return_submitted or overdue), with the borrowing member attached
 * — admin-scoped counterpart to getMyOpenRequestForInstrument, and named to
 * match it rather than "getCurrentBorrowingForInstrument": a "pending" row
 * here is a request awaiting review that hasn't been approved yet, so the
 * instrument isn't actually borrowed — calling that a "current borrowing"
 * would be wrong. The returned `kind` tells the caller which case it got:
 * "pending" (awaiting review, instrument hasn't left yet) or "current"
 * (active, return_submitted or overdue — it's actually out right now).
 * Used by the admin instrument detail page to show "who has this right
 * now" without duplicating the Borrow Requests module; the page links out
 * to the full request (/admin/requests/[id]) for anything beyond this
 * summary. Callers must already be admin-gated (see requireAdmin() in the
 * page) — this function does not check that itself, matching
 * getAdminBorrowRequestById. There can only ever be one such row per
 * instrument (submit_borrow_request rejects a new request while the
 * instrument isn't available), but this still orders/limits defensively
 * rather than assuming that invariant holds.
 */
export interface InstrumentBorrowingSummary {
  kind: "pending" | "current";
  request: BorrowRequestAdminView;
}

export async function getOpenBorrowRequestForInstrument(
  instrumentId: string,
): Promise<InstrumentBorrowingSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("borrow_requests")
    .select(REQUEST_COLUMNS_ADMIN)
    .eq("instrument_id", instrumentId)
    .in("status", ["pending", ...ACTIVE_BORROW_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) return null;
    throw new Error("Could not load the open borrow request for this instrument.");
  }

  const row = (data as unknown as BorrowRequestAdminView | null) ?? null;
  if (!row) return null;

  const request = withEffectiveStatus(row);
  return {
    kind: request.status === "pending" ? "pending" : "current",
    request,
  };
}

export interface AdminBorrowRequestsQuery {
  search?: string;
  status?: BorrowRequestStatus | "all";
  sort?: "newest" | "oldest" | "return-date-asc" | "return-date-desc";
  page?: number;
  pageSize?: number;
}

export interface AdminBorrowRequestsResult {
  requests: BorrowRequestAdminView[];
  totalCount: number;
}

/**
 * Admin request queue: search + filter + sort + pagination in a single
 * query, mirroring getAdminInstruments's shape. Search matches instrument
 * code/name or the requesting member's name; both embedded resources are
 * joined with !inner so the filter narrows the top-level rows, not just
 * the nested objects.
 */
export async function getAdminBorrowRequests(
  query: AdminBorrowRequestsQuery,
): Promise<AdminBorrowRequestsResult> {
  const { search = "", status = "all", sort = "newest", page = 1, pageSize = 20 } = query;

  const supabase = await createClient();

  let queryBuilder = supabase
    .from("borrow_requests")
    .select(
      "id, member_id, instrument_id, purpose, requested_borrow_date, requested_return_date, status, admin_note, reviewed_by, reviewed_at, actual_borrow_date, actual_return_date, return_photo_url, return_notes, condition_before, condition_after, damage_reported, damage_notes, damage_reported_at, verified_by, verified_at, created_at, updated_at, instrument:instruments!inner(id, instrument_code, name, category, image_url), member:profiles!member_id!inner(id, full_name, avatar_url, phone)",
      { count: "exact" },
    );

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    const safeSearch = trimmedSearch.replace(/[%,]/g, "");
    queryBuilder = queryBuilder.or(
      `instrument_code.ilike.%${safeSearch}%,name.ilike.%${safeSearch}%`,
      { referencedTable: "instrument" },
    );
  }

  // "overdue" and "active" both live under the raw `active` status value —
  // see the effective-status note above. Split them here so the filter
  // dropdown actually narrows results instead of matching a status that's
  // never stored.
  if (status === "overdue") {
    queryBuilder = queryBuilder
      .eq("status", "active")
      .lt("requested_return_date", getMalaysiaTodayIsoDate());
  } else if (status === "active") {
    queryBuilder = queryBuilder
      .eq("status", "active")
      .gte("requested_return_date", getMalaysiaTodayIsoDate());
  } else if (status !== "all") {
    queryBuilder = queryBuilder.eq("status", status);
  }

  if (sort === "oldest") {
    queryBuilder = queryBuilder.order("created_at", { ascending: true });
  } else if (sort === "return-date-asc") {
    queryBuilder = queryBuilder.order("requested_return_date", { ascending: true });
  } else if (sort === "return-date-desc") {
    queryBuilder = queryBuilder.order("requested_return_date", { ascending: false });
  } else {
    queryBuilder = queryBuilder.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await queryBuilder.range(from, to);

  if (error) {
    throw new Error("Could not load borrow requests.");
  }

  return {
    requests: withEffectiveStatuses(
      (data as unknown as BorrowRequestAdminView[] | null) ?? [],
    ),
    totalCount: count ?? 0,
  };
}

export async function getAdminBorrowRequestById(
  id: string,
): Promise<BorrowRequestAdminView | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("borrow_requests")
    .select(REQUEST_COLUMNS_ADMIN)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) return null;
    throw new Error("Could not load this request.");
  }

  const row = (data as unknown as BorrowRequestAdminView | null) ?? null;
  return row ? withEffectiveStatus(row) : null;
}

/**
 * Counts for the admin requests queue header and the admin dashboard.
 * Counts are keyed by *effective* status, so `active` here means "still
 * out, not yet overdue" and `overdue` is broken out separately — callers
 * that want "everything currently checked out" should add the two
 * together (see the admin dashboard's Active Borrowings card).
 */
export async function getBorrowRequestStats(): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("borrow_requests")
    .select("status, requested_return_date");

  if (error) {
    throw new Error("Could not load request statistics.");
  }

  const rows = data ?? [];
  const counts: Record<string, number> = { total: rows.length };
  for (const row of rows) {
    const effectiveStatus =
      row.status === "active" && isPastReturnDate(row.requested_return_date)
        ? "overdue"
        : (row.status as string);
    counts[effectiveStatus] = (counts[effectiveStatus] ?? 0) + 1;
  }
  return counts;
}

/** Counts for the member dashboard's summary cards, scoped to the signed-in member. */
export interface MyBorrowStats {
  activeBorrowings: number;
  pendingRequests: number;
}

export async function getMyBorrowStats(): Promise<MyBorrowStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { activeBorrowings: 0, pendingRequests: 0 };

  const { data, error } = await supabase
    .from("borrow_requests")
    .select("status")
    .eq("member_id", user.id)
    .in("status", ["pending", ...ACTIVE_BORROW_STATUSES]);

  if (error) {
    throw new Error("Could not load your borrowing stats.");
  }

  const rows = data ?? [];
  return {
    // Raw status "active" and "return_submitted" both mean the member
    // still physically has the instrument (overdue is a derived subset of
    // "active", so it's already included here).
    activeBorrowings: rows.filter(
      (row) => row.status === "active" || row.status === "return_submitted",
    ).length,
    pendingRequests: rows.filter((row) => row.status === "pending").length,
  };
}

// ---------------------------------------------------------------------------
// Mutations — every write to borrow_requests goes through one of the
// SECURITY DEFINER RPCs created for Module 2, never a direct insert/update.
// Each wrapper just forwards to the RPC and turns a Postgres error into a
// plain message the Server Action layer can hand back to the UI.
// ---------------------------------------------------------------------------

export interface RpcResult {
  ok: boolean;
  error?: string;
}

export async function submitBorrowRequestRpc(params: {
  instrumentId: string;
  purpose: string;
  requestedBorrowDate: string;
  requestedReturnDate: string;
}): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_borrow_request", {
    p_instrument_id: params.instrumentId,
    p_purpose: params.purpose,
    p_requested_borrow_date: params.requestedBorrowDate,
    p_requested_return_date: params.requestedReturnDate,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function cancelBorrowRequestRpc(requestId: string): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_borrow_request", {
    p_request_id: requestId,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function approveBorrowRequestRpc(
  requestId: string,
  adminNote?: string,
): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_borrow_request", {
    p_request_id: requestId,
    p_admin_note: adminNote || null,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function rejectBorrowRequestRpc(
  requestId: string,
  adminNote?: string,
): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_borrow_request", {
    p_request_id: requestId,
    p_admin_note: adminNote || null,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function submitReturnRpc(params: {
  requestId: string;
  returnPhotoUrl: string;
  returnNotes?: string;
}): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_return", {
    p_request_id: params.requestId,
    p_return_photo_url: params.returnPhotoUrl,
    p_return_notes: params.returnNotes || null,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function reportDamageRpc(params: {
  requestId: string;
  damageNotes: string;
}): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("report_damage", {
    p_request_id: params.requestId,
    p_damage_notes: params.damageNotes,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function completeReturnRpc(params: {
  requestId: string;
  verificationNote?: string;
  conditionAfter: InstrumentCondition;
  finalInstrumentStatus: InstrumentStatus;
  damageReported?: boolean;
  damageNotes?: string;
}): Promise<RpcResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_return", {
    p_request_id: params.requestId,
    p_verification_note: params.verificationNote || null,
    p_condition_after: params.conditionAfter,
    p_final_instrument_status: params.finalInstrumentStatus,
    p_damage_reported: params.damageReported ?? false,
    p_damage_notes: params.damageNotes || null,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Whether an instrument currently has any non-terminal borrow request
 * (pending, active, return_submitted or overdue). Used to block archiving
 * an instrument that's mid-borrow.
 */
export async function instrumentHasOpenBorrowRequest(instrumentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("borrow_requests")
    .select("id", { count: "exact", head: true })
    .eq("instrument_id", instrumentId)
    .in("status", ["pending", ...ACTIVE_BORROW_STATUSES]);

  if (error) {
    // Fail closed: if we can't verify, don't allow the archive to proceed
    // silently — the caller should treat this as "can't confirm, blocked".
    return true;
  }

  return (count ?? 0) > 0;
}

/**
 * Whether an instrument currently has an open *active* borrowing — status
 * active, return_submitted or overdue (ACTIVE_BORROW_STATUSES) — as opposed
 * to a merely pending request that hasn't been approved yet. Narrower than
 * instrumentHasOpenBorrowRequest, which also counts "pending" (the right
 * bar for blocking an archive); a normal instrument edit shouldn't be
 * blocked from changing status just because someone has an unapproved
 * request in, but it must never be allowed to override a status the
 * borrowing workflow itself owns while a loan is actually in progress. Used
 * by updateInstrument to decide whether a submitted status change may be
 * applied.
 */
export async function instrumentHasActiveBorrowing(instrumentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("borrow_requests")
    .select("id", { count: "exact", head: true })
    .eq("instrument_id", instrumentId)
    .in("status", ACTIVE_BORROW_STATUSES);

  if (error) {
    // Fail closed: if we can't verify, don't let a status change slip
    // through — treat it as if an active borrowing exists.
    return true;
  }

  return (count ?? 0) > 0;
}
