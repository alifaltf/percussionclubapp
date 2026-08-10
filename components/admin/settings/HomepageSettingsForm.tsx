"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import { updateHomepageSettings } from "@/app/admin/settings/actions";
import type { SettingsActionState, SiteSettings } from "@/types/settings";

const INITIAL_STATE: SettingsActionState = { status: "idle", message: null };

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6] disabled:text-[#666666]";
const LABEL_CLASSES = "text-xs font-medium uppercase tracking-wide text-[#666666]";

interface HomepageSettingsFormProps {
  settings: SiteSettings;
}

export default function HomepageSettingsForm({ settings }: HomepageSettingsFormProps) {
  const [state, formAction, isSubmitting] = useActionState(updateHomepageSettings, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Hero Heading"
          name="heroHeading"
          defaultValue={settings.hero_heading}
          disabled={isSubmitting}
          required
        />
        <FormField
          label="Hero Subheading"
          name="heroSubheading"
          defaultValue={settings.hero_subheading}
          disabled={isSubmitting}
          required
        />
      </div>

      <FormField
        label="About Heading"
        name="aboutHeading"
        defaultValue={settings.about_heading}
        disabled={isSubmitting}
        required
      />

      <div>
        <label htmlFor="aboutText" className={LABEL_CLASSES}>
          About Text
        </label>
        <textarea
          id="aboutText"
          name="aboutText"
          defaultValue={settings.about_text}
          disabled={isSubmitting}
          rows={4}
          required
          className={FIELD_CLASSES}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Join Us URL"
          name="joinUsUrl"
          placeholder="/contact"
          defaultValue={settings.join_us_url}
          disabled={isSubmitting}
          required
        />
        <FormField
          label="Contact CTA Text"
          name="contactCtaText"
          defaultValue={settings.contact_cta_text}
          disabled={isSubmitting}
          required
        />
      </div>

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
          {isSubmitting ? "Saving..." : "Save Homepage Settings"}
        </Button>
        <Button type="reset" variant="outline" disabled={isSubmitting}>
          Reset
        </Button>
      </div>
    </form>
  );
}
