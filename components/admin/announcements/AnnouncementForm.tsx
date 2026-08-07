"use client";

import { useActionState, useState } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import {
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_PRIORITY_LABELS,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_STATUS_LABELS,
} from "@/types/announcement";
import type { Announcement } from "@/types/announcement";
import type { AnnouncementFormState } from "@/app/admin/announcements/actions";
import { toDatetimeLocalValue } from "@/utils/format-announcement";

const INITIAL_STATE: AnnouncementFormState = { status: "idle", message: null };

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

interface AnnouncementFormProps {
  mode: "create" | "edit";
  announcement?: Announcement;
  action: (prevState: AnnouncementFormState, formData: FormData) => Promise<AnnouncementFormState>;
}

export default function AnnouncementForm({ mode, announcement, action }: AnnouncementFormProps) {
  const [state, formAction, isSubmitting] = useActionState(action, INITIAL_STATE);
  const [slug, setSlug] = useState(announcement?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(announcement));

  function handleTitleBlur(titleValue: string) {
    if (!slugTouched && titleValue) {
      setSlug(slugify(titleValue));
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && announcement && (
        <input type="hidden" name="wasPublished" value={String(announcement.status === "published")} />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Title"
          name="title"
          defaultValue={announcement?.title}
          onBlur={(e) => handleTitleBlur(e.target.value)}
          disabled={isSubmitting}
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
            placeholder="rehearsal-schedule-update"
            disabled={isSubmitting}
            required
            className={FIELD_CLASSES}
          />
        </div>
      </div>

      <div>
        <label htmlFor="summary" className={LABEL_CLASSES}>
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          defaultValue={announcement?.summary ?? ""}
          placeholder="A short summary shown in the announcements list."
          disabled={isSubmitting}
          required
          rows={2}
          className={FIELD_CLASSES}
        />
      </div>

      <div>
        <label htmlFor="content" className={LABEL_CLASSES}>
          Content
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={announcement?.content ?? ""}
          disabled={isSubmitting}
          required
          rows={8}
          className={FIELD_CLASSES}
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
            defaultValue={announcement?.status ?? "draft"}
            disabled={isSubmitting}
            className={FIELD_CLASSES}
          >
            {ANNOUNCEMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ANNOUNCEMENT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="priority" className={LABEL_CLASSES}>
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={announcement?.priority ?? "normal"}
            disabled={isSubmitting}
            className={FIELD_CLASSES}
          >
            {ANNOUNCEMENT_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {ANNOUNCEMENT_PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="publishedAt" className={LABEL_CLASSES}>
            Published Date (optional)
          </label>
          <input
            id="publishedAt"
            name="publishedAt"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(announcement?.published_at ?? null)}
            disabled={isSubmitting}
            className={FIELD_CLASSES}
          />
          <p className="mt-1 text-xs text-[#666666]">
            Leave blank to publish immediately with the current date and time.
          </p>
        </div>

        <div>
          <label htmlFor="expiresAt" className={LABEL_CLASSES}>
            Expiry Date (optional)
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(announcement?.expires_at ?? null)}
            disabled={isSubmitting}
            className={FIELD_CLASSES}
          />
          <p className="mt-1 text-xs text-[#666666]">
            After this date, members will no longer see this announcement.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-[#111111]">
        <input
          type="checkbox"
          name="isPinned"
          defaultChecked={announcement?.is_pinned ?? false}
          disabled={isSubmitting}
        />
        Pin this announcement to the top of the list
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create Announcement"
              : "Save Changes"}
        </Button>
        <Button href="/admin/announcements" variant="outline">
          {mode === "create" ? "Cancel" : "Back to Announcements"}
        </Button>
      </div>
    </form>
  );
}
