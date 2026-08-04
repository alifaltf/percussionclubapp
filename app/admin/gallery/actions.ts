"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getStoragePathFromPublicUrl } from "@/lib/supabase/storage";
import { GALLERY_ALBUM_STATUSES, type GalleryAlbumStatus } from "@/types/gallery";

export interface AlbumFormState {
  status: "idle" | "error" | "success";
  message: string | null;
}

export interface GalleryActionResult {
  status: "success" | "error";
  message: string;
}

const UNIQUE_VIOLATION = "23505";
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GALLERY_IMAGES_BUCKET = "gallery-images";
const MAX_DESCRIPTION_LENGTH = 1000;

async function assertAdmin(): Promise<{ userId: string }> {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== "admin") {
    throw new Error("not-admin");
  }
  return { userId: user.id };
}

function revalidateGallery(id?: string, slug?: string) {
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  revalidatePath("/admin");
  if (id) {
    revalidatePath(`/admin/gallery/${id}/edit`);
  }
  if (slug) {
    revalidatePath(`/gallery/${slug}`);
  }
}

function readAlbumFields(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const eventIdRaw = String(formData.get("eventId") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const isFeatured = formData.get("isFeatured") === "on";
  const coverImageUrlRaw = formData.get("coverImageUrl");

  return {
    id,
    title,
    slug,
    description: description || null,
    eventId: eventIdRaw || null,
    status,
    isFeatured,
    coverImageUrl:
      typeof coverImageUrlRaw === "string" && coverImageUrlRaw ? coverImageUrlRaw : undefined,
  };
}

function validateFields(fields: ReturnType<typeof readAlbumFields>): string | null {
  if (!fields.title) {
    return "Title is required.";
  }
  if (!fields.slug || !SLUG_PATTERN.test(fields.slug)) {
    return "Slug must use lowercase letters, numbers and hyphens (e.g. rhythm-night-2026).";
  }
  if (fields.description && fields.description.length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
  }
  if (fields.eventId && !UUID_PATTERN.test(fields.eventId)) {
    return "Please choose a valid related event.";
  }
  if (!GALLERY_ALBUM_STATUSES.includes(fields.status as GalleryAlbumStatus)) {
    return "Please choose a valid status.";
  }
  return null;
}

export async function createAlbum(
  _prevState: AlbumFormState,
  formData: FormData,
): Promise<AlbumFormState> {
  let userId: string;
  try {
    ({ userId } = await assertAdmin());
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const fields = readAlbumFields(formData);
  const validationError = validateFields(fields);
  if (validationError) {
    return { status: "error", message: validationError };
  }
  if (!fields.id || !UUID_PATTERN.test(fields.id)) {
    return { status: "error", message: "Could not create the album. Please try again." };
  }

  const supabase = await createClient();

  const isPublishing = fields.status === "published";

  const { error } = await supabase.from("gallery_albums").insert({
    id: fields.id,
    title: fields.title,
    slug: fields.slug,
    description: fields.description,
    cover_image_url: fields.coverImageUrl ?? null,
    event_id: fields.eventId,
    status: fields.status,
    is_featured: fields.isFeatured,
    published_at: isPublishing ? new Date().toISOString() : null,
    created_by: userId,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { status: "error", message: "This slug is already in use." };
    }
    return { status: "error", message: "Could not create the album. Please try again." };
  }

  revalidateGallery();
  redirect(`/admin/gallery/${fields.id}/edit`);
}

export async function updateAlbum(
  id: string,
  _prevState: AlbumFormState,
  formData: FormData,
): Promise<AlbumFormState> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const fields = readAlbumFields(formData);
  const validationError = validateFields(fields);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  const currentCoverImageUrl = String(formData.get("currentCoverImageUrl") ?? "");
  const currentSlug = String(formData.get("currentSlug") ?? "");
  const wasPublished = String(formData.get("wasPublished") ?? "") === "true";

  const supabase = await createClient();

  const isNewlyPublished = fields.status === "published" && !wasPublished;

  const updatePayload: Record<string, unknown> = {
    title: fields.title,
    slug: fields.slug,
    description: fields.description,
    event_id: fields.eventId,
    status: fields.status,
    is_featured: fields.isFeatured,
    updated_at: new Date().toISOString(),
  };

  if (isNewlyPublished) {
    updatePayload.published_at = new Date().toISOString();
  }

  if (fields.coverImageUrl) {
    updatePayload.cover_image_url = fields.coverImageUrl;
  }

  const { error } = await supabase.from("gallery_albums").update(updatePayload).eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { status: "error", message: "This slug is already in use." };
    }
    return { status: "error", message: "Could not save changes. Please try again." };
  }

  // Only remove the old cover image once the new one is safely saved on the
  // row, so a failed update never leaves an album with no cover at all.
  if (
    fields.coverImageUrl &&
    currentCoverImageUrl &&
    currentCoverImageUrl !== fields.coverImageUrl
  ) {
    const oldPath = getStoragePathFromPublicUrl(currentCoverImageUrl, GALLERY_IMAGES_BUCKET);
    if (oldPath) {
      await supabase.storage.from(GALLERY_IMAGES_BUCKET).remove([oldPath]);
    }
  }

  revalidateGallery(id, currentSlug || fields.slug);
  return { status: "success", message: "Changes saved." };
}

