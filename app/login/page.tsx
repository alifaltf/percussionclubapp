import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-1 items-center justify-center bg-[#F8F8F6] px-6 py-16 sm:py-24">
        <div className="w-full max-w-md rounded-2xl border border-[#E8E8E8] bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/images/percussion-club-logo.jpg"
              alt="IIUM Percussion Club logo"
              width={80}
              height={80}
              priority
              className="h-16 w-16 object-contain"
            />
            <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight text-[#111111]">
              Member Login
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#666666]">
              Sign in to access the IIUM Percussion Club portal.
            </p>
          </div>

          <div className="mt-8">
            <LoginForm />
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
