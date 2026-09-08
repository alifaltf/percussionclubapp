import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the redirect Supabase sends after a visitor clicks a
 * password-recovery link (from `resetPasswordForEmail`'s `redirectTo`).
 * Exchanges the one-time `code` for a real session, then forwards to the
 * reset-password page.
 *
 * SECURITY: this only ever redirects to the fixed, hardcoded internal path
 * `/reset-password`. The `?next=` query param on the incoming link exists
 * purely for readability/documentation of intent — it is never read here,
 * so an attacker can't repurpose this endpoint as an open redirect by
 * crafting a link with a different `next` value.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password`);
    }
  }

  // Missing or invalid/expired code: send the visitor back to request a
  // fresh link, with a generic (non-revealing) error flag the page can
  // render a friendly message for.
  return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`);
}
