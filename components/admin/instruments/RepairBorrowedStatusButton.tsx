"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { repairFalseBorrowedStatus } from "@/app/admin/instruments/actions";

interface RepairBorrowedStatusButtonProps {
  instrumentId: string;
  instrumentName: string;
  className?: string;
}

/**
 * The one explicit repair path for a data-inconsistent instrument (raw
 * status "borrowed" with no matching borrowing record behind it) — see
 * repairFalseBorrowedStatus in app/admin/instruments/actions.ts. Mirrors
 * ArchiveInstrumentButton's confirm/transition/inline-error pattern rather
 * than inventing a new one. This is deliberately not part of the normal
 * Edit status dropdown; it only ever renders where the detail page has
 * already determined the inconsistency is real (case D).
 */
export default function RepairBorrowedStatusButton({
  instrumentId,
  instrumentName,
  className = "",
}: RepairBorrowedStatusButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const confirmed = window.confirm(
      `Reset "${instrumentName}" to Available? Only do this if you've confirmed it isn't actually out on loan — this does not affect any borrowing history.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await repairFalseBorrowedStatus(instrumentId);

      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-sm border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-800 transition-colors duration-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Resetting..." : "Reset Status to Available"}
      </button>
      {error && <span className="mt-1.5 text-xs text-red-600">{error}</span>}
    </div>
  );
}
