"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import {
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_STATUSES,
  type AnnouncementPriority,
  type AnnouncementStatus,
} from "@/types/announcement";

export interface AnnouncementFormState {
  status: "idle" | "error" | "success";
  message: string | null;
}

export interface AnnouncementActionResult {
  status: "success" | "error";
  message: string;
}

const UNIQUE_VIOLATION = "23505";
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

async function assertAdmin(): Promise<{ userId: string }> {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== "admin") {
    throw new Error("not-admin");
  }
  return { userId: user.id };
}

function revalidateAnnouncements(id?: string) {
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  if (id) {
    revalidatePath(`/admin/announcements/${id}/edit`);
    revalidatePath(`/announcements/${id}`);
  }
}

function readAnnouncementFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const priority = String(formData.get("priority") ?? "normal");
  const isPinned = formData.get("isPinned") === "on";
  const publishedAtRaw = String(formData.get("publishedAt") ?? "").trim();
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();

  return {
    title,
    slug,
    summary,
    content,
    status,
    priority,
    isPinned,
    publishedAt: publishedAtRaw || null,
    expiresAt: expiresAtRaw || null,
  };
}

function validateFields(fields: ReturnType<typeof readAnnouncementFields>): string | null {
  if (!fields.title) {
    return "Title is required.";
  }
  if (!fields.slug || !SLUG_PATTERN.test(fields.slug)) {
    return "Slug must use lowercase letters, numbers and hyphens (e.g. rehearsal-update).";
  }
  if (!fields.summary) {
    return "Summary is required.";
  }
  if (!fields.content) {
    return "Content is required.";
  }
  if (!ANNOUNCEMENT_STATUSES.includes(fields.status as AnnouncementStatus)) {
    return "Please choose a valid status.";
  }
  if (!ANNOUNCEMENT_PRIORITIES.includes(fields.priority as AnnouncementPriority)) {
    return "Please choose a valid priority.";
  }
  if (fields.expiresAt) {
    // Compare against the explicit published date if one was entered;
    // otherwise fall back to "now" as a stand-in for the timestamp the
    // announcement will actually get stamped with on publish.
    const referenceDate = fields.publishedAt ? new Date(fields.publishedAt) : new Date();
    const expiresDate = new Date(fields.expiresAt);
    if (Number.isNaN(expiresDate.getTime())) {
      return "Expiry date is invalid.";
    }
    if (expiresDate <= referenceDate) {
      return "Expiry must be after the published date.";
    }
  }
  return null;
}

export async function createAnnouncement(
  _prevState: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  let userId: string;
  try {
    ({ userId } = await assertAdmin());
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const fields = readAnnouncementFields(formData);
  const validationError = validateFields(fields);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  const isPublishing = fields.status === "published";
  const publishedAt = isPublishing
    ? fields.publishedAt
      ? new Date(fields.publishedAt).toISOString()
      : new Date().toISOString()
    : null;

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    title: fields.title,
    slug: fields.slug,
    summary: fields.summary,
    content: fields.content,
    status: fields.status,
    priority: fields.priority,
    is_pinned: fields.isPinned,
    published_at: publishedAt,
    expires_at: fields.expiresAt ? new Date(fields.expiresAt).toISOString() : null,
    created_by: userId,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { status: "error", message: "This slug is already in use." };
    }
    return { status: "error", message: "Could not create the announcement. Please try again." };
  }

  revalidateAnnouncements();
  redirect("/admin/announcements");
}

export async function updateAnnouncement(
  id: string,
  _prevState: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const fields = readAnnouncementFields(formData);
  const validationError = validateFields(fields);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  const wasPublished = String(formData.get("wasPublished") ?? "") === "true";
  const isPublishing = fields.status === "published";

  const updatePayload: Record<string, unknown> = {
    title: fields.title,
    slug: fields.slug,
    summary: fields.summary,
    content: fields.content,
    status: fields.status,
    priority: fields.priority,
    is_pinned: fields.isPinned,
    expires_at: fields.expiresAt ? new Date(fields.expiresAt).toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  if (isPublishing) {
    // An explicit date always wins (lets an admin reschedule/backdate).
    // Otherwise: only stamp "now" the first time it goes live — leave an
    // already-published announcement's published_at untouched so it keeps
    // its original publish date.
    if (fields.publishedAt) {
      updatePayload.published_at = new Date(fields.publishedAt).toISOString();
    } else if (!wasPublished) {
      updatePayload.published_at = new Date().toISOString();
    }
  } else {
    updatePayload.published_at = null;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").update(updatePayload).eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { status: "error", message: "This slug is already in use." };
    }
    return { status: "error", message: "Could not save changes. Please try again." };
  }

  revalidateAnnouncements(id);
  return { status: "success", message: "Changes saved." };
}

export async function publishAnnouncement(id: string): Promise<AnnouncementActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not publish this announcement." };
  }

  revalidateAnnouncements(id);
  return { status: "success", message: "Announcement published." };
}

export async function unpublishAnnouncement(id: string): Promise<AnnouncementActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").update({ status: "draft" }).eq("id", id);

  if (error) {
    return { status: "error", message: "Could not unpublish this announcement." };
  }

  revalidateAnnouncements(id);
  return { status: "success", message: "Announcement moved back to draft." };
}

export async function setAnnouncementPinned(
  id: string,
  pinned: boolean,
): Promise<AnnouncementActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ is_pinned: pinned })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not update pinned status." };
  }

  revalidateAnnouncements(id);
  return {
    status: "success",
    message: pinned ? "Announcement pinned." : "Announcement unpinned.",
  };
}

export async function archiveAnnouncement(id: string): Promise<AnnouncementActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not archive this announcement." };
  }

  revalidateAnnouncements(id);
  return { status: "success", message: "Announcement archived." };
}

export async function restoreAnnouncement(id: string): Promise<AnnouncementActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ archived_at: null })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not restore this announcement." };
  }

  revalidateAnnouncements(id);
  return { status: "success", message: "Announcement restored." };
}
