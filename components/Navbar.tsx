import NavbarClient from "@/components/NavbarClient";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getSiteSettings } from "@/lib/supabase/settings";
import { DEFAULT_SITE_SETTINGS } from "@/types/settings";

export default async function Navbar() {
  const [{ user, profile }, settingsResult] = await Promise.all([
    getCurrentUser(),
    getSiteSettings().catch(() => DEFAULT_SITE_SETTINGS),
  ]);

  const logoUrl = settingsResult.logo_url || "/images/percussion-club-logo.jpg";
  const clubName = settingsResult.club_name;
  const showGallery = settingsResult.allow_public_gallery;
  const showEvents = settingsResult.allow_public_events;

  if (!user) {
    return (
      <NavbarClient
        isAuthenticated={false}
        logoUrl={logoUrl}
        clubName={clubName}
        showGallery={showGallery}
        showEvents={showEvents}
      />
    );
  }

  const isAdmin = profile?.role === "admin";
  const displayName = profile?.full_name || user.email || "Member";
  const avatarUrl = profile?.avatar_url ?? undefined;

  return (
    <NavbarClient
      isAuthenticated
      isAdmin={isAdmin}
      displayName={displayName}
      avatarUrl={avatarUrl}
      logoUrl={logoUrl}
      clubName={clubName}
      showGallery={showGallery}
      showEvents={showEvents}
    />
  );
}
