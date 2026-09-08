"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/app/forgot-password/actions";

const INITIAL_STATE: ForgotPasswordState = { status: "idle", message: null };

const FIELD_STYLES =
  "w-full rounded-sm border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#111111] transition-colors duration-300 placeholder:text-[#666666] focus:outline-none focus:border-[#C8A928] focus:ring-1 focus:ring-[#C8A928]";

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    INITIAL_STATE,
  );

  if (state.status === "success") {
    return (
      <div className="rounded-sm border border-[#E8E8E8] bg-[#F8F8F6] px-5 py-6 text-center">
        <p className="text-sm leading-relaxed text-[#111111]">{state.message}</p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-[#111111]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={FIELD_STYLES}
        />
      </div>

      <div aria-live="polite">
        {state.status === "error" && state.message && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isPending}
        className="w-full"
      >
        {isPending ? "Sending..." : "Send Reset Link"}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
        >
          ← Back to login
        </Link>
      </div>
    </form>
  );
}
