"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import type { UserRole } from "@/types/profile";

export interface MemberActionResult {
  status: "success" | "error";
  message: string;
}

const VALID_ROLES: UserRole[] = ["member", "admin"];

/**
 * Promotes or demotes a member's role.
 *
 * The normal RLS-scoped client can only UPDATE its own profiles row (the
 * only UPDATE policy on profiles is "own row" — confirmed live, no
 * admin-scoped UPDATE policy exists), so the actual write is delegated to
 * the `update_member_role` SECURITY DEFINER RPC. That RPC independently
 * re-checks is_admin() and blocks self-changes itself — the checks in this
 * function are a fast-fail UX layer (clearer error messages, no round trip
 * for a no-op), not the real authorization backstop. The existing
 * trg_prevent_profile_protected_field_changes trigger and the profiles RLS
 * policies are untouched by this feature.
 */
export async function updateMemberRole(
  memberId: string,
  newRole: UserRole,
): Promise<MemberActionResult> {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== "admin") {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  if (!memberId || typeof memberId !== "string") {
    return { status: "error", message: "Invalid member." };
  }

  if (!VALID_ROLES.includes(newRole)) {
    return { status: "error", message: "Invalid role." };
  }

  if (memberId === user.id) {
    return { status: "error", message: "You can't change your own role." };
  }

  const supabase = await createClient();

  const { data: target, error: fetchError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", memberId)
    .maybeSingle();

  if (fetchError) {
    return { status: "error", message: "Could not look up this member. Please try again." };
  }
  if (!target) {
    return { status: "error", message: "Member not found." };
  }

  if (target.role === newRole) {
    return {
      status: "success",
      message: newRole === "admin" ? "Already an admin." : "Already a member.",
    };
  }

  const { error: rpcError } = await supabase.rpc("update_member_role", {
    target_id: memberId,
    new_role: newRole,
  });

  if (rpcError) {
    return {
      status: "error",
      message: rpcError.message || "Could not update role. Please try again.",
    };
  }

  revalidatePath("/admin/members");

  return {
    status: "success",
    message: newRole === "admin" ? "Member promoted to admin." : "Admin demoted to member.",
  };
}
