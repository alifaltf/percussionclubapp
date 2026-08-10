"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import { updateFeatureSettings } from "@/app/admin/settings/actions";
import type { SettingsActionState, SiteSettings } from "@/types/settings";

const INITIAL_STATE: SettingsActionState = { status: "idle", message: null };

interface ToggleRowProps {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
  disabled: boolean;
  warning?: boolean;
}

function ToggleRow({ name, label, description, defaultChecked, disabled, warning }: ToggleRowProps) {
  return (
    <label className="flex items-start gap-4 rounded-lg border border-[#E8E8E8] p-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-1 h-4 w-4 shrink-0 accent-[#C8A928]"
      />
      <span>
        <span className={`block text-sm font-semibold ${warning ? "text-red-600" : "text-[#111111]"}`}>
          {label}
        </span>
        <span className="mt-1 block text-sm text-[#666666]">{description}</span>
      </span>
    </label>
  );
}

interface FeatureSettingsFormProps {
  settings: SiteSettings;
}

export default function FeatureSettingsForm({ settings }: FeatureSettingsFormProps) {
  const [state, formAction, isSubmitting] = useActionState(updateFeatureSettings, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <ToggleRow
        name="allowPublicGallery"
        label="Allow Public Gallery"
        description="When off, the /gallery pages are blocked for everyone except admins, and gallery links are hidden from navigation."
        defaultChecked={settings.allow_public_gallery}
        disabled={isSubmitting}
      />
      <ToggleRow
        name="allowPublicEvents"
        label="Allow Public Events"
        description="When off, the /events pages are blocked for everyone except admins, and event links are hidden from navigation."
        defaultChecked={settings.allow_public_events}
        disabled={isSubmitting}
      />
      <ToggleRow
        name="allowMemberBorrowing"
        label="Allow Member Borrowing"
        description="When off, members can still browse instruments, but can't submit new borrow requests. Existing borrowings, returns and admin review are unaffected."
        defaultChecked={settings.allow_member_borrowing}
        disabled={isSubmitting}
      />
      <ToggleRow
        name="maintenanceMode"
        label="Maintenance Mode"
        description="Blocks all public and member access with a maintenance page. Admins can still log in and use /admin. Use with care."
        defaultChecked={settings.maintenance_mode}
        disabled={isSubmitting}
        warning
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
          {isSubmitting ? "Saving..." : "Save Feature Settings"}
        </Button>
        <Button type="reset" variant="outline" disabled={isSubmitting}>
          Reset
        </Button>
      </div>
    </form>
  );
}
