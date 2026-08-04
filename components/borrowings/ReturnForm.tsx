"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { CameraIcon, InstrumentIcon } from "@/components/ui/icons";
import { uploadReturnPhoto } from "@/lib/supabase/storage";
import type { BorrowingFormState } from "@/app/my-borrowings/[id]/actions";

const INITIAL_STATE: BorrowingFormState = { status: "idle", message: null };
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6] disabled:text-[#666666]";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";

interface ReturnFormProps {
  requestId: string;
  action: (
    prevState: BorrowingFormState,
    formData: FormData,
  ) => Promise<BorrowingFormState>;
}

export default function ReturnForm({ requestId, action }: ReturnFormProps) {
  const router = useRouter();
  const [state, formAction, isSubmitting] = useActionState(action, INITIAL_STATE);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // revalidatePath in the server action only invalidates the route cache —
  // it doesn't re-render this already-mounted page. Refresh explicitly so
  // the status badge and "canSubmitReturn"/"canReportDamage" gates above
  // pick up the new status instead of staying stale until a manual reload.
  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  const busy = isUploading || isSubmitting;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Please choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);

    if (!selectedFile) {
      setUploadError("Please upload a photo of the returned instrument.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const { path } = await uploadReturnPhoto(requestId, selectedFile, setUploadProgress);
      formData.set("returnPhotoPath", path);
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(null);
      setUploadError(err instanceof Error ? err.message : "Photo upload failed.");
      return;
    }
    setIsUploading(false);

    formAction(formData);
  }

  if (state.status === "success") {
    return (
      <div className="rounded-sm border border-[#C8A928]/40 bg-[#C8A928]/5 px-4 py-3">
        <p className="text-sm font-medium text-[#111111]">{state.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={LABEL_CLASSES}>Return Photo</label>
        <div className="mt-1.5 flex items-center gap-4">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#E8E8E8] bg-[#F8F8F6]">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Return preview" className="h-full w-full object-cover" />
            ) : (
              <InstrumentIcon className="h-8 w-8 text-[#C8A928]/50" />
            )}
          </div>
          <div className="flex-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-sm border border-[#E8E8E8] px-3 py-1.5 text-sm font-medium text-[#111111] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CameraIcon className="h-4 w-4" />
              {previewUrl ? "Replace Photo" : "Upload Photo"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={busy}
              className="hidden"
            />
            <p className="mt-1.5 text-xs text-[#666666]">JPG, PNG or WebP · Max 5MB</p>

            {uploadProgress !== null && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8E8E8]">
                  <div
                    className="h-full bg-[#C8A928] transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-[#666666]">Uploading... {uploadProgress}%</p>
              </div>
            )}

            {uploadError && (
              <p role="alert" className="mt-1.5 text-xs text-red-600">
                {uploadError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="returnNotes" className={LABEL_CLASSES}>
          Return Notes (optional)
        </label>
        <textarea
          id="returnNotes"
          name="returnNotes"
          rows={3}
          placeholder="Anything the admin should know about the instrument's condition?"
          disabled={busy}
          className={FIELD_CLASSES}
        />
      </div>

      <div aria-live="polite" className="min-h-[1.25rem]">
        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={busy}>
        {busy ? (isUploading ? "Uploading..." : "Submitting...") : "Submit Return"}
      </Button>
    </form>
  );
}
