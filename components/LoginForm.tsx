"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { login, type LoginState } from "@/app/login/actions";

const INITIAL_STATE: LoginState = { status: "idle", message: null };

const FIELD_STYLES =
  "w-full rounded-sm border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#111111] transition-colors duration-300 placeholder:text-[#666666] focus:outline-none focus:border-[#C8A928] focus:ring-1 focus:ring-[#C8A928]";

export default function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);

  const isBusy = isPending || state.status === "success";

  useEffect(() => {
    if (state.status === "success") {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state.status, router]);

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

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-[#111111]"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${FIELD_STYLES} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-[#666666]">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded-sm border-[#E8E8E8] text-[#C8A928] focus:ring-[#C8A928]"
          />
          Remember me
        </label>

        <Link
          href="#"
          className="text-sm text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
        >
          Forgot password?
        </Link>
      </div>

      <div aria-live="polite">
        {state.status === "error" && state.message && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
        {state.status === "success" && state.message && (
          <p className="text-sm text-[#9E8217]">{state.message}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isBusy}
        className="w-full"
      >
        {isBusy ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
