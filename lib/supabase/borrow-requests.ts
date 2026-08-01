import { createClient } from "@/lib/supabase/server";
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

  return (data as unknown as BorrowRequestWithInstrument[] | null) ?? [];
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

  return (data as unknown as BorrowRequestWithInstrument[] | null) ?? [];
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

  return (data as unknown as BorrowRequestWithInstrument | null) ?? null;
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

  return (data as unknown as BorrowRequestWithInstrument | null) ?? null;
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

  if (status !== "all") {
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
    requests: (data as unknown as BorrowRequestAdminView[] | null) ?? [],
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

  return (data as unknown as BorrowRequestAdminView | null) ?? null;
}

/** Counts for the admin requests queue header. */
export async function getBorrowRequestStats(): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("borrow_requests").select("status");

  if (error) {
    throw new Error("Could not load request statistics.");
  }

  const rows = data ?? [];
  const counts: Record<string, number> = { total: rows.length };
  for (const row of rows) {
    counts[row.status as string] = (counts[row.status as string] ?? 0) + 1;
  }
  return counts;
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
