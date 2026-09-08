"use server";

import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export interface ForgotPasswordState {
  status: "idle" | "error" | "success";
  message: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returned on every well-formed submission, whether or not an account
// actually exists for the email — never let the response confirm or deny
// account existence (email enumeration protection).
const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for that email, we've sent a password reset link. Please check your inbox.";

/**
 * Requests a Supabase password-recovery email. The redirect target
 * (`/auth/callback`) exchanges the recovery code for a session and then
 * forwards to `/reset-password` — see app/auth/callback/route.ts.
 *
 * Deliberately returns the same generic success message for every
 * validly-formatted email, regardless of the Supabase result, so the
 * response can never be used to enumerate registered accounts.
 */
export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !EMAIL_PATTERN.test(email)) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
    };
  }

  const supabase = await createClient();

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
    });
  } catch {
    // Intentionally swallowed — see GENERIC_SUCCESS_MESSAGE above. Any
    // Supabase-side failure (unknown email, rate limiting, transient SMTP
    // issues) must not change what the visitor sees.
  }

  return {
    status: "success",
    message: GENERIC_SUCCESS_MESSAGE,
  };
}
