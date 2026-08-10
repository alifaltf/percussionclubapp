import { ClockIcon } from "@/components/ui/icons";
import { getSiteSettings } from "@/lib/supabase/settings";
import { DEFAULT_SITE_SETTINGS } from "@/types/settings";

export default async function MaintenancePage() {
  const settings = await getSiteSettings().catch(() => DEFAULT_SITE_SETTINGS);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[#F8F8F6] px-6 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#C8A928]">
        <ClockIcon className="h-6 w-6" />
      </span>
      <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
        We&apos;ll Be Right Back
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#666666]">
        {settings.club_name} is currently undergoing scheduled maintenance. Please check back
        shortly.
      </p>
    </main>
  );
}
