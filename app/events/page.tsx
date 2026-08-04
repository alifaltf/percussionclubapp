import { Suspense } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import EventCard from "@/components/ui/EventCard";
import EventStatusBadge from "@/components/events/EventStatusBadge";
import EventsFilterBar from "@/components/events/EventsFilterBar";
import { CalendarIcon } from "@/components/ui/icons";
import { getPublicEvents } from "@/lib/supabase/events";
import { formatEventDate, formatEventTimeRange } from "@/utils/format-event";
import type { Event, PublicEventFilter } from "@/types/event";

interface EventsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function toCardProps(event: Event) {
  // A plain "Published" badge on every upcoming event is just noise — only
  // surface the badge when the status is something a visitor needs to
  // notice (cancelled or completed).
  const showBadge = event.status === "cancelled" || event.status === "completed";

  return {
    image: {
      src: event.banner_url ?? "/images/events/event-1.jpg",
      alt: event.title,
    },
    title: event.title,
    date: formatEventDate(event.event_date),
    time: formatEventTimeRange(event.start_time, event.end_time),
    location: event.location ?? "Location TBA",
    description: event.short_description ?? event.description ?? "",
    href: `/events/${event.id}`,
    badge: showBadge ? <EventStatusBadge status={event.status} /> : undefined,
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const search = firstValue(params.q) ?? "";
  const filter = (firstValue(params.filter) ?? "all") as PublicEventFilter;

  let events: Event[] = [];
  let loadError = false;

  try {
    events = await getPublicEvents({ search });
  } catch {
    loadError = true;
  }

  const today = todayIsoDate();
  const upcoming = events.filter((event) => event.event_date >= today);
  const past = events.filter((event) => event.event_date < today);
  const completed = events.filter((event) => event.status === "completed");
  const cancelled = events.filter((event) => event.status === "cancelled");

  const hasActiveFilters = search.trim() !== "" || filter !== "all";

  const FILTERED: Record<Exclude<PublicEventFilter, "all">, { title: string; events: Event[] }> = {
    upcoming: { title: "Upcoming Events", events: upcoming },
    past: { title: "Past Events", events: past },
    completed: { title: "Completed Events", events: completed },
    cancelled: { title: "Cancelled Events", events: cancelled },
  };

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
          IIUM Percussion Club
        </span>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
          Events
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[#666666]">
          Performances, workshops and club activities — past and upcoming.
        </p>

        {loadError ? (
          <div className="mt-10">
            <EmptyState
              icon={<CalendarIcon className="h-5 w-5" />}
              title="Couldn't load events"
              description="Something went wrong while fetching events. Please try again."
              action={
                <Button href="/events" variant="outline">
                  Try Again
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-10">
              <Suspense fallback={null}>
                <EventsFilterBar />
              </Suspense>
            </div>

            {filter === "all" ? (
              <>
                <EventSection
                  title="Upcoming Events"
                  events={upcoming}
                  emptyDescription={
                    hasActiveFilters
                      ? "Try adjusting your search."
                      : "Check back soon for new performances and workshops."
                  }
                />
                <EventSection
                  title="Past Events"
                  events={past}
                  emptyDescription="Past events will appear here once they've happened."
                  className="mt-16"
                />
              </>
            ) : (
              <EventSection
                title={FILTERED[filter].title}
                events={FILTERED[filter].events}
                emptyDescription="Try adjusting your search or filters."
                className="mt-10"
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

interface EventSectionProps {
  title: string;
  events: Event[];
  emptyDescription: string;
  className?: string;
}

function EventSection({ title, events, emptyDescription, className = "mt-10" }: EventSectionProps) {
  return (
    <div className={className}>
      <h2 className="font-serif text-xl font-semibold text-[#111111]">{title}</h2>
      {events.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<CalendarIcon className="h-5 w-5" />}
            title="No events found"
            description={emptyDescription}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <Reveal key={event.id} delayMs={Math.min(index, 5) * 80}>
              <EventCard {...toCardProps(event)} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
