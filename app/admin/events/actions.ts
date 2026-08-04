"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getStoragePathFromPublicUrl } from "@/lib/supabase/storage";
import { EVENT_STATUSES, type EventStatus } from "@/types/event";

export interface EventFormState {
  status: "idle" | "error" | "success";
  message: string | null;
}

export interface EventActionResult {
  status: "success" | "error";
  message: string;
}

const UNIQUE_VIOLATION = "23505";
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EVENT_IMAGES_BUCKET = "event-images";

async function assertAdmin(): Promise<void> {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== "admin") {
    throw new Error("not-admin");
  }
}

function revalidateEvents(id?: string) {
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  revalidatePath("/admin");
  if (id) {
    revalidatePath(`/admin/events/${id}/edit`);
    revalidatePath(`/events/${id}`);
  }
}

function readEventFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const registrationUrl = String(formData.get("registrationUrl") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const isFeatured = formData.get("isFeatured") === "on";
  const bannerUrlRaw = formData.get("bannerUrl");

  return {
    title,
    slug,
    shortDescription: shortDescription || null,
    description: description || null,
    eventDate,
    startTime: startTime || null,
    endTime: endTime || null,
    location: location || null,
    registrationUrl: registrationUrl || null,
    status,
    isFeatured,
    bannerUrl: typeof bannerUrlRaw === "string" && bannerUrlRaw ? bannerUrlRaw : undefined,
  };
}

function validateFields(fields: ReturnType<typeof readEventFields>): string | null {
  if (!fields.title) {
    return "Title is required.";
  }
  if (!fields.slug || !SLUG_PATTERN.test(fields.slug)) {
    return "Slug must use lowercase letters, numbers and hyphens (e.g. rhythm-night-2026).";
  }
  if (!fields.eventDate) {
    return "Event date is required.";
  }
  if (fields.startTime && fields.endTime && fields.startTime >= fields.endTime) {
    return "Start time must be before end time.";
  }
  if (fields.registrationUrl) {
    try {
      const url = new URL(fields.registrationUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return "Registration URL must be a valid http(s) link.";
      }
    } catch {
      return "Registration URL must be a valid link.";
    }
  }
  if (!EVENT_STATUSES.includes(fields.status as EventStatus)) {
    return "Please choose a valid status.";
  }
  return null;
}

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const fields = readEventFields(formData);
  const validationError = validateFields(fields);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  const { user } = await getCurrentUser();
  const supabase = await createClient();

  const isPublishing = fields.status === "published";

  const { error } = await supabase.from("events").insert({
    title: fields.title,
    slug: fields.slug,
    short_description: fields.shortDescription,
    description: fields.description,
    event_date: fields.eventDate,
    start_time: fields.startTime,
    end_time: fields.endTime,
    location: fields.location,
    registration_url: fields.registrationUrl,
    status: fields.status,
    is_featured: fields.isFeatured,
    banner_url: fields.bannerUrl ?? null,
    published_at: isPublishing ? new Date().toISOString() : null,
    created_by: user?.id ?? null,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { status: "error", message: "This slug is already in use." };
    }
    return { status: "error", message: "Could not create the event. Please try again." };
  }

  revalidateEvents();
  redirect("/admin/events");
}

export async function updateEvent(
  id: string,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const fields = readEventFields(formData);
  const validationError = validateFields(fields);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  const currentBannerUrl = String(formData.get("currentBannerUrl") ?? "");
  const wasPublished = String(formData.get("wasPublished") ?? "") === "true";

  const supabase = await createClient();

  const isNewlyPublished = fields.status === "published" && !wasPublished;

  const updatePayload: Record<string, unknown> = {
    title: fields.title,
    slug: fields.slug,
    short_description: fields.shortDescription,
    description: fields.description,
    event_date: fields.eventDate,
    start_time: fields.startTime,
    end_time: fields.endTime,
    location: fields.location,
    registration_url: fields.registrationUrl,
    status: fields.status,
    is_featured: fields.isFeatured,
    updated_at: new Date().toISOString(),
  };

  if (isNewlyPublished) {
    updatePayload.published_at = new Date().toISOString();
  }

  if (fields.bannerUrl) {
    updatePayload.banner_url = fields.bannerUrl;
  }

  const { error } = await supabase.from("events").update(updatePayload).eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { status: "error", message: "This slug is already in use." };
    }
    return { status: "error", message: "Could not save changes. Please try again." };
  }

  // Only remove the old banner once the new one is safely saved on the row,
  // so a failed update never leaves an event with no image at all.
  if (fields.bannerUrl && currentBannerUrl && currentBannerUrl !== fields.bannerUrl) {
    const oldPath = getStoragePathFromPublicUrl(currentBannerUrl, EVENT_IMAGES_BUCKET);
    if (oldPath) {
      await supabase.storage.from(EVENT_IMAGES_BUCKET).remove([oldPath]);
    }
  }

  revalidateEvents(id);
  redirect("/admin/events");
}

export async function publishEvent(id: string): Promise<EventActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not publish this event." };
  }

  revalidateEvents(id);
  return { status: "success", message: "Event published." };
}

export async function unpublishEvent(id: string): Promise<EventActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ status: "draft" }).eq("id", id);

  if (error) {
    return { status: "error", message: "Could not unpublish this event." };
  }

  revalidateEvents(id);
  return { status: "success", message: "Event moved back to draft." };
}

export async function archiveEvent(id: string): Promise<EventActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not archive this event." };
  }

  revalidateEvents(id);
  return { status: "success", message: "Event archived." };
}

export async function restoreEvent(id: string): Promise<EventActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ archived_at: null }).eq("id", id);

  if (error) {
    return { status: "error", message: "Could not restore this event." };
  }

  revalidateEvents(id);
  return { status: "success", message: "Event restored." };
}

export async function setEventFeatured(id: string, featured: boolean): Promise<EventActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ is_featured: featured })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not update featured status." };
  }

  revalidateEvents(id);
  return {
    status: "success",
    message: featured ? "Event marked as featured." : "Event removed from featured.",
  };
}
