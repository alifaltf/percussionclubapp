"use client";

import { useActionState, useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import { CameraIcon } from "@/components/ui/icons";
import { uploadSiteAsset } from "@/lib/supabase/storage";
import { IMAGE_UPLOAD_LIMITS } from "@/lib/upload-limits";
import { updateGeneralSettings } from "@/app/admin/settings/actions";
import type { SettingsActionState, SiteSettings } from "@/types/settings";

const INITIAL_STATE: SettingsActionState = { status: "idle", message: null };

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6] disabled:text-[#666666]";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";

interface GeneralSettingsFormProps {
  settings: SiteSettings;
}

export default function GeneralSettingsForm({ settings }: GeneralSettingsFormProps) {
  const [state, formAction, isSubmitting] = useActionState(updateGeneralSettings, INITIAL_STATE);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoProgress, setLogoProgress] = useState<number | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconProgress, setFaviconProgress] = useState<number | null>(null);
  const [faviconError, setFaviconError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const busy = isSubmitting || isUploading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLogoError(null);
    setFaviconError(null);

    const formData = new FormData(event.currentTarget);

    if (logoFile || faviconFile) {
      setIsUploading(true);
      try {
        if (logoFile) {
          setLogoProgress(0);
          const { publicUrl } = await uploadSiteAsset("logo", logoFile, setLogoProgress);
          formData.set("logoUrl", publicUrl);
        }
        if (faviconFile) {
          setFaviconProgress(0);
          const { publicUrl } = await uploadSiteAsset("favicon", faviconFile, setFaviconProgress);
          formData.set("faviconUrl", publicUrl);
        }
      } catch (err) {
        setIsUploading(false);
        setLogoProgress(null);
        setFaviconProgress(null);
        const message = err instanceof Error ? err.message : "Upload failed.";
        if (logoFile) setLogoError(message);
        else setFaviconError(message);
        return;
      }
      setIsUploading(false);
    }

    formAction(formData);
  }

  function handleReset() {
    setLogoFile(null);
    setLogoProgress(null);
    setLogoError(null);
    setFaviconFile(null);
    setFaviconProgress(null);
    setFaviconError(null);
  }

  return (
    <form onSubmit={handleSubmit} onReset={handleReset} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ImageUploadField
          label="Club Logo"
          previewAlt="Club logo preview"
          placeholderIcon={<CameraIcon className="h-8 w-8 text-[#C8A928]/50" />}
          initialImageUrl={settings.logo_url}
          onFileSelected={setLogoFile}
          uploadProgress={logoProgress}
          disabled={busy}
          error={logoError}
          maxSizeBytes={IMAGE_UPLOAD_LIMITS.siteAsset}
        />
        <ImageUploadField
          label="Favicon"
          previewAlt="Favicon preview"
          placeholderIcon={<CameraIcon className="h-8 w-8 text-[#C8A928]/50" />}
          initialImageUrl={settings.favicon_url}
          onFileSelected={setFaviconFile}
          uploadProgress={faviconProgress}
          disabled={busy}
          error={faviconError}
          maxSizeBytes={IMAGE_UPLOAD_LIMITS.siteAsset}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Club Name" name="clubName" defaultValue={settings.club_name} disabled={busy} required />
        <FormField label="Short Name" name="shortName" defaultValue={settings.short_name} disabled={busy} required />
      </div>

      <FormField label="Tagline" name="tagline" defaultValue={settings.tagline} disabled={busy} required />

      <div>
        <label htmlFor="description" className={LABEL_CLASSES}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={settings.description}
          disabled={busy}
          rows={3}
          required
          className={FIELD_CLASSES}
        />
      </div>

      <div aria-live="polite" className="min-h-[1.25rem]">
        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
        {state.status === "success" && <p className="text-sm text-[#9E8217]">{state.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {isUploading ? "Uploading..." : isSubmitting ? "Saving..." : "Save General Settings"}
        </Button>
        <Button type="reset" variant="outline" disabled={busy}>
          Reset
        </Button>
      </div>
    </form>
  );
}
