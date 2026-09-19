import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/instruments", "/admin", "/my-requests", "/my-borrowings", "/announcements"];
// /reset-password is intentionally NOT protected here — it needs its own
// server-side session check (see app/reset-password/page.tsx) so a
// missing/expired recovery link can redirect to a friendly
// /forgot-password?error=invalid_link message instead of the generic
// /login bounce this list would otherwise produce.
const AUTH_ONLY_PREFIXES = ["/login", "/forgot-password"];

// Paths that are never subject to maintenance mode or the public
// gallery/events feature toggles, regardless of their state:
//   - /login           so an admin can always sign in during maintenance
//   - /maintenance     the maintenance page itself — redirecting it would loop
//   - /admin           so a signed-in admin can always reach the admin portal
//                      (guests are still bounced to /login by the existing
//                      PROTECTED_PREFIXES check below, same as always)
//   - /auth            the Supabase auth callback route — a callback must
//                      never be gated
//   - /reset-password  otherwise a member mid password-reset (forgot-password
//                      -> email -> /auth/callback -> /reset-password) would
//                      get bounced to /maintenance instead of being able to
//                      finish setting their new password. This does NOT
//                      exempt normal member pages — only the reset step
//                      itself, which already has its own server-side
//                      session gate (see app/reset-password/page.tsx).
// Static assets (_next/*, favicon, images) are already excluded entirely by
// this middleware's `config.matcher` in middleware.ts, so they never reach
// this function at all.
const GATING_EXEMPT_PREFIXES = ["/login", "/maintenance", "/admin", "/auth", "/reset-password"];

interface ToggleSettings {
  maintenance_mode: boolean;
  allow_public_gallery: boolean;
  allow_public_events: boolean;
}

// Fails open (site fully accessible) if the settings row can't be read —
// e.g. the Module 8 migration hasn't been run yet. A missing/unreadable
// settings row should never be able to lock every visitor out.
const PERMISSIVE_DEFAULTS: ToggleSettings = {
  maintenance_mode: false,
  allow_public_gallery: true,
  allow_public_events: true,
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the token with Supabase on every call.
  // Never substitute getSession() here — it trusts the (possibly stale)
  // cookie without verifying it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isAuthOnlyRoute = AUTH_ONLY_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isGatingExempt = GATING_EXEMPT_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // Memoized so at most one extra `profiles` lookup happens per request,
  // even though both the maintenance check and the feature-toggle check
  // below can each need to know whether the current user is an admin.
  let isAdminChecked = false;
  let isAdminCache = false;
  async function currentUserIsAdmin(): Promise<boolean> {
    if (isAdminChecked) return isAdminCache;
    isAdminChecked = true;
    if (!user) {
      isAdminCache = false;
      return false;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdminCache = profile?.role === "admin";
    return isAdminCache;
  }

  if (!isGatingExempt) {
    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("maintenance_mode, allow_public_gallery, allow_public_events")
      .eq("id", 1)
      .maybeSingle();

    const settings: ToggleSettings = settingsRow ?? PERMISSIVE_DEFAULTS;

    if (settings.maintenance_mode) {
      const isAdmin = await currentUserIsAdmin();
      if (!isAdmin) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/maintenance";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
      // Admin during maintenance: falls through with full, unrestricted
      // access — including the feature toggles below.
    } else {
      const isGalleryRoute = pathname === "/gallery" || pathname.startsWith("/gallery/");
      const isEventsRoute = pathname === "/events" || pathname.startsWith("/events/");

      const blockedByToggle =
        (isGalleryRoute && !settings.allow_public_gallery) ||
        (isEventsRoute && !settings.allow_public_events);

      if (blockedByToggle && !(await currentUserIsAdmin())) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthOnlyRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
