"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { submitBorrowRequestRpc } from "@/lib/supabase/borrow-requests";

export interface BorrowRequestFormState {
  status: "idle" | "error" | "success";
  message: string | null;
}

/**
 * Friendlier text for the specific RAISE EXCEPTION messages the
 * submit_borrow_request RPC can return, falling back to the raw message
 * for anything unexpected so nothing is silently swallowed.
 */
function describeRpcError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("not available")) {
    return "This instrument is no longer available to borrow.";
  }
  if (lower.includes("club member") || lower.includes("not a member")) {
    return "You must be a signed-in club member to request an instrument.";
  }
  if (lower.includes("date")) {
    return "Please check your borrow and return dates and try again.";
  }
  return message;
}

export async function submitBorrowRequest(
  instrumentId: string,
  _prevState: BorrowRequestFormState,
  formData: FormData,
): Promise<BorrowRequestFormState> {
  const { user } = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must be signed in to request an instrument." };
  }

  const purpose = String(formData.get("purpose") ?? "").trim();
  const requestedBorrowDate = String(formData.get("requestedBorrowDate") ?? "").trim();
  const requestedReturnDate = String(formData.get("requestedReturnDate") ?? "").trim();

  if (!purpose) {
    return { status: "error", message: "Please tell us what you'll use the instrument for." };
  }
  if (!requestedBorrowDate || !requestedReturnDate) {
    return { status: "error", message: "Please choose both a borrow date and a return date." };
  }
  if (requestedReturnDate < requestedBorrowDate) {
    return { status: "error", message: "Return date can't be before the borrow date." };
  }

  const result = await submitBorrowRequestRpc({
    instrumentId,
    purpose,
    requestedBorrowDate,
    requestedReturnDate,
  });

  if (!result.ok) {
    return { status: "error", message: describeRpcError(result.error ?? "") };
  }

  revalidatePath(`/instruments/${instrumentId}`);
  revalidatePath("/instruments");
  revalidatePath("/my-requests");

  return { status: "success", message: "Request submitted. An admin will review it shortly." };
}
