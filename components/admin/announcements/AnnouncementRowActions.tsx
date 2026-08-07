"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  archiveAnnouncement,
  publishAnnouncement,
  restoreAnnouncement,
  setAnnouncementPinned,
  unpublishAnnouncement,
} from "@/app/admin/announcements/actions";
import type { Announcement } from "@/types/announcement";

interface AnnouncementRowActionsProps {
  announcement: Announcement;
  /** Navigate here after archive/restore instead of refreshing in place — used on the edit page. */
  redirectOnArchiveTo?: string;
  /** Hide the "Edit" link — used on the edit page itself. */
  showEditLink?: boolean;
  className?: string;
}

type PendingAction = "publish" | "unpublish" | "pin" | "archive" | null;

const LINK_CLASSES =
  "text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-60";

export default function AnnouncementRowActions({
  announcement,
  redirectOnArchiveTo,
  showEditLink = true,
  className = "",
}: AnnouncementRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);

  const isArchived = Boolean(announcement.archived_at);

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
    run("publish", () => publishAnnouncement(announcement.id));
  }

  function handleUnpublish() {
    const confirmed = window.confirm(
      `Move "${announcement.title}" back to draft? It will no longer be visible to members.`,
    );
    if (!confirmed) return;
    run("unpublish", () => unpublishAnnouncement(announcement.id));
  }

  function handlePinToggle() {
    run("pin", () => setAnnouncementPinned(announcement.id, !announcement.is_pinned));
  }

  function handleArchiveToggle() {
    const confirmMessage = isArchived
      ? `Restore "${announcement.title}"? It will be visible again.`
      : `Archive "${announcement.title}"? It will no longer be visible to members.`;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;
    run("archive", () =>
      isArchived ? restoreAnnouncement(announcement.id) : archiveAnnouncement(announcement.id),
    );
  }

  return (
    <div className={`flex flex-col items-end gap-1.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {showEditLink && (
          <Link
            href={`/admin/announcements/${announcement.id}/edit`}
            className="text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
          >
            Edit
          </Link>
        )}

        {announcement.status === "published" ? (
          <button type="button" onClick={handleUnpublish} disabled={isPending} className={LINK_CLASSES}>
            {isPending && pendingAction === "unpublish" ? "Unpublishing..." : "Unpublish"}
          </button>
        ) : (
          <button type="button" onClick={handlePublish} disabled={isPending} className={LINK_CLASSES}>
            {isPending && pendingAction === "publish" ? "Publishing..." : "Publish"}
          </button>
        )}

        <button type="button" onClick={handlePinToggle} disabled={isPending} className={LINK_CLASSES}>
          {isPending && pendingAction === "pin"
            ? "Saving..."
            : announcement.is_pinned
              ? "Unpin"
              : "Pin"}
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
