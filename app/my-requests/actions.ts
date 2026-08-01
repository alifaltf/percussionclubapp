"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { cancelBorrowRequestRpc } from "@/lib/supabase/borrow-requests";

export interface BorrowActionResult {
  status: "success" | "error";
  message: string;
}

export async function cancelMyRequest(requestId: string): Promise<BorrowActionResult> {
  const { user } = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must be signed in to do that." };
  }

  const result = await cancelBorrowRequestRpc(requestId);
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Could not cancel this request." };
  }

  revalidatePath("/my-requests");
  revalidatePath("/instruments");

  return { status: "success", message: "Request cancelled." };
}
