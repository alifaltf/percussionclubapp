import Link from "next/link";
import { notFound } from "next/navigation";
import EventForm from "@/components/admin/events/EventForm";
import EventRowActions from "@/components/admin/events/EventRowActions";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getAdminEventById } from "@/lib/supabase/events";
import { updateEvent } from "@/app/admin/events/actions";
import type { Event } from "@/types/event";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  await requireAdmin();
  const { id } = await params;

  let event: Event | null;
  try {
    event = await getAdminEventById(id);
  } catch {
    notFound();
  }

  if (!event) {
    notFound();
  }

  const boundUpdate = updateEvent.bind(null, id);

  return (
    <main className="flex flex-1 flex-col bg-[#F8F8F6] px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/admin/events"
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

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
              Edit Event
            </h1>
            <p className="mt-2 text-sm text-[#666666]">{event.slug}</p>
          </div>
          <EventRowActions
            event={event}
            showEditLink={false}
            redirectOnArchiveTo="/admin/events"
          />
        </div>

        <div className="mt-8 rounded-2xl border border-[#E8E8E8] bg-white p-8 shadow-sm sm:p-10">
          <EventForm mode="edit" event={event} action={boundUpdate} />
        </div>
      </div>
    </main>
  );
}
