"use client";

import { useActionState, useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import { GalleryIcon } from "@/components/ui/icons";
import { uploadGalleryImage } from "@/lib/supabase/storage";
import { GALLERY_ALBUM_STATUSES, GALLERY_ALBUM_STATUS_LABELS } from "@/types/gallery";
import type { GalleryAlbumWithMeta } from "@/types/gallery";
import type { AlbumFormState } from "@/app/admin/gallery/actions";

const INITIAL_STATE: AlbumFormState = { status: "idle", message: null };
const GALLERY_COVER_MAX_BYTES = 8 * 1024 * 1024;

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6] disabled:text-[#666666]";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";
const MAX_DESCRIPTION_LENGTH = 1000;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface AlbumFormProps {
  mode: "create" | "edit";
  album?: GalleryAlbumWithMeta;
  events: { id: string; title: string }[];
  action: (prevState: AlbumFormState, formData: FormData) => Promise<AlbumFormState>;
}

export default function AlbumForm({ mode, album, events, action }: AlbumFormProps) {
  const [state, formAction, isSubmitting] = useActionState(action, INITIAL_STATE);
  // Albums need an id before any image (including the cover) can be
  // uploaded, since gallery images live at `{album-id}/{file}` in storage.
  // Generating it client-side up front means create and edit share the
  // exact same upload path logic.
  const [albumId] = useState(() => album?.id ?? crypto.randomUUID());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [slug, setSlug] = useState(album?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(album));
  const [description, setDescription] = useState(album?.description ?? "");

  const busy = isUploading || isSubmitting;

  function handleTitleBlur(titleValue: string) {
    if (!slugTouched && titleValue) {
      setSlug(slugify(titleValue));
    }
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setUploadError(null);

    const formData = new FormData(formEvent.currentTarget);

    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const { publicUrl } = await uploadGalleryImage(albumId, selectedFile, setUploadProgress);
        formData.set("coverImageUrl", publicUrl);
      } catch (err) {
        setIsUploading(false);
        setUploadProgress(null);
        setUploadError(err instanceof Error ? err.message : "Cover image upload failed.");
        return;
      }
      setIsUploading(false);
    }

    if (mode === "edit" && album) {
      formData.set("currentCoverImageUrl", album.cover_image_url ?? "");
      formData.set("currentSlug", album.slug);
      formData.set("wasPublished", String(album.status === "published"));
    }

    formAction(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="id" value={albumId} />

      <ImageUploadField
        label="Cover Image"
        previewAlt="Album cover preview"
        placeholderIcon={<GalleryIcon className="h-8 w-8 text-[#C8A928]/50" />}
        initialImageUrl={album?.cover_image_url ?? null}
        onFileSelected={setSelectedFile}
        uploadProgress={uploadProgress}
        disabled={busy}
        error={uploadError}
        maxSizeBytes={GALLERY_COVER_MAX_BYTES}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Title"
          name="title"
          defaultValue={album?.title}
          onBlur={(e) => handleTitleBlur(e.target.value)}
          disabled={busy}
          required
        />
        <div>
          <label htmlFor="slug" className={LABEL_CLASSES}>
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="rhythm-night-2026"
            disabled={busy}
            required
            className={FIELD_CLASSES}
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="description" className={LABEL_CLASSES}>
            Description
          </label>
          <span className="text-xs text-[#666666]">
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={MAX_DESCRIPTION_LENGTH}
          disabled={busy}
          rows={4}
          className={FIELD_CLASSES}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="eventId" className={LABEL_CLASSES}>
            Related Event (optional)
          </label>
          <select
            id="eventId"
            name="eventId"
            defaultValue={album?.event_id ?? ""}
            disabled={busy}
            className={FIELD_CLASSES}
          >
            <option value="">None</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className={LABEL_CLASSES}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={album?.status ?? "draft"}
            disabled={busy}
            className={FIELD_CLASSES}
          >
            {GALLERY_ALBUM_STATUSES.map((value) => (
              <option key={value} value={value}>
                {GALLERY_ALBUM_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-[#111111]">
        <input
          type="checkbox"
          name="isFeatured"
          defaultChecked={album?.is_featured ?? false}
          disabled={busy}
        />
        Feature this album
      </label>

      <div aria-live="polite" className="min-h-[1.25rem]">
        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
        {state.status === "success" && (
          <p className="text-sm text-[#C8A928]">{state.message}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy
            ? isUploading
              ? "Uploading..."
              : "Saving..."
            : mode === "create"
              ? "Create Album"
              : "Save Changes"}
        </Button>
        <Button href="/admin/gallery" variant="outline">
          {mode === "create" ? "Cancel" : "Back to Albums"}
        </Button>
      </div>
    </form>
  );
}
