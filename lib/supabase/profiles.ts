import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/profile";

export interface Member {
  id: string;
  full_name: string | null;
  role: UserRole;
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
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Could not load members.");
  }

  return data ?? [];
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
