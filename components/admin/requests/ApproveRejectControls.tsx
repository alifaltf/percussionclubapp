"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { approveRequest, rejectRequest } from "@/app/admin/requests/actions";

interface ApproveRejectControlsProps {
  requestId: string;
  instrumentName: string;
  memberName: string;
}

export default function ApproveRejectControls({
  requestId,
  instrumentName,
  memberName,
}: ApproveRejectControlsProps) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    const confirmed = window.confirm(
      `Approve ${memberName}'s request for "${instrumentName}"? The instrument will be marked as borrowed.`,
    );
    if (!confirmed) return;

    setError(null);
    setPendingAction("approve");
    startTransition(async () => {
      const result = await approveRequest(requestId, adminNote.trim() || undefined);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  function handleReject() {
    const confirmed = window.confirm(
      `Reject ${memberName}'s request for "${instrumentName}"?`,
    );
    if (!confirmed) return;

    setError(null);
    setPendingAction("reject");
    startTransition(async () => {
      const result = await rejectRequest(requestId, adminNote.trim() || undefined);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-sm border border-[#E8E8E8] p-4">
      <label
        htmlFor="adminNote"
        className="text-xs font-medium uppercase tracking-wide text-[#666666]"
      >
        Admin Note (optional)
      </label>
      <textarea
        id="adminNote"
        rows={2}
        value={adminNote}
        onChange={(event) => setAdminNote(event.target.value)}
        disabled={isPending}
        placeholder="Visible to the member — explain a rejection, or add pickup instructions."
        className="mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6]"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex items-center gap-3">
        <Button type="button" onClick={handleApprove} disabled={isPending}>
          {isPending && pendingAction === "approve" ? "Approving..." : "Approve"}
        </Button>
        <Button type="button" variant="outline" onClick={handleReject} disabled={isPending}>
          {isPending && pendingAction === "reject" ? "Rejecting..." : "Reject"}
        </Button>
      </div>
    </div>
  );
}
