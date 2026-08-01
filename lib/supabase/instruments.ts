import { createClient } from "@/lib/supabase/server";
import type {
  Instrument,
  InstrumentArchiveState,
  InstrumentCondition,
  InstrumentSort,
  InstrumentStats,
  InstrumentStatus,
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
