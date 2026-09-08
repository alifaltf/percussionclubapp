"use server";

import { createClient } from "@/lib/supabase/server";

export interface ResetPasswordState {
  status: "idle" | "error" | "success";
  message: string | null;
}

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

/**
 * Updates the password for the currently authenticated session. Relies
 * entirely on the session already established before this form was ever
 * reachable — see the server-side `getUser()` gate in
 * app/reset-password/page.tsx, which redirects away before this action can
 * be invoked without a valid session (recovery or otherwise).
 */
export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    return {
      status: "error",
      message: "Please fill in both password fields.",
    };
  }

  if (password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
    return {
      status: "error",
      message: `Password must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`,
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "Passwords do not match.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      status: "error",
      message: "Could not update your password. Please try again.",
    };
  }

  return {
    status: "success",
    message: "Your password has been updated.",
  };
}
