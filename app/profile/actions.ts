"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileFormState {
  status: "idle" | "error" | "success";
  message: string | null;
}

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName) {
    return { status: "error", message: "Full name cannot be empty." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in to update your profile.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      status: "error",
      message: "Could not save your changes. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return { status: "success", message: "Profile updated successfully." };
}

export interface AvatarState {
  status: "idle" | "error" | "success";
  message: string | null;
  avatarUrl?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadAvatar(
  _prevState: AvatarState,
  formData: FormData,
): Promise<AvatarState> {
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Please choose an image to upload." };
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return {
      status: "error",
      message: "Please upload a JPG, PNG or WebP image.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { status: "error", message: "Image must be 2MB or smaller." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "You must be signed in to update your photo.",
    };
  }

  // Best-effort cleanup of any previous avatar saved in a different format.
  const otherExtensions = Object.values(ALLOWED_TYPES).filter(
    (ext) => ext !== extension,
  );
  await supabase.storage
    .from("avatars")
    .remove(otherExtensions.map((ext) => `${user.id}/avatar.${ext}`));

  const filePath = `${user.id}/avatar.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return {
      status: "error",
      message: "Could not upload your photo. Please try again.",
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Cache-bust: the storage path stays the same across re-uploads (upsert),
  // so without this the browser/CDN may keep serving the old image.
  const avatarUrl = `${publicUrl}?updated=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return {
      status: "error",
      message: "Photo uploaded but could not be saved. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Profile picture updated.",
    avatarUrl,
  };
}
