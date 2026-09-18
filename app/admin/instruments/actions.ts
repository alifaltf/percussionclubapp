"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getStoragePathFromPublicUrl } from "@/lib/supabase/storage";
import {
  instrumentHasActiveBorrowing,
  instrumentHasOpenBorrowRequest,
} from "@/lib/supabase/borrow-requests";
import {
  INSTRUMENT_CODE_PATTERN,
  INSTRUMENT_CONDITIONS,
  MANUALLY_ASSIGNABLE_INSTRUMENT_STATUSES,
  type InstrumentCondition,
  type InstrumentStatus,
} from "@/types/instrument";

export interface InstrumentFormState {
  status: "idle" | "error" | "success";
  message: string | null;
}

export interface InstrumentActionResult {
  status: "success" | "error";
  message: string;
}

const UNIQUE_VIOLATION = "23505";
const INSTRUMENT_IMAGES_BUCKET = "instrument-images";

async function assertAdmin(): Promise<void> {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== "admin") {
    throw new Error("not-admin");
  }
}

function readInstrumentFields(formData: FormData) {
  const instrumentCode = String(formData.get("instrumentCode") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "available");
  const condition = String(formData.get("condition") ?? "good");
  const purchaseDate = String(formData.get("purchaseDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const imageUrlRaw = formData.get("imageUrl");

  return {
    instrumentCode,
    name,
    category,
    description: description || null,
    status,
    condition,
    purchaseDate: purchaseDate || null,
    notes: notes || null,
    imageUrl:
      typeof imageUrlRaw === "string" && imageUrlRaw ? imageUrlRaw : undefined,
  };
}

function validateFields(fields: ReturnType<typeof readInstrumentFields>): string | null {
  if (!fields.instrumentCode || !INSTRUMENT_CODE_PATTERN.test(fields.instrumentCode)) {
    return "Instrument code must use lowercase letters, numbers and underscores (e.g. conga_1).";
  }
  if (!fields.name) {
    return "Name is required.";
  }
  if (!fields.category) {
    return "Category is required.";
  }
  if (!INSTRUMENT_CONDITIONS.includes(fields.condition as InstrumentCondition)) {
    return "Please choose a valid condition.";
  }
  return null;
}

/**
 * Whether a submitted status is one createInstrument/updateInstrument may
 * actually write. This is deliberately stricter than "is it a member of
 * InstrumentStatus" — it's the server-side half of keeping "borrowed" and
 * "pending" out of normal instrument lifecycle management, independent of
 * whatever InstrumentForm does or doesn't offer in its dropdown:
 *
 * - Any of the normal MANUALLY_ASSIGNABLE_INSTRUMENT_STATUSES is always
 *   fine.
 * - "pending" is tolerated ONLY when the row's current DB status is already
 *   "pending" — that's a legacy value with no workflow behind it, and an
 *   admin editing such a row without touching Status must not have it
 *   silently rewritten just because the form loaded (see InstrumentForm's
 *   "(legacy)" option). It's still never a value that can be newly assigned
 *   to a row that isn't already pending.
 * - "borrowed" is never a valid target here at all — it's exclusively
 *   owned by the borrowing workflow's approve/return RPCs. (updateInstrument
 *   handles an already-borrowed instrument separately, by preserving its
 *   current status outright rather than calling this — see hasOpenBorrowing
 *   there.)
 *
 * currentStatus is null for createInstrument, where there is no existing
 * row and therefore no legacy-pending exception.
 */
function isAssignableInstrumentStatus(
  status: string,
  currentStatus: InstrumentStatus | null,
): boolean {
  if (MANUALLY_ASSIGNABLE_INSTRUMENT_STATUSES.includes(status as InstrumentStatus)) {
    return true;
  }
  return status === "pending" && currentStatus === "pending";
}

export async function createInstrument(
  _prevState: InstrumentFormState,
  formData: FormData,
): Promise<InstrumentFormState> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const fields = readInstrumentFields(formData);
  const validationError = validateFields(fields);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  // A brand-new instrument has no existing row, so there's no legacy-pending
  // exception here — only the normal manually assignable statuses are ever
  // valid on create. This rejects a hand-crafted request that bypasses
  // InstrumentForm's dropdown and tries to submit "borrowed" or "pending"
  // directly, with the same validation-error structure as any other bad
  // field, rather than silently creating the instrument with some other
  // status instead.
  if (!isAssignableInstrumentStatus(fields.status, null)) {
    return { status: "error", message: "Please choose a valid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("instruments").insert({
    instrument_code: fields.instrumentCode,
    name: fields.name,
    category: fields.category,
    description: fields.description,
    status: fields.status,
    condition: fields.condition,
    purchase_date: fields.purchaseDate,
    notes: fields.notes,
    image_url: fields.imageUrl ?? null,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { status: "error", message: "This instrument code is already in use." };
    }
    return { status: "error", message: "Could not create the instrument. Please try again." };
  }

  revalidatePath("/admin/instruments");
  revalidatePath("/instruments");
  redirect("/admin/instruments");
}

export async function updateInstrument(
  id: string,
  _prevState: InstrumentFormState,
  formData: FormData,
): Promise<InstrumentFormState> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const fields = readInstrumentFields(formData);
  const validationError = validateFields(fields);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  const currentImageUrl = String(formData.get("currentImageUrl") ?? "");

  const supabase = await createClient();

  // Load the instrument's current status straight from the database (never
  // trust the client for this) so we can tell whether it's in an open
  // borrowing lifecycle state before applying any submitted status change.
  const { data: currentInstrument, error: currentInstrumentError } = await supabase
    .from("instruments")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (currentInstrumentError || !currentInstrument) {
    return { status: "error", message: "Could not load this instrument. Please try again." };
  }

  const currentStatus = currentInstrument.status as InstrumentStatus;

  // An instrument is in an open borrowing lifecycle state when its own raw
  // status is "borrowed", or it has an active/return_submitted/overdue
  // borrow request — checking both guards against a contradiction between
  // the two ever slipping through (e.g. a legacy row where one says
  // "borrowed" and the other doesn't agree). While that's true, the
  // borrowing workflow — not a normal instrument edit — owns this
  // instrument's lifecycle status. This is enforced here, server-side, so
  // it holds even against a hand-crafted request that bypasses the
  // disabled/hidden UI control in InstrumentForm; the UI gating is a
  // courtesy, not the actual guarantee.
  const hasOpenBorrowing =
    currentStatus === "borrowed" || (await instrumentHasActiveBorrowing(id));

  // Two distinct rules, in priority order:
  //  1. While an open borrowing exists (raw status "borrowed", including an
  //     inconsistent legacy row with no matching request — or a live
  //     active/return_submitted/overdue request), the borrowing workflow
  //     owns this instrument's status. Whatever was submitted is ignored
  //     and the server-verified current status is kept, silently — this is
  //     the existing protection, and it's deliberately NOT a validation
  //     error, so unrelated metadata (name/description/notes/image/etc.)
  //     still saves normally. Fixing an inconsistent legacy "borrowed" row
  //     is a separate, explicit repair action (repairFalseBorrowedStatus),
  //     not something a normal edit can do.
  //  2. Otherwise, the submitted status must be one of the normal manually
  //     assignable statuses (or, for a legacy-pending row, "pending" left
  //     unchanged) — a hand-crafted request trying to move a normal
  //     instrument INTO "borrowed" or "pending" is rejected outright, the
  //     same way any other invalid field would be, rather than silently
  //     ignored or coerced to something else.
  let nextStatus: InstrumentStatus;
  if (hasOpenBorrowing) {
    nextStatus = currentStatus;
  } else {
    if (!isAssignableInstrumentStatus(fields.status, currentStatus)) {
      return { status: "error", message: "Please choose a valid status." };
    }
    nextStatus = fields.status as InstrumentStatus;
  }

  const updatePayload: Record<string, unknown> = {
    instrument_code: fields.instrumentCode,
    name: fields.name,
    category: fields.category,
    description: fields.description,
    status: nextStatus,
    condition: fields.condition,
    purchase_date: fields.purchaseDate,
    notes: fields.notes,
    updated_at: new Date().toISOString(),
  };

  if (fields.imageUrl) {
    updatePayload.image_url = fields.imageUrl;
  }

  const { error } = await supabase
    .from("instruments")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { status: "error", message: "This instrument code is already in use." };
    }
    return { status: "error", message: "Could not save changes. Please try again." };
  }

  // Only remove the old image once the new one is safely saved on the row,
  // so a failed update never leaves an instrument with no image at all.
  if (fields.imageUrl && currentImageUrl && currentImageUrl !== fields.imageUrl) {
    const oldPath = getStoragePathFromPublicUrl(currentImageUrl, INSTRUMENT_IMAGES_BUCKET);
    if (oldPath) {
      await supabase.storage.from(INSTRUMENT_IMAGES_BUCKET).remove([oldPath]);
    }
  }

  revalidatePath("/admin/instruments");
  revalidatePath(`/admin/instruments/${id}/edit`);
  revalidatePath("/instruments");
  revalidatePath(`/instruments/${id}`);
  redirect("/admin/instruments");
}