export async function publishAlbum(id: string): Promise<GalleryActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_albums")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not publish this album." };
  }

  revalidateGallery(id);
  return { status: "success", message: "Album published." };
}

export async function unpublishAlbum(id: string): Promise<GalleryActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("gallery_albums").update({ status: "draft" }).eq("id", id);

  if (error) {
    return { status: "error", message: "Could not unpublish this album." };
  }

  revalidateGallery(id);
  return { status: "success", message: "Album moved back to draft." };
}

export async function archiveAlbum(id: string): Promise<GalleryActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_albums")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not archive this album." };
  }

  revalidateGallery(id);
  return { status: "success", message: "Album archived." };
}

export async function restoreAlbum(id: string): Promise<GalleryActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_albums")
    .update({ archived_at: null })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not restore this album." };
  }

  revalidateGallery(id);
  return { status: "success", message: "Album restored." };
}

export async function setAlbumFeatured(id: string, featured: boolean): Promise<GalleryActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_albums")
    .update({ is_featured: featured })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "Could not update featured status." };
  }

  revalidateGallery(id);
  return {
    status: "success",
    message: featured ? "Album marked as featured." : "Album removed from featured.",
  };
}

// ---------------------------------------------------------------------------
// Image management — used from the album edit page's image manager.
// ---------------------------------------------------------------------------

export interface NewGalleryImageInput {
  imageUrl: string;
  storagePath: string;
}

export interface AddGalleryImagesResult {
  status: "success" | "error";
  message: string;
  insertedCount: number;
}

/** Inserts uploaded images as gallery_images rows, appended after the current max display_order. */
export async function addGalleryImages(
  albumId: string,
  images: NewGalleryImageInput[],
): Promise<AddGalleryImagesResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action.", insertedCount: 0 };
  }

  if (images.length === 0) {
    return { status: "error", message: "No images to add.", insertedCount: 0 };
  }

  const supabase = await createClient();

  const { data: existing, error: maxError } = await supabase
    .from("gallery_images")
    .select("display_order")
    .eq("album_id", albumId)
    .order("display_order", { ascending: false })
    .limit(1);

  if (maxError) {
    return { status: "error", message: "Could not add images. Please try again.", insertedCount: 0 };
  }

  const startOrder = (existing?.[0]?.display_order ?? -1) + 1;

  const { error } = await supabase.from("gallery_images").insert(
    images.map((image, index) => ({
      album_id: albumId,
      image_url: image.imageUrl,
      storage_path: image.storagePath,
      display_order: startOrder + index,
    })),
  );

  if (error) {
    return { status: "error", message: "Could not add images. Please try again.", insertedCount: 0 };
  }

  revalidateGallery(albumId);
  return { status: "success", message: `${images.length} image(s) added.`, insertedCount: images.length };
}

export async function updateGalleryImage(
  imageId: string,
  fields: { caption: string; altText: string },
): Promise<GalleryActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_images")
    .update({
      caption: fields.caption.trim() || null,
      alt_text: fields.altText.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", imageId);

  if (error) {
    return { status: "error", message: "Could not save image details." };
  }

  revalidateGallery();
  return { status: "success", message: "Image details saved." };
}

/** Removes a gallery image's DB row and its storage object. */
export async function deleteGalleryImage(imageId: string): Promise<GalleryActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();

  const { data: image, error: fetchError } = await supabase
    .from("gallery_images")
    .select("storage_path, album_id")
    .eq("id", imageId)
    .maybeSingle();

  if (fetchError || !image) {
    return { status: "error", message: "Could not find this image." };
  }

  // Remove the database row first — if storage removal below fails, the
  // result is an orphaned (harmless) file rather than a gallery row
  // pointing at nothing.
  const { error: deleteError } = await supabase.from("gallery_images").delete().eq("id", imageId);

  if (deleteError) {
    return { status: "error", message: "Could not remove this image." };
  }

  if (image.storage_path) {
    await supabase.storage.from(GALLERY_IMAGES_BUCKET).remove([image.storage_path]);
  }

  revalidateGallery(image.album_id);
  return { status: "success", message: "Image removed." };
}

export interface ReorderInput {
  id: string;
  displayOrder: number;
}

/** Batch-saves the new display order for an album's images. */
export async function reorderGalleryImages(
  albumId: string,
  order: ReorderInput[],
): Promise<GalleryActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  if (order.length === 0) {
    return { status: "success", message: "Order saved." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_images")
    .upsert(
      order.map((item) => ({ id: item.id, display_order: item.displayOrder })),
      { onConflict: "id" },
    );

  if (error) {
    return { status: "error", message: "Could not save the new order." };
  }

  revalidateGallery(albumId);
  return { status: "success", message: "Order saved." };
}

/** Sets one of an album's existing images as its cover, without a new upload. */
export async function setAlbumCoverFromImage(
  albumId: string,
  imageUrl: string,
): Promise<GalleryActionResult> {
  try {
    await assertAdmin();
  } catch {
    return { status: "error", message: "You must be an admin to perform this action." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_albums")
    .update({ cover_image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq("id", albumId);

  if (error) {
    return { status: "error", message: "Could not set the cover image." };
  }

  revalidateGallery(albumId);
  return { status: "success", message: "Cover image updated." };
}
