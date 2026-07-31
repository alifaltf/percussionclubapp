import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/profile";

interface CurrentUser {
  user: User | null;
  profile: Profile | null;
}

/**
 * Fetches the authenticated user plus their `profiles` row.
 *
 * Wrapped in React's `cache()` so that multiple calls within the same
 * request (e.g. from the root layout's Navbar and a page component) only
 * hit Supabase once instead of once per caller.
 *
 * Role is always read from the `profiles` table, never from auth metadata.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, phone")
    .eq("id", user.id)
    .single();

  return { user, profile: (profile as Profile | null) ?? null };
});
