import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SITE_SETTINGS } from "@/types/settings";
import type { SiteSettings } from "@/types/settings";

export const SITE_SETTINGS_CACHE_TAG = "site-settings";

const SETTINGS_COLUMNS =
  "id, club_name, short_name, tagline, description, logo_url, favicon_url, email, phone, whatsapp, instagram, facebook, youtube, location, rehearsal_schedule, hero_heading, hero_subheading, about_heading, about_text, join_us_url, contact_cta_text, hero_image_1_url, hero_image_2_url, hero_image_3_url, hero_image_4_url, about_image_url, primary_color, accent_color, background_color, text_color, allow_public_gallery, allow_public_events, allow_member_borrowing, maintenance_mode, created_at, updated_at";

/**
 * A plain (non-SSR, no cookies) Supabase client for the one read every
 * visitor needs regardless of who they are. `site_settings` has a public
 * SELECT policy (`to anon, authenticated using (true)`), so this never
 * needs the caller's session — which matters here specifically because
 * `next/cache`'s `unstable_cache` forbids using request-scoped APIs like
 * `cookies()` inside the cached function (the cached function's result is
 * shared across requests/users, so it can't depend on one request's
 * cookies). The normal cookie-based `createClient()` from
 * `lib/supabase/server.ts` is used everywhere else in this module (writes,
 * which do need the admin's session for the RLS check).
 */
function createPublicClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

async function fetchSiteSettings(): Promise<SiteSettings> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select(SETTINGS_COLUMNS)
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    // Never let a settings outage (or the migration not having run yet)
    // break the public site — fall back to the same defaults the database
    // seeds on creation.
    return DEFAULT_SITE_SETTINGS;
  }

  return data as SiteSettings;
}

/**
 * Cached read of the site_settings singleton. Tagged "site-settings" so
 * every admin save (see app/admin/settings/actions.ts) can invalidate it
 * with `revalidateTag` — the very next request anywhere on the site picks
 * up the new values, no redeploy required, and nothing is stale in the
 * meantime. Persists across requests and users (unlike React's per-request
 * `cache()`, which would still hit Postgres on every new page view), so
 * Navbar/Hero/Footer/Contact/About and the feature-toggle checks all share
 * one cached value instead of five separate queries.
 */
export const getSiteSettings = unstable_cache(fetchSiteSettings, ["site-settings"], {
  tags: [SITE_SETTINGS_CACHE_TAG],
});

/**
 * Raw update used by every settings Server Action. Callers are responsible
 * for validating their own section's fields and for calling
 * `revalidateTag(SITE_SETTINGS_CACHE_TAG)` after a successful write — kept
 * out of this helper so a single failed section doesn't invalidate the
 * cache with no new data to serve.
 */
export async function updateSiteSettingsRow(
  updates: Partial<Omit<SiteSettings, "id" | "created_at" | "updated_at">>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("site_settings").update(updates).eq("id", 1);

  if (error) {
    return { ok: false, error: "Could not save settings. Please try again." };
  }

  return { ok: true };
}

const SITE_ASSET_URL_COLUMNS =
  "logo_url, favicon_url, hero_image_1_url, hero_image_2_url, hero_image_3_url, hero_image_4_url, about_image_url";

export type SiteAssetUrls = Pick<
  SiteSettings,
  | "logo_url"
  | "favicon_url"
  | "hero_image_1_url"
  | "hero_image_2_url"
  | "hero_image_3_url"
  | "hero_image_4_url"
  | "about_image_url"
>;

/**
 * Fresh (non-cached) read of just the site-assets image URL columns.
 * Used by the settings Server Actions immediately before a logo/favicon/
 * Hero/About image replacement, so old-file cleanup deletes exactly the
 * Storage object the database is about to stop pointing at.
 *
 * This deliberately does NOT go through the unstable_cache-wrapped
 * getSiteSettings() (which can lag behind the true row for the current
 * cache lifetime) and it deliberately does NOT accept a client-supplied
 * "previous URL" — a tampered request could otherwise name an arbitrary
 * site-assets object for deletion. The only trustworthy "previous" value
 * is whatever the database says right now, read with the same
 * cookie-authenticated client used for the write below.
 */
export async function getCurrentSiteAssetUrls(): Promise<SiteAssetUrls | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select(SITE_ASSET_URL_COLUMNS)
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as SiteAssetUrls;
}
