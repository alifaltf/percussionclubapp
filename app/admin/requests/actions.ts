"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/current-user";
import {
  approveBorrowRequestRpc,
  completeReturnRpc,
  rejectBorrowRequestRpc,
} from "@/lib/supabase/borrow-requests";
import { INSTRUMENT_CONDITIONS, INSTRUMENT_STATUSES } from "@/types/instrument";
import type { InstrumentCondition, InstrumentStatus } from "@/types/instrument";

export interface BorrowRequestActionResult {
  status: "idle" | "success" | "error";
  message: string;
}

async function assertAdmin(): Promise<void> {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== "admin") {
    throw new Error("not-admin");
  }
}

function revalidateRequest(requestId: string) {
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/instruments");
  revalidatePath("/instruments");
  revalidatePath("/my-requests");
  revalidatePath("/my-borrowings");
}

export async function approveRequest(
  requestId: string,
  adminNote?: string,
): Promise<BorrowRequestActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const result = await approveBorrowRequestRpc(requestId, adminNote);
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Could not approve this request." };
  }

  revalidateRequest(requestId);
  return { status: "success", message: "Request approved. The instrument is now borrowed." };
}

export async function rejectRequest(
  requestId: string,
  adminNote?: string,
): Promise<BorrowRequestActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const result = await rejectBorrowRequestRpc(requestId, adminNote);
  if (!result.ok) {
    return { status: "error", message: result.error ?? "Could not reject this request." };
  }

  revalidateRequest(requestId);
  return { status: "success", message: "Request rejected." };
}

export async function completeReturnAction(
  requestId: string,
  _prevState: BorrowRequestActionResult,
  formData: FormData,
): Promise<BorrowRequestActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const conditionAfter = String(formData.get("conditionAfter") ?? "");
  const finalInstrumentStatus = String(formData.get("finalInstrumentStatus") ?? "");
  const verificationNote = String(formData.get("verificationNote") ?? "").trim();
  const damageReported = formData.get("damageReported") === "on";
  const damageNotes = String(formData.get("damageNotes") ?? "").trim();

  if (!INSTRUMENT_CONDITIONS.includes(conditionAfter as InstrumentCondition)) {
    return { status: "error", message: "Please choose a valid condition." };
  }
  if (!INSTRUMENT_STATUSES.includes(finalInstrumentStatus as InstrumentStatus)) {
    return { status: "error", message: "Please choose a valid instrument status." };
  }
  if (damageReported && !damageNotes) {
    return { status: "error", message: "Please describe the damage." };
  }

  const result = await completeReturnRpc({
    requestId,
    verificationNote: verificationNote || undefined,
    conditionAfter: conditionAfter as InstrumentCondition,
    finalInstrumentStatus: finalInstrumentStatus as InstrumentStatus,
    damageReported,
    damageNotes: damageNotes || undefined,
  });

  if (!result.ok) {
    return { status: "error", message: result.error ?? "Could not complete this return." };
  }

  revalidateRequest(requestId);
  return { status: "success", message: "Return verified and instrument updated." };
}
