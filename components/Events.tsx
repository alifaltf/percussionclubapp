import Button from "@/components/ui/Button";
import EventCard from "@/components/ui/EventCard";
import EmptyState from "@/components/ui/EmptyState";
import Reveal from "@/components/ui/Reveal";
import { CalendarIcon } from "@/components/ui/icons";
import { getHomepageEvents } from "@/lib/supabase/events";
import { formatEventDate, formatEventTimeRange } from "@/utils/format-event";
import type { Event } from "@/types/event";

function toCardProps(event: Event) {
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
  };
}

export default async function Events() {
  let events: Event[] = [];
  let loadError = false;

  try {
    events = await getHomepageEvents();
  } catch {
    loadError = true;
  }

  return (
    <section id="events" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C8A928]">
            Upcoming Events
          </span>
          <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#111111] sm:text-5xl">
            Feel the Next Beat
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[#666666] sm:text-lg">
            Stay connected with our upcoming performances, workshops and club
            activities.
          </p>
        </Reveal>

        {!loadError && events.length > 0 && (
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, index) => (
              <Reveal key={event.id} delayMs={index * 100}>
                <EventCard {...toCardProps(event)} />
              </Reveal>
            ))}
          </div>
        )}

        {!loadError && events.length === 0 && (
          <div className="mt-16">
            <EmptyState
              icon={<CalendarIcon className="h-5 w-5" />}
              title="No upcoming events"
              description="Check back soon for new performances and workshops."
            />
          </div>
        )}

        {loadError && (
          <div className="mt-16">
            <EmptyState
              icon={<CalendarIcon className="h-5 w-5" />}
              title="Couldn't load events"
              description="Something went wrong while fetching upcoming events."
            />
          </div>
        )}

        <Reveal delayMs={300} className="mt-14 flex justify-center">
          <Button href="/events" variant="outline">
            View All Events
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
