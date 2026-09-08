import { redirect } from "next/navigation";
import Image from "next/image";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/supabase/settings";
import { DEFAULT_SITE_SETTINGS } from "@/types/settings";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authoritative server-side check. This page is intentionally NOT in
  // PROTECTED_PREFIXES (middleware only handles the "no session at all"
  // case) — the real gate lives here so a missing/expired/already-used
  // recovery link always lands on a clear, friendly message instead of a
  // broken form or a raw Supabase error.
  if (!user) {
    redirect("/forgot-password?error=invalid_link");
  }

  const settings = await getSiteSettings().catch(() => DEFAULT_SITE_SETTINGS);
  const logoUrl = settings.logo_url || "/images/percussion-club-logo.jpg";

  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-1 items-center justify-center bg-[#F8F8F6] px-6 py-16 sm:py-24">
        <div className="w-full max-w-md rounded-2xl border border-[#E8E8E8] bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <Image
              src={logoUrl}
              alt={`${settings.club_name} logo`}
              width={80}
              height={80}
              priority
              className="h-16 w-16 object-contain"
            />
            <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight text-[#111111]">
              Reset Password
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#666666]">
              Choose a new password for your account.
            </p>
          </div>

          <div className="mt-8">
            <ResetPasswordForm />
          </div>
        </div>
      </section>
    </main>
  );
}
