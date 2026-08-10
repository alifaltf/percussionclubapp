"use server";

import { revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { SITE_SETTINGS_CACHE_TAG, updateSiteSettingsRow } from "@/lib/supabase/settings";
import type { SettingsActionState } from "@/types/settings";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * Every settings write goes through this — the admin gating on
 * /admin/settings (via requireAdmin in the page) only controls whether the
 * *form* is shown. A Server Action is a public HTTP endpoint in its own
 * right, so it re-checks the caller's role independently. This is the
 * "still protect sensitive actions even if middleware is bypassed"
 * requirement.
 */
async function requireAdminForAction(): Promise<string | null> {
  const { user, profile } = await getCurrentUser();
  if (!user) return "You must be signed in.";
  if (profile?.role !== "admin") return "Only admins can update settings.";
  return null;
}

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function optionalField(formData: FormData, name: string): string | null {
  const value = field(formData, name);
  return value === "" ? null : value;
}

/** Accepts an absolute URL or a site-relative path starting with "/". */
function isValidUrlOrPath(value: string): boolean {
  if (value.startsWith("/")) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

async function finish(ok: boolean, message: string): Promise<SettingsActionState> {
  if (ok) {
    // { expire: 0 } means "fully revalidate right now" — this Next.js
    // version requires a second argument; passing an explicit cache-life
    // config (rather than a named profile string) applies immediately
    // without depending on any profile being registered in next.config.ts,
    // which this project doesn't define. This is what actually makes the
    // "no stale settings" requirement true: the very next request to any
    // page that reads getSiteSettings() gets fresh data.
    revalidateTag(SITE_SETTINGS_CACHE_TAG, { expire: 0 });
    return { status: "success", message };
  }
  return { status: "error", message };
}

export async function updateGeneralSettings(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const authError = await requireAdminForAction();
  if (authError) return { status: "error", message: authError };

  const clubName = field(formData, "clubName");
  const shortName = field(formData, "shortName");
  const tagline = field(formData, "tagline");
  const description = field(formData, "description");
  const logoUrl = optionalField(formData, "logoUrl");
  const faviconUrl = optionalField(formData, "faviconUrl");

  if (!clubName || !shortName || !tagline || !description) {
    return { status: "error", message: "Please fill in all general fields." };
  }

  const result = await updateSiteSettingsRow({
    club_name: clubName,
    short_name: shortName,
    tagline,
    description,
    logo_url: logoUrl,
    favicon_url: faviconUrl,
  });

  return finish(result.ok, result.ok ? "General settings saved." : (result.error ?? "Could not save."));
}

export async function updateContactSettings(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const authError = await requireAdminForAction();
  if (authError) return { status: "error", message: authError };

  const email = field(formData, "email");
  const phone = optionalField(formData, "phone");
  const whatsapp = optionalField(formData, "whatsapp");
  const instagram = optionalField(formData, "instagram");
  const facebook = optionalField(formData, "facebook");
  const youtube = optionalField(formData, "youtube");
  const location = field(formData, "location");
  const rehearsalSchedule = field(formData, "rehearsalSchedule");

  if (!email || !EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  if (!location || !rehearsalSchedule) {
    return { status: "error", message: "Please fill in location and rehearsal schedule." };
  }
  for (const [label, value] of [
    ["Instagram", instagram],
    ["Facebook", facebook],
    ["YouTube", youtube],
  ] as const) {
    if (value && !isValidUrlOrPath(value)) {
      return { status: "error", message: `Please enter a valid ${label} URL.` };
    }
  }

  const result = await updateSiteSettingsRow({
    email,
    phone,
    whatsapp,
    instagram,
    facebook,
    youtube,
    location,
    rehearsal_schedule: rehearsalSchedule,
  });

  return finish(result.ok, result.ok ? "Contact settings saved." : (result.error ?? "Could not save."));
}

export async function updateHomepageSettings(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const authError = await requireAdminForAction();
  if (authError) return { status: "error", message: authError };

  const heroHeading = field(formData, "heroHeading");
  const heroSubheading = field(formData, "heroSubheading");
  const aboutHeading = field(formData, "aboutHeading");
  const aboutText = field(formData, "aboutText");
  const joinUsUrl = field(formData, "joinUsUrl");
  const contactCtaText = field(formData, "contactCtaText");

  if (!heroHeading || !heroSubheading || !aboutHeading || !aboutText || !contactCtaText) {
    return { status: "error", message: "Please fill in all homepage fields." };
  }
  if (!joinUsUrl || !isValidUrlOrPath(joinUsUrl)) {
    return { status: "error", message: "Please enter a valid Join Us URL (e.g. /contact)." };
  }

  const result = await updateSiteSettingsRow({
    hero_heading: heroHeading,
    hero_subheading: heroSubheading,
    about_heading: aboutHeading,
    about_text: aboutText,
    join_us_url: joinUsUrl,
    contact_cta_text: contactCtaText,
  });

  return finish(result.ok, result.ok ? "Homepage settings saved." : (result.error ?? "Could not save."));
}

export async function updateBrandingSettings(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const authError = await requireAdminForAction();
  if (authError) return { status: "error", message: authError };

  const primaryColor = field(formData, "primaryColor");
  const accentColor = field(formData, "accentColor");
  const backgroundColor = field(formData, "backgroundColor");
  const textColor = field(formData, "textColor");

  for (const [label, value] of [
    ["Primary", primaryColor],
    ["Accent", accentColor],
    ["Background", backgroundColor],
    ["Text", textColor],
  ] as const) {
    if (!HEX_COLOR_PATTERN.test(value)) {
      return { status: "error", message: `${label} color must be a valid hex color (e.g. #C8A928).` };
    }
  }

  const result = await updateSiteSettingsRow({
    primary_color: primaryColor,
    accent_color: accentColor,
    background_color: backgroundColor,
    text_color: textColor,
  });

  return finish(result.ok, result.ok ? "Branding settings saved." : (result.error ?? "Could not save."));
}

export async function updateFeatureSettings(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const authError = await requireAdminForAction();
  if (authError) return { status: "error", message: authError };

  const result = await updateSiteSettingsRow({
    allow_public_gallery: formData.get("allowPublicGallery") === "on",
    allow_public_events: formData.get("allowPublicEvents") === "on",
    allow_member_borrowing: formData.get("allowMemberBorrowing") === "on",
    maintenance_mode: formData.get("maintenanceMode") === "on",
  });

  return finish(result.ok, result.ok ? "Feature settings saved." : (result.error ?? "Could not save."));
}
