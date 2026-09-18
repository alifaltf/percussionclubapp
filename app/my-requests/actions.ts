"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { cancelBorrowRequestRpc, getMyBorrowingById } from "@/lib/supabase/borrow-requests";

export interface BorrowActionResult {
  status: "success" | "error";
  message: string;
}

export async function cancelMyRequest(requestId: string): Promise<BorrowActionResult> {
  const { user } = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must be signed in to do that." };
  }

  // Defense-in-depth: confirm the request exists, belongs to the signed-in
  // member, and is still pending before calling the RPC. getMyBorrowingById
  // already scopes its query to member_id = user.id, so a non-null result
  // is itself the ownership check. cancel_borrow_request remains the final
  // authority for concurrent changes (e.g. an admin approving it in the
  // same moment) — this only rejects an obviously invalid request earlier
  // with a clearer message; a race is still caught by the RPC below.
  const request = await getMyBorrowingById(requestId);
  if (!request) {
    return { status: "error", message: "Request not found." };
  }
  if (request.status !== "pending") {
    return { status: "error", message: "Only a pending request can be cancelled." };
  }

  const result = await cancelBorrowRequestRpc(requestId);
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Could not cancel this request." };
  }

  revalidatePath("/my-requests");
  revalidatePath("/instruments");

  return { status: "success", message: "Request cancelled." };
}
