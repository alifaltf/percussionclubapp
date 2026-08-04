"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import type { BorrowRequestFormState } from "@/app/instruments/[id]/actions";

const INITIAL_STATE: BorrowRequestFormState = { status: "idle", message: null };

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6] disabled:text-[#666666]";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";

interface RequestToBorrowFormProps {
  action: (
    prevState: BorrowRequestFormState,
    formData: FormData,
  ) => Promise<BorrowRequestFormState>;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function RequestToBorrowForm({ action }: RequestToBorrowFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isSubmitting] = useActionState(action, INITIAL_STATE);
  const [borrowDate, setBorrowDate] = useState(todayIso());

  // So the instrument's status/availability reflects the new request if the
  // member navigates back to this page instead of following the link below.
  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  if (state.status === "success") {
    return (
      <div className="rounded-sm border border-[#C8A928]/40 bg-[#C8A928]/5 px-4 py-3">
        <p className="text-sm font-medium text-[#111111]">{state.message}</p>
        <button
          type="button"
          onClick={() => router.push("/my-requests")}
          className="mt-2 text-sm font-medium text-[#C8A928] transition-colors duration-300 hover:text-[#9E8217]"
        >
          View My Requests →
        </button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <Button type="button" variant="primary" onClick={() => setIsOpen(true)}>
        Request to Borrow
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="requestedBorrowDate" className={LABEL_CLASSES}>
            Borrow Date
          </label>
          <input
            id="requestedBorrowDate"
            name="requestedBorrowDate"
            type="date"
            min={todayIso()}
            value={borrowDate}
            onChange={(event) => setBorrowDate(event.target.value)}
            disabled={isSubmitting}
            required
            className={FIELD_CLASSES}
          />
        </div>
        <div>
          <label htmlFor="requestedReturnDate" className={LABEL_CLASSES}>
            Return Date
          </label>
          <input
            id="requestedReturnDate"
            name="requestedReturnDate"
            type="date"
            min={borrowDate || todayIso()}
            disabled={isSubmitting}
            required
            className={FIELD_CLASSES}
          />
        </div>
      </div>

      <div>
        <label htmlFor="purpose" className={LABEL_CLASSES}>
          Purpose
        </label>
        <textarea
          id="purpose"
          name="purpose"
          rows={3}
          placeholder="What will you use this instrument for?"
          disabled={isSubmitting}
          required
          className={FIELD_CLASSES}
        />
      </div>

      <div aria-live="polite" className="min-h-[1.25rem]">
        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
