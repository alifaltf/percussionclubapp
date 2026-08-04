"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  XIcon,
} from "@/components/ui/icons";
import { deleteGalleryImage, setAlbumCoverFromImage, updateGalleryImage } from "@/app/admin/gallery/actions";
import type { GalleryImage } from "@/types/gallery";

interface GalleryImageCardProps {
  albumId: string;
  image: GalleryImage;
  isCover: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: "up" | "down") => void;
  onDeleted: () => void;
  onCoverChanged: () => void;
}

export default function GalleryImageCard({
  albumId,
  image,
  isCover,
  canMoveUp,
  canMoveDown,
  onMove,
  onDeleted,
  onCoverChanged,
}: GalleryImageCardProps) {
  const [caption, setCaption] = useState(image.caption ?? "");
  const [altText, setAltText] = useState(image.alt_text ?? "");
  const [isSavingDetails, startSavingDetails] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isSettingCover, startSettingCover] = useTransition();
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detailsDirty = caption !== (image.caption ?? "") || altText !== (image.alt_text ?? "");
  const busy = isSavingDetails || isDeleting || isSettingCover;

  function handleSaveDetails() {
    setError(null);
    setDetailsSaved(false);
    startSavingDetails(async () => {
      const result = await updateGalleryImage(image.id, { caption, altText });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setDetailsSaved(true);
    });
  }

  function handleDelete() {
    const confirmed = window.confirm("Remove this photo from the album? This can't be undone.");
    if (!confirmed) return;
    setError(null);
    startDeleting(async () => {
      const result = await deleteGalleryImage(image.id);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      onDeleted();
    });
  }

  function handleSetCover() {
    setError(null);
    startSettingCover(async () => {
      const result = await setAlbumCoverFromImage(albumId, image.image_url);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      onCoverChanged();
    });
  }

  return (
    <div className="flex gap-4 border border-[#E8E8E8] bg-white p-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-[#F8F8F6]">
        <Image src={image.image_url} alt={image.alt_text ?? "Gallery photo"} fill sizes="96px" className="object-cover" />
        {isCover && (
          <span className="absolute bottom-1 left-1 rounded-full bg-[#C8A928] p-1 text-white">
            <StarIcon className="h-3 w-3" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-[#666666]">
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                setDetailsSaved(false);
              }}
              disabled={busy}
              className="mt-1 w-full rounded-sm border border-[#E8E8E8] px-2.5 py-1.5 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6]"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-[#666666]">
              Alt text
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => {
                setAltText(e.target.value);
                setDetailsSaved(false);
              }}
              disabled={busy}
              placeholder="Describes the image for screen readers"
              className="mt-1 w-full rounded-sm border border-[#E8E8E8] px-2.5 py-1.5 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDetails}
            disabled={busy || !detailsDirty}
            className="text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingDetails ? "Saving..." : "Save Details"}
          </button>
          {detailsSaved && !detailsDirty && (
            <span className="text-xs text-[#666666]">Saved</span>
          )}

          <span className="text-[#E8E8E8]" aria-hidden="true">
            |
          </span>

          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={busy || !canMoveUp}
            aria-label="Move photo earlier"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={busy || !canMoveDown}
            aria-label="Move photo later"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>

          <span className="text-[#E8E8E8]" aria-hidden="true">
            |
          </span>

          <button
            type="button"
            onClick={handleSetCover}
            disabled={busy || isCover}
            className="text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSettingCover ? "Setting..." : isCover ? "Cover Photo" : "Set as Cover"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            aria-label="Remove photo"
            className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XIcon className="h-4 w-4" />
            {isDeleting ? "Removing..." : "Remove"}
          </button>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
