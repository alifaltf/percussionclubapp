"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import GalleryImageCard from "@/components/admin/gallery/GalleryImageCard";
import { CameraIcon, GalleryIcon } from "@/components/ui/icons";
import { uploadGalleryImages } from "@/lib/supabase/storage";
import { addGalleryImages, reorderGalleryImages } from "@/app/admin/gallery/actions";
import type { GalleryImage } from "@/types/gallery";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AlbumImageManagerProps {
  albumId: string;
  initialImages: GalleryImage[];
  coverImageUrl: string | null;
}

export default function AlbumImageManager({
  albumId,
  initialImages,
  coverImageUrl,
}: AlbumImageManagerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [cover, setCover] = useState(coverImageUrl);
  const [orderDirty, setOrderDirty] = useState(false);
  const [isSavingOrder, startSavingOrder] = useTransition();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [uploadFailures, setUploadFailures] = useState<{ name: string; message: string }[]>([]);

  // Re-sync local state whenever the server-fetched props change (after a
  // router.refresh() following a successful mutation), using the React-docs
  // "adjust state during render" pattern rather than an effect — this keeps
  // local state in sync with the database as the source of truth without an
  // extra render pass. See https://react.dev/learn/you-might-not-need-an-effect
  const [prevInitialImages, setPrevInitialImages] = useState(initialImages);
  if (initialImages !== prevInitialImages) {
    setPrevInitialImages(initialImages);
    setImages(initialImages);
    setOrderDirty(false);
  }

  const [prevCoverImageUrl, setPrevCoverImageUrl] = useState(coverImageUrl);
  if (coverImageUrl !== prevCoverImageUrl) {
    setPrevCoverImageUrl(coverImageUrl);
    setCover(coverImageUrl);
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const validFiles: File[] = [];
    const immediateFailures: { name: string; message: string }[] = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        immediateFailures.push({ name: file.name, message: "Unsupported file type." });
      } else if (file.size > 8 * 1024 * 1024) {
        immediateFailures.push({ name: file.name, message: "Larger than 8MB." });
      } else {
        validFiles.push(file);
      }
    }

    setUploadFailures(immediateFailures);
    if (validFiles.length === 0) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setUploadProgress(new Map(validFiles.map((file) => [file.name, 0])));

    const { succeeded, failed } = await uploadGalleryImages(albumId, validFiles, (index, percent) => {
      setUploadProgress((prev) => {
        const next = new Map(prev);
        next.set(validFiles[index].name, percent);
        return next;
      });
    });

    setUploadFailures([
      ...immediateFailures,
      ...failed.map((failure) => ({ name: failure.file.name, message: failure.message })),
    ]);

    if (succeeded.length > 0) {
      const result = await addGalleryImages(
        albumId,
        succeeded.map((item) => ({ imageUrl: item.publicUrl, storagePath: item.path })),
      );
      if (result.status === "error") {
        setUploadFailures((prev) => [
          ...prev,
          ...succeeded.map((item) => ({ name: item.file.name, message: result.message })),
        ]);
      }
    }

    setIsUploading(false);
    setUploadProgress(new Map());
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  function moveImage(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    setOrderDirty(true);
  }

  function handleSaveOrder() {
    startSavingOrder(async () => {
      const order = images.map((image, index) => ({ id: image.id, displayOrder: index }));
      const result = await reorderGalleryImages(albumId, order);
      if (result.status === "success") {
        setOrderDirty(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-[#F8F8F6] p-6 text-center">
        <CameraIcon className="mx-auto h-8 w-8 text-[#C8A928]/60" />
        <p className="mt-2 text-sm text-[#666666]">
          Upload photos to this album — JPG, PNG or WebP, up to 8MB each.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="mt-3 inline-flex items-center gap-2 rounded-sm border border-[#E8E8E8] bg-white px-4 py-2 text-sm font-medium text-[#111111] transition-colors duration-300 hover:border-[#C8A928] hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Choose Photos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          disabled={isUploading}
          className="hidden"
        />

        {uploadProgress.size > 0 && (
          <div className="mx-auto mt-4 max-w-sm space-y-2 text-left">
            {Array.from(uploadProgress.entries()).map(([name, percent]) => (
              <div key={name}>
                <p className="truncate text-xs text-[#666666]">{name}</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8E8E8]">
                  <div
                    className="h-full bg-[#C8A928] transition-all duration-150"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {uploadFailures.length > 0 && (
          <div className="mx-auto mt-4 max-w-sm text-left">
            <p className="text-xs font-medium text-red-600">
              {uploadFailures.length} file(s) failed to upload:
            </p>
            <ul className="mt-1 space-y-0.5">
              {uploadFailures.map((failure, index) => (
                <li key={index} className="text-xs text-red-600">
                  {failure.name} — {failure.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {images.length === 0 ? (
        <EmptyState
          icon={<GalleryIcon className="h-5 w-5" />}
          title="No photos yet"
          description="Upload photos above to start building this album."
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#666666]">
              {images.length} photo{images.length === 1 ? "" : "s"}
            </p>
            {orderDirty && (
              <Button type="button" variant="outline" onClick={handleSaveOrder} disabled={isSavingOrder}>
                {isSavingOrder ? "Saving Order..." : "Save Order"}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {images.map((image, index) => (
              <GalleryImageCard
                key={image.id}
                albumId={albumId}
                image={image}
                isCover={cover === image.image_url}
                canMoveUp={index > 0}
                canMoveDown={index < images.length - 1}
                onMove={(direction) => moveImage(index, direction)}
                onDeleted={() => router.refresh()}
                onCoverChanged={() => router.refresh()}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
