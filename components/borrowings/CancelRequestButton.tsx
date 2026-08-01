"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMyRequest } from "@/app/my-requests/actions";

interface CancelRequestButtonProps {
  requestId: string;
  instrumentName: string;
}

export default function CancelRequestButton({
  requestId,
  instrumentName,
}: CancelRequestButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const confirmed = window.confirm(`Cancel your request for "${instrumentName}"?`);
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await cancelMyRequest(requestId);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Cancelling..." : "Cancel"}
      </button>
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </div>
  );
}
