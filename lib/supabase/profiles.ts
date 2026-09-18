import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/profile";

// Postgres error code for a malformed literal passed to a typed column
// (e.g. an id in the URL that isn't a valid UUID) — mirrors the pattern
// already used in lib/supabase/instruments.ts and lib/supabase/borrow-requests.ts.
const INVALID_TEXT_REPRESENTATION = "22P02";

export interface Member {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

/**
 * Full member list for the admin Members page. Relies entirely on the
 * existing "Admins can view all profiles" RLS SELECT policy (USING
 * is_admin()) on public.profiles — no service-role key involved. If this
 * is ever called by a non-admin, RLS silently scopes the result to just
 * their own row rather than erroring, same as every other admin query in
 * this app.
 */
export async function getAllMembers(): Promise<Member[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, phone, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Could not load members.");
  }

  return data ?? [];
}

export interface MemberProfile {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

/**
 * A single member's profile for the admin member detail page
 * (/admin/members/[id]). Admin-only — relies on the same "Admins can view
 * all profiles" RLS SELECT policy as getAllMembers above; this must never
 * be imported from member-facing code, since it can return any member's
 * row, not just the caller's own. `profiles` has no email column (email
 * lives only in auth.users), so it is deliberately not selected here —
 * this app does not introduce a service-role auth.users lookup just to
 * surface email in the admin UI. Returns null both when the row genuinely
 * doesn't exist and when `id` isn't a valid UUID at all, matching
 * getInstrumentById's convention.
 */
export async function getMemberById(id: string): Promise<MemberProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, phone, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === INVALID_TEXT_REPRESENTATION) {
      return null;
    }
    throw new Error("Could not load this member.");
  }

  return (data as MemberProfile | null) ?? null;
}

/**
 * Total member count for the admin dashboard's "Total Members" card. A
 * head-only count query (same pattern as getGalleryAnalytics' image count)
 * so the dashboard doesn't have to pull every profile row just to count
 * them.
 */
export async function getMemberCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error("Could not load member count.");
  }

  return count ?? 0;
}
