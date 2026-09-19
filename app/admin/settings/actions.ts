"use server";

import { revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentSiteAssetUrls,
  SITE_SETTINGS_CACHE_TAG,
  updateSiteSettingsRow,
} from "@/lib/supabase/settings";
import { getStoragePathFromPublicUrl } from "@/lib/supabase/storage";
import type { SettingsActionState, SiteSettings } from "@/types/settings";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const SITE_ASSETS_BUCKET = "site-assets";

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

/**
 * Deletes replaced site-assets Storage objects after a settings image
 * swap. `previous` MUST come from a fresh, trusted, server-side read of
 * site_settings (getCurrentSiteAssetUrls) — never from client-supplied
 * form data. A hidden "previous URL" form field would let a tampered
 * request name an arbitrary site-assets object for deletion; reading the
 * database ourselves removes that trust boundary entirely. `next` is the
 * newly-uploaded URL from this submission, or null if this slot wasn't
 * touched.
 *
 * Only called after the DB update has already succeeded (never before —
 * deleting the old file first would risk leaving a setting pointing at
 * nothing if the DB write then failed), and never throws: an orphaned
 * Storage object is preferable to breaking a successful save, so any
 * deletion failure here is only logged.
 */
async function cleanupReplacedSiteAssets(
  replacements: Array<{ previous: string | null | undefined; next: string | null }>,
): Promise<void> {
  const pathsToRemove: string[] = [];

  for (const { previous, next } of replacements) {
    if (!next || !previous || previous === next) continue;
    const oldPath = getStoragePathFromPublicUrl(previous, SITE_ASSETS_BUCKET);
    if (oldPath) pathsToRemove.push(oldPath);
  }

  if (pathsToRemove.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.storage.from(SITE_ASSETS_BUCKET).remove(pathsToRemove);
  if (error) {
    console.error("Failed to remove replaced site-asset file(s):", error.message);
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
  if (logoUrl && !isValidUrlOrPath(logoUrl)) {
    return { status: "error", message: "Logo image failed to upload correctly. Please try again." };
  }
  if (faviconUrl && !isValidUrlOrPath(faviconUrl)) {
    return { status: "error", message: "Favicon image failed to upload correctly. Please try again." };
  }

  // Only read the current row when an image is actually being replaced —
  // a plain text-only save has nothing to clean up regardless. The read
  // happens here, right before the update, so it reflects the row this
  // save is about to change (see getCurrentSiteAssetUrls).
  const previous =
    logoUrl || faviconUrl ? await getCurrentSiteAssetUrls() : null;

  // logo_url/favicon_url are only included in the update when a new image
  // was actually uploaded in this submission. A field that wasn't touched
  // must never overwrite the existing value with null — that was the
  // General Settings data-loss bug found in the Settings CMS audit: saving
  // Club Name/Tagline/Description alone used to wipe the logo and favicon.
  const updates: Partial<Omit<SiteSettings, "id" | "created_at" | "updated_at">> = {
    club_name: clubName,
    short_name: shortName,
    tagline,
    description,
  };
  if (logoUrl) updates.logo_url = logoUrl;
  if (faviconUrl) updates.favicon_url = faviconUrl;

  const result = await updateSiteSettingsRow(updates);

  if (result.ok) {
    await cleanupReplacedSiteAssets([
      { previous: previous?.logo_url, next: logoUrl },
      { previous: previous?.favicon_url, next: faviconUrl },
    ]);
  }

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

  const heroImage1Url = optionalField(formData, "heroImage1Url");
  const heroImage2Url = optionalField(formData, "heroImage2Url");
  const heroImage3Url = optionalField(formData, "heroImage3Url");
  const heroImage4Url = optionalField(formData, "heroImage4Url");
  const aboutImageUrl = optionalField(formData, "aboutImageUrl");

  if (!heroHeading || !heroSubheading || !aboutHeading || !aboutText || !contactCtaText) {
    return { status: "error", message: "Please fill in all homepage fields." };
  }
  if (!joinUsUrl || !isValidUrlOrPath(joinUsUrl)) {
    return { status: "error", message: "Please enter a valid Join Us URL (e.g. /contact)." };
  }
  for (const [label, value] of [
    ["Hero Image 1", heroImage1Url],
    ["Hero Image 2", heroImage2Url],
    ["Hero Image 3", heroImage3Url],
    ["Hero Image 4", heroImage4Url],
    ["About Club Image", aboutImageUrl],
  ] as const) {
    if (value && !isValidUrlOrPath(value)) {
      return { status: "error", message: `${label} failed to upload correctly. Please try again.` };
    }
  }

  // Same reasoning as updateGeneralSettings above: only read the current
  // row (server-side, trusted) when at least one image slot was actually
  // replaced in this submission.
  const previous =
    heroImage1Url || heroImage2Url || heroImage3Url || heroImage4Url || aboutImageUrl
      ? await getCurrentSiteAssetUrls()
      : null;

  // Same "only include a touched image field" rule as General Settings —
  // an untouched Hero/About slot must never overwrite its existing value
  // with null.
  const updates: Partial<Omit<SiteSettings, "id" | "created_at" | "updated_at">> = {
    hero_heading: heroHeading,
    hero_subheading: heroSubheading,
    about_heading: aboutHeading,
    about_text: aboutText,
    join_us_url: joinUsUrl,
    contact_cta_text: contactCtaText,
  };
  if (heroImage1Url) updates.hero_image_1_url = heroImage1Url;
  if (heroImage2Url) updates.hero_image_2_url = heroImage2Url;
  if (heroImage3Url) updates.hero_image_3_url = heroImage3Url;
  if (heroImage4Url) updates.hero_image_4_url = heroImage4Url;
  if (aboutImageUrl) updates.about_image_url = aboutImageUrl;

  const result = await updateSiteSettingsRow(updates);

  if (result.ok) {
    await cleanupReplacedSiteAssets([
      { previous: previous?.hero_image_1_url, next: heroImage1Url },
      { previous: previous?.hero_image_2_url, next: heroImage2Url },
      { previous: previous?.hero_image_3_url, next: heroImage3Url },
      { previous: previous?.hero_image_4_url, next: heroImage4Url },
      { previous: previous?.about_image_url, next: aboutImageUrl },
    ]);
  }

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
