"use client";

import { useActionState, useState } from "react";
import Button from "@/components/ui/Button";
import {
  CONDITION_LABELS,
  INSTRUMENT_CONDITIONS,
  INSTRUMENT_STATUSES,
  STATUS_LABELS,
  type InstrumentCondition,
} from "@/types/instrument";
import type { BorrowRequestActionResult } from "@/app/admin/requests/actions";

const INITIAL_STATE: BorrowRequestActionResult = { status: "idle", message: "" };

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6]";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";

// Statuses that make sense as the outcome of a return — a returned
// instrument shouldn't land back in "pending" or "borrowed".
const RETURN_OUTCOME_STATUSES = INSTRUMENT_STATUSES.filter(
  (status) => status !== "pending" && status !== "borrowed",
);

interface CompleteReturnFormProps {
  currentCondition: InstrumentCondition | null;
  action: (
    prevState: BorrowRequestActionResult,
    formData: FormData,
  ) => Promise<BorrowRequestActionResult>;
}

export default function CompleteReturnForm({ currentCondition, action }: CompleteReturnFormProps) {
  const [state, formAction, isSubmitting] = useActionState(action, INITIAL_STATE);
  const [damageReported, setDamageReported] = useState(false);

  if (state.status === "success") {
    return (
      <div className="rounded-sm border border-[#C8A928]/40 bg-[#C8A928]/5 px-4 py-3">
        <p className="text-sm font-medium text-[#111111]">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 rounded-sm border border-[#E8E8E8] p-4">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="conditionAfter" className={LABEL_CLASSES}>
            Condition at Return
          </label>
          <select
            id="conditionAfter"
            name="conditionAfter"
            defaultValue={currentCondition || "good"}
            disabled={isSubmitting}
            className={FIELD_CLASSES}
          >
            {INSTRUMENT_CONDITIONS.map((value) => (
              <option key={value} value={value}>
                {CONDITION_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="finalInstrumentStatus" className={LABEL_CLASSES}>
            Instrument Status After Return
          </label>
          <select
            id="finalInstrumentStatus"
            name="finalInstrumentStatus"
            defaultValue="available"
            disabled={isSubmitting}
            className={FIELD_CLASSES}
          >
            {RETURN_OUTCOME_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="verificationNote" className={LABEL_CLASSES}>
          Verification Note (optional)
        </label>
        <textarea
          id="verificationNote"
          name="verificationNote"
          rows={2}
          disabled={isSubmitting}
          className={FIELD_CLASSES}
        />
      </div>

      <div className="rounded-sm border border-[#E8E8E8] p-3">
        <label className="flex items-center gap-2 text-sm text-[#111111]">
          <input
            type="checkbox"
            name="damageReported"
            checked={damageReported}
            onChange={(event) => setDamageReported(event.target.checked)}
            disabled={isSubmitting}
          />
          Damage found on this return
        </label>

        {damageReported && (
          <div className="mt-3">
            <label htmlFor="damageNotes" className={LABEL_CLASSES}>
              Damage Notes
            </label>
            <textarea
              id="damageNotes"
              name="damageNotes"
              rows={2}
              required={damageReported}
              disabled={isSubmitting}
              className={FIELD_CLASSES}
            />
          </div>
        )}
      </div>

      <div aria-live="polite" className="min-h-[1.25rem]">
        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Verify & Complete Return"}
      </Button>
    </form>
  );
}
