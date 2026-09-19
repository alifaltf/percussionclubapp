"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import { CameraIcon } from "@/components/ui/icons";
import { uploadSiteAsset } from "@/lib/supabase/storage";
import { IMAGE_UPLOAD_LIMITS } from "@/lib/upload-limits";
import { updateHomepageSettings } from "@/app/admin/settings/actions";
import type { SettingsActionState, SiteSettings } from "@/types/settings";

const INITIAL_STATE: SettingsActionState = { status: "idle", message: null };

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6] disabled:text-[#666666]";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";

type SiteAssetKind = "hero-1" | "hero-2" | "hero-3" | "hero-4" | "about";

interface HomepageImageFieldProps {
  label: string;
  previewAlt: string;
  currentUrl: string | null;
  onFileSelected: (file: File | null) => void;
  uploadProgress: number | null;
  disabled: boolean;
  error: string | null;
}

/** A single Hero/About image slot — ImageUploadField plus a note when no
 * custom image has been uploaded yet, since the public site silently falls
 * back to the original hardcoded photo in that case and the admin should
 * know that's what's currently showing. */
function HomepageImageField({
  label,
  previewAlt,
  currentUrl,
  onFileSelected,
  uploadProgress,
  disabled,
  error,
}: HomepageImageFieldProps) {
  return (
    <div>
      <ImageUploadField
        label={label}
        previewAlt={previewAlt}
        placeholderIcon={<CameraIcon className="h-8 w-8 text-[#C8A928]/50" />}
        initialImageUrl={currentUrl}
        onFileSelected={onFileSelected}
        uploadProgress={uploadProgress}
        disabled={disabled}
        error={error}
        maxSizeBytes={IMAGE_UPLOAD_LIMITS.siteAsset}
      />
      {!currentUrl && (
        <p className="mt-1.5 text-xs text-[#666666]">
          No custom image uploaded — the public site is currently showing the default photo.
        </p>
      )}
    </div>
  );
}

interface HomepageSettingsFormProps {
  settings: SiteSettings;
}

export default function HomepageSettingsForm({ settings }: HomepageSettingsFormProps) {
  const [state, formAction, isSubmitting] = useActionState(updateHomepageSettings, INITIAL_STATE);

  const [heroImage1File, setHeroImage1File] = useState<File | null>(null);
  const [heroImage1Progress, setHeroImage1Progress] = useState<number | null>(null);
  const [heroImage1Error, setHeroImage1Error] = useState<string | null>(null);

  const [heroImage2File, setHeroImage2File] = useState<File | null>(null);
  const [heroImage2Progress, setHeroImage2Progress] = useState<number | null>(null);
  const [heroImage2Error, setHeroImage2Error] = useState<string | null>(null);

  const [heroImage3File, setHeroImage3File] = useState<File | null>(null);
  const [heroImage3Progress, setHeroImage3Progress] = useState<number | null>(null);
  const [heroImage3Error, setHeroImage3Error] = useState<string | null>(null);

  const [heroImage4File, setHeroImage4File] = useState<File | null>(null);
  const [heroImage4Progress, setHeroImage4Progress] = useState<number | null>(null);
  const [heroImage4Error, setHeroImage4Error] = useState<string | null>(null);

  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [aboutImageProgress, setAboutImageProgress] = useState<number | null>(null);
  const [aboutImageError, setAboutImageError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const busy = isSubmitting || isUploading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHeroImage1Error(null);
    setHeroImage2Error(null);
    setHeroImage3Error(null);
    setHeroImage4Error(null);
    setAboutImageError(null);

    const formData = new FormData(event.currentTarget);
    // Note: unlike an earlier version of this form, no "current image URL"
    // is sent here. Old-file cleanup now reads each previous URL itself,
    // server-side, from the database (see getCurrentSiteAssetUrls in
    // lib/supabase/settings.ts) rather than trusting a client-supplied
    // value for a destructive Storage delete.

    const uploads: Array<{
      file: File | null;
      kind: SiteAssetKind;
      formField: string;
      setProgress: (value: number | null) => void;
      setError: (value: string | null) => void;
    }> = [
      {
        file: heroImage1File,
        kind: "hero-1",
        formField: "heroImage1Url",
        setProgress: setHeroImage1Progress,
        setError: setHeroImage1Error,
      },
      {
        file: heroImage2File,
        kind: "hero-2",
        formField: "heroImage2Url",
        setProgress: setHeroImage2Progress,
        setError: setHeroImage2Error,
      },
      {
        file: heroImage3File,
        kind: "hero-3",
        formField: "heroImage3Url",
        setProgress: setHeroImage3Progress,
        setError: setHeroImage3Error,
      },
      {
        file: heroImage4File,
        kind: "hero-4",
        formField: "heroImage4Url",
        setProgress: setHeroImage4Progress,
        setError: setHeroImage4Error,
      },
      {
        file: aboutImageFile,
        kind: "about",
        formField: "aboutImageUrl",
        setProgress: setAboutImageProgress,
        setError: setAboutImageError,
      },
    ];

    const filesToUpload = uploads.filter((upload) => upload.file);

    if (filesToUpload.length > 0) {
      setIsUploading(true);
      for (const upload of filesToUpload) {
        upload.setProgress(0);
        try {
          const { publicUrl } = await uploadSiteAsset(upload.kind, upload.file as File, upload.setProgress);
          formData.set(upload.formField, publicUrl);
        } catch (err) {
          setIsUploading(false);
          upload.setProgress(null);
          upload.setError(err instanceof Error ? err.message : "Upload failed.");
          return;
        }
      }
      setIsUploading(false);
    }

    // formAction is useActionState's dispatch — safe to call only as a
    // form action/formAction prop (which React wraps in a transition
    // automatically) or manually inside startTransition. Calling it bare
    // after the async uploads above throws "An async function with
    // useActionState was called outside of a transition".
    startTransition(() => {
      formAction(formData);
    });
  }

  function handleReset() {
    setHeroImage1File(null);
    setHeroImage1Progress(null);
    setHeroImage1Error(null);
    setHeroImage2File(null);
    setHeroImage2Progress(null);
    setHeroImage2Error(null);
    setHeroImage3File(null);
    setHeroImage3Progress(null);
    setHeroImage3Error(null);
    setHeroImage4File(null);
    setHeroImage4Progress(null);
    setHeroImage4Error(null);
    setAboutImageFile(null);
    setAboutImageProgress(null);
    setAboutImageError(null);
  }

  return (
    <form onSubmit={handleSubmit} onReset={handleReset} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Hero Heading"
          name="heroHeading"
          defaultValue={settings.hero_heading}
          disabled={busy}
          required
        />
        <FormField
          label="Hero Subheading"
          name="heroSubheading"
          defaultValue={settings.hero_subheading}
          disabled={busy}
          required
        />
      </div>

      <div>
        <p className={LABEL_CLASSES}>Hero Images (4 slides)</p>
        <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <HomepageImageField
            label="Hero Image 1"
            previewAlt="Hero slide 1 preview"
            currentUrl={settings.hero_image_1_url}
            onFileSelected={setHeroImage1File}
            uploadProgress={heroImage1Progress}
            disabled={busy}
            error={heroImage1Error}
          />
          <HomepageImageField
            label="Hero Image 2"
            previewAlt="Hero slide 2 preview"
            currentUrl={settings.hero_image_2_url}
            onFileSelected={setHeroImage2File}
            uploadProgress={heroImage2Progress}
            disabled={busy}
            error={heroImage2Error}
          />
          <HomepageImageField
            label="Hero Image 3"
            previewAlt="Hero slide 3 preview"
            currentUrl={settings.hero_image_3_url}
            onFileSelected={setHeroImage3File}
            uploadProgress={heroImage3Progress}
            disabled={busy}
            error={heroImage3Error}
          />
          <HomepageImageField
            label="Hero Image 4"
            previewAlt="Hero slide 4 preview"
            currentUrl={settings.hero_image_4_url}
            onFileSelected={setHeroImage4File}
            uploadProgress={heroImage4Progress}
            disabled={busy}
            error={heroImage4Error}
          />
        </div>
      </div>

      <FormField
        label="About Heading"
        name="aboutHeading"
        defaultValue={settings.about_heading}
        disabled={busy}
        required
      />

      <div>
        <label htmlFor="aboutText" className={LABEL_CLASSES}>
          About Text
        </label>
        <textarea
          id="aboutText"
          name="aboutText"
          defaultValue={settings.about_text}
          disabled={busy}
          rows={4}
          required
          className={FIELD_CLASSES}
        />
      </div>

      <HomepageImageField
        label="About Club Image"
        previewAlt="About Club image preview"
        currentUrl={settings.about_image_url}
        onFileSelected={setAboutImageFile}
        uploadProgress={aboutImageProgress}
        disabled={busy}
        error={aboutImageError}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Join Us URL"
          name="joinUsUrl"
          placeholder="/contact"
          defaultValue={settings.join_us_url}
          disabled={busy}
          required
        />
        <FormField
          label="Contact CTA Text"
          name="contactCtaText"
          defaultValue={settings.contact_cta_text}
          disabled={busy}
          required
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
          {isUploading ? "Uploading..." : isSubmitting ? "Saving..." : "Save Homepage Settings"}
        </Button>
        <Button type="reset" variant="outline" disabled={busy}>
          Reset
        </Button>
      </div>
    </form>
  );
}
