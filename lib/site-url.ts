/**
 * Canonical application base URL, used anywhere an absolute URL must be
 * embedded in generated output (currently: QR codes). Never hardcode the
 * Vercel domain elsewhere — always go through `getSiteUrl()`.
 *
 * Resolution order:
 * 1. `NEXT_PUBLIC_SITE_URL` — explicit, intentional override. Set this in
 *    Vercel project settings (and locally in `.env.local`) once the
 *    production domain is known.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel's own production domain,
 *    auto-injected at build time, used only when `VERCEL_ENV` is
 *    "production" so preview/branch deployments don't self-report as prod.
 * 3. `VERCEL_URL` — the current deployment's own URL (previews, branch
 *    deployments), auto-injected by Vercel.
 * 4. `http://localhost:3000` — local development fallback only.
 */
function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  // Strip any trailing slash(es) so callers can always safely do
  // `${getSiteUrl()}/path` without producing a double slash.
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return normalizeBaseUrl(explicit);
  }

  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }

  if (process.env.VERCEL_URL) {
    return normalizeBaseUrl(process.env.VERCEL_URL);
  }

  return "http://localhost:3000";
}
