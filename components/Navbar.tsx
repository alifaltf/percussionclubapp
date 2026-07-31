import NavbarClient from "@/components/NavbarClient";
import { getCurrentUser } from "@/lib/supabase/current-user";

export default async function Navbar() {
  const { user, profile } = await getCurrentUser();

  if (!user) {
    return <NavbarClient isAuthenticated={false} />;
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
    />
  );
}
