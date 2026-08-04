"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches most storage bucket configs
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploadFieldProps {
  /** Field label, e.g. "Image" or "Banner Image". */
  label?: string;
  /** Alt text for the preview thumbnail. */
  previewAlt?: string;
  /** Icon shown in the placeholder state, before any image is selected/present. */
  placeholderIcon: ReactNode;
  initialImageUrl?: string | null;
  onFileSelected: (file: File | null) => void;
  uploadProgress: number | null;
  disabled?: boolean;
  error?: string | null;
  /** Overrides the 5MB default — gallery covers allow up to 8MB. */
  maxSizeBytes?: number;
}

/**
 * Shared image-upload control used by both the instrument and event admin
 * forms — local preview, size/type validation, and an upload-progress bar.
 * The actual upload (and its bucket) is the caller's responsibility; this
 * component only picks and validates the file.
 */
export default function ImageUploadField({
  label = "Image",
  previewAlt = "Preview",
  placeholderIcon,
  initialImageUrl = null,
  onFileSelected,
  uploadProgress,
  disabled = false,
  error = null,
  maxSizeBytes = DEFAULT_MAX_FILE_SIZE,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl);
  const [localError, setLocalError] = useState<string | null>(null);
  const maxSizeMb = Math.round(maxSizeBytes / (1024 * 1024));

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("Please choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > maxSizeBytes) {
      setLocalError(`Image must be ${maxSizeMb}MB or smaller.`);
      event.target.value = "";
      return;
    }

    setLocalError(null);
    setPreviewUrl(URL.createObjectURL(file));
    onFileSelected(file);
  }

  const displayedError = localError || error;

  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-[#666666]">
        {label}
      </label>
      <div className="mt-1.5 flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#E8E8E8] bg-[#F8F8F6]">
          {previewUrl ? (
            // Local blob: previews from a freshly-selected file can't be
            // optimized by next/image, so a plain <img> is used here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={previewAlt}
              className="h-full w-full object-cover"
            />
          ) : (
            placeholderIcon
          )}
        </div>

        <div className="flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-sm border border-[#E8E8E8] px-3 py-1.5 text-sm font-medium text-[#111111] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {previewUrl ? "Replace Image" : "Upload Image"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
          />
          <p className="mt-1.5 text-xs text-[#666666]">JPG, PNG or WebP · Max {maxSizeMb}MB</p>

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

          {displayedError && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {displayedError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
