"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import { updateContactSettings } from "@/app/admin/settings/actions";
import type { SettingsActionState, SiteSettings } from "@/types/settings";

const INITIAL_STATE: SettingsActionState = { status: "idle", message: null };

interface ContactSettingsFormProps {
  settings: SiteSettings;
}

export default function ContactSettingsForm({ settings }: ContactSettingsFormProps) {
  const [state, formAction, isSubmitting] = useActionState(updateContactSettings, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Email"
          name="email"
          type="email"
          defaultValue={settings.email}
          disabled={isSubmitting}
          required
        />
        <FormField
          label="Phone"
          name="phone"
          type="tel"
          placeholder="+60 12-345 6789"
          defaultValue={settings.phone ?? ""}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="WhatsApp Link"
          name="whatsapp"
          type="url"
          placeholder="https://wa.me/60123456789"
          defaultValue={settings.whatsapp ?? ""}
          disabled={isSubmitting}
        />
        <FormField
          label="Instagram URL"
          name="instagram"
          type="url"
          placeholder="https://instagram.com/..."
          defaultValue={settings.instagram ?? ""}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Facebook URL"
          name="facebook"
          type="url"
          placeholder="https://facebook.com/..."
          defaultValue={settings.facebook ?? ""}
          disabled={isSubmitting}
        />
        <FormField
          label="YouTube URL"
          name="youtube"
          type="url"
          placeholder="https://youtube.com/..."
          defaultValue={settings.youtube ?? ""}
          disabled={isSubmitting}
        />
      </div>

      <FormField
        label="Location"
        name="location"
        defaultValue={settings.location}
        disabled={isSubmitting}
        required
      />
      <FormField
        label="Rehearsal Schedule"
        name="rehearsalSchedule"
        defaultValue={settings.rehearsal_schedule}
        disabled={isSubmitting}
        required
      />

      <div aria-live="polite" className="min-h-[1.25rem]">
        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {state.message}
          </p>
        )}
        {state.status === "success" && <p className="text-sm text-[#9E8217]">{state.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Contact Settings"}
        </Button>
        <Button type="reset" variant="outline" disabled={isSubmitting}>
          Reset
        </Button>
      </div>
    </form>
  );
}
