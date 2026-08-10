import { createClient } from "@/lib/supabase/server";
import {
  INSTRUMENT_CODE_PATTERN,
  type Instrument,
  type InstrumentArchiveState,
  type InstrumentCondition,
  type InstrumentSort,
  type InstrumentStats,
  type InstrumentStatus,
  type PublicInstrument,
} from "@/types/instrument";

// Postgres error code for a malformed literal passed to a typed column
// (e.g. an id in the URL that isn't a valid UUID).
const INVALID_TEXT_REPRESENTATION = "22P02";

const INSTRUMENT_COLUMNS =
  "id, instrument_code, name, category, description, status, condition, image_url, purchase_date, notes, archived_at, created_at, updated_at";

/**
 * Fetches all non-archived instruments. RLS on the `instruments` table
 * already restricts reads to members and admins, so no role check is
 * needed here.
 */
export async function getInstruments(): Promise<Instrument[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("instruments")
    .select(INSTRUMENT_COLUMNS)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Could not load instruments.");
  }

  return (data as Instrument[] | null) ?? [];
}

/**
 * Fetches a single non-archived instrument by id. Returns null both when
 * the row genuinely doesn't exist and when `id` isn't a valid UUID at all
 * (e.g. someone hand-edits the URL) — callers should treat both as
 * "not found".
 */
export async function getInstrumentById(id: string): Promise<Instrument | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("instruments")
    .select(INSTRUMENT_COLUMNS)
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) {
      return null;
    }
    throw new Error("Could not load this instrument.");
  }

  return (data as Instrument | null) ?? null;
}

/**
 * Same as getInstrumentById, but for the admin edit page: doesn't exclude
 * archived instruments, since an admin should still be able to reach one
 * via a bookmarked or shared link.
 */
export async function getInstrumentByIdForAdmin(id: string): Promise<Instrument | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("instruments")
    .select(INSTRUMENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) {
      return null;
    }
    throw new Error("Could not load this instrument.");
  }

  return (data as Instrument | null) ?? null;
}

/**
 * Same as getInstrumentByIdForAdmin, but by instrument_code — used by the
 * QR download Route Handler to confirm a code corresponds to a real
 * instrument (any archive state, same as the admin edit page) before a PNG
 * is generated for it, without needing the caller to already know the id.
 */
export async function getInstrumentByCodeForAdmin(code: string): Promise<Instrument | null> {
  if (!INSTRUMENT_CODE_PATTERN.test(code)) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("instruments")
    .select(INSTRUMENT_COLUMNS)
    .eq("instrument_code", code)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load this instrument.");
  }

  return (data as Instrument | null) ?? null;
}

/**
 * Member/admin-scoped lookup by instrument_code — the authenticated
 * counterpart to getPublicInstrumentByCode. Used on the QR route
 * (/i/[instrument_code]) once a session is confirmed, so a signed-in
 * member gets the full record (and its id, needed to bind the existing
 * borrowing flow) instead of the restricted public RPC's output. Relies
 * on the same RLS as getInstrumentById — no separate access check needed
 * here since RLS already limits reads to authenticated members/admins.
 */
export async function getInstrumentByCode(code: string): Promise<Instrument | null> {
  if (!INSTRUMENT_CODE_PATTERN.test(code)) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("instruments")
    .select(INSTRUMENT_COLUMNS)
    .eq("instrument_code", code)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load this instrument.");
  }

  return (data as Instrument | null) ?? null;
}

/**
 * Public, anonymous-safe lookup by instrument_code — backs the QR route
 * (/i/[instrument_code]). Unlike getInstrumentById, this never touches the
 * `instruments` table directly: it calls the `get_public_instrument_by_code`
 * SECURITY DEFINER RPC, which is the only thing granted EXECUTE to the
 * `anon` role and which returns just the identification columns (no id,
 * no notes, no purchase info, no archived rows — see the Module 9 SQL
 * migration). Existing RLS on `instruments` is untouched.
 *
 * The regex check here is a cheap short-circuit, not the real guard — the
 * RPC re-validates the same pattern server-side regardless of what this
 * function is given.
 */
export async function getPublicInstrumentByCode(
  code: string,
): Promise<PublicInstrument | null> {
  if (!INSTRUMENT_CODE_PATTERN.test(code)) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_instrument_by_code", {
    p_code: code,
  });

  if (error) {
    throw new Error("Could not load this instrument.");
  }

  const row = (data as PublicInstrument[] | null)?.[0];
  return row ?? null;
}

// An admin printing bulk QR labels can only ever have this many rows
// selected at once (mirrors the admin instrument list's page size), so
// this also acts as a hard cap on how many QR codes get generated
// server-side in a single request.
const MAX_BULK_QR_IDS = 20;

