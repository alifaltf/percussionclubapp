import Link from "next/link";
import EventForm from "@/components/admin/events/EventForm";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createEvent } from "@/app/admin/events/actions";

export default async function NewEventPage() {
  await requireAdmin();

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

        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#111111] sm:text-4xl">
          Add Event
        </h1>
        <p className="mt-2 text-sm text-[#666666]">Create a new club event.</p>

        <div className="mt-8 rounded-2xl border border-[#E8E8E8] bg-white p-8 shadow-sm sm:p-10">
          <EventForm mode="create" action={createEvent} />
        </div>
      </div>
    </main>
  );
}
