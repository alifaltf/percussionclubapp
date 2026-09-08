import { createClient } from "@/lib/supabase/server";
import type { ContactMessage } from "@/types/contact";

/**
 * All contact form submissions, newest first. Relies entirely on the
 * "Admins can view contact messages" RLS SELECT policy (USING is_admin())
 * on public.contact_messages — no service-role key involved. There is no
 * admin inbox page yet; this exists so submissions can be retrieved (e.g.
 * from a future page, or ad hoc) now that the form actually persists data.
 */
export async function getContactMessages(): Promise<ContactMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, full_name, email, subject, message, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Could not load contact messages.");
  }

  return data ?? [];
}
