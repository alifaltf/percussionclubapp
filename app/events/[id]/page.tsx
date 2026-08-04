import { notFound } from "next/navigation";
import Link from "next/link";
import EventBannerImage from "@/components/events/EventBannerImage";
import EventStatusBadge from "@/components/events/EventStatusBadge";
import Button from "@/components/ui/Button";
import { LocationIcon, CalendarIcon, ClockIcon } from "@/components/ui/icons";
import { getPublicEventById } from "@/lib/supabase/events";
import { formatEventDate, formatEventTimeRange } from "@/utils/format-event";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  let event;
  try {
    event = await getPublicEventById(id);
  } catch {
    notFound();
  }

  if (!event) {
    notFound();
  }

  const showStatusBadge = event.status === "cancelled" || event.status === "completed";

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#666666] transition-colors duration-300 hover:text-[#C8A928]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Events
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
          <EventBannerImage
            src={event.banner_url}
            alt={event.title}
            sizes="(min-width: 1024px) 896px, 100vw"
            className="aspect-[16/9] w-full"
            priority
          />

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#C8A928]">
                {formatEventDate(event.event_date)}
              </span>
              {showStatusBadge && <EventStatusBadge status={event.status} />}
            </div>

            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
              {event.title}
            </h1>

            {event.short_description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#666666]">
                {event.short_description}
              </p>
            )}

            <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-[#E8E8E8] pt-6 sm:grid-cols-3">
              <div className="flex items-start gap-2.5">
                <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A928]" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Date
                  </dt>
                  <dd className="mt-1 text-sm text-[#111111]">
                    {formatEventDate(event.event_date)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A928]" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Time
                  </dt>
                  <dd className="mt-1 text-sm text-[#111111]">
                    {formatEventTimeRange(event.start_time, event.end_time)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <LocationIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A928]" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#666666]">
                    Location
                  </dt>
                  <dd className="mt-1 text-sm text-[#111111]">
                    {event.location ?? "To be announced"}
                  </dd>
                </div>
              </div>
            </dl>

            {event.description && (
              <div className="mt-8 border-t border-[#E8E8E8] pt-6">
                <h2 className="font-serif text-lg font-semibold text-[#111111]">
                  About This Event
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#666666]">
                  {event.description}
                </p>
              </div>
            )}

            {event.status === "cancelled" && (
              <p className="mt-8 rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                This event has been cancelled.
              </p>
            )}

            {event.registration_url && event.status === "published" && (
              <div className="mt-8 border-t border-[#E8E8E8] pt-6">
                <Button href={event.registration_url} target="_blank" rel="noopener noreferrer">
                  Register Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
