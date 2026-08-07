import { redirect } from "next/navigation";
import { Suspense } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import AnnouncementCard from "@/components/announcements/AnnouncementCard";
import AnnouncementsFilterBar from "@/components/announcements/AnnouncementsFilterBar";
import { MegaphoneIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getPublicAnnouncements } from "@/lib/supabase/announcements";
import type { Announcement, PublicAnnouncementFilter } from "@/types/announcement";

interface AnnouncementsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AnnouncementsPage({ searchParams }: AnnouncementsPageProps) {
  const { user } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const search = firstValue(params.q) ?? "";
  const filter = (firstValue(params.filter) ?? "all") as PublicAnnouncementFilter;

  let announcements: Announcement[] = [];
  let loadError = false;

  try {
    announcements = await getPublicAnnouncements({ search, filter });
  } catch {
    loadError = true;
  }

  const hasActiveFilters = search.trim() !== "" || filter !== "all";

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-4xl">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
          IIUM Percussion Club
        </span>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
          Announcements
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#666666]">
          Club news, reminders and updates for members.
        </p>

        {loadError ? (
          <div className="mt-10">
            <EmptyState
              icon={<MegaphoneIcon className="h-5 w-5" />}
              title="Couldn't load announcements"
              description="Something went wrong while fetching announcements. Please try again."
              action={
                <Button href="/announcements" variant="outline">
                  Try Again
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-10">
              <Suspense fallback={null}>
                <AnnouncementsFilterBar />
              </Suspense>
            </div>

            <div className="mt-6">
              {announcements.length === 0 ? (
                <EmptyState
                  icon={<MegaphoneIcon className="h-5 w-5" />}
                  title={hasActiveFilters ? "No announcements found" : "No announcements yet"}
                  description={
                    hasActiveFilters
                      ? "Try adjusting your search or filters."
                      : "Check back soon for club news and updates."
                  }
                />
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement, index) => (
                    <Reveal key={announcement.id} delayMs={Math.min(index, 5) * 60}>
                      <AnnouncementCard announcement={announcement} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
