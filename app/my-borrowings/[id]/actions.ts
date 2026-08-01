"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { reportDamageRpc, submitReturnRpc } from "@/lib/supabase/borrow-requests";

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

  const returnPhotoPath = String(formData.get("returnPhotoPath") ?? "").trim();
  const returnNotes = String(formData.get("returnNotes") ?? "").trim();

  if (!returnPhotoPath) {
    return { status: "error", message: "Please upload a photo of the returned instrument." };
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
