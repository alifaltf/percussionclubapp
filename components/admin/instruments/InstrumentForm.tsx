"use client";

import { useActionState, useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/ui/ImageUploadField";
import { InstrumentIcon } from "@/components/ui/icons";
import { uploadInstrumentImage } from "@/lib/supabase/storage";
import {
  CONDITION_LABELS,
  INSTRUMENT_CONDITIONS,
  INSTRUMENT_STATUSES,
  STATUS_LABELS,
  type Instrument,
  type InstrumentStatus,
} from "@/types/instrument";
import type { InstrumentFormState } from "@/app/admin/instruments/actions";

const INITIAL_STATE: InstrumentFormState = { status: "idle", message: null };

// "pending" is a defined InstrumentStatus with no workflow behind it — no
// code path ever assigns it, and the return flow explicitly excludes it as
// an outcome. "borrowed" is excluded for a different reason: it's a status
// the borrowing workflow owns — the approve-request RPC is what moves an
// instrument to "borrowed", and the return workflow is what moves it away.
// Manually selecting "borrowed" here would create a false borrowed state
// with no real borrow request behind it, so it's not a normal, manually
// assignable status on this form (see the locked read-only display below
// for an instrument that's already borrowed). Both are deliberately left
// out of the selectable options so new instruments and status changes can
// never introduce them through this form.
const SELECTABLE_STATUSES: InstrumentStatus[] = INSTRUMENT_STATUSES.filter(
  (status) => status !== "pending" && status !== "borrowed",
);

/**
 * The options shown in the Status select. Always excludes "pending" and
 * "borrowed" — except when the instrument being edited already has a status
 * outside that normal list (a legacy "pending" row, or an inconsistent
 * legacy "borrowed" row with no real borrowing behind it), in which case
 * that value is kept as the sole extra option so the field still renders
 * the instrument's real value instead of silently defaulting to something
 * else on save. This only matters for pre-existing rows; new instruments
 * can never end up with either value through this form. Note: a *normal*,
 * consistent "borrowed" instrument never reaches this function at all — see
 * isLockedByBorrowing below, which replaces the select entirely for that
 * case.
 */
function statusOptions(currentStatus: InstrumentStatus | undefined): InstrumentStatus[] {
  if (currentStatus && !SELECTABLE_STATUSES.includes(currentStatus)) {
    return [currentStatus, ...SELECTABLE_STATUSES];
  }
  return SELECTABLE_STATUSES;
}

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6] disabled:text-[#666666]";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";

interface InstrumentFormProps {
  mode: "create" | "edit";
  instrument?: Instrument;
  action: (prevState: InstrumentFormState, formData: FormData) => Promise<InstrumentFormState>;
}

export default function InstrumentForm({ mode, instrument, action }: InstrumentFormProps) {
  const [state, formAction, isSubmitting] = useActionState(action, INITIAL_STATE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const busy = isUploading || isSubmitting;
  // A consistent "borrowed" instrument is never manually editable here — its
  // status is owned by the borrowing workflow (approve/return). This is
  // UI-level messaging only; the server independently enforces the same
  // rule in updateInstrument regardless of what a submitted form contains.
  const isLockedByBorrowing = mode === "edit" && instrument?.status === "borrowed";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);

    const formData = new FormData(event.currentTarget);

    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const { publicUrl } = await uploadInstrumentImage(selectedFile, setUploadProgress);
        formData.set("imageUrl", publicUrl);
      } catch (err) {
        setIsUploading(false);
        setUploadProgress(null);
        setUploadError(err instanceof Error ? err.message : "Image upload failed.");
        return;
      }
      setIsUploading(false);
    }

    if (mode === "edit" && instrument) {
      formData.set("currentImageUrl", instrument.image_url ?? "");
    }

    formAction(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ImageUploadField
        previewAlt="Instrument preview"
        placeholderIcon={<InstrumentIcon className="h-8 w-8 text-[#C8A928]/50" />}
        initialImageUrl={instrument?.image_url ?? null}
        onFileSelected={setSelectedFile}
        uploadProgress={uploadProgress}
        disabled={busy}
        error={uploadError}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Instrument Code"
          name="instrumentCode"
          defaultValue={instrument?.instrument_code}
          placeholder="conga_1"
          disabled={busy}
          required
        />
        <FormField
          label="Name"
          name="name"
          defaultValue={instrument?.name}
          disabled={busy}
          required
        />
        <FormField
          label="Category"
          name="category"
          defaultValue={instrument?.category}
          disabled={busy}
          required
        />
        <div>
          <label htmlFor="status" className={LABEL_CLASSES}>
            Status
          </label>
          {isLockedByBorrowing ? (
            <>
              {/* Preserve the real value on submit without presenting an
                  editable control — the server treats "borrowed" as
                  authoritative here regardless of this hidden input, but
                  keeping it consistent avoids relying on that alone. */}
              <input type="hidden" name="status" value="borrowed" />
              <div
                id="status"
                className={`${FIELD_CLASSES} flex cursor-not-allowed items-center bg-[#F8F8F6] text-[#666666]`}
              >
                {STATUS_LABELS.borrowed}
              </div>
              <p className="mt-1.5 text-xs text-[#666666]">
                Controlled by the Borrow Requests workflow while this instrument is on loan —
                approve its return there to change this.
              </p>
            </>
          ) : (
            <select
              id="status"
              name="status"
              defaultValue={instrument?.status ?? "available"}
              disabled={busy}
              className={FIELD_CLASSES}
            >
              {statusOptions(instrument?.status).map((value) => (
                <option key={value} value={value}>
                  {value === "pending" || value === "borrowed"
                    ? `${STATUS_LABELS[value]} (legacy)`
                    : STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label htmlFor="condition" className={LABEL_CLASSES}>
            Condition
          </label>
          <select
            id="condition"
            name="condition"
            defaultValue={instrument?.condition ?? "good"}
            disabled={busy}
            className={FIELD_CLASSES}
          >
            {INSTRUMENT_CONDITIONS.map((value) => (
              <option key={value} value={value}>
                {CONDITION_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <FormField
          label="Purchase Date"
          name="purchaseDate"
          type="date"
          defaultValue={instrument?.purchase_date ?? ""}
          disabled={busy}
        />
      </div>

      <div>
        <label htmlFor="description" className={LABEL_CLASSES}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={instrument?.description ?? ""}
          disabled={busy}
          rows={3}
          className={FIELD_CLASSES}
        />
      </div>

      <div>
        <label htmlFor="notes" className={LABEL_CLASSES}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={instrument?.notes ?? ""}
          disabled={busy}
          rows={3}
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
        <Button type="submit" disabled={busy}>
          {busy
            ? isUploading
              ? "Uploading..."
              : "Saving..."
            : mode === "create"
              ? "Add Instrument"
              : "Save Changes"}
        </Button>
        <Button href="/admin/instruments" variant="outline">
          Cancel
        </Button>
      </div>
    </form>
  );
}
