import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/supabase/settings";
import { DEFAULT_SITE_SETTINGS } from "@/types/settings";

interface ForgotPasswordPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const isInvalidLink = firstValue(params.error) === "invalid_link";

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
              Forgot Password
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#666666]">
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>
          </div>

          {isInvalidLink && (
            <p
              role="alert"
              className="mt-6 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              This password reset link is invalid or has expired. Please
              request a new one.
            </p>
          )}

          <div className="mt-8">
            <ForgotPasswordForm />
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
            >
              ← Back to homepage
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