/**
 * Fetches instruments by id for the bulk QR label page. Callers MUST have
 * already verified the caller is an admin (see requireAdmin() in the page)
 * — this function does not check that itself, matching the pattern used by
 * getInstrumentByIdForAdmin. Ids that don't correspond to a real row are
 * silently dropped rather than erroring, so a stale or hand-edited "ids"
 * query string just yields fewer labels instead of a failure. Includes
 * archived instruments (an admin relabeling a reactivated instrument is a
 * legitimate use case), but the resulting label's QR will show a
 * "not found" page to the public while the instrument stays archived.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getInstrumentsByIds(ids: string[]): Promise<Instrument[]> {
  // Filter out anything that isn't even UUID-shaped *before* querying — a
  // single malformed id in the array would otherwise make Postgres reject
  // the whole `IN (...)` list (22P02) and silently return zero rows for
  // every id, not just the bad one.
  const uniqueIds = Array.from(new Set(ids))
    .filter((id) => UUID_PATTERN.test(id))
    .slice(0, MAX_BULK_QR_IDS);
  if (uniqueIds.length === 0) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("instruments")
    .select(INSTRUMENT_COLUMNS)
    .in("id", uniqueIds);

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) {
      return [];
    }
    throw new Error("Could not load the selected instruments.");
  }

  return (data as Instrument[] | null) ?? [];
}

export interface AdminInstrumentsQuery {
  search?: string;
  status?: InstrumentStatus | "all";
  category?: string | "all";
  condition?: InstrumentCondition | "all";
  archiveState?: InstrumentArchiveState;
  sort?: InstrumentSort;
  page?: number;
  pageSize?: number;
}

export interface AdminInstrumentsResult {
  instruments: Instrument[];
  totalCount: number;
}

/**
 * Admin instrument list: search + filter + sort + pagination, all done
 * server-side in a single query. Unlike the member-facing list, archived
 * instruments are included by default (archiveState "all") so admins can
 * see and manage them — narrow to "active" or "archived" via the filter.
 */
export async function getAdminInstruments(
  query: AdminInstrumentsQuery,
): Promise<AdminInstrumentsResult> {
  const {
    search = "",
    status = "all",
    category = "all",
    condition = "all",
    archiveState = "all",
    sort = "newest",
    page = 1,
    pageSize = 20,
  } = query;

  const supabase = await createClient();

  let queryBuilder = supabase
    .from("instruments")
    .select(INSTRUMENT_COLUMNS, { count: "exact" });

  if (archiveState === "active") {
    queryBuilder = queryBuilder.is("archived_at", null);
  } else if (archiveState === "archived") {
    queryBuilder = queryBuilder.not("archived_at", "is", null);
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    // `.or()` uses commas to separate conditions and `%` as the ILIKE
    // wildcard — strip both so a search string can't inject extra clauses.
    const safeSearch = trimmedSearch.replace(/[%,]/g, "");
    queryBuilder = queryBuilder.or(
      `instrument_code.ilike.%${safeSearch}%,name.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%`,
    );
  }

  if (status !== "all") {
    queryBuilder = queryBuilder.eq("status", status);
  }
  if (condition !== "all") {
    queryBuilder = queryBuilder.eq("condition", condition);
  }
  if (category !== "all") {
    queryBuilder = queryBuilder.eq("category", category);
  }

  if (sort === "oldest") {
    queryBuilder = queryBuilder.order("created_at", { ascending: true });
  } else if (sort === "name-asc") {
    queryBuilder = queryBuilder.order("name", { ascending: true });
  } else if (sort === "name-desc") {
    queryBuilder = queryBuilder.order("name", { ascending: false });
  } else {
    queryBuilder = queryBuilder.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await queryBuilder.range(from, to);

  if (error) {
    throw new Error("Could not load instruments.");
  }

  return {
    instruments: (data as Instrument[] | null) ?? [],
    totalCount: count ?? 0,
  };
}

/**
 * Distinct categories across all instruments (active and archived), for
 * the filter dropdown — archived rows can still be filtered by category.
 */
export async function getInstrumentCategories(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("instruments").select("category");

  if (error) {
    throw new Error("Could not load categories.");
  }

  const unique = new Set((data ?? []).map((row) => row.category as string));
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

/** Counts for the admin dashboard stat cards. */
export async function getInstrumentStats(): Promise<InstrumentStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("instruments")
    .select("status")
    .is("archived_at", null);

  if (error) {
    throw new Error("Could not load instrument statistics.");
  }

  const rows = data ?? [];
  const countOf = (status: InstrumentStatus) =>
    rows.filter((row) => row.status === status).length;

  return {
    total: rows.length,
    available: countOf("available"),
    borrowed: countOf("borrowed"),
    damaged: countOf("damaged"),
    maintenance: countOf("maintenance"),
  };
}
