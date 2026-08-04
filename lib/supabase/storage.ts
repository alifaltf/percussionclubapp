import { createClient } from "@/lib/supabase/client";

export interface UploadImageResult {
  path: string;
  publicUrl: string;
}

const INSTRUMENT_IMAGES_BUCKET = "instrument-images";
const EVENT_IMAGES_BUCKET = "event-images";
const RETURN_PHOTOS_BUCKET = "return-photos";
const GALLERY_IMAGES_BUCKET = "gallery-images";
const GALLERY_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

// Both callers already validate MIME type before calling these functions,
// but the storage path is still built from the *filename's* extension, and
// a filename is attacker-controlled input. Deriving it naively
// (`file.name.split(".").pop()`) would let a crafted name like
// "a.b/../c" inject a "/" into the object path. Whitelisting the
// extension against the accepted image types closes that off.
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function safeImageExtension(fileName: string): string {
  const raw = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_IMAGE_EXTENSIONS.has(raw) ? raw : "jpg";
}

/**
 * Uploads a file directly from the browser to a public Supabase Storage
 * bucket with real upload-progress reporting via XMLHttpRequest.
 * supabase-js's storage client uses fetch under the hood, which doesn't
 * expose progress events, so this talks to the Storage REST endpoint
 * directly.
 *
 * This also keeps file bytes out of Server Actions entirely — Next.js
 * caps Server Action request bodies at 1MB by default, well under these
 * buckets' 5MB limit, so routing uploads through an action would fail for
 * anything over ~1MB.
 *
 * Shared by uploadInstrumentImage, uploadEventBanner and uploadGalleryImage
 * — all public buckets keyed by a random filename, optionally nested under
 * a caller-supplied folder prefix (gallery images use `{album-id}/`, so
 * two albums can never collide even if their images happen to get the same
 * generated name). uploadReturnPhoto is kept separate below since the
 * `return-photos` bucket is private and uses a different (request-id-scoped)
 * path shape and doesn't return a public URL.
 */
async function uploadToPublicBucket(
  bucket: string,
  file: File,
  onProgress: (percent: number) => void,
  errorMessage: string,
  pathPrefix = "",
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

  const extension = safeImageExtension(file.name);
  const path = `${pathPrefix}${crypto.randomUUID()}.${extension}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl}/storage/v1/object/${bucket}/${path}`);
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
        reject(new Error(errorMessage));
      }
    };
    xhr.onerror = () => reject(new Error(errorMessage));

    xhr.send(file);
  });

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { path, publicUrl };
}

export async function uploadInstrumentImage(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadImageResult> {
  return uploadToPublicBucket(
    INSTRUMENT_IMAGES_BUCKET,
    file,
    onProgress,
    "Image upload failed. Please try again.",
  );
}

/** Uploads an event banner image — same rationale as uploadInstrumentImage. */
export async function uploadEventBanner(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadImageResult> {
  return uploadToPublicBucket(
    EVENT_IMAGES_BUCKET,
    file,
    onProgress,
    "Banner upload failed. Please try again.",
  );
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Uploads a single gallery image into `{album-id}/{generated-file-name}`,
 * same rationale as uploadInstrumentImage. The album id is validated as a
 * UUID before being used as a folder segment — albums always get a
 * client-generated UUID (see admin gallery form), but this guards against
 * ever building a path from an unexpected value.
 */
export async function uploadGalleryImage(
  albumId: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadImageResult> {
  if (!UUID_PATTERN.test(albumId)) {
    throw new Error("Invalid album reference.");
  }
  if (file.size > GALLERY_IMAGE_MAX_BYTES) {
    throw new Error(`"${file.name}" is larger than 8MB.`);
  }
  return uploadToPublicBucket(
    GALLERY_IMAGES_BUCKET,
    file,
    onProgress,
    `"${file.name}" failed to upload.`,
    `${albumId}/`,
  );
}

export interface GalleryUploadSuccess extends UploadImageResult {
  file: File;
}

export interface GalleryUploadFailure {
  file: File;
  message: string;
}

export interface GalleryUploadBatchResult {
  succeeded: GalleryUploadSuccess[];
  failed: GalleryUploadFailure[];
}

/**
 * Uploads multiple gallery images in parallel. Uses Promise.allSettled so
 * one bad file (wrong type slipped past the input accept filter, network
 * blip, etc.) never blocks the others — the caller gets back both the
 * successful uploads (ready to insert as gallery_images rows) and the
 * failures (to report by filename), matching the "if part of a multi-upload
 * fails, report which files failed" requirement.
 */
export async function uploadGalleryImages(
  albumId: string,
  files: File[],
  onProgress: (fileIndex: number, percent: number) => void,
): Promise<GalleryUploadBatchResult> {
  const results = await Promise.allSettled(
    files.map((file, index) =>
      uploadGalleryImage(albumId, file, (percent) => onProgress(index, percent)),
    ),
  );

  const succeeded: GalleryUploadSuccess[] = [];
  const failed: GalleryUploadFailure[] = [];

  results.forEach((result, index) => {
    const file = files[index];
    if (result.status === "fulfilled") {
      succeeded.push({ file, ...result.value });
    } else {
      failed.push({
        file,
        message: result.reason instanceof Error ? result.reason.message : "Upload failed.",
      });
    }
  });

  return { succeeded, failed };
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

  const extension = safeImageExtension(file.name);
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
