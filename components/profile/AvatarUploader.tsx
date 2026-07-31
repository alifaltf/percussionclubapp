"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CameraIcon } from "@/components/ui/icons";
import { uploadAvatar, type AvatarState } from "@/app/profile/actions";
import { getInitials } from "@/utils/get-initials";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const INITIAL_STATE: AvatarState = { status: "idle", message: null };

interface AvatarUploaderProps {
  displayName: string;
  initialAvatarUrl: string | null;
}

export default function AvatarUploader({
  displayName,
  initialAvatarUrl,
}: AvatarUploaderProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    uploadAvatar,
    INITIAL_STATE,
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = state.avatarUrl ?? initialAvatarUrl ?? undefined;
  const initials = getInitials(displayName);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPreviewError("Please choose a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setPreviewError("Image must be 2MB or smaller.");
      event.target.value = "";
      return;
    }

    setPreviewError(null);
    formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col items-center"
    >
      <div className="relative">
        <span className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#E8E8E8] bg-[#F8F8F6] text-xl font-semibold text-[#111111]">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            initials
          )}
          {isPending && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#C8A928] border-t-transparent" />
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          aria-label="Change profile picture"
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#666666] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CameraIcon className="h-4 w-4" />
        </button>

        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="mt-3 min-h-[1.25rem] text-center" aria-live="polite">
        {previewError && (
          <p role="alert" className="text-xs text-red-600">
            {previewError}
          </p>
        )}
        {!previewError && state.status === "error" && (
          <p role="alert" className="text-xs text-red-600">
            {state.message}
          </p>
        )}
        {!previewError && state.status === "success" && (
          <p className="text-xs text-[#9E8217]">{state.message}</p>
        )}
        {!previewError && isPending && (
          <p className="text-xs text-[#666666]">Uploading...</p>
        )}
      </div>

      <p className="text-xs text-[#666666]">JPG, PNG or WebP · Max 2MB</p>
    </form>
  );
}
