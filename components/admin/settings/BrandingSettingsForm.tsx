"use client";

import { useActionState, useState } from "react";
import Button from "@/components/ui/Button";
import { updateBrandingSettings } from "@/app/admin/settings/actions";
import type { SettingsActionState, SiteSettings } from "@/types/settings";

const INITIAL_STATE: SettingsActionState = { status: "idle", message: null };
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

interface ColorFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

function ColorField({ label, name, value, onChange, disabled }: ColorFieldProps) {
  const isValid = HEX_COLOR_PATTERN.test(value);

  return (
    <div>
      <label htmlFor={name} className="text-xs font-medium uppercase tracking-wide text-[#666666]">
        {label}
      </label>
      <div className="mt-1.5 flex items-center gap-3">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={isValid ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-sm border border-[#E8E8E8] disabled:cursor-not-allowed"
        />
        <input
          id={name}
          name={name}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="#C8A928"
          required
          className="w-full rounded-sm border border-[#E8E8E8] px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F8F6] disabled:text-[#666666]"
        />
      </div>
      {!isValid && value !== "" && (
        <p className="mt-1.5 text-xs text-red-600">Must be a hex color, e.g. #C8A928.</p>
      )}
    </div>
  );
}

interface BrandingSettingsFormProps {
  settings: SiteSettings;
}

export default function BrandingSettingsForm({ settings }: BrandingSettingsFormProps) {
  const [state, formAction, isSubmitting] = useActionState(updateBrandingSettings, INITIAL_STATE);

  const [primaryColor, setPrimaryColor] = useState(settings.primary_color);
  const [accentColor, setAccentColor] = useState(settings.accent_color);
  const [backgroundColor, setBackgroundColor] = useState(settings.background_color);
  const [textColor, setTextColor] = useState(settings.text_color);

  function handleReset() {
    setPrimaryColor(settings.primary_color);
    setAccentColor(settings.accent_color);
    setBackgroundColor(settings.background_color);
    setTextColor(settings.text_color);
  }

  return (
    <form action={formAction} onReset={handleReset} className="space-y-6">
      <p className="text-sm text-[#666666]">
        These colors drive the site&apos;s CSS custom properties (
        <code className="text-xs">--brand-primary</code> and similar). The white/black/gold
        defaults shown here are the club&apos;s current design — change them only if you intend to
        re-brand.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ColorField label="Primary Color" name="primaryColor" value={primaryColor} onChange={setPrimaryColor} disabled={isSubmitting} />
        <ColorField label="Accent Color" name="accentColor" value={accentColor} onChange={setAccentColor} disabled={isSubmitting} />
        <ColorField label="Background Color" name="backgroundColor" value={backgroundColor} onChange={setBackgroundColor} disabled={isSubmitting} />
        <ColorField label="Text Color" name="textColor" value={textColor} onChange={setTextColor} disabled={isSubmitting} />
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
          {isSubmitting ? "Saving..." : "Save Branding"}
        </Button>
        <Button type="reset" variant="outline" disabled={isSubmitting}>
          Reset
        </Button>
      </div>
    </form>
  );
}