/**
 * Admin-only repair for a data-inconsistent instrument: raw status is
 * "borrowed" but there is no matching active/return_submitted/overdue
 * borrow request behind it (see Instrument Management verification report,
 * case F). Normal instrument editing deliberately can't touch this — see
 * hasOpenBorrowing in updateInstrument, which locks status untouched
 * whenever it's "borrowed" regardless of whether a real borrowing exists.
 * This is the one explicit, narrow path back to "available" for that
 * specific inconsistency; it never touches borrow_requests (no borrowing
 * history is modified) and never calls a borrowing RPC, since there's no
 * real borrowing here to complete or cancel — just a stray status value.
 *
 * Every check is re-verified from the database immediately before writing
 * (never trusting whatever the detail page had loaded when the admin
 * clicked the button), and the write itself is conditioned on status still
 * being "borrowed" at the moment of the UPDATE, so a request approved in
 * the gap between the check and the write can't be silently clobbered —
 * the update affects zero rows in that case and is reported as a failure
 * rather than a false success.
 */
export async function repairFalseBorrowedStatus(id: string): Promise<InstrumentActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();

  const { data: currentInstrument, error: currentInstrumentError } = await supabase
    .from("instruments")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (currentInstrumentError || !currentInstrument) {
    return { status: "error", message: "Could not load this instrument. Please try again." };
  }

  if (currentInstrument.status !== "borrowed") {
    return {
      status: "error",
      message: "This instrument is no longer marked as borrowed — there's nothing to repair.",
    };
  }

  if (await instrumentHasActiveBorrowing(id)) {
    return {
      status: "error",
      message:
        "This instrument now has an active borrowing record, so its status isn't actually inconsistent — it can't be reset here.",
    };
  }

  const { data: updated, error } = await supabase
    .from("instruments")
    .update({ status: "available", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "borrowed")
    .select("id");

  if (error) {
    return { status: "error", message: "Could not reset this instrument's status. Please try again." };
  }

  if (!updated || updated.length === 0) {
    return {
      status: "error",
      message:
        "This instrument's status changed just before the reset could be applied. Please refresh and try again.",
    };
  }

  revalidatePath("/admin/instruments");
  revalidatePath(`/admin/instruments/${id}`);
  revalidatePath(`/admin/instruments/${id}/edit`);
  revalidatePath("/instruments");
  revalidatePath(`/instruments/${id}`);

  return { status: "success", message: "Status reset to Available." };
}

