import NavbarClient from "@/components/NavbarClient";
import { createClient } from "@/lib/supabase/server";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <NavbarClient isAuthenticated={false} />;
  }

  const isAdmin = user.app_metadata?.role === "admin";
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "Member";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <NavbarClient
      isAuthenticated
      isAdmin={isAdmin}
      displayName={displayName}
      avatarUrl={avatarUrl}
    />
  );
}
