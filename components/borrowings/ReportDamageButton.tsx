"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { AlertTriangleIcon } from "@/components/ui/icons";
import type { BorrowingFormState } from "@/app/my-borrowings/[id]/actions";

const INITIAL_STATE: BorrowingFormState = { status: "idle", message: null };

interface ReportDamageButtonProps {
  action: (
    prevState: BorrowingFormState,
    formData: FormData,
  ) => Promise<BorrowingFormState>;
}

export default function ReportDamageButton({ action }: ReportDamageButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isSubmitting] = useActionState(action, INITIAL_STATE);

  // Keep the rest of the page (damage badge, etc.) in sync after a
  // successful report instead of leaving it stale until reload.
  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  if (state.status === "success") {
    return (
      <div className="rounded-sm border border-amber-300 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-[#111111]">{state.message}</p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-red-600"
      >
        <AlertTriangleIcon className="h-4 w-4" />
        Report Damage
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-sm border border-[#E8E8E8] p-4">
      <label
        htmlFor="damageNotes"
        className="text-xs font-medium uppercase tracking-wide text-[#666666]"
      >
        Describe the Damage
      </label>
      <textarea
        id="damageNotes"
        name="damageNotes"
        rows={3}
        required
        disabled={isSubmitting}
        placeholder="What happened, and what part of the instrument is affected?"
        className="mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6]"
      />

      <div aria-live="polite" className="min-h-[1.25rem] mt-1.5">
        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Reporting..." : "Report Damage"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
