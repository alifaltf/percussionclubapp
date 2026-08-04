import { Suspense } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { CalendarIcon, PlusIcon } from "@/components/ui/icons";
import EventStatsRow from "@/components/admin/events/EventStatsRow";
import EventsToolbar from "@/components/admin/events/EventsToolbar";
import EventsTable from "@/components/admin/events/EventsTable";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getAdminEvents, getEventStats } from "@/lib/supabase/events";
import type {
  Event,
  EventArchiveState,
  EventFeaturedState,
  EventSort,
  EventStats,
  EventStatus,
} from "@/types/event";

const PAGE_SIZE = 20;

interface AdminEventsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminEventsPage({ searchParams }: AdminEventsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = firstValue(params.q) ?? "";
  const status = (firstValue(params.status) ?? "all") as EventStatus | "all";
  const archiveState = (firstValue(params.archive) ?? "all") as EventArchiveState;
  const featuredState = (firstValue(params.featured) ?? "all") as EventFeaturedState;
  const sort = (firstValue(params.sort) ?? "event-date-asc") as EventSort;
  const page = Math.max(1, Number(firstValue(params.page) ?? "1") || 1);

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    archiveState !== "all" ||
    featuredState !== "all";

  let stats: EventStats | null = null;
  let events: Event[] = [];
  let totalCount = 0;
  let loadError = false;

  try {
    const [statsResult, listResult] = await Promise.all([
      getEventStats(),
      getAdminEvents({
        search,
        status,
        archiveState,
        featuredState,
        sort,
        page,
        pageSize: PAGE_SIZE,
      }),
    ]);
    stats = statsResult;
    events = listResult.events;
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
              Event Management
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#666666]">
              Create, publish and archive club events.
            </p>
          </div>
          <Button href="/admin/events/new">
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Add Event
          </Button>
        </div>

        {loadError ? (
          <div className="mt-10">
            <EmptyState
              icon={<CalendarIcon className="h-5 w-5" />}
              title="Couldn't load events"
              description="Something went wrong while fetching events. Please try again."
              action={
                <Button href="/admin/events" variant="outline">
                  Try Again
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {stats && (
              <div className="mt-10">
                <EventStatsRow stats={stats} />
              </div>
            )}

            <div className="mt-8">
              <Suspense fallback={null}>
                <EventsToolbar />
              </Suspense>
            </div>

            <div className="mt-6">
              {events.length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon className="h-5 w-5" />}
                  title={hasActiveFilters ? "No events found" : "No events yet"}
                  description={
                    hasActiveFilters
                      ? "Try adjusting your search or filters."
                      : "Create your first event to get started."
                  }
                  action={
                    !hasActiveFilters ? (
                      <Button href="/admin/events/new" variant="outline">
                        Add Event
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <>
                  <EventsTable events={events} />
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
