"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getStoragePathFromPublicUrl } from "@/lib/supabase/storage";
import { instrumentHasOpenBorrowRequest } from "@/lib/supabase/borrow-requests";
import {
  INSTRUMENT_CONDITIONS,
  INSTRUMENT_STATUSES,
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
const CODE_PATTERN = /^[a-z0-9]+(_[a-z0-9]+)*$/;
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
  if (!fields.instrumentCode || !CODE_PATTERN.test(fields.instrumentCode)) {
    return "Instrument code must use lowercase letters, numbers and underscores (e.g. conga_1).";
  }
  if (!fields.name) {
    return "Name is required.";
  }
  if (!fields.category) {
    return "Category is required.";
  }
  if (!INSTRUMENT_STATUSES.includes(fields.status as InstrumentStatus)) {
    return "Please choose a valid status.";
  }
  if (!INSTRUMENT_CONDITIONS.includes(fields.condition as InstrumentCondition)) {
    return "Please choose a valid condition.";
  }
  return null;
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
  const updatePayload: Record<string, unknown> = {
    instrument_code: fields.instrumentCode,
    name: fields.name,
    category: fields.category,
    description: fields.description,
    status: fields.status,
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
