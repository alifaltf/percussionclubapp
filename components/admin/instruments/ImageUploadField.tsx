"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { CameraIcon, InstrumentIcon } from "@/components/ui/icons";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches the instrument-images bucket config
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploadFieldProps {
  initialImageUrl?: string | null;
  onFileSelected: (file: File | null) => void;
  uploadProgress: number | null;
  disabled?: boolean;
  error?: string | null;
}

export default function ImageUploadField({
  initialImageUrl = null,
  onFileSelected,
  uploadProgress,
  disabled = false,
  error = null,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("Please choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setLocalError("Image must be 5MB or smaller.");
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
        Image
      </label>
      <div className="mt-1.5 flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#E8E8E8] bg-[#F8F8F6]">
          {previewUrl ? (
            // Local blob: previews from a freshly-selected file can't be
            // optimized by next/image, so a plain <img> is used here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Instrument preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <InstrumentIcon className="h-8 w-8 text-[#C8A928]/50" />
          )}
        </div>

        <div className="flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-sm border border-[#E8E8E8] px-3 py-1.5 text-sm font-medium text-[#111111] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CameraIcon className="h-4 w-4" />
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
