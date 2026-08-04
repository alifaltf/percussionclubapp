"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  archiveAlbum,
  publishAlbum,
  restoreAlbum,
  setAlbumFeatured,
  unpublishAlbum,
} from "@/app/admin/gallery/actions";
import type { GalleryAlbumWithMeta } from "@/types/gallery";

interface AlbumRowActionsProps {
  album: GalleryAlbumWithMeta;
  /** Navigate here after archive/restore instead of refreshing in place — used on the edit page. */
  redirectOnArchiveTo?: string;
  /** Hide the "Edit" link — used on the edit page itself. */
  showEditLink?: boolean;
  className?: string;
}

type PendingAction = "publish" | "unpublish" | "feature" | "archive" | null;

const LINK_CLASSES =
  "text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-60";

export default function AlbumRowActions({
  album,
  redirectOnArchiveTo,
  showEditLink = true,
  className = "",
}: AlbumRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);

  const isArchived = Boolean(album.archived_at);

  function run(action: PendingAction, task: () => Promise<{ status: string; message: string }>) {
    setError(null);
    setPendingAction(action);
    startTransition(async () => {
      const result = await task();
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      if (action === "archive" && redirectOnArchiveTo) {
        router.push(redirectOnArchiveTo);
      } else {
        router.refresh();
      }
    });
  }

  function handlePublish() {
    run("publish", () => publishAlbum(album.id));
  }

  function handleUnpublish() {
    const confirmed = window.confirm(
      `Move "${album.title}" back to draft? It will no longer be publicly visible.`,
    );
    if (!confirmed) return;
    run("unpublish", () => unpublishAlbum(album.id));
  }

  function handleFeatureToggle() {
    run("feature", () => setAlbumFeatured(album.id, !album.is_featured));
  }

  function handleArchiveToggle() {
    const confirmMessage = isArchived
      ? `Restore "${album.title}"? It will be visible in the gallery again.`
      : `Archive "${album.title}"? It will no longer be visible to the public.`;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;
    run("archive", () => (isArchived ? restoreAlbum(album.id) : archiveAlbum(album.id)));
  }

  return (
    <div className={`flex flex-col items-end gap-1.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {showEditLink && (
          <Link
            href={`/admin/gallery/${album.id}/edit`}
            className="text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
          >
            Edit
          </Link>
        )}

        {album.status === "published" ? (
          <button type="button" onClick={handleUnpublish} disabled={isPending} className={LINK_CLASSES}>
            {isPending && pendingAction === "unpublish" ? "Unpublishing..." : "Unpublish"}
          </button>
        ) : (
          <button type="button" onClick={handlePublish} disabled={isPending} className={LINK_CLASSES}>
            {isPending && pendingAction === "publish" ? "Publishing..." : "Publish"}
          </button>
        )}

        <button type="button" onClick={handleFeatureToggle} disabled={isPending} className={LINK_CLASSES}>
          {isPending && pendingAction === "feature"
            ? "Saving..."
            : album.is_featured
              ? "Unfeature"
              : "Feature"}
        </button>

        <button
          type="button"
          onClick={handleArchiveToggle}
          disabled={isPending}
          className={`${LINK_CLASSES} ${isArchived ? "" : "hover:text-red-600"}`}
        >
          {isPending && pendingAction === "archive"
            ? isArchived
              ? "Restoring..."
              : "Archiving..."
            : isArchived
              ? "Restore"
              : "Archive"}
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
