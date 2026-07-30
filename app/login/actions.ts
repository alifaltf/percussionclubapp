"use server";

import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  status: "idle" | "error" | "success";
  message: string | null;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      status: "error",
      message: "Please enter your email and password.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: "Invalid email or password. Please try again.",
    };
  }

  return {
    status: "success",
    message: "Signed in successfully. Redirecting...",
  };
}
