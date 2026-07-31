import { redirect } from "next/navigation";
import AvatarUploader from "@/components/profile/AvatarUploader";
import ProfileDetailsForm from "@/components/profile/ProfileDetailsForm";
import { getCurrentUser } from "@/lib/supabase/current-user";

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = profile?.role === "admin";
  const displayName = profile?.full_name || user.email || "Member";

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Your Account
          </span>
          <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
            Profile
          </h1>
          <p className="mt-2 text-sm text-[#666666]">
            Manage your name, phone number and profile picture.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[#E8E8E8] bg-white p-8 shadow-sm sm:p-10">
          <AvatarUploader
            displayName={displayName}
            initialAvatarUrl={profile?.avatar_url ?? null}
          />

          <div className="my-10 border-t border-[#E8E8E8]" />

          <ProfileDetailsForm
            email={user.email ?? ""}
            isAdmin={isAdmin}
            initialFullName={profile?.full_name ?? ""}
            initialPhone={profile?.phone ?? ""}
          />
        </div>
      </div>
    </main>
  );
}
