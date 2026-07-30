import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-24 text-center">
      <h1 className="font-serif text-3xl font-semibold text-[#111111] sm:text-4xl">
        Welcome to the Percussion Club Portal
      </h1>

      <div className="mt-8">
        <LogoutButton />
      </div>
    </main>
  );
}
