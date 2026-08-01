import { createClient } from "@/lib/supabase/server";

const RETURN_PHOTOS_BUCKET = "return-photos";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour — plenty for viewing a single page

/**
 * Generates a short-lived signed URL for a return photo. The bucket is
 * private, so this is the only way to display a photo — subject to the
 * `return-photos` storage RLS policies (owner or admin only), enforced
 * server-side via the caller's session.
 */
export async function getSignedReturnPhotoUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(RETURN_PHOTOS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}
