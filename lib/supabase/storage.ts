import { createClient } from "@/lib/supabase/client";

export interface UploadImageResult {
  path: string;
  publicUrl: string;
}

const INSTRUMENT_IMAGES_BUCKET = "instrument-images";
const RETURN_PHOTOS_BUCKET = "return-photos";

/**
 * Uploads a file directly from the browser to Supabase Storage with real
 * upload-progress reporting via XMLHttpRequest. supabase-js's storage
 * client uses fetch under the hood, which doesn't expose progress events,
 * so this talks to the Storage REST endpoint directly.
 *
 * This also keeps file bytes out of Server Actions entirely — Next.js
 * caps Server Action request bodies at 1MB by default, well under this
 * bucket's 5MB limit, so routing uploads through an action would fail for
 * anything over ~1MB.
 */
export async function uploadInstrumentImage(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadImageResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be signed in to upload images.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Image upload is not configured.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `${supabaseUrl}/storage/v1/object/${INSTRUMENT_IMAGES_BUCKET}/${path}`,
    );
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("Image upload failed. Please try again."));
      }
    };
    xhr.onerror = () => reject(new Error("Image upload failed. Please try again."));

    xhr.send(file);
  });

  const {
    data: { publicUrl },
  } = supabase.storage.from(INSTRUMENT_IMAGES_BUCKET).getPublicUrl(path);

  return { path, publicUrl };
}

/**
 * Extracts the storage object path from a Supabase public URL so the old
 * image can be removed after a replacement upload succeeds.
 */
export function getStoragePathFromPublicUrl(
  publicUrl: string,
  bucket: string,
): string | null {
  const marker = `/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return publicUrl.slice(index + marker.length);
}

/**
 * Uploads a return photo directly from the browser, same rationale as
 * uploadInstrumentImage (real progress, bypasses the Server Action body
 * limit). The `return-photos` bucket is private, so unlike instrument
 * images this returns a storage path, not a public URL — the storage RLS
 * policies require the object path to start with the borrow request's id
 * (`(storage.foldername(name))[1]`), which is what makes the ownership
 * check in the INSERT/UPDATE policies work.
 */
export async function uploadReturnPhoto(
  requestId: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadImageResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be signed in to upload a return photo.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Photo upload is not configured.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${requestId}/${crypto.randomUUID()}.${extension}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // upsert=true (via header) lets a member replace their return photo
    // before it's been verified, matching the "replace before verification"
    // storage policy.
    xhr.open(
      "POST",
      `${supabaseUrl}/storage/v1/object/${RETURN_PHOTOS_BUCKET}/${path}`,
    );
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("Photo upload failed. Please try again."));
      }
    };
    xhr.onerror = () => reject(new Error("Photo upload failed. Please try again."));

    xhr.send(file);
  });

  return { path, publicUrl: path };
}
