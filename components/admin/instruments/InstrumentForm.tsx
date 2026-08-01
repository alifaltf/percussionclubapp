"use client";

import { useActionState, useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import ImageUploadField from "@/components/admin/instruments/ImageUploadField";
import { uploadInstrumentImage } from "@/lib/supabase/storage";
import {
  CONDITION_LABELS,
  INSTRUMENT_CONDITIONS,
  INSTRUMENT_STATUSES,
  STATUS_LABELS,
  type Instrument,
} from "@/types/instrument";
import type { InstrumentFormState } from "@/app/admin/instruments/actions";

const INITIAL_STATE: InstrumentFormState = { status: "idle", message: null };

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
          <select
            id="status"
            name="status"
            defaultValue={instrument?.status ?? "available"}
            disabled={busy}
            className={FIELD_CLASSES}
          >
            {INSTRUMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
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
