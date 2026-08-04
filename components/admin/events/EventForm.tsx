"use client";

import { useActionState, useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import { CalendarIcon } from "@/components/ui/icons";
import { uploadEventBanner } from "@/lib/supabase/storage";
import { EVENT_STATUSES, EVENT_STATUS_LABELS, type Event } from "@/types/event";
import type { EventFormState } from "@/app/admin/events/actions";

const INITIAL_STATE: EventFormState = { status: "idle", message: null };

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6] disabled:text-[#666666]";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface EventFormProps {
  mode: "create" | "edit";
  event?: Event;
  action: (prevState: EventFormState, formData: FormData) => Promise<EventFormState>;
}

export default function EventForm({ mode, event, action }: EventFormProps) {
  const [state, formAction, isSubmitting] = useActionState(action, INITIAL_STATE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(event));

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
        const { publicUrl } = await uploadEventBanner(selectedFile, setUploadProgress);
        formData.set("bannerUrl", publicUrl);
      } catch (err) {
        setIsUploading(false);
        setUploadProgress(null);
        setUploadError(err instanceof Error ? err.message : "Banner upload failed.");
        return;
      }
      setIsUploading(false);
    }

    if (mode === "edit" && event) {
      formData.set("currentBannerUrl", event.banner_url ?? "");
      formData.set("wasPublished", String(event.status === "published"));
    }

    formAction(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ImageUploadField
        label="Banner Image"
        previewAlt="Event banner preview"
        placeholderIcon={<CalendarIcon className="h-8 w-8 text-[#C8A928]/50" />}
        initialImageUrl={event?.banner_url ?? null}
        onFileSelected={setSelectedFile}
        uploadProgress={uploadProgress}
        disabled={busy}
        error={uploadError}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Title"
          name="title"
          defaultValue={event?.title}
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
        <label htmlFor="shortDescription" className={LABEL_CLASSES}>
          Short Description
        </label>
        <textarea
          id="shortDescription"
          name="shortDescription"
          defaultValue={event?.short_description ?? ""}
          placeholder="One or two sentences shown on event cards."
          disabled={busy}
          rows={2}
          className={FIELD_CLASSES}
        />
      </div>

      <div>
        <label htmlFor="description" className={LABEL_CLASSES}>
          Full Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={event?.description ?? ""}
          disabled={busy}
          rows={5}
          className={FIELD_CLASSES}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <FormField
          label="Event Date"
          name="eventDate"
          type="date"
          defaultValue={event?.event_date ?? ""}
          disabled={busy}
          required
        />
        <FormField
          label="Start Time"
          name="startTime"
          type="time"
          defaultValue={event?.start_time ?? ""}
          disabled={busy}
        />
        <FormField
          label="End Time"
          name="endTime"
          type="time"
          defaultValue={event?.end_time ?? ""}
          disabled={busy}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Location"
          name="location"
          defaultValue={event?.location ?? ""}
          disabled={busy}
        />
        <FormField
          label="Registration URL"
          name="registrationUrl"
          type="url"
          placeholder="https://..."
          defaultValue={event?.registration_url ?? ""}
          disabled={busy}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className={LABEL_CLASSES}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={event?.status ?? "draft"}
            disabled={busy}
            className={FIELD_CLASSES}
          >
            {EVENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {EVENT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={event?.is_featured ?? false}
              disabled={busy}
            />
            Feature this event
          </label>
        </div>
      </div>

      <div aria-live="polite" className="min-h-[1.25rem]">
        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy
            ? isUploading
              ? "Uploading..."
              : "Saving..."
            : mode === "create"
              ? "Create Event"
              : "Save Changes"}
        </Button>
        <Button href="/admin/events" variant="outline">
          Cancel
        </Button>
      </div>
    </form>
  );
}
