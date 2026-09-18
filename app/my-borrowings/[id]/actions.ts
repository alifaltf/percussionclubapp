"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/current-user";
import {
  getMyBorrowingById,
  reportDamageRpc,
  submitReturnRpc,
} from "@/lib/supabase/borrow-requests";

export interface BorrowingFormState {
  status: "idle" | "error" | "success";
  message: string | null;
}

export async function submitReturn(
  requestId: string,
  _prevState: BorrowingFormState,
  formData: FormData,
): Promise<BorrowingFormState> {
  const { user } = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must be signed in to do that." };
  }

  // Defense-in-depth: confirm ownership (getMyBorrowingById scopes its
  // query to member_id = user.id, so a non-null result is itself the
  // ownership check) and that the borrowing is in a state a return can
  // actually be submitted for. submit_return remains the final authority
  // for concurrent changes — this only rejects an obviously invalid
  // request earlier with a clearer message.
  const request = await getMyBorrowingById(requestId);
  if (!request) {
    return { status: "error", message: "Borrowing not found." };
  }
  if (request.status !== "active" && request.status !== "overdue") {
    return { status: "error", message: "A return can only be submitted for an active borrowing." };
  }

  const returnPhotoPath = String(formData.get("returnPhotoPath") ?? "").trim();
  const returnNotes = String(formData.get("returnNotes") ?? "").trim();

  if (!returnPhotoPath) {
    return { status: "error", message: "Please upload a photo of the returned instrument." };
  }

  // uploadReturnPhoto (lib/supabase/storage.ts) always writes under
  // `${requestId}/...` in the private return-photos bucket. Reject
  // anything outside that namespace so a crafted request can't attach an
  // unrelated object as this request's return photo.
  if (!returnPhotoPath.startsWith(`${requestId}/`)) {
    return { status: "error", message: "Invalid return photo." };
  }

  const result = await submitReturnRpc({
    requestId,
    returnPhotoUrl: returnPhotoPath,
    returnNotes: returnNotes || undefined,
  });

  if (!result.ok) {
    return { status: "error", message: result.error ?? "Could not submit the return." };
  }

  revalidatePath(`/my-borrowings/${requestId}`);
  revalidatePath("/my-borrowings");
  revalidatePath("/admin/requests");

  return {
    status: "success",
    message: "Return submitted. An admin will verify it and update the instrument shortly.",
  };
}

export async function reportDamage(
  requestId: string,
  _prevState: BorrowingFormState,
  formData: FormData,
): Promise<BorrowingFormState> {
  const { user } = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must be signed in to do that." };
  }

  // Defense-in-depth: same ownership + state checks as submitReturn above.
  // report_damage remains the final authority for concurrent changes.
  const request = await getMyBorrowingById(requestId);
  if (!request) {
    return { status: "error", message: "Borrowing not found." };
  }
  if (request.status !== "active" && request.status !== "overdue") {
    return { status: "error", message: "Damage can only be reported for an active borrowing." };
  }

  const damageNotes = String(formData.get("damageNotes") ?? "").trim();
  if (!damageNotes) {
    return { status: "error", message: "Please describe the damage." };
  }

  const result = await reportDamageRpc({ requestId, damageNotes });
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Could not report damage." };
  }

  revalidatePath(`/my-borrowings/${requestId}`);
  revalidatePath("/admin/requests");

  return { status: "success", message: "Damage reported. An admin has been notified." };
}
