"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  archiveEvent,
  publishEvent,
  restoreEvent,
  setEventFeatured,
  unpublishEvent,
} from "@/app/admin/events/actions";
import type { Event } from "@/types/event";

interface EventRowActionsProps {
  event: Event;
  /** Navigate here after archive/restore instead of refreshing in place — used on the edit page. */
  redirectOnArchiveTo?: string;
  /** Hide the "Edit" link — used on the edit page itself, where it would just link to the current page. */
  showEditLink?: boolean;
  className?: string;
}

type PendingAction = "publish" | "unpublish" | "feature" | "archive" | null;

const LINK_CLASSES =
  "text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928] disabled:cursor-not-allowed disabled:opacity-60";

export default function EventRowActions({
  event,
  redirectOnArchiveTo,
  showEditLink = true,
  className = "",
}: EventRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);

  const isArchived = Boolean(event.archived_at);

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
    run("publish", () => publishEvent(event.id));
  }

  function handleUnpublish() {
    const confirmed = window.confirm(`Move "${event.title}" back to draft? It will no longer be publicly visible.`);
    if (!confirmed) return;
    run("unpublish", () => unpublishEvent(event.id));
  }

  function handleFeatureToggle() {
    run("feature", () => setEventFeatured(event.id, !event.is_featured));
  }

  function handleArchiveToggle() {
    const confirmMessage = isArchived
      ? `Restore "${event.title}"? It will be visible in the events list again.`
      : `Archive "${event.title}"? It will no longer be visible to the public.`;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;
    run("archive", () => (isArchived ? restoreEvent(event.id) : archiveEvent(event.id)));
  }

  return (
    <div className={`flex flex-col items-end gap-1.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {showEditLink && (
          <Link
            href={`/admin/events/${event.id}/edit`}
            className="text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
          >
            Edit
          </Link>
        )}

        {event.status === "published" ? (
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
            : event.is_featured
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
