"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveInstrument, unarchiveInstrument } from "@/app/admin/instruments/actions";

interface ArchiveInstrumentButtonProps {
  instrumentId: string;
  instrumentName: string;
  isArchived: boolean;
  /** If set, navigate here after success instead of refreshing in place. */
  redirectTo?: string;
  className?: string;
}

export default function ArchiveInstrumentButton({
  instrumentId,
  instrumentName,
  isArchived,
  redirectTo,
  className = "",
}: ArchiveInstrumentButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const confirmMessage = isArchived
      ? `Unarchive "${instrumentName}"? It will become visible to members again.`
      : `Archive "${instrumentName}"? It will no longer be visible to members.`;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = isArchived
        ? await unarchiveInstrument(instrumentId)
        : await archiveInstrument(instrumentId);

      if (result.status === "error") {
        setError(result.message);
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className={`inline-flex flex-col items-end ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`text-sm font-medium transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
          isArchived
            ? "text-[#666666] hover:text-[#C8A928]"
            : "text-[#666666] hover:text-red-600"
        }`}
      >
        {isPending
          ? isArchived
            ? "Unarchiving..."
            : "Archiving..."
          : isArchived
            ? "Unarchive"
            : "Archive"}
      </button>
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </div>
  );
}
