"use server";

import { createClient } from "@/lib/supabase/server";

export interface ContactState {
  status: "idle" | "error" | "success";
  message: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}): string | null {
  if (!values.fullName || values.fullName.length < 2 || values.fullName.length > 100) {
    return "Please enter a valid name (2-100 characters).";
  }
  if (
    !values.email ||
    values.email.length > 254 ||
    !EMAIL_PATTERN.test(values.email)
  ) {
    return "Please enter a valid email address.";
  }
  if (values.subject.length > 150) {
    return "Subject must be 150 characters or fewer.";
  }
  if (!values.message || values.message.length < 10 || values.message.length > 5000) {
    return "Message must be between 10 and 5000 characters.";
  }
  return null;
}

/**
 * Submits the public contact form. Server-side validation is authoritative —
 * the client-side checks in ContactForm.tsx are only a first-pass UX layer.
 *
 * Abuse protection is intentionally lightweight (no external service):
 * - a hidden honeypot field ("company") silently no-ops for simple bots
 * - a short time-window check on email blocks rapid repeat submissions
 *
 * The rate-limit check and the insert both happen inside the
 * submit_contact_message() SECURITY DEFINER RPC rather than here. contact_messages
 * intentionally has no SELECT policy for anon/authenticated (only admins can
 * read submissions), so a plain client-side "check then insert" from this
 * Server Action would never see any existing rows and the rate limit would
 * silently never trigger. The RPC runs with elevated privilege to do both
 * the recency check and the insert atomically (also closing a race where two
 * near-simultaneous submissions could both pass a separate check-then-insert).
 *
 * Supabase/Postgres errors are never surfaced to the client — only a
 * generic message is returned so internal details never leak.
 */
export async function submitContactMessage(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot: real users never fill this in (it's hidden via CSS). If it
  // has a value, silently pretend success rather than tipping off the bot.
  const honeypot = String(formData.get("company") ?? "").trim();
  if (honeypot) {
    return {
      status: "success",
      message: "Thank you for reaching out — we'll get back to you soon.",
    };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const validationError = validate({ fullName, email, subject, message });
  if (validationError) {
    return { status: "error", message: validationError };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_contact_message", {
    p_full_name: fullName,
    p_email: email,
    p_subject: subject || null,
    p_message: message,
  });

  if (error) {
    if (error.message?.includes("rate_limited")) {
      return {
        status: "error",
        message: "Please wait a moment before sending another message.",
      };
    }
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }

  return {
    status: "success",
    message: "Thank you for reaching out — we'll get back to you soon.",
  };
}
