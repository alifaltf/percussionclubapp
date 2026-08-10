import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import SettingsTabs from "@/components/admin/settings/SettingsTabs";
import { SettingsIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getSiteSettings } from "@/lib/supabase/settings";

export default async function AdminSettingsPage() {
  await requireAdmin();

  let settings;
  let loadError = false;
  try {
    settings = await getSiteSettings();
  } catch {
    loadError = true;
  }

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-5xl">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
          Admin
        </span>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
          System Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#666666]">
          Manage club-wide public information and branding shown across the site — no code changes
          required.
        </p>

        {loadError || !settings ? (
          <div className="mt-10">
            <EmptyState
              icon={<SettingsIcon className="h-5 w-5" />}
              title="Couldn't load settings"
              description="Something went wrong while fetching site settings. Please try again."
              action={
                <Button href="/admin/settings" variant="outline">
                  Try Again
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-10">
            <SettingsTabs settings={settings} />
          </div>
        )}
      </div>
    </main>
  );
}
