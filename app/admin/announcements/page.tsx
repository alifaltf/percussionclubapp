import { Suspense } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { MegaphoneIcon, PlusIcon } from "@/components/ui/icons";
import AnnouncementStatsRow from "@/components/admin/announcements/AnnouncementStatsRow";
import AnnouncementsToolbar from "@/components/admin/announcements/AnnouncementsToolbar";
import AnnouncementsTable from "@/components/admin/announcements/AnnouncementsTable";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getAdminAnnouncements, getAnnouncementStats } from "@/lib/supabase/announcements";
import type {
  Announcement,
  AnnouncementArchiveState,
  AnnouncementPinnedState,
  AnnouncementPriority,
  AnnouncementSort,
  AnnouncementStats,
  AnnouncementStatus,
} from "@/types/announcement";

const PAGE_SIZE = 20;

interface AdminAnnouncementsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAnnouncementsPage({
  searchParams,
}: AdminAnnouncementsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = firstValue(params.q) ?? "";
  const status = (firstValue(params.status) ?? "all") as AnnouncementStatus | "all";
  const priority = (firstValue(params.priority) ?? "all") as AnnouncementPriority | "all";
  const pinnedState = (firstValue(params.pinned) ?? "all") as AnnouncementPinnedState;
  const archiveState = (firstValue(params.archive) ?? "all") as AnnouncementArchiveState;
  const sort = (firstValue(params.sort) ?? "newest") as AnnouncementSort;
  const page = Math.max(1, Number(firstValue(params.page) ?? "1") || 1);

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    priority !== "all" ||
    pinnedState !== "all" ||
    archiveState !== "all";

  let stats: AnnouncementStats | null = null;
  let announcements: Announcement[] = [];
  let totalCount = 0;
  let loadError = false;

  try {
    const [statsResult, listResult] = await Promise.all([
      getAnnouncementStats(),
      getAdminAnnouncements({
        search,
        status,
        priority,
        pinnedState,
        archiveState,
        sort,
        page,
        pageSize: PAGE_SIZE,
      }),
    ]);
    stats = statsResult;
    announcements = listResult.announcements;
    totalCount = listResult.totalCount;
  } catch {
    loadError = true;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
              Admin
            </span>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
              Announcements
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#666666]">
              Post club news, reminders and updates for members.
            </p>
          </div>
          <Button href="/admin/announcements/new">
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Add Announcement
          </Button>
        </div>

        {loadError ? (
          <div className="mt-10">
            <EmptyState
              icon={<MegaphoneIcon className="h-5 w-5" />}
              title="Couldn't load announcements"
              description="Something went wrong while fetching announcements. Please try again."
              action={
                <Button href="/admin/announcements" variant="outline">
                  Try Again
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {stats && (
              <div className="mt-10">
                <AnnouncementStatsRow stats={stats} />
              </div>
            )}

            <div className="mt-8">
              <Suspense fallback={null}>
                <AnnouncementsToolbar />
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
                      : "Create your first announcement to get started."
                  }
                  action={
                    !hasActiveFilters ? (
                      <Button href="/admin/announcements/new" variant="outline">
                        Add Announcement
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <>
                  <AnnouncementsTable announcements={announcements} />
                  <div className="mt-6">
                    <Suspense fallback={null}>
                      <Pagination page={page} totalPages={totalPages} />
                    </Suspense>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
