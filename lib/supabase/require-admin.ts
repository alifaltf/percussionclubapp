import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";

/**
 * Guards admin-only Server Components. Redirects guests to /login and
 * signed-in non-admins to /dashboard, mirroring the page-level auth checks
 * already used by /dashboard, /profile and /instruments.
 */
export async function requireAdmin() {
  const { user, profile } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return { user, profile };
}