export async function archiveInstrument(id: string): Promise<InstrumentActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  // An instrument that's out on loan (or has a pending/awaiting-return
  // request) shouldn't be archived out from under a member — the borrowing
  // workflow needs it to stay visible and reachable until it's resolved.
  if (await instrumentHasOpenBorrowRequest(id)) {
    return {
      status: "error",
      message:
        "This instrument has a pending or active borrow request and can't be archived until it's resolved.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("instruments")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not archive this instrument." };
  }

  revalidatePath("/admin/instruments");
  revalidatePath("/instruments");
  revalidatePath(`/instruments/${id}`);

  return { status: "success", message: "Instrument archived." };
}

export async function unarchiveInstrument(id: string): Promise<InstrumentActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("instruments")
    .update({ archived_at: null })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not unarchive this instrument." };
  }

  revalidatePath("/admin/instruments");
  revalidatePath("/instruments");
  revalidatePath(`/instruments/${id}`);

  return { status: "success", message: "Instrument unarchived." };
}

export async function bulkArchiveInstruments(
  ids: string[],
): Promise<InstrumentActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  if (ids.length === 0) {
    return { status: "error", message: "No instruments selected." };
  }

  const openBorrowChecks = await Promise.all(ids.map(instrumentHasOpenBorrowRequest));
  const blockedCount = openBorrowChecks.filter(Boolean).length;
  const archivableIds = ids.filter((_, index) => !openBorrowChecks[index]);

  if (archivableIds.length === 0) {
    return {
      status: "error",
      message: "None of the selected instruments can be archived — they all have an open borrow request.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("instruments")
    .update({ archived_at: new Date().toISOString() })
    .in("id", archivableIds);

  if (error) {
    return { status: "error", message: "Could not archive the selected instruments." };
  }

  revalidatePath("/admin/instruments");
  revalidatePath("/instruments");

  if (blockedCount > 0) {
    return {
      status: "success",
      message: `${archivableIds.length} instrument(s) archived. ${blockedCount} skipped due to an open borrow request.`,
    };
  }

  return { status: "success", message: `${archivableIds.length} instrument(s) archived.` };
}
